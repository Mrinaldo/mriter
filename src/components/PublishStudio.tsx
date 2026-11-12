import React, { useState } from 'react'
import {
  Download,
  BookOpen,
  FileText,
  Printer,
  Sparkles,
  Smartphone,
  Book,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Code,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { generateEpub } from '../utils/epubGenerator'
import { generateDocx, DocxExportFormat } from '../utils/docxGenerator'
import { generateProjectMarkdown } from '../utils/markdownGenerator'
import { BookTheme, TrimSize } from '../types/manuscript'
import { SAMPLE_COVER_IMAGE } from '../utils/sampleCoverBase64'

export const PublishStudio: React.FC = () => {
  const { project, setProject } = useManuscript()
  const { exportSettings } = project

  const [activeTab, setActiveTab] = useState<'preview' | 'cover' | 'styles' | 'metadata'>('preview')
  const [devicePreview, setDevicePreview] = useState<'ereader' | 'print' | 'phone'>('ereader')
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null)
  const [docxFormat, setDocxFormat] = useState<DocxExportFormat | 'auto'>('auto')
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | null>(null)

  // Assemble all book sections for pagination in preview
  interface PreviewSection {
    title: string
    type: string
    contentHtml: string
    isChapter?: boolean
    isCover?: boolean
    chapterNum?: number
  }

  const previewSections: PreviewSection[] = []

  // 0. Cover Page
  if (exportSettings.coverImage && exportSettings.includeCoverPage) {
    previewSections.push({
      title: 'Book Cover',
      type: 'cover',
      isCover: true,
      contentHtml: '',
    })
  }

  // 1. Front matter
  project.frontMatter
    .filter((fm) => fm.includedInExport)
    .forEach((fm) => {
      previewSections.push({
        title: fm.title,
        type: 'frontmatter',
        contentHtml: fm.content,
      })
    })

  // 2. Chapters & Scenes
  let chapCount = 0
  project.parts.forEach((p) => {
    p.chapters.forEach((c) => {
      chapCount++
      const scenesHtml = c.scenes
        .map((s, idx) => {
          const divider =
            idx > 0 && exportSettings.includeSceneDividers
              ? `<p class="my-8 text-center text-muted-theme font-serif tracking-[0.5em] text-xs">${exportSettings.sceneDividerSymbol}</p>`
              : ''
          return `${divider}<div>${s.content}</div>`
        })
        .join('')

      previewSections.push({
        title: c.title,
        type: 'chapter',
        contentHtml: scenesHtml,
        isChapter: true,
        chapterNum: chapCount,
      })
    })
  })

  // 3. Back matter
  project.backMatter
    .filter((bm) => bm.includedInExport)
    .forEach((bm) => {
      previewSections.push({
        title: bm.title,
        type: 'backmatter',
        contentHtml: bm.content,
      })
    })

  const currentSection = previewSections[currentPreviewIndex] || previewSections[0]

  // Update export settings
  const updateSettings = (updates: Partial<typeof exportSettings>) => {
    setProject((prev) => ({
      ...prev,
      exportSettings: {
        ...prev.exportSettings,
        ...updates,
      },
      updatedAt: new Date().toISOString(),
    }))
  }

  // Handle Cover Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateSettings({ coverImage: reader.result, includeCoverPage: true })
          setCurrentPreviewIndex(0)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle EPUB 3 Export
  const handleExportEpub = async () => {
    setIsExporting(true)
    setExportSuccessMessage(null)
    try {
      const blob = await generateEpub(project)
      const fileName = `${project.title || 'manuscript'}.epub`

      if (window.electronAPI) {
        // Save via native dialog in Electron
        const saveRes = await window.electronAPI.showSaveFileDialog({
          title: 'Export EPUB 3 Ebook',
          defaultName: fileName,
          filters: [{ name: 'EPUB Ebook (*.epub)', extensions: ['epub'] }],
        })
        if (!saveRes.canceled && saveRes.filePath) {
          const buffer = await blob.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
          await window.electronAPI.saveFile({
            filePath: saveRes.filePath,
            content: base64,
            isBinary: true,
          })
          setExportSuccessMessage(`EPUB successfully exported to ${saveRes.filePath}!`)
        }
      } else {
        // Browser download fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        setExportSuccessMessage(`EPUB successfully downloaded!`)
      }
    } catch (err) {
      console.error('EPUB export failed', err)
      alert('Failed to export EPUB. See console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Standard Manuscript DOCX Export
  const handleExportDocx = async () => {
    setIsExporting(true)
    setExportSuccessMessage(null)
    try {
      const effectiveFormat: DocxExportFormat | undefined =
        docxFormat === 'auto' ? undefined : docxFormat
      const blob = await generateDocx(project, undefined, effectiveFormat)
      const fileName = `${project.author || 'Author'} - ${project.title || 'Manuscript'}.docx`

      if (window.electronAPI) {
        const saveRes = await window.electronAPI.showSaveFileDialog({
          title: 'Export Standard Manuscript DOCX',
          defaultName: fileName,
          filters: [{ name: 'Word Document (*.docx)', extensions: ['docx'] }],
        })
        if (!saveRes.canceled && saveRes.filePath) {
          const buffer = await blob.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
          await window.electronAPI.saveFile({
            filePath: saveRes.filePath,
            content: base64,
            isBinary: true,
          })
          setExportSuccessMessage(`DOCX successfully exported to ${saveRes.filePath}!`)
        }
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        setExportSuccessMessage(`DOCX standard manuscript downloaded!`)
      }
    } catch (err) {
      console.error('DOCX export failed', err)
      alert('Failed to export DOCX. See console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Clean Markdown (.md) Export
  const handleExportMarkdown = async () => {
    setIsExporting(true)
    setExportSuccessMessage(null)
    try {
      const md = generateProjectMarkdown(project)
      const fileName = `${project.title || 'manuscript'}.md`

      if (window.electronAPI) {
        const saveRes = await window.electronAPI.showSaveFileDialog({
          title: 'Export Markdown (.md)',
          defaultName: fileName,
          filters: [{ name: 'Markdown (*.md)', extensions: ['md'] }],
        })
        if (!saveRes.canceled && saveRes.filePath) {
          await window.electronAPI.saveFile({
            filePath: saveRes.filePath,
            content: md,
          })
          setExportSuccessMessage(`Markdown successfully exported to ${saveRes.filePath}!`)
        }
      } else {
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        setExportSuccessMessage(`Markdown file (.md) downloaded!`)
      }
    } catch (err) {
      console.error('Markdown export failed', err)
      alert('Failed to export Markdown. See console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Copy Markdown to Clipboard
  const handleCopyMarkdown = async () => {
    try {
      const md = generateProjectMarkdown(project)
      await navigator.clipboard.writeText(md)
      setCopiedType('markdown')
      setExportSuccessMessage('Manuscript copied to clipboard as clean Markdown!')
      setTimeout(() => setCopiedType(null), 2500)
    } catch (err) {
      console.error('Copy markdown failed', err)
      alert('Failed to copy Markdown to clipboard.')
    }
  }

  // Handle Copy Clean HTML to Clipboard
  const handleCopyHtml = async () => {
    try {
      const sections: string[] = []
      project.parts.forEach((p) => {
        p.chapters.forEach((c) => {
          sections.push(`<h2>${c.title}</h2>`)
          c.scenes.forEach((s) => {
            sections.push(s.content)
          })
        })
      })
      const fullHtml = sections.join('\n\n')
      await navigator.clipboard.writeText(fullHtml)
      setCopiedType('html')
      setExportSuccessMessage('Clean HTML content copied to clipboard!')
      setTimeout(() => setCopiedType(null), 2500)
    } catch (err) {
      console.error('Copy HTML failed', err)
      alert('Failed to copy HTML to clipboard.')
    }
  }

  // Handle Print PDF
  const handlePrintPDF = () => {
    window.print()
  }

  // Theme styling for preview - headings and body share harmonious font families
  const getThemeTypographyClass = (theme: BookTheme) => {
    switch (theme) {
      case 'fantasy':
        return {
          font: 'font-["EB_Garamond",serif]',
          heading: 'font-["EB_Garamond",serif] tracking-wider uppercase font-bold',
        }
      case 'modern':
        return {
          font: 'font-["Inter",sans-serif]',
          heading: 'font-["Inter",sans-serif] font-bold tracking-tight',
        }
      case 'romantic':
        return {
          font: 'font-["Newsreader",serif]',
          heading: 'font-["Newsreader",serif] font-bold tracking-wide',
        }
      case 'classic':
      default:
        return {
          font: 'font-["EB_Garamond",serif]',
          heading: 'font-["EB_Garamond",serif] tracking-widest uppercase font-bold',
        }
    }
  }

  const typo = getThemeTypographyClass(exportSettings.bookTheme)

  return (
    <div className="flex-1 flex flex-col h-full bg-app text-main overflow-hidden select-none">
      {/* Top Studio Control Bar */}
      <div className="h-12 bg-panel border-b border-subtle px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-accent" />
          <div>
            <h2 className="text-xs font-serif font-semibold text-main">Publishing Studio</h2>
            <p className="text-[10px] text-muted-theme">
              Preview, typesetting, and production-ready exports
            </p>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center bg-surface p-0.5 rounded-md border border-subtle text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-panel text-main font-semibold shadow-xs'
                : 'text-muted-theme hover:text-main'
            }`}
          >
            Interior Preview
          </button>
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
              activeTab === 'cover'
                ? 'bg-panel text-main font-semibold shadow-xs'
                : 'text-muted-theme hover:text-main'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Cover Art</span>
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'styles'
                ? 'bg-panel text-main font-semibold shadow-xs'
                : 'text-muted-theme hover:text-main'
            }`}
          >
            Typography & Layout
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'metadata'
                ? 'bg-panel text-main font-semibold shadow-xs'
                : 'text-muted-theme hover:text-main'
            }`}
          >
            Book Metadata
          </button>
        </div>

        {/* Right: Export Buttons */}
        <div className="flex items-center space-x-2">
          {/* Markdown & HTML Button Group */}
          <div className="flex items-center bg-surface border border-subtle rounded-md overflow-hidden text-xs">
            <button
              onClick={handleExportMarkdown}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-muted-theme hover:text-main hover:bg-panel transition-colors cursor-pointer"
              title="Export clean Markdown (.md) with YAML frontmatter"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Export .MD</span>
            </button>
            <div className="w-[1px] h-4 bg-border-subtle" />
            <button
              onClick={handleCopyMarkdown}
              className="px-2 py-1 text-muted-theme hover:text-main hover:bg-panel transition-colors flex items-center space-x-1 cursor-pointer"
              title="Copy entire project as clean Markdown to clipboard"
            >
              {copiedType === 'markdown' ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">Copy MD</span>
            </button>
            <div className="w-[1px] h-4 bg-border-subtle" />
            <button
              onClick={handleCopyHtml}
              className="px-2 py-1 text-muted-theme hover:text-main hover:bg-panel transition-colors flex items-center space-x-1 cursor-pointer"
              title="Copy project prose as clean HTML to clipboard"
            >
              {copiedType === 'html' ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Code className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">HTML</span>
            </button>
          </div>

          {/* DOCX Format Selection & Export */}
          <div className="flex items-center bg-surface border border-subtle rounded-md overflow-hidden">
            <select
              value={docxFormat}
              onChange={(e) => setDocxFormat(e.target.value as any)}
              className="bg-transparent text-muted-theme hover:text-main text-[11px] px-2 py-1 outline-none cursor-pointer border-r border-subtle"
              title="DOCX formatting specification"
            >
              <option value="auto">DOCX: Auto ({project.projectType || 'novel'})</option>
              <option value="novel">DOCX: Standard Novel</option>
              <option value="short-story">DOCX: Shunn Short Fiction</option>
              <option value="article">DOCX: Article / Essay</option>
            </select>
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-main hover:bg-panel transition-colors cursor-pointer"
              title="Export Word Document (.docx)"
            >
              <Download className="w-3 h-3 text-muted-theme" />
              <span>Export</span>
            </button>
          </div>

          {/* EPUB 3 Export */}
          <button
            onClick={handleExportEpub}
            disabled={isExporting}
            className="flex items-center space-x-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-surface)] px-3 py-1 rounded-md text-xs font-medium shadow-xs transition-opacity cursor-pointer"
            title="Export EPUB 3 for Amazon KDP, Apple Books, Kobo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EPUB 3</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {exportSuccessMessage && (
        <div className="bg-accent-soft border-b border-subtle px-5 py-2 flex items-center justify-between text-xs text-accent animate-in fade-in">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-muted-theme hover:text-main font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Config Sidebar (when in cover/styles/metadata mode) */}
        {activeTab !== 'preview' && (
          <div className="w-88 bg-panel border-r border-subtle p-5 overflow-y-auto space-y-5 shrink-0">
            {/* COVER ART TAB */}
            {activeTab === 'cover' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-serif font-bold text-main mb-1">Ebook Cover Art</h3>
                  <p className="text-[11px] text-muted-theme mb-3">
                    Front cover image embedded into the EPUB 3 file for Amazon KDP, Apple Books, and Google Play.
                  </p>
                </div>

                {exportSettings.coverImage ? (
                  <div className="space-y-3.5">
                    <div className="relative mx-auto w-40 aspect-[1/1.5] rounded-md overflow-hidden border border-subtle shadow-md bg-surface">
                      <img
                        src={exportSettings.coverImage}
                        alt="Book Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5 pt-1">
                      <label className="flex items-center justify-center space-x-2 bg-surface hover:bg-panel text-main border border-subtle py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-accent" />
                        <span>Upload Custom Cover</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>

                      <button
                        onClick={() => {
                          updateSettings({ coverImage: SAMPLE_COVER_IMAGE, includeCoverPage: true })
                          setCurrentPreviewIndex(0)
                        }}
                        className="flex items-center justify-center space-x-1.5 text-muted-theme hover:text-main text-xs py-1 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Celestial Cover</span>
                      </button>

                      <button
                        onClick={() => updateSettings({ coverImage: undefined, includeCoverPage: false })}
                        className="flex items-center justify-center space-x-1.5 text-muted-theme hover:text-red-600 text-xs py-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Cover Image</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-subtle rounded-lg p-6 text-center space-y-3 bg-surface">
                    <ImageIcon className="w-8 h-8 text-faint mx-auto" />
                    <p className="text-xs text-muted-theme">No cover image currently assigned.</p>
                    <div className="flex flex-col space-y-2">
                      <label className="inline-flex items-center justify-center space-x-2 bg-accent text-[var(--bg-surface)] font-medium py-1.5 px-3 rounded-md text-xs cursor-pointer hover:opacity-90 transition-opacity">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Cover Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>
                      <button
                        onClick={() => {
                          updateSettings({ coverImage: SAMPLE_COVER_IMAGE, includeCoverPage: true })
                          setCurrentPreviewIndex(0)
                        }}
                        className="text-xs text-accent hover:underline py-1"
                      >
                        Use Sample Illustrated Cover
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-subtle">
                  <label className="flex items-center justify-between text-xs text-muted-theme hover:text-main cursor-pointer">
                    <span>Embed Cover Page in EPUB & Preview</span>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeCoverPage}
                      onChange={(e) => updateSettings({ includeCoverPage: e.target.checked })}
                      className="accent-[var(--accent)] rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* STYLES TAB */}
            {activeTab === 'styles' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-serif font-bold text-main mb-1">
                    Book Interior Theme
                  </h3>
                  <p className="text-[11px] text-muted-theme mb-2.5">
                    Choose the typesetting aesthetic that fits your genre.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'classic', label: 'Classic Literary', desc: 'Garamond & Roman serif' },
                      { id: 'fantasy', label: 'Epic Fantasy', desc: 'Cinzel headers & emblems' },
                      { id: 'modern', label: 'Modern Minimal', desc: 'Contemporary clean look' },
                      { id: 'romantic', label: 'Romantic Serif', desc: 'Poetic & soft flourishes' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => updateSettings({ bookTheme: th.id as BookTheme })}
                        className={`p-2.5 rounded-md border text-left transition-all ${
                          exportSettings.bookTheme === th.id
                            ? 'bg-accent-soft border-[var(--accent)] text-main'
                            : 'bg-surface border-subtle text-muted-theme hover:text-main'
                        }`}
                      >
                        <span className="font-serif font-semibold text-xs block text-main">
                          {th.label}
                        </span>
                        <span className="text-[10px] text-faint">{th.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trim Size */}
                <div>
                  <h3 className="text-xs font-serif font-bold text-main mb-1">
                    Print Trim Size
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: '5x8', label: '5" × 8"' },
                      { id: '5.5x8.5', label: '5.5" × 8.5"' },
                      { id: '6x9', label: '6" × 9"' },
                      { id: 'a5', label: 'A5' },
                    ].map((size) => (
                      <button
                        key={size.id}
                        onClick={() => updateSettings({ trimSize: size.id as TrimSize })}
                        className={`py-1.5 text-center rounded-md border text-xs font-medium transition-colors ${
                          exportSettings.trimSize === size.id
                            ? 'bg-accent-soft border-[var(--accent)] text-accent font-semibold'
                            : 'bg-surface border-subtle text-muted-theme hover:text-main'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Toggles */}
                <div className="space-y-3 pt-3 border-t border-subtle">
                  <h3 className="text-[10px] uppercase font-semibold text-faint tracking-wider">
                    Typesetting Options
                  </h3>

                  <label className="flex items-center justify-between text-xs text-muted-theme hover:text-main cursor-pointer">
                    <span>Drop Caps on Chapter Openings</span>
                    <input
                      type="checkbox"
                      checked={exportSettings.dropCaps}
                      onChange={(e) => updateSettings({ dropCaps: e.target.checked })}
                      className="accent-[var(--accent)] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-muted-theme hover:text-main cursor-pointer">
                    <span>Include Scene Dividers</span>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeSceneDividers}
                      onChange={(e) => updateSettings({ includeSceneDividers: e.target.checked })}
                      className="accent-[var(--accent)] rounded"
                    />
                  </label>

                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">
                      Scene Divider Symbol
                    </label>
                    <input
                      type="text"
                      value={exportSettings.sceneDividerSymbol}
                      onChange={(e) => updateSettings({ sceneDividerSymbol: e.target.value })}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">
                      Chapter Title Style
                    </label>
                    <select
                      value={exportSettings.chapterTitleStyle}
                      onChange={(e: any) => updateSettings({ chapterTitleStyle: e.target.value })}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    >
                      <option value="num-and-title">Number and Title (Chapter 1: The Ash Upon The Water)</option>
                      <option value="title-only">Title Only (The Ash Upon The Water)</option>
                      <option value="num-only">Number Only (Chapter 1)</option>
                      <option value="none">None (Continuous / No Chapter Headers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">
                      Manuscript Submission Format (.docx)
                    </label>
                    <select
                      value={docxFormat}
                      onChange={(e) => setDocxFormat(e.target.value as any)}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    >
                      <option value="auto">Auto-detect ({project.projectType || 'novel'})</option>
                      <option value="novel">Standard Novel (Double spaced, 1" margins, title page, chapter breaks)</option>
                      <option value="short-story">William Shunn Short Story (Page 1 header block, no chapter breaks)</option>
                      <option value="article">Article / Essay (Clean single/1.5-spaced, modern headers)</option>
                    </select>
                    <p className="text-[10px] text-faint mt-1">
                      {docxFormat === 'short-story' || (docxFormat === 'auto' && project.projectType === 'short-story')
                        ? 'Follows classic William Shunn guidelines: contact top-left, word count top-right, title midway down page 1.'
                        : docxFormat === 'article' || (docxFormat === 'auto' && project.projectType === 'article')
                        ? 'Contemporary editorial essay styling with clean section dividers and typography.'
                        : 'Standard publishing manuscript layout with dedicated title page and individual chapter page breaks.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* METADATA TAB */}
            {activeTab === 'metadata' && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-serif font-bold text-main mb-1">Book Metadata</h3>
                <p className="text-[11px] text-muted-theme mb-2.5">
                  Embedded into the EPUB 3 package for Amazon KDP & Apple Books.
                </p>

                <div>
                  <label className="text-[11px] text-muted-theme block mb-1">Book Title</label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                    className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-theme block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={project.subtitle || ''}
                    onChange={(e) => setProject((p) => ({ ...p, subtitle: e.target.value }))}
                    className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">Author Name</label>
                    <input
                      type="text"
                      value={project.author}
                      onChange={(e) => setProject((p) => ({ ...p, author: e.target.value }))}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">Publisher</label>
                    <input
                      type="text"
                      value={project.publisher || ''}
                      onChange={(e) => setProject((p) => ({ ...p, publisher: e.target.value }))}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">ISBN</label>
                    <input
                      type="text"
                      value={project.isbn || ''}
                      onChange={(e) => setProject((p) => ({ ...p, isbn: e.target.value }))}
                      placeholder="978-..."
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-theme block mb-1">Genre</label>
                    <input
                      type="text"
                      value={project.genre || ''}
                      onChange={(e) => setProject((p) => ({ ...p, genre: e.target.value }))}
                      className="w-full bg-surface text-main text-xs px-2.5 py-1 rounded border border-subtle outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted-theme block mb-1">Book Description</label>
                  <textarea
                    value={project.description || ''}
                    onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-surface text-main text-xs p-2.5 rounded border border-subtle outline-none resize-none leading-relaxed focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center: Live Device Previewer */}
        <div className="flex-1 flex flex-col items-center justify-between p-5 overflow-hidden bg-app">
          {/* Device and Page Controls Header */}
          <div className="w-full max-w-2xl flex items-center justify-between mb-3 select-none">
            {/* Device selector */}
            <div className="flex items-center space-x-1 bg-surface p-0.5 rounded-md border border-subtle">
              <button
                onClick={() => setDevicePreview('ereader')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  devicePreview === 'ereader'
                    ? 'bg-panel text-main font-semibold shadow-xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <Book className="w-3.5 h-3.5" />
                <span>E-Reader</span>
              </button>
              <button
                onClick={() => setDevicePreview('print')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  devicePreview === 'print'
                    ? 'bg-panel text-main font-semibold shadow-xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Print Mockup</span>
              </button>
              <button
                onClick={() => setDevicePreview('phone')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  devicePreview === 'phone'
                    ? 'bg-panel text-main font-semibold shadow-xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Quick Print Button */}
            <button
              onClick={handlePrintPDF}
              className="flex items-center space-x-1.5 text-muted-theme hover:text-main text-xs px-2.5 py-1 rounded bg-surface hover:bg-panel border border-subtle transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Device Mockup Frame */}
          <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
            <div
              className={`transition-all duration-300 rounded-xl shadow-md overflow-hidden flex flex-col border border-subtle bg-surface text-main ${
                devicePreview === 'ereader'
                  ? 'w-[500px] h-[600px] ring-8 ring-[var(--bg-panel)]'
                  : devicePreview === 'phone'
                  ? 'w-[340px] h-[600px] ring-8 ring-[var(--bg-panel)]'
                  : 'w-[540px] h-[640px]'
              }`}
            >
              {/* E-Reader Top Bar */}
              <div className="h-7 px-4 border-b border-subtle flex items-center justify-between text-[10px] text-muted-theme select-none">
                <span className="font-serif italic truncate max-w-[200px]">{project.title}</span>
                <span>
                  {currentPreviewIndex + 1} of {previewSections.length}
                </span>
              </div>

              {/* Reader Interior Content */}
              <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col justify-center">
                {currentSection && (
                  <div className={`w-full max-w-prose mx-auto ${typo.font}`}>
                    {currentSection.isCover ? (
                      /* Full Cover Page */
                      <div className="h-full w-full flex flex-col items-center justify-center">
                        <img
                          src={exportSettings.coverImage}
                          alt="Cover Page"
                          className="max-h-[460px] w-auto object-contain rounded shadow-md border border-subtle"
                        />
                      </div>
                    ) : (
                      /* Text Pages */
                      <>
                        {currentSection.isChapter && exportSettings.chapterTitleStyle !== 'none' && (
                          <div className="text-center mb-7">
                            {exportSettings.chapterTitleStyle !== 'title-only' && exportSettings.includeChapterNumbers && (
                              <p className="text-[10px] uppercase tracking-widest text-muted-theme font-serif mb-1">
                                Chapter {currentSection.chapterNum}
                              </p>
                            )}
                            {exportSettings.chapterTitleStyle !== 'num-only' && currentSection.title && (
                              <h2 className={`text-lg font-bold ${typo.heading}`}>
                                {currentSection.title}
                              </h2>
                            )}
                          </div>
                        )}

                        <div
                          className={`text-xs leading-relaxed text-main ${
                            exportSettings.dropCaps ? '[&>div>p:first-child]:first-letter:float-left [&>div>p:first-child]:first-letter:text-3xl [&>div>p:first-child]:first-letter:pr-2 [&>div>p:first-child]:first-letter:font-serif' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: currentSection.contentHtml }}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* E-Reader Bottom Running Footer */}
              <div className="h-7 px-4 border-t border-subtle flex items-center justify-center text-[10px] text-muted-theme select-none">
                <span className="font-serif uppercase tracking-widest text-[9px]">
                  {project.author}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Prev / Next */}
          <div className="w-full max-w-md flex items-center justify-between mt-3">
            <button
              onClick={() => setCurrentPreviewIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPreviewIndex === 0}
              className="flex items-center space-x-1 text-xs text-muted-theme hover:text-main disabled:opacity-30 disabled:hover:text-muted-theme px-2.5 py-1 rounded bg-surface border border-subtle transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-muted-theme truncate max-w-[180px]">
              {currentSection?.title}
            </span>

            <button
              onClick={() =>
                setCurrentPreviewIndex((prev) => Math.min(previewSections.length - 1, prev + 1))
              }
              disabled={currentPreviewIndex === previewSections.length - 1}
              className="flex items-center space-x-1 text-xs text-muted-theme hover:text-main disabled:opacity-30 disabled:hover:text-muted-theme px-2.5 py-1 rounded bg-surface border border-subtle transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
