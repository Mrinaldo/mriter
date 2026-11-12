import JSZip from 'jszip'
import {
  ManuscriptProject,
  PartItem,
  ChapterItem,
  SceneItem,
  ProjectType,
} from '../types/manuscript'
import { createDefaultProject } from './initialProject'

export interface ImportSummary {
  project: ManuscriptProject
  totalWords: number
  chaptersCount: number
  scenesCount: number
  fileType: 'markdown' | 'docx' | 'text'
}

/**
 * Universal Manuscript Importer for .md, .txt, and .docx files.
 */
export async function importManuscriptFile(file: File): Promise<ImportSummary> {
  const fileName = file.name
  const baseName = fileName.replace(/\.[^/.]+$/, '')
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer()
    return parseDocxManuscript(arrayBuffer, baseName)
  }

  const text = await file.text()
  return parseTextOrMarkdownManuscript(text, baseName, extension === 'md' ? 'markdown' : 'text')
}

/**
 * Parse Markdown or Plain Text manuscript.
 */
export function parseTextOrMarkdownManuscript(
  rawText: string,
  fallbackTitle: string,
  fileType: 'markdown' | 'text' = 'markdown'
): ImportSummary {
  let text = rawText
  let title = fallbackTitle
  let author = 'Author'
  let subtitle = ''
  let projectType: ProjectType = 'novel'

  // 1. Extract YAML frontmatter if present
  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1]
    text = text.substring(frontmatterMatch[0].length)

    const titleMatch = yaml.match(/title:\s*["']?([^"'\n\r]+)["']?/)
    if (titleMatch) title = titleMatch[1].trim()

    const authorMatch = yaml.match(/author:\s*["']?([^"'\n\r]+)["']?/)
    if (authorMatch) author = authorMatch[1].trim()

    const subtitleMatch = yaml.match(/subtitle:\s*["']?([^"'\n\r]+)["']?/)
    if (subtitleMatch) subtitle = subtitleMatch[1].trim()

    const typeMatch = yaml.match(/projectType:\s*["']?([^"'\n\r]+)["']?/)
    if (typeMatch) {
      const parsedType = typeMatch[1].trim().toLowerCase()
      if (parsedType === 'article' || parsedType === 'short-story' || parsedType === 'novel') {
        projectType = parsedType
      }
    }
  }

  // 2. Identify Chapters and Scenes
  const baseProject = createDefaultProject()
  const now = new Date().toISOString()

  // Lines split
  const lines = text.split(/\r?\n/)

  interface ParsedChapter {
    title: string
    scenes: { title: string; paragraphs: string[] }[]
  }

  const chapters: ParsedChapter[] = []
  let currentChapter: ParsedChapter = {
    title: projectType === 'article' ? title : 'Chapter 1',
    scenes: [{ title: 'Scene 1', paragraphs: [] }],
  }

  let inScene = currentChapter.scenes[0]

  const isChapterHeading = (line: string): string | null => {
    // Markdown # or ## Chapter
    const h1Match = line.match(/^#\s+(.+)$/)
    if (h1Match) return h1Match[1].trim()

    const chapRegex = /^(?:chapter|part|act|prologue|epilogue)\b.*$/i
    if (chapRegex.test(line.trim()) && line.trim().length < 80) {
      return line.trim()
    }
    return null
  }

  const isSceneDivider = (line: string): boolean => {
    const trimmed = line.trim()
    // Markdown ## or horizontal rule or asterisks
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) return true
    if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) return true
    if (/^(?:\*\s*){3,}$/.test(trimmed)) return true
    return false
  }

  for (const line of lines) {
    const chapTitle = isChapterHeading(line)
    if (chapTitle && (chapters.length > 0 || currentChapter.scenes[0].paragraphs.length > 0)) {
      // Save current chapter if it has content
      if (currentChapter.scenes.some((s) => s.paragraphs.length > 0)) {
        chapters.push(currentChapter)
      }
      currentChapter = {
        title: chapTitle,
        scenes: [{ title: 'Scene 1', paragraphs: [] }],
      }
      inScene = currentChapter.scenes[0]
      continue
    }

    if (isSceneDivider(line)) {
      let sceneTitle = `Scene ${currentChapter.scenes.length + 1}`
      const h2Match = line.match(/^#{2,3}\s+(.+)$/)
      if (h2Match) sceneTitle = h2Match[1].trim()

      if (inScene.paragraphs.length > 0) {
        const nextScene = { title: sceneTitle, paragraphs: [] }
        currentChapter.scenes.push(nextScene)
        inScene = nextScene
      }
      continue
    }

    const trimmed = line.trim()
    if (trimmed.length > 0) {
      inScene.paragraphs.push(trimmed)
    }
  }

  if (currentChapter.scenes.some((s) => s.paragraphs.length > 0)) {
    chapters.push(currentChapter)
  }

  if (chapters.length === 0) {
    chapters.push({
      title: projectType === 'article' ? title : 'Chapter 1',
      scenes: [{ title: 'Scene 1', paragraphs: ['Start writing your manuscript here...'] }],
    })
  }

  // 3. Assemble ManuscriptProject parts and scenes
  let totalWords = 0
  let totalScenesCount = 0

  const projectChapters: ChapterItem[] = chapters.map((ch, cIdx) => {
    const chapterScenes: SceneItem[] = ch.scenes.map((sc, sIdx) => {
      totalScenesCount++
      const plainText = sc.paragraphs.join('\n\n')
      const wordCount = plainText.split(/\s+/).filter(Boolean).length
      totalWords += wordCount

      // Convert paragraphs to HTML
      const contentHtml = sc.paragraphs
        .map((p) => {
          // Inline bold & italics
          let formatted = p
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
          return `<p>${formatted}</p>`
        })
        .join('')

      return {
        id: `scene-${cIdx + 1}-${sIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        title: sc.title || `Scene ${sIdx + 1}`,
        content: contentHtml,
        plainText,
        synopsis: '',
        status: 'draft',
        wordCount,
        notes: '',
        createdAt: now,
        updatedAt: now,
      }
    })

    return {
      id: `chapter-${cIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      title: ch.title,
      scenes: chapterScenes,
    }
  })

  const newProject: ManuscriptProject = {
    ...baseProject,
    id: 'proj-' + Math.random().toString(36).substring(2, 9),
    title,
    subtitle: subtitle || undefined,
    author,
    projectType,
    parts: [
      {
        id: 'part-1',
        title: projectType === 'article' ? 'Article Body' : 'Part One',
        chapters: projectChapters,
      },
    ],
    updatedAt: now,
  }

  return {
    project: newProject,
    totalWords,
    chaptersCount: projectChapters.length,
    scenesCount: totalScenesCount,
    fileType,
  }
}

/**
 * Parse Word (.docx) manuscript using JSZip and XML parsing.
 */
export async function parseDocxManuscript(
  arrayBuffer: ArrayBuffer,
  fallbackTitle: string
): Promise<ImportSummary> {
  const zip = await JSZip.loadAsync(arrayBuffer)
  const docXmlFile = zip.file('word/document.xml')

  if (!docXmlFile) {
    throw new Error('Invalid Word document: word/document.xml not found.')
  }

  const xmlText = await docXmlFile.async('text')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

  // Extract paragraphs (<w:p>)
  const pElements = xmlDoc.getElementsByTagName('w:p')
  const paragraphs: { text: string; isHeading: boolean; headingText?: string }[] = []

  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i]

    // Check style for heading (w:pStyle w:val="Heading1" etc.)
    const pStyle = p.getElementsByTagName('w:pStyle')[0]
    const styleVal = pStyle ? pStyle.getAttribute('w:val') || '' : ''
    const isHeading =
      /heading/i.test(styleVal) ||
      /title/i.test(styleVal)

    // Extract text runs
    const tElements = p.getElementsByTagName('w:t')
    let text = ''
    for (let j = 0; j < tElements.length; j++) {
      text += tElements[j].textContent || ''
    }

    const trimmed = text.trim()
    if (trimmed.length > 0) {
      const headingDetected =
        isHeading ||
        /^(?:chapter|part|act|prologue|epilogue)\b.*$/i.test(trimmed)

      paragraphs.push({
        text: trimmed,
        isHeading: headingDetected,
        headingText: headingDetected ? trimmed : undefined,
      })
    }
  }

  // Convert extracted Word paragraphs to chapters and scenes
  interface ParsedChapter {
    title: string
    scenes: { title: string; paragraphs: string[] }[]
  }

  const chapters: ParsedChapter[] = []
  let currentChapter: ParsedChapter = {
    title: 'Chapter 1',
    scenes: [{ title: 'Scene 1', paragraphs: [] }],
  }

  for (const item of paragraphs) {
    if (item.isHeading && item.headingText) {
      if (currentChapter.scenes.some((s) => s.paragraphs.length > 0)) {
        chapters.push(currentChapter)
      }
      currentChapter = {
        title: item.headingText,
        scenes: [{ title: 'Scene 1', paragraphs: [] }],
      }
      continue
    }

    if (item.text === '* * *' || item.text === '***' || item.text === '#') {
      if (currentChapter.scenes[currentChapter.scenes.length - 1].paragraphs.length > 0) {
        currentChapter.scenes.push({
          title: `Scene ${currentChapter.scenes.length + 1}`,
          paragraphs: [],
        })
      }
      continue
    }

    const currentScene = currentChapter.scenes[currentChapter.scenes.length - 1]
    currentScene.paragraphs.push(item.text)
  }

  if (currentChapter.scenes.some((s) => s.paragraphs.length > 0)) {
    chapters.push(currentChapter)
  }

  if (chapters.length === 0) {
    chapters.push({
      title: 'Chapter 1',
      scenes: [{ title: 'Scene 1', paragraphs: ['No readable text found in document.'] }],
    })
  }

  const now = new Date().toISOString()
  let totalWords = 0
  let totalScenesCount = 0

  const projectChapters: ChapterItem[] = chapters.map((ch, cIdx) => {
    const chapterScenes: SceneItem[] = ch.scenes.map((sc, sIdx) => {
      totalScenesCount++
      const plainText = sc.paragraphs.join('\n\n')
      const wordCount = plainText.split(/\s+/).filter(Boolean).length
      totalWords += wordCount
      const contentHtml = sc.paragraphs.map((p) => `<p>${p}</p>`).join('')

      return {
        id: `scene-${cIdx + 1}-${sIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        title: sc.title || `Scene ${sIdx + 1}`,
        content: contentHtml,
        plainText,
        synopsis: '',
        status: 'draft',
        wordCount,
        notes: '',
        createdAt: now,
        updatedAt: now,
      }
    })

    return {
      id: `chapter-${cIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      title: ch.title,
      scenes: chapterScenes,
    }
  })

  const baseProject = createDefaultProject()
  const newProject: ManuscriptProject = {
    ...baseProject,
    id: 'proj-' + Math.random().toString(36).substring(2, 9),
    title: fallbackTitle,
    author: 'Author',
    projectType: 'novel',
    parts: [
      {
        id: 'part-1',
        title: 'Part One',
        chapters: projectChapters,
      },
    ],
    updatedAt: now,
  }

  return {
    project: newProject,
    totalWords,
    chaptersCount: projectChapters.length,
    scenesCount: totalScenesCount,
    fileType: 'docx',
  }
}
