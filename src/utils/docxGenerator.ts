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

// Helper to strip HTML tags to extract text paragraphs
function htmlToParagraphs(html: string): string[] {
  if (!html) return []
  // Replace <p>, <div>, <br> with markers
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
  authorContact?: { address?: string; email?: string; phone?: string }
): Promise<Blob> {
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

  // 1. Title Page / First Page Headers
  // Left: Author contact
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 240 }, // single space in contact block
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
  project.parts.forEach((part, partIdx) => {
    part.chapters.forEach((chapter) => {
      chapterIndex++

      // Page break before chapter
      docParagraphs.push(
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 1440, line: 480, after: 480 }, // drop down 1 inch
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

      // Chapter title if distinct
      if (chapter.title && !chapter.title.toLowerCase().startsWith('chapter')) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 480, after: 720 },
            children: [
              new TextRun({
                text: chapter.title,
                font: 'Times New Roman',
                size: 24,
                italics: true,
              }),
            ],
          })
        )
      }

      // Scenes
      chapter.scenes.forEach((scene, sceneIdx) => {
        if (sceneIdx > 0) {
          // Standard manuscript scene break: single centered '#'
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
              top: 1440, // 1 inch
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
