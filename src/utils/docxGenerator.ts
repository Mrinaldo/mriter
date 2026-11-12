import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  PageNumber,
  Packer,
} from 'docx'
import { ManuscriptProject } from '../types/manuscript'

export type DocxExportFormat = 'novel' | 'short-story' | 'article'

// Helper to strip HTML tags to extract text paragraphs
function htmlToParagraphs(html: string): string[] {
  if (!html) return []
  const text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')

  return text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

// Convert number to word (e.g. 1 -> ONE, 2 -> TWO)
function numberToWord(n: number): string {
  const words = [
    'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY'
  ]
  return words[n] || n.toString()
}

export async function generateDocx(
  project: ManuscriptProject,
  authorContact?: { address?: string; email?: string; phone?: string },
  formatOverride?: DocxExportFormat
): Promise<Blob> {
  const effectiveFormat: DocxExportFormat =
    formatOverride || (project.projectType as DocxExportFormat) || 'novel'

  const docParagraphs: Paragraph[] = []

  // Extract author surname for running header
  const authorNames = project.author.trim().split(' ')
  const surname = authorNames[authorNames.length - 1].toUpperCase()
  const shortTitle = project.title.toUpperCase().slice(0, 30)

  // Calculate total manuscript word count
  let totalWords = 0
  project.parts.forEach((p) => {
    p.chapters.forEach((c) => {
      c.scenes.forEach((s) => {
        totalWords += s.wordCount || 0
      })
    })
  })
  const roundedWords = Math.ceil(totalWords / 100) * 100

  // =========================================================================
  // 1. SHORT STORY FORMAT (Standard William Shunn Short Fiction Submission)
  // Story starts directly on Page 1 below the title block!
  // =========================================================================
  if (effectiveFormat === 'short-story') {
    // Contact block at top-left, word count at top-right
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({ text: project.author, font: 'Times New Roman', size: 24 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: authorContact?.email || 'author@example.com',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: authorContact?.phone || '',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, line: 240 },
        children: [
          new TextRun({
            text: `About ${roundedWords.toLocaleString()} words`,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )

    // Drop down to middle of page
    for (let i = 0; i < 4; i++) {
      docParagraphs.push(
        new Paragraph({
          spacing: { line: 480 },
          children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
        })
      )
    }

    // Title Block (Uses individual story title if collection, or project title)
    const firstStoryTitle =
      project.parts[0]?.chapters.length > 1 && project.parts[0]?.chapters[0]?.title
        ? project.parts[0].chapters[0].title
        : project.title

    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: firstStoryTitle.toUpperCase(),
            font: 'Times New Roman',
            size: 24,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [new TextRun({ text: 'by', font: 'Times New Roman', size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, after: 720 },
        children: [
          new TextRun({
            text: project.author,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )

    // Story Text begins directly on Page 1
    let isFirstChapter = true
    project.parts.forEach((part) => {
      part.chapters.forEach((chapter) => {
        if (!isFirstChapter) {
          // Page break and Header for subsequent stories in collection
          docParagraphs.push(
            new Paragraph({
              pageBreakBefore: true,
              alignment: AlignmentType.CENTER,
              spacing: { before: 1440, line: 480 },
              children: [
                new TextRun({
                  text: (chapter.title || 'UNTITLED STORY').toUpperCase(),
                  font: 'Times New Roman',
                  size: 24,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 480 },
              children: [new TextRun({ text: 'by', font: 'Times New Roman', size: 24 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 480, after: 720 },
              children: [
                new TextRun({
                  text: project.author,
                  font: 'Times New Roman',
                  size: 24,
                }),
              ],
            })
          )
        }
        isFirstChapter = false

        let isFirstSceneInChapter = true
        chapter.scenes.forEach((scene) => {
          if (!isFirstSceneInChapter) {
            // Centered '#' for scene break
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 480, line: 480, after: 480 },
                children: [
                  new TextRun({
                    text: '#',
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              })
            )
          }
          isFirstSceneInChapter = false

          const paragraphs = htmlToParagraphs(scene.content)
          paragraphs.forEach((pText) => {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 720 }, // 0.5 inch indent
                spacing: { line: 480 }, // Double spaced
                children: [
                  new TextRun({
                    text: pText,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              })
            )
          })
        })
      })
    })

    // End mark
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, line: 480 },
        children: [
          new TextRun({
            text: '### END ###',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )
  }
  // =========================================================================
  // 2. ARTICLE / ESSAY FORMAT
  // Clean editorial title block and continuous prose
  // =========================================================================
  else if (effectiveFormat === 'article') {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, after: 240 },
        children: [
          new TextRun({
            text: project.title,
            font: 'Times New Roman',
            size: 36, // 18pt
            bold: true,
          }),
        ],
      })
    )

    if (project.subtitle) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: project.subtitle,
              font: 'Times New Roman',
              size: 28, // 14pt
              italics: true,
            }),
          ],
        })
      )
    }

    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240, after: 720 },
        children: [
          new TextRun({
            text: `By ${project.author}  •  ${roundedWords.toLocaleString()} words`,
            font: 'Times New Roman',
            size: 22, // 11pt
            color: '666666',
          }),
        ],
      })
    )

    project.parts.forEach((part) => {
      part.chapters.forEach((chapter) => {
        chapter.scenes.forEach((scene) => {
          const paragraphs = htmlToParagraphs(scene.content)
          paragraphs.forEach((pText) => {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { line: 360, after: 240 }, // 1.5 spacing with paragraph gap
                children: [
                  new TextRun({
                    text: pText,
                    font: 'Times New Roman',
                    size: 24, // 12pt
                  }),
                ],
              })
            )
          })
        })
      })
    })
  }
  // =========================================================================
  // 3. NOVEL FORMAT (Standard William Shunn Novel Manuscript)
  // Dedicated Title Page, then Page Break, then Chapters
  // =========================================================================
  else {
    // 1. Title Page Headers
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({ text: project.author, font: 'Times New Roman', size: 24 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: authorContact?.email || 'author@example.com',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: authorContact?.phone || '',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, line: 240 },
        children: [
          new TextRun({
            text: `About ${roundedWords.toLocaleString()} words`,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )

    // Spacing down to middle of page
    for (let i = 0; i < 6; i++) {
      docParagraphs.push(
        new Paragraph({
          spacing: { line: 480 },
          children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
        })
      )
    }

    // Centered Title Block
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: project.title.toUpperCase(),
            font: 'Times New Roman',
            size: 24,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [new TextRun({ text: 'by', font: 'Times New Roman', size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: project.author,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )

    // Chapters & Body
    let chapterIndex = 0
    project.parts.forEach((part) => {
      part.chapters.forEach((chapter) => {
        chapterIndex++

        const includeNumbers = project.exportSettings?.includeChapterNumbers ?? true
        const style = project.exportSettings?.chapterTitleStyle ?? 'num-and-title'

        if (style !== 'none') {
          if (style === 'num-only' || (style === 'num-and-title' && includeNumbers)) {
            docParagraphs.push(
              new Paragraph({
                pageBreakBefore: true,
                alignment: AlignmentType.CENTER,
                spacing: { before: 1440, line: 480, after: 480 },
                children: [
                  new TextRun({
                    text: `CHAPTER ${numberToWord(chapterIndex)}`,
                    font: 'Times New Roman',
                    size: 24,
                    bold: true,
                  }),
                ],
              })
            )
          }

          if ((style === 'title-only' || style === 'num-and-title') && chapter.title) {
            docParagraphs.push(
              new Paragraph({
                pageBreakBefore: style === 'title-only',
                alignment: AlignmentType.CENTER,
                spacing: { before: style === 'title-only' ? 1440 : 240, line: 480, after: 720 },
                children: [
                  new TextRun({
                    text: chapter.title,
                    font: 'Times New Roman',
                    size: 24,
                    bold: style === 'title-only',
                    italics: style !== 'title-only',
                  }),
                ],
              })
            )
          }
        }

        chapter.scenes.forEach((scene, sceneIdx) => {
          if (sceneIdx > 0) {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 480, line: 480, after: 480 },
                children: [
                  new TextRun({
                    text: '#',
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              })
            )
          }

          const paragraphs = htmlToParagraphs(scene.content)
          paragraphs.forEach((pText) => {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 720 },
                spacing: { line: 480 },
                children: [
                  new TextRun({
                    text: pText,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              })
            )
          })
        })
      })
    })

    // End mark
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, line: 480 },
        children: [
          new TextRun({
            text: '### END ###',
            font: 'Times New Roman',
            size: 24,
          }),
        ],
      })
    )
  }

  // Running Header (Surname / Title / Page Number)
  const runningHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: `${surname} / ${shortTitle} / `,
            font: 'Times New Roman',
            size: 20,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: 'Times New Roman',
            size: 20,
          }),
        ],
      }),
    ],
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: runningHeader,
        },
        children: docParagraphs,
      },
    ],
  })

  const buffer = await Packer.toBlob(doc)
  return buffer
}
