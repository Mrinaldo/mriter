import React, { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  Minus,
  Sparkles,
  Type,
  Clock,
  Minimize2,
} from 'lucide-react'
import { useManuscript, EditorFont, WORLD_CLASS_FONTS } from '../context/ManuscriptContext'

export const ZenEditor: React.FC = () => {
  const {
    currentScene,
    currentSection,
    currentChapter,
    activeSceneId,
    activeSectionId,
    updateSceneContent,
    updateSceneMetadata,
    updateSectionContent,
    editorFont,
    setEditorFont,
    typewriterMode,
    setTypewriterMode,
    focusMode,
    setFocusMode,
  } = useManuscript()

  const [sceneTitleInput, setSceneTitleInput] = useState('')
  const editorContainerRef = useRef<HTMLDivElement>(null)

  // Determine current active document item
  const isScene = Boolean(activeSceneId && currentScene)
  const isSection = Boolean(activeSectionId && currentSection)

  const initialContent = isScene
    ? currentScene?.content || ''
    : isSection
    ? currentSection?.content || ''
    : ''

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: isScene
          ? 'Write without fear. Edit without mercy...'
          : 'Draft this section...',
      }),
      CharacterCount,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const words = editor.storage.characterCount.words()

      if (isScene && activeSceneId) {
        updateSceneContent(activeSceneId, html, text, words)
      } else if (isSection && activeSectionId) {
        updateSectionContent(activeSectionId, html)
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none max-w-prose mx-auto min-h-[70vh] py-10 px-4',
      },
    },
  })

  // Synchronize editor content when active scene/section changes
  useEffect(() => {
    if (!editor) return

    const newContent = isScene
      ? currentScene?.content || ''
      : isSection
      ? currentSection?.content || ''
      : ''

    if (editor.getHTML() !== newContent) {
      editor.commands.setContent(newContent, { emitUpdate: false })
    }

    if (isScene && currentScene) {
      setSceneTitleInput(currentScene.title)
    } else if (isSection && currentSection) {
      setSceneTitleInput(currentSection.title)
    }
  }, [activeSceneId, activeSectionId, editor])

  // Typewriter Mode: Scroll active line to center
  useEffect(() => {
    if (!typewriterMode || !editor) return

    const handleSelectionUpdate = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const container = editorContainerRef.current
      if (container && rect.top > 0) {
        const offset = rect.top - container.clientHeight / 2 + container.scrollTop
        container.scrollTo({ top: offset, behavior: 'smooth' })
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [typewriterMode, editor])

  // Listen for editor commands dispatched from Keymap or Find Action
  useEffect(() => {
    if (!editor) return

    const handleEditorCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ command: string }>
      switch (customEvent.detail?.command) {
        case 'sceneBreak':
          editor.chain().focus().setHorizontalRule().run()
          break
        case 'bold':
          editor.chain().focus().toggleBold().run()
          break
        case 'italic':
          editor.chain().focus().toggleItalic().run()
          break
        case 'heading1':
          editor.chain().focus().toggleHeading({ level: 1 }).run()
          break
        case 'heading2':
          editor.chain().focus().toggleHeading({ level: 2 }).run()
          break
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run()
          break
        case 'focus':
          editor.commands.focus()
          break
      }
    }

    window.addEventListener('mriter-editor-command', handleEditorCommand)
    return () => window.removeEventListener('mriter-editor-command', handleEditorCommand)
  }, [editor])

  // Get typography font family class & CSS font-family
  const getFontFamilyConfig = (font: EditorFont) => {
    switch (font) {
      case 'charter':
        return {
          css: '"Charter", "Bitstream Charter", "Sitka Text", Georgia, serif',
          fontClass: 'font-["Charter","Bitstream_Charter","Sitka_Text",Georgia,serif]',
          bodyClass: 'text-[1.18rem] leading-[1.82]',
        }
      case 'courier':
        return {
          css: '"Courier Prime", Courier, monospace',
          fontClass: 'font-["Courier_Prime",Courier,monospace]',
          bodyClass: 'text-[1.08rem] leading-[1.85]',
        }
      case 'palatino':
        return {
          css: '"Palatino", "Palatino Linotype", "Book Antiqua", Georgia, serif',
          fontClass: 'font-["Palatino","Palatino_Linotype","Book_Antiqua",Georgia,serif]',
          bodyClass: 'text-[1.16rem] leading-[1.8]',
        }
      case 'literata':
        return {
          css: '"Literata", Georgia, serif',
          fontClass: 'font-["Literata",Georgia,serif]',
          bodyClass: 'text-[1.15rem] leading-[1.8]',
        }
      case 'newsreader':
        return {
          css: '"Newsreader", Georgia, serif',
          fontClass: 'font-["Newsreader",Georgia,serif]',
          bodyClass: 'text-[1.2rem] leading-[1.8]',
        }
      case 'ia-mono':
        return {
          css: '"IBM Plex Mono", monospace',
          fontClass: 'font-["IBM_Plex_Mono",monospace]',
          bodyClass: 'text-[1.05rem] leading-[1.85]',
        }
      case 'garamond':
        return {
          css: '"EB Garamond", Georgia, serif',
          fontClass: 'font-["EB_Garamond",Georgia,serif]',
          bodyClass: 'text-[1.22rem] leading-[1.8]',
        }
      case 'lora':
        return {
          css: '"Lora", Georgia, serif',
          fontClass: 'font-["Lora",Georgia,serif]',
          bodyClass: 'text-[1.14rem] leading-[1.78]',
        }
      case 'merriweather':
        return {
          css: '"Merriweather", Georgia, serif',
          fontClass: 'font-["Merriweather",Georgia,serif]',
          bodyClass: 'text-[1.1rem] leading-[1.85]',
        }
      case 'inter':
        return {
          css: '"Inter", system-ui, -apple-system, sans-serif',
          fontClass: 'font-["Inter",system-ui,-apple-system,sans-serif]',
          bodyClass: 'text-[1.06rem] leading-[1.75]',
        }
      default:
        return {
          css: '"EB Garamond", Georgia, serif',
          fontClass: 'font-serif',
          bodyClass: 'text-[1.18rem] leading-[1.8]',
        }
    }
  }

  const fontConfig = getFontFamilyConfig(editorFont)
  const wordCount = editor?.storage.characterCount.words() || 0
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 225))
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI)
  const isWindows = isElectron && window.electronAPI?.platform !== 'darwin'
  const isMac = isElectron && window.electronAPI?.platform === 'darwin'
  const [isMaximized, setIsMaximized] = useState(false)

  // Track window maximized state for custom caption controls
  useEffect(() => {
    if (isElectron && window.electronAPI?.isWindowMaximized) {
      window.electronAPI.isWindowMaximized().then((max) => setIsMaximized(Boolean(max)))
    }
    if (isElectron && window.electronAPI?.onWindowMaximizedChange) {
      window.electronAPI.onWindowMaximizedChange((max) => setIsMaximized(Boolean(max)))
    }
  }, [isElectron])

  if (!isScene && !isSection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-app text-main transition-colors duration-150">
        <Sparkles className="w-8 h-8 text-faint mb-2" />
        <h3 className="font-serif text-base font-medium text-main">No Scene Selected</h3>
        <p className="text-xs text-muted-theme mt-1">Select a chapter or scene from the manuscript binder to begin.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-app text-main transition-colors duration-150">
      {/* Editor Formatting Toolbar */}
      <div
        style={{
          paddingLeft: isMac && focusMode ? '80px' : '0.75rem',
          paddingRight: isWindows && focusMode ? '0' : '0.75rem',
        }}
        className={`h-11 border-b border-subtle bg-panel flex items-center justify-between select-none shrink-0 text-muted-theme transition-colors duration-150 ${
          focusMode ? 'titlebar-drag-region' : ''
        }`}
      >
        {/* Left: Formatting tools */}
        <div className="flex items-center space-x-1 no-drag-region min-w-0 shrink">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1 rounded transition-colors shrink-0 ${
              editor?.isActive('bold')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1 rounded transition-colors shrink-0 ${
              editor?.isActive('italic')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-current opacity-20 mx-1 hidden sm:block shrink-0" />

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1 rounded transition-colors hidden sm:inline-flex shrink-0 ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded transition-colors hidden sm:inline-flex shrink-0 ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1 rounded transition-colors hidden md:inline-flex shrink-0 ${
              editor?.isActive('blockquote')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="p-1 rounded hover:text-main hover:bg-surface transition-colors hidden md:inline-flex shrink-0"
            title="Scene Break Divider (✦ ✦ ✦)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Typography font, typewriter toggle, & Zen mode exit */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs no-drag-region shrink-0 ml-auto">
          {/* World-Renowned Typography Font Selector */}
          <div className="flex items-center space-x-1 shrink">
            <Type className="w-3 h-3 text-faint shrink-0" />
            <select
              value={editorFont}
              onChange={(e) => setEditorFont(e.target.value as EditorFont)}
              className="bg-surface text-main border border-subtle rounded px-1.5 sm:px-2 py-0.5 text-xs outline-none cursor-pointer font-serif max-w-[110px] sm:max-w-[170px] truncate"
              title="Typography Font (World-Renowned Writing Software)"
            >
              <optgroup label="Classic Literary & Book Serifs">
                <option value="garamond">EB Garamond (Scrivener Classic)</option>
                <option value="charter">Charter (Ulysses Signature)</option>
                <option value="palatino">Palatino (Apple Books & Fine Publishing)</option>
                <option value="literata">Literata (Google Play Books Long-form)</option>
                <option value="newsreader">Newsreader (Editorial Publishing)</option>
                <option value="lora">Lora (Contemporary Literary)</option>
                <option value="merriweather">Merriweather (Screen Bookish)</option>
              </optgroup>
              <optgroup label="Distraction-Free Monospaced">
                <option value="courier">Courier Prime (Screenplay & Scrivener)</option>
                <option value="ia-mono">IBM Plex Mono (iA Writer Style)</option>
              </optgroup>
              <optgroup label="Modern Editorial Sans">
                <option value="inter">Inter Sans (Bear & Notion Style)</option>
              </optgroup>
            </select>
          </div>

          <div className="h-3 w-px bg-current opacity-20 hidden lg:block shrink-0" />

          {/* Typewriter scrolling mode */}
          <button
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`hidden lg:inline-flex px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
              typewriterMode
                ? 'bg-accent-soft text-accent border border-subtle'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Center line scrolling"
          >
            Typewriter {typewriterMode ? 'ON' : 'OFF'}
          </button>

          {/* Explicit Exit Zen Mode Button when in Zen focus */}
          {focusMode && (
            <>
              <div className="h-3 w-px bg-current opacity-20 shrink-0" />
              <button
                onClick={() => setFocusMode(false)}
                title="Exit Zen Mode (Esc or F11)"
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-accent-soft text-accent hover:bg-accent hover:text-white transition-colors text-[11px] font-medium cursor-pointer shrink-0"
              >
                <Minimize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Exit Zen</span>
                <kbd className="text-[9px] opacity-75 font-mono ml-0.5 hidden sm:inline">Esc</kbd>
              </button>
            </>
          )}

          {/* Windows / Linux Caption Controls in Zen Focus Mode (GUARANTEED VISIBLE, NEVER HIDDEN) */}
          {focusMode && isWindows && (
            <div className="flex items-center h-11 ml-1 sm:ml-2 pl-0.5 sm:pl-1 border-l border-subtle no-drag-region shrink-0">
              <button
                onClick={() => window.electronAPI?.minimizeWindow?.()}
                title="Minimize"
                className="w-11 h-11 flex items-center justify-center hover:bg-surface text-muted-theme hover:text-main transition-colors cursor-pointer shrink-0"
              >
                <span className="w-2.5 h-[1.2px] bg-current" />
              </button>
              <button
                onClick={async () => {
                  const max = await window.electronAPI?.maximizeWindow?.()
                  setIsMaximized(Boolean(max))
                }}
                title={isMaximized ? 'Restore' : 'Maximize'}
                className="w-11 h-11 flex items-center justify-center hover:bg-surface text-muted-theme hover:text-main transition-colors cursor-pointer shrink-0"
              >
                {isMaximized ? (
                  <div className="relative w-2.5 h-2.5">
                    <div className="absolute top-0 right-0 w-2 h-2 border border-current rounded-[0.5px]" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border border-current bg-panel rounded-[0.5px]" />
                  </div>
                ) : (
                  <div className="w-2.5 h-2.5 border-[1.2px] border-current rounded-[1px]" />
                )}
              </button>
              <button
                onClick={() => window.electronAPI?.closeWindow?.()}
                title="Close"
                className="w-11 h-11 flex items-center justify-center hover:bg-[#e81123] hover:text-white text-muted-theme transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M1 1l8 8M9 1L1 9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div ref={editorContainerRef} className="flex-1 overflow-y-auto relative scroll-smooth">
        <div
          className={`max-w-[720px] mx-auto px-8 pt-8 pb-32 ${fontConfig.fontClass}`}
          style={{ fontFamily: fontConfig.css }}
        >
          {/* Scene / Chapter Header */}
          <div className="mb-6 pb-3 border-b border-subtle">
            {isScene && currentChapter && (
              <p
                className="text-[10px] uppercase tracking-widest text-faint mb-1.5"
                style={{ fontFamily: 'inherit' }}
              >
                {currentChapter.title}
              </p>
            )}
            <input
              type="text"
              value={sceneTitleInput}
              onChange={(e) => {
                setSceneTitleInput(e.target.value)
                if (isScene && activeSceneId) {
                  updateSceneMetadata(activeSceneId, { title: e.target.value })
                }
              }}
              placeholder="Untitled Scene..."
              className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-faint text-main"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {/* TipTap Surface */}
          <div className={fontConfig.bodyClass} style={{ fontFamily: 'inherit' }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Bottom Scene Status Bar */}
      <div className="h-7 px-6 border-t border-subtle flex items-center justify-between text-[10px] select-none shrink-0 bg-panel text-muted-theme transition-colors duration-150">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono">{wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-faint" />
            <span>~{readingTimeMin} min read</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isScene && currentScene && (
            <span className="capitalize px-2 py-0.5 rounded text-[9px] bg-accent-soft text-accent font-medium">
              {currentScene.status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
