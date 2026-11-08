import JSZip from 'jszip'
import { ManuscriptProject } from '../types/manuscript'

// Helper to escape XML
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Convert HTML content into valid XHTML for EPUB3
function cleanHtmlForEpub(html: string): string {
  if (!html) return '<p></p>'
  // Replace <br> with <br/>, <hr> with <hr/>, <img> with <img/>
  let cleaned = html
    .replace(/<br>/gi, '<br/>')
    .replace(/<hr>/gi, '<hr/>')
    .replace(/<img([^>]*[^/])>/gi, '<img$1/>')
    .replace(/&nbsp;/gi, '&#160;')

  return cleaned
}

export async function generateEpub(project: ManuscriptProject): Promise<Blob> {
  const zip = new JSZip()
  const { exportSettings } = project

  // 1. mimetype (MUST be first and uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  )

  // 3. CSS Stylesheet
  const css = `
@charset "utf-8";
body {
  margin: 5% 8%;
  font-family: "EB Garamond", Georgia, "Times New Roman", serif;
  line-height: 1.6;
  text-align: justify;
  color: #1a1a1a;
}
h1, h2, h3 {
  font-family: inherit;
  text-align: center;
  font-weight: bold;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
h1.book-title {
  font-size: 2.2em;
  margin-top: 25%;
  margin-bottom: 0.2em;
}
p.subtitle {
  text-align: center;
  font-style: italic;
  font-size: 1.1em;
  margin-bottom: 2em;
}
p.author {
  text-align: center;
  font-size: 1.2em;
  letter-spacing: 0.1em;
  margin-top: 3em;
}
h2.chapter-title {
  font-size: 1.6em;
  margin-top: 20%;
  margin-bottom: 1.5em;
}
p {
  margin-top: 0;
  margin-bottom: 0;
  text-indent: 1.5em;
}
p.no-indent, .first-p {
  text-indent: 0 !important;
}
${
  exportSettings.dropCaps
    ? `
p.drop-cap:first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.8;
  padding-top: 4px;
  padding-right: 8px;
  padding-left: 2px;
  font-family: Georgia, serif;
}
`
    : ''
}
.scene-divider {
  text-align: center;
  margin: 1.8em 0;
  text-indent: 0;
  letter-spacing: 0.4em;
  font-size: 0.9em;
  color: #666;
}
.center {
  text-align: center;
  text-indent: 0;
}
.italic {
  font-style: italic;
}
`
  zip.file('OEBPS/styles.css', css)

  // Items to track for manifest & spine
  interface ManifestEntry {
    id: string
    href: string
    mediaType: string
    properties?: string
    title: string
  }

  const manifest: ManifestEntry[] = [
    { id: 'css', href: 'styles.css', mediaType: 'text/css', title: 'Stylesheet' },
    { id: 'nav', href: 'nav.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav', title: 'Table of Contents' },
  ]
  const spine: string[] = []
  const tocEntries: Array<{ href: string; title: string }> = []

  // Add Cover Image & Cover XHTML if available
  let hasCover = false
  if (exportSettings.coverImage && exportSettings.includeCoverPage) {
    const match = exportSettings.coverImage.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/)
    if (match) {
      hasCover = true
      const mimeType = match[1]
      const base64Data = match[2]
      const ext = mimeType === 'image/png' ? 'png' : 'jpg'
      const coverImageFileName = `cover.${ext}`

      // Add image binary to OEBPS
      zip.file(`OEBPS/${coverImageFileName}`, base64Data, { base64: true })

      // Add cover.xhtml
      const coverHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${project.language}">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
  <style type="text/css">
    @page { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; text-align: center; background-color: #0b132b; }
    div.cover-container { text-align: center; height: 100vh; max-height: 100vh; }
    img.cover-img { max-width: 100%; max-height: 100%; height: 100vh; width: auto; object-fit: contain; }
  </style>
</head>
<body epub:type="cover">
  <div class="cover-container">
    <img class="cover-img" src="${coverImageFileName}" alt="${escapeXml(project.title)} Cover"/>
  </div>
</body>
</html>`
      zip.file('OEBPS/cover.xhtml', coverHtml)

      // Add to manifest and spine as first item
      manifest.push(
        { id: 'cover-image', href: coverImageFileName, mediaType: mimeType, properties: 'cover-image', title: 'Cover Image' },
        { id: 'cover-page', href: 'cover.xhtml', mediaType: 'application/xhtml+xml', title: 'Cover' }
      )
      spine.push('cover-page')
      tocEntries.push({ href: 'cover.xhtml', title: 'Cover' })
    }
  }

  // Add Front Matter
  project.frontMatter
    .filter((fm) => fm.includedInExport)
    .forEach((fm, index) => {
      const fileId = `fm_${index + 1}`
      const fileName = `${fileId}.xhtml`
      const content = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${project.language}">
<head>
  <title>${escapeXml(fm.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body epub:type="frontmatter">
  <div class="frontmatter-section">
    ${cleanHtmlForEpub(fm.content)}
  </div>
</body>
</html>`
      zip.file(`OEBPS/${fileName}`, content)
      manifest.push({ id: fileId, href: fileName, mediaType: 'application/xhtml+xml', title: fm.title })
      spine.push(fileId)
      tocEntries.push({ href: fileName, title: fm.title })
    })

  // Add Chapters & Scenes
  let chapterCounter = 0
  project.parts.forEach((part, pIdx) => {
    part.chapters.forEach((chap) => {
      chapterCounter++
      const fileId = `chap_${chapterCounter}`
      const fileName = `${fileId}.xhtml`

      let chapterTitleHtml = ''
      if (exportSettings.chapterTitleStyle === 'num-and-title') {
        chapterTitleHtml = `<h2 class="chapter-title">${escapeXml(chap.title)}</h2>`
      } else if (exportSettings.chapterTitleStyle === 'num-only') {
        chapterTitleHtml = `<h2 class="chapter-title">Chapter ${chapterCounter}</h2>`
      } else {
        chapterTitleHtml = `<h2 class="chapter-title">${escapeXml(chap.title)}</h2>`
      }

      // Build scenes inside chapter
      const scenesHtml = chap.scenes
        .map((scene, sIdx) => {
          const divider =
            sIdx > 0 && exportSettings.includeSceneDividers
              ? `<p class="scene-divider">${escapeXml(exportSettings.sceneDividerSymbol)}</p>`
              : ''
          const sceneContent = cleanHtmlForEpub(scene.content)
          return `${divider}<div class="scene">${sceneContent}</div>`
        })
        .join('\n')

      const chapterPageHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${project.language}">
<head>
  <title>${escapeXml(chap.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body epub:type="bodymatter chapter">
  ${part.chapters.length > 0 && pIdx >= 0 && chapterCounter === 1 ? `<p class="center italic" style="margin-bottom:2em;">${escapeXml(part.title)}</p>` : ''}
  ${chapterTitleHtml}
  ${scenesHtml}
</body>
</html>`

      zip.file(`OEBPS/${fileName}`, chapterPageHtml)
      manifest.push({ id: fileId, href: fileName, mediaType: 'application/xhtml+xml', title: chap.title })
      spine.push(fileId)
      tocEntries.push({ href: fileName, title: chap.title })
    })
  })

  // Add Back Matter
  project.backMatter
    .filter((bm) => bm.includedInExport)
    .forEach((bm, index) => {
      const fileId = `bm_${index + 1}`
      const fileName = `${fileId}.xhtml`
      const content = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${project.language}">
<head>
  <title>${escapeXml(bm.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body epub:type="backmatter">
  <h2 class="chapter-title">${escapeXml(bm.title)}</h2>
  <div class="backmatter-section">
    ${cleanHtmlForEpub(bm.content)}
  </div>
</body>
</html>`
      zip.file(`OEBPS/${fileName}`, content)
      manifest.push({ id: fileId, href: fileName, mediaType: 'application/xhtml+xml', title: bm.title })
      spine.push(fileId)
      tocEntries.push({ href: fileName, title: bm.title })
    })

  // 4. EPUB 3 Navigation Document (nav.xhtml)
  const navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${project.language}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${tocEntries.map((entry) => `<li><a href="${entry.href}">${escapeXml(entry.title)}</a></li>`).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`
  zip.file('OEBPS/nav.xhtml', navHtml)

  // 5. EPUB 2 NCX file (for broad device compatibility e.g. older Kindles)
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${project.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(project.title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(project.author)}</text>
  </docAuthor>
  <navMap>
    ${tocEntries
      .map(
        (entry, idx) => `
    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(entry.title)}</text></navLabel>
      <content src="${entry.href}"/>
    </navPoint>`
      )
      .join('')}
  </navMap>
</ncx>`
  zip.file('OEBPS/toc.ncx', ncx)
  manifest.push({ id: 'ncx', href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml', title: 'NCX' })

  // 6. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${project.id}</dc:identifier>
    <dc:title>${escapeXml(project.title)}</dc:title>
    <dc:creator id="creator">${escapeXml(project.author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <dc:language>${project.language || 'en'}</dc:language>
    <dc:date>${new Date().toISOString()}</dc:date>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ''}
    ${project.publisher ? `<dc:publisher>${escapeXml(project.publisher)}</dc:publisher>` : ''}
    ${project.description ? `<dc:description>${escapeXml(project.description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifest.map((m) => `<item id="${m.id}" href="${m.href}" media-type="${m.mediaType}" ${m.properties ? `properties="${m.properties}"` : ''}/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spine.map((id) => `<itemref idref="${id}"/>`).join('\n    ')}
  </spine>
</package>`

  zip.file('OEBPS/content.opf', opf)

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
}
