export interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged'
  text: string
}

/**
 * Word-level difference generator for comparing scene snapshots or revision drafts.
 * Uses an efficient greedy LCS algorithm optimized for large text blocks.
 */
export function computeWordDiff(oldText: string, newText: string): DiffChunk[] {
  if (oldText === newText) {
    return [{ type: 'unchanged', text: oldText }]
  }
  if (!oldText) {
    return [{ type: 'added', text: newText }]
  }
  if (!newText) {
    return [{ type: 'removed', text: oldText }]
  }

  // Tokenize preserving whitespace and punctuation
  const oldTokens = oldText.split(/(\s+)/)
  const newTokens = newText.split(/(\s+)/)

  const n = oldTokens.length
  const m = newTokens.length

  // For very long documents, fallback to line-level diff if tokens exceed 2,500
  if (n * m > 4000000) {
    return computeLineDiff(oldText, newText)
  }

  // Standard LCS dynamic programming table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  // Backtrack to extract diff chunks
  const rawChunks: DiffChunk[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      rawChunks.push({ type: 'unchanged', text: oldTokens[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChunks.push({ type: 'added', text: newTokens[j - 1] })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawChunks.push({ type: 'removed', text: oldTokens[i - 1] })
      i--
    }
  }

  rawChunks.reverse()

  // Coalesce adjacent identical chunks
  const coalesced: DiffChunk[] = []
  for (const c of rawChunks) {
    const last = coalesced[coalesced.length - 1]
    if (last && last.type === c.type) {
      last.text += c.text
    } else {
      coalesced.push({ ...c })
    }
  }

  return coalesced
}

/**
 * Fallback line-level difference generator for very large documents.
 */
function computeLineDiff(oldText: string, newText: string): DiffChunk[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const chunks: DiffChunk[] = []

  let i = 0
  let j = 0
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      chunks.push({ type: 'unchanged', text: oldLines[i] + '\n' })
      i++
      j++
    } else {
      chunks.push({ type: 'removed', text: oldLines[i] + '\n' })
      chunks.push({ type: 'added', text: newLines[j] + '\n' })
      i++
      j++
    }
  }
  while (i < oldLines.length) {
    chunks.push({ type: 'removed', text: oldLines[i++] + '\n' })
  }
  while (j < newLines.length) {
    chunks.push({ type: 'added', text: newLines[j++] + '\n' })
  }
  return chunks
}
