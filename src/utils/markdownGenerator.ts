import { ManuscriptProject, SceneItem } from '../types/manuscript'

/**
 * Converts rich HTML content from TipTap into clean, standardized Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let md = html

  // Blockquotes
  md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_match, content) => {
    const lines = htmlToMarkdown(content).trim().split('\n')
    return '\n\n' + lines.map((l) => `> ${l}`).join('\n') + '\n\n'
  })

  // Horizontal Rules / Scene Breaks
  md = md.replace(/<hr\s*[\/]?>/gi, '\n\n* * *\n\n')

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, c) => `\n\n# ${stripTags(c).trim()}\n\n`)
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, c) => `\n\n## ${stripTags(c).trim()}\n\n`)
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, c) => `\n\n### ${stripTags(c).trim()}\n\n`)

  // Lists (Unordered & Ordered)
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, c) => {
    return '\n\n' + c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_lm: string, lc: string) => `- ${stripTags(lc).trim()}\n`).trim() + '\n\n'
  })
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, c) => {
    let index = 1
    return '\n\n' + c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_lm: string, lc: string) => `${index++}. ${stripTags(lc).trim()}\n`).trim() + '\n\n'
  })

  // Inline formatting
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')

  // Paragraphs & line breaks
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, c) => {
    const text = c.trim()
    return text ? `\n\n${text}` : '\n\n'
  })
  md = md.replace(/<br\s*[\/]?>/gi, '\n')

  // Remaining HTML tags
  md = md.replace(/<[^>]+>/g, '')

  // HTML entities
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Clean excessive blank lines (max 2 consecutive newlines)
  md = md.replace(/\n{3,}/g, '\n\n')

  return md.trim()
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '')
}

/**
 * Generates clean, publishing-ready Markdown with YAML frontmatter.
 */
export function generateProjectMarkdown(
  project: ManuscriptProject,
  options?: {
    includeFrontmatter?: boolean
    singleSceneId?: string
  }
): string {
  const includeFrontmatter = options?.includeFrontmatter ?? true
  const now = new Date().toISOString().split('T')[0]

  // Calculate total word count
  let totalWords = 0
  project.parts.forEach((p) => {
    p.chapters.forEach((c) => {
      c.scenes.forEach((s) => {
        totalWords += s.wordCount || 0
      })
    })
  })

  let output = ''

  // 1. YAML Frontmatter
  if (includeFrontmatter) {
    output += `---\n`
    output += `title: "${project.title.replace(/"/g, '\\"')}"\n`
    if (project.subtitle) output += `subtitle: "${project.subtitle.replace(/"/g, '\\"')}"\n`
    output += `author: "${project.author.replace(/"/g, '\\"')}"\n`
    output += `date: "${now}"\n`
    if (project.genre) output += `genre: "${project.genre}"\n`
    output += `wordCount: ${totalWords}\n`
    if (project.description) output += `description: "${project.description.replace(/"/g, '\\"')}"\n`
    if (project.projectType) output += `type: "${project.projectType}"\n`
    output += `---\n\n`
  }

  // 2. If single scene requested
  if (options?.singleSceneId) {
    for (const part of project.parts) {
      for (const chap of part.chapters) {
        const found = chap.scenes.find((s) => s.id === options.singleSceneId)
        if (found) {
          output += `# ${found.title}\n\n`
          output += htmlToMarkdown(found.content)
          return output
        }
      }
    }
  }

  // 3. For Articles: output Title and continuous prose
  if (project.projectType === 'article') {
    output += `# ${project.title}\n\n`
    if (project.subtitle) {
      output += `*${project.subtitle}*\n\n`
    }

    project.parts.forEach((part) => {
      part.chapters.forEach((chap) => {
        chap.scenes.forEach((scene) => {
          if (scene.content) {
            output += htmlToMarkdown(scene.content) + '\n\n'
          }
        })
      })
    })

    return output.trim()
  }

  // 4. For Short Stories: Title, Author, and scenes separated by scene breaks
  if (project.projectType === 'short-story') {
    output += `# ${project.title}\n\n`
    output += `**By ${project.author}**\n\n`
    output += `* * *\n\n`

    let isFirstScene = true
    project.parts.forEach((part) => {
      part.chapters.forEach((chap) => {
        chap.scenes.forEach((scene) => {
          if (!isFirstScene) {
            output += `\n\n* * *\n\n`
          }
          isFirstScene = false
          output += htmlToMarkdown(scene.content)
        })
      })
    })

    return output.trim()
  }

  // 5. For Novels: Parts, Chapters, and Scenes
  let chapterIndex = 0
  project.parts.forEach((part, partIdx) => {
    if (project.parts.length > 1 && part.title) {
      output += `# ${part.title}\n\n`
    }

    part.chapters.forEach((chap) => {
      chapterIndex++
      const chapHeader = chap.title || `Chapter ${chapterIndex}`
      output += `## ${chapHeader}\n\n`

      let isFirstSceneInChap = true
      chap.scenes.forEach((scene) => {
        if (!isFirstSceneInChap) {
          output += `\n\n* * *\n\n`
        }
        isFirstSceneInChap = false
        output += htmlToMarkdown(scene.content) + '\n\n'
      })
    })
  })

  return output.trim()
}
