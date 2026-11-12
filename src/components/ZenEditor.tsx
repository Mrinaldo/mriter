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
  List,
  ListOrdered,
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  X,
  AlignLeft,
  AlignJustify,
  SpellCheck,
} from 'lucide-react'
import { useManuscript, EditorFont, WORLD_CLASS_FONTS } from '../context/ManuscriptContext'
import { isMacOS, formatKeyDisplay } from '../types/keymap'
import { SearchExtension } from '../utils/tiptapSearchExtension'

export const ZenEditor: React.FC = () => {
  const {
    project,
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
    contentWidth,
    setContentWidth,
    paragraphStyle,
    setParagraphStyle,
    lineSpacing,
    setLineSpacing,
    fontSizeScale,
    setFontSizeScale,
    showChapterSubtitle,
    setShowChapterSubtitle,
    textAlignment,
    setTextAlignment,
    spellCheckEnabled,
    setSpellCheckEnabled,
    spellCheckLanguage,
    setSpellCheckLanguage,
    openProjectSearch,
  } = useManuscript()

  const [sceneTitleInput, setSceneTitleInput] = useState('')
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)
  const layoutMenuRef = useRef<HTMLDivElement>(null)

  // Floating Find & Replace Bar State
  const [isFindOpen, setIsFindOpen] = useState(false)
  const [showReplaceRow, setShowReplaceRow] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)

  // Layout & Spacing Menu Popover State
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false)

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
          ? project.projectType === 'article'
            ? 'Draft your thoughts, analysis, or story...'
            : 'Write without fear. Edit without mercy...'
          : 'Draft this section...',
      }),
      CharacterCount,
      SearchExtension,
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
        class: 'focus:outline-none min-h-[70vh] py-6 px-1',
        spellcheck: spellCheckEnabled ? 'true' : 'false',
        autocorrect: spellCheckEnabled ? 'on' : 'off',
      },
    },
  })

  // Synchronize spellcheck attributes directly to the TipTap ProseMirror contenteditable element
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return
    editor.view.dom.setAttribute('spellcheck', spellCheckEnabled ? 'true' : 'false')
    editor.view.dom.setAttribute('autocorrect', spellCheckEnabled ? 'on' : 'off')
  }, [spellCheckEnabled, editor])

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

  // Sync Search Extension state with in-editor Search inputs
  useEffect(() => {
    if (!editor) return
    if (isFindOpen && searchTerm) {
      editor.commands.setSearchTerm(searchTerm)
    } else if (!isFindOpen || !searchTerm) {
      editor.commands.clearSearch()
    }
  }, [searchTerm, isFindOpen, editor])

  useEffect(() => {
    if (!editor) return
    editor.commands.setCaseSensitive(caseSensitive)
  }, [caseSensitive, editor])

  useEffect(() => {
    if (!editor) return
    editor.commands.setWholeWord(wholeWord)
  }, [wholeWord, editor])

  useEffect(() => {
    if (!editor) return
    editor.commands.setReplaceTerm(replaceTerm)
  }, [replaceTerm, editor])

  // Global keydown shortcuts for Find & Replace in Editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setIsFindOpen(true)
        setTimeout(() => {
          findInputRef.current?.focus()
          findInputRef.current?.select()
        }, 50)
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setIsFindOpen(true)
        setShowReplaceRow(true)
        setTimeout(() => {
          findInputRef.current?.focus()
          findInputRef.current?.select()
        }, 50)
      } else if (e.key === 'Escape' && isFindOpen) {
        setIsFindOpen(false)
        editor?.commands.clearSearch()
        editor?.commands.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFindOpen, editor])

  // Close layout menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setIsLayoutMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run()
          break
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run()
          break
        case 'find':
          setIsFindOpen(true)
          setTimeout(() => findInputRef.current?.focus(), 50)
          break
        case 'focus':
          editor.commands.focus()
          break
      }
    }

    window.addEventListener('mriter-editor-command', handleEditorCommand)
    return () => window.removeEventListener('mriter-editor-command', handleEditorCommand)
  }, [editor])

  // Typography font family configuration
  const getFontFamilyConfig = (font: EditorFont) => {
    switch (font) {
      case 'charter':
        return {
          css: '"Charter", "Bitstream Charter", "Sitka Text", Georgia, serif',
          fontClass: 'font-["Charter","Bitstream_Charter","Sitka_Text",Georgia,serif]',
        }
      case 'courier':
        return {
          css: '"Courier Prime", Courier, monospace',
          fontClass: 'font-["Courier_Prime",Courier,monospace]',
        }
      case 'palatino':
        return {
          css: '"Palatino", "Palatino Linotype", "Book Antiqua", Georgia, serif',
          fontClass: 'font-["Palatino","Palatino_Linotype","Book_Antiqua",Georgia,serif]',
        }
      case 'literata':
        return {
          css: '"Literata", Georgia, serif',
          fontClass: 'font-["Literata",Georgia,serif]',
        }
      case 'newsreader':
        return {
          css: '"Newsreader", Georgia, serif',
          fontClass: 'font-["Newsreader",Georgia,serif]',
        }
      case 'ia-mono':
        return {
          css: '"IBM Plex Mono", monospace',
          fontClass: 'font-["IBM_Plex_Mono",monospace]',
        }
      case 'garamond':
        return {
          css: '"EB Garamond", Georgia, serif',
          fontClass: 'font-["EB_Garamond",Georgia,serif]',
        }
      case 'lora':
        return {
          css: '"Lora", Georgia, serif',
          fontClass: 'font-["Lora",Georgia,serif]',
        }
      case 'merriweather':
        return {
          css: '"Merriweather", Georgia, serif',
          fontClass: 'font-["Merriweather",Georgia,serif]',
        }
      case 'inter':
        return {
          css: '"Inter", system-ui, -apple-system, sans-serif',
          fontClass: 'font-["Inter",system-ui,-apple-system,sans-serif]',
        }
      default:
        return {
          css: '"EB Garamond", Georgia, serif',
          fontClass: 'font-serif',
        }
    }
  }

  // Dynamic layout & spacing styling classes
  const getLayoutClasses = () => {
    let widthClass = 'max-w-[740px]'
    if (contentWidth === 'compact') widthClass = 'max-w-[620px]'
    else if (contentWidth === 'wide') widthClass = 'max-w-[940px]'
    else if (contentWidth === 'fluid') widthClass = 'max-w-none w-full px-6 sm:px-14 md:px-20'

    let fontSizeClass = 'text-[1.18rem]'
    if (fontSizeScale === 'small') fontSizeClass = 'text-[1.05rem]'
    else if (fontSizeScale === 'medium') fontSizeClass = 'text-[1.32rem]'
    else if (fontSizeScale === 'large') fontSizeClass = 'text-[1.48rem]'

    let lineSpacingClass = 'leading-[1.82]'
    if (lineSpacing === 'tight') lineSpacingClass = 'leading-[1.55]'
    else if (lineSpacing === 'relaxed') lineSpacingClass = 'leading-[2.05]'
    else if (lineSpacing === 'double') lineSpacingClass = 'leading-[2.35]'

    let alignClass = textAlignment === 'justify' ? 'text-justify' : 'text-left'

    return { widthClass, fontSizeClass, lineSpacingClass, alignClass }
  }

  const fontConfig = getFontFamilyConfig(editorFont)
  const layoutClasses = getLayoutClasses()
  const wordCount = editor?.storage.characterCount.words() || 0
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 225))

  // TipTap Search storage details
  const searchResults = (editor?.storage as any)?.search?.results || []
  const currentMatchIndex = (editor?.storage as any)?.search?.currentIndex ?? -1
  const matchCount = searchResults.length

  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI)
  const isWindows = isElectron && window.electronAPI?.platform !== 'darwin'
  const isMac = isElectron ? window.electronAPI?.platform === 'darwin' : isMacOS()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Track window maximized and fullscreen states
  useEffect(() => {
    if (isElectron && window.electronAPI?.isWindowMaximized) {
      window.electronAPI.isWindowMaximized().then((max) => setIsMaximized(Boolean(max)))
    }
    if (isElectron && window.electronAPI?.onWindowMaximizedChange) {
      window.electronAPI.onWindowMaximizedChange((max) => setIsMaximized(Boolean(max)))
    }
    if (isElectron && window.electronAPI?.isWindowFullScreen) {
      window.electronAPI.isWindowFullScreen().then((fs) => setIsFullScreen(Boolean(fs)))
    }
    if (isElectron && window.electronAPI?.onWindowFullScreenChange) {
      const unsub = window.electronAPI.onWindowFullScreenChange((fs) => setIsFullScreen(Boolean(fs)))
      return () => {
        if (typeof unsub === 'function') unsub()
      }
    }
  }, [isElectron])

  if (!isScene && !isSection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-app text-main transition-colors duration-150">
        <Sparkles className="w-8 h-8 text-faint mb-2" />
        <h3 className="font-serif text-base font-medium text-main">No Document Selected</h3>
        <p className="text-xs text-muted-theme mt-1">Select a draft or scene from the manuscript binder to begin.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-app text-main transition-colors duration-150 relative">
      {/* Editor Formatting Toolbar */}
      <div
        style={{
          paddingLeft: isMac && focusMode && !isFullScreen ? '80px' : '0.75rem',
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
            className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${
              editor?.isActive('bold')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title={`Bold (${formatKeyDisplay('Ctrl+B')})`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${
              editor?.isActive('italic')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title={`Italic (${formatKeyDisplay('Ctrl+I')})`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-current opacity-20 mx-1 hidden sm:block shrink-0" />

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1 rounded transition-colors hidden sm:inline-flex shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 1 })
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title={`Heading 1 (${formatKeyDisplay('Ctrl+Alt+1')})`}
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded transition-colors hidden sm:inline-flex shrink-0 cursor-pointer ${
              editor?.isActive('heading', { level: 2 })
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title={`Heading 2 (${formatKeyDisplay('Ctrl+Alt+2')})`}
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-1 rounded transition-colors hidden md:inline-flex shrink-0 cursor-pointer ${
              editor?.isActive('blockquote')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title={`Blockquote (${formatKeyDisplay('Ctrl+Shift+.')})`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* List controls for articles & notes */}
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded transition-colors hidden md:inline-flex shrink-0 cursor-pointer ${
              editor?.isActive('bulletList')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded transition-colors hidden md:inline-flex shrink-0 cursor-pointer ${
              editor?.isActive('orderedList')
                ? 'bg-accent-soft text-accent'
                : 'hover:text-main hover:bg-surface'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="p-1 rounded hover:text-main hover:bg-surface transition-colors hidden md:inline-flex shrink-0 cursor-pointer"
            title={`Scene Break Divider (${formatKeyDisplay('Ctrl+Enter')})`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Search, Layout & Spacing freedom, Typography, & Typewriter */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs no-drag-region shrink-0 ml-auto">
          {/* Quick In-Editor Find & Replace Toggle */}
          <button
            onClick={() => {
              setIsFindOpen(!isFindOpen)
              if (!isFindOpen) {
                setTimeout(() => findInputRef.current?.focus(), 50)
              } else {
                editor?.commands.clearSearch()
              }
            }}
            className={`p-1.5 rounded transition-colors shrink-0 cursor-pointer ${
              isFindOpen ? 'bg-accent-soft text-accent' : 'hover:text-main hover:bg-surface'
            }`}
            title={`Find in Document (${formatKeyDisplay('Ctrl+F')})`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Layout, Margins & Spacing Menu Dropdown */}
          <div className="relative shrink-0" ref={layoutMenuRef}>
            <button
              onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
              className={`flex items-center space-x-1 px-2 py-1 rounded border transition-colors cursor-pointer text-xs ${
                isLayoutMenuOpen
                  ? 'bg-accent-soft text-accent border-accent'
                  : 'bg-surface border-subtle hover:text-main'
              }`}
              title="Margins, Line Spacing, and Paragraph Layout"
            >
              <SlidersHorizontal className="w-3 h-3 text-faint" />
              <span className="hidden sm:inline font-medium">Layout</span>
            </button>

            {isLayoutMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-surface border border-subtle rounded-xl shadow-xl p-3 z-40 space-y-3 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-subtle">
                  <span className="font-serif font-semibold text-xs text-main">Editor Canvas Layout</span>
                  <button
                    onClick={() => setIsLayoutMenuOpen(false)}
                    className="p-0.5 rounded text-faint hover:text-main cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Editor Content Width */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                    Canvas Width & Margins
                  </label>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {[
                      { id: 'compact', label: '620px' },
                      { id: 'standard', label: '740px' },
                      { id: 'wide', label: '940px' },
                      { id: 'fluid', label: 'Full' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setContentWidth(w.id as any)}
                        className={`py-1 rounded text-center transition-colors border cursor-pointer ${
                          contentWidth === w.id
                            ? 'bg-accent text-on-accent border-accent font-medium'
                            : 'bg-panel border-subtle text-muted-theme hover:text-main'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paragraph Spacing Style */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                    Paragraph Spacing
                  </label>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => setParagraphStyle('indented')}
                      className={`py-1 px-2 rounded text-left transition-colors border cursor-pointer ${
                        paragraphStyle === 'indented'
                          ? 'bg-accent text-on-accent border-accent font-medium'
                          : 'bg-panel border-subtle text-muted-theme hover:text-main'
                      }`}
                    >
                      Indent (Fiction)
                    </button>
                    <button
                      onClick={() => setParagraphStyle('block')}
                      className={`py-1 px-2 rounded text-left transition-colors border cursor-pointer ${
                        paragraphStyle === 'block'
                          ? 'bg-accent text-on-accent border-accent font-medium'
                          : 'bg-panel border-subtle text-muted-theme hover:text-main'
                      }`}
                    >
                      Block (Article)
                    </button>
                  </div>
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                    Line Spacing
                  </label>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {[
                      { id: 'tight', label: '1.5x' },
                      { id: 'normal', label: '1.8x' },
                      { id: 'relaxed', label: '2.0x' },
                      { id: 'double', label: '2.3x' },
                    ].map((ls) => (
                      <button
                        key={ls.id}
                        onClick={() => setLineSpacing(ls.id as any)}
                        className={`py-1 rounded text-center transition-colors border cursor-pointer ${
                          lineSpacing === ls.id
                            ? 'bg-accent text-on-accent border-accent font-medium'
                            : 'bg-panel border-subtle text-muted-theme hover:text-main'
                        }`}
                      >
                        {ls.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Scaling */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                    Font Size
                  </label>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {[
                      { id: 'small', label: 'Small' },
                      { id: 'standard', label: 'Std' },
                      { id: 'medium', label: 'Med' },
                      { id: 'large', label: 'Large' },
                    ].map((fs) => (
                      <button
                        key={fs.id}
                        onClick={() => setFontSizeScale(fs.id as any)}
                        className={`py-1 rounded text-center transition-colors border cursor-pointer ${
                          fontSizeScale === fs.id
                            ? 'bg-accent text-on-accent border-accent font-medium'
                            : 'bg-panel border-subtle text-muted-theme hover:text-main'
                        }`}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                    Alignment
                  </label>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => setTextAlignment('left')}
                      className={`flex items-center justify-center space-x-1 py-1 rounded transition-colors border cursor-pointer ${
                        textAlignment === 'left'
                          ? 'bg-accent text-on-accent border-accent font-medium'
                          : 'bg-panel border-subtle text-muted-theme hover:text-main'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Left</span>
                    </button>
                    <button
                      onClick={() => setTextAlignment('justify')}
                      className={`flex items-center justify-center space-x-1 py-1 rounded transition-colors border cursor-pointer ${
                        textAlignment === 'justify'
                          ? 'bg-accent text-on-accent border-accent font-medium'
                          : 'bg-panel border-subtle text-muted-theme hover:text-main'
                      }`}
                    >
                      <AlignJustify className="w-3 h-3" />
                      <span>Justify</span>
                    </button>
                  </div>
                </div>

                {/* Show Chapter Subtitle Toggle */}
                {isScene && (
                  <div className="pt-2 border-t border-subtle">
                    <label className="flex items-center justify-between text-xs text-main cursor-pointer select-none">
                      <span className="text-[11px]">Show Chapter subtitle</span>
                      <input
                        type="checkbox"
                        checked={showChapterSubtitle}
                        onChange={(e) => setShowChapterSubtitle(e.target.checked)}
                        className="rounded border-subtle accent-[var(--accent)] cursor-pointer"
                      />
                    </label>
                  </div>
                )}

                {/* Spell Check Toggle & Language */}
                <div className="pt-2 border-t border-subtle space-y-2">
                  <label className="flex items-center justify-between text-xs text-main cursor-pointer select-none">
                    <span className="text-[11px] flex items-center space-x-1.5 font-medium">
                      <SpellCheck className="w-3.5 h-3.5 text-faint" />
                      <span>Check Spelling</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={spellCheckEnabled}
                      onChange={(e) => setSpellCheckEnabled(e.target.checked)}
                      className="rounded border-subtle accent-[var(--accent)] cursor-pointer"
                    />
                  </label>

                  {spellCheckEnabled && (
                    <div className="flex items-center justify-between text-[11px] text-muted-theme pt-0.5">
                      <span className="text-[10px] uppercase tracking-wider">Language</span>
                      <select
                        value={spellCheckLanguage}
                        onChange={(e) => setSpellCheckLanguage(e.target.value)}
                        className="bg-panel text-main text-[11px] border border-subtle rounded px-1.5 py-0.5 outline-none cursor-pointer"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="en-CA">English (Canada)</option>
                        <option value="en-AU">English (Australia)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
            className={`hidden lg:inline-flex px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
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

          {/* Windows / Linux Caption Controls in Zen Focus Mode */}
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

      {/* Floating In-Editor Find & Replace Bar */}
      {isFindOpen && (
        <div className="absolute top-13 right-4 sm:right-8 z-30 w-80 sm:w-96 bg-surface border border-subtle rounded-xl shadow-xl p-2.5 text-xs text-main space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-muted-theme shrink-0 ml-1" />
            <input
              ref={findInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (e.shiftKey) editor?.commands.previousSearchResult()
                  else editor?.commands.nextSearchResult()
                } else if (e.key === 'Escape') {
                  setIsFindOpen(false)
                  editor?.commands.clearSearch()
                  editor?.commands.focus()
                }
              }}
              placeholder="Find in this scene..."
              className="flex-1 bg-panel text-main text-xs px-2 py-1 rounded border border-subtle focus:border-accent outline-none placeholder:text-faint"
            />
            {/* Match counter */}
            <span className="text-[10px] text-faint font-mono whitespace-nowrap px-1">
              {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : searchTerm ? '0/0' : ''}
            </span>
            {/* Prev / Next buttons */}
            <button
              onClick={() => editor?.commands.previousSearchResult()}
              title="Previous Match (Shift+Enter)"
              className="p-1 rounded text-muted-theme hover:text-main hover:bg-panel cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor?.commands.nextSearchResult()}
              title="Next Match (Enter)"
              className="p-1 rounded text-muted-theme hover:text-main hover:bg-panel cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {/* Toggle replace row */}
            <button
              onClick={() => setShowReplaceRow(!showReplaceRow)}
              title="Toggle Replace Row"
              className={`p-1 rounded cursor-pointer transition-colors ${
                showReplaceRow ? 'bg-accent-soft text-accent' : 'text-muted-theme hover:text-main hover:bg-panel'
              }`}
            >
              <Replace className="w-3.5 h-3.5" />
            </button>
            {/* Close button */}
            <button
              onClick={() => {
                setIsFindOpen(false)
                editor?.commands.clearSearch()
                editor?.commands.focus()
              }}
              title="Close (Esc)"
              className="p-1 rounded text-muted-theme hover:text-main hover:bg-panel cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Options & Replace Row */}
          {showReplaceRow && (
            <div className="space-y-2 pt-1 border-t border-subtle">
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 bg-panel text-main text-xs px-2 py-1 rounded border border-subtle focus:border-accent outline-none placeholder:text-faint"
                />
                <button
                  onClick={() => editor?.commands.replaceCurrent()}
                  disabled={matchCount === 0}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-panel hover:bg-accent-soft hover:text-accent disabled:opacity-40 border border-subtle cursor-pointer transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={() => editor?.commands.replaceAllSearchResults()}
                  disabled={matchCount === 0}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-accent text-on-accent hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all"
                >
                  All
                </button>
              </div>
            </div>
          )}

          {/* Footer bar with options and Global Search CTA */}
          <div className="flex items-center justify-between pt-1 border-t border-subtle text-[11px] text-muted-theme">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                  caseSensitive ? 'bg-accent-soft text-accent border-accent' : 'border-subtle bg-panel text-muted-theme'
                }`}
                title="Match Case (Aa)"
              >
                Aa
              </button>
              <button
                onClick={() => setWholeWord(!wholeWord)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                  wholeWord ? 'bg-accent-soft text-accent border-accent' : 'border-subtle bg-panel text-muted-theme'
                }`}
                title="Whole Word (\b)"
              >
                \b
              </button>
            </div>
            <button
              onClick={() => {
                setIsFindOpen(false)
                openProjectSearch(searchTerm)
              }}
              className="text-accent hover:underline flex items-center space-x-1 text-[10px] cursor-pointer"
            >
              <span>Search whole manuscript</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        ref={editorContainerRef}
        data-paragraph-style={paragraphStyle}
        data-heading-align={project.projectType === 'article' ? 'left' : 'center'}
        className="flex-1 overflow-y-auto relative scroll-smooth"
      >
        <div
          className={`${layoutClasses.widthClass} mx-auto px-6 sm:px-10 pt-8 pb-32 ${fontConfig.fontClass} ${layoutClasses.fontSizeClass} ${layoutClasses.lineSpacingClass} ${layoutClasses.alignClass}`}
          style={{ fontFamily: fontConfig.css }}
        >
          {/* Scene / Chapter Header */}
          <div className="mb-6 pb-3 border-b border-subtle">
            {showChapterSubtitle && isScene && currentChapter && currentChapter.title && currentChapter.title.trim() && (
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
              spellCheck={spellCheckEnabled}
              onChange={(e) => {
                setSceneTitleInput(e.target.value)
                if (isScene && activeSceneId) {
                  updateSceneMetadata(activeSceneId, { title: e.target.value })
                }
              }}
              placeholder={project.projectType === 'article' ? 'Article Title...' : 'Untitled Scene...'}
              className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-faint text-main"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {/* TipTap Surface */}
          <div style={{ fontFamily: 'inherit' }}>
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
          <span>•</span>
          <span className="capitalize">{contentWidth} width</span>
          <span>•</span>
          <button
            onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}
            className={`hover:text-main cursor-pointer transition-colors flex items-center space-x-1 ${
              spellCheckEnabled ? 'text-accent font-medium' : 'text-faint'
            }`}
            title={`Toggle Spell Check (${formatKeyDisplay('F7')})`}
          >
            <SpellCheck className="w-3 h-3" />
            <span>{spellCheckEnabled ? 'Spell Check' : 'Spell Off'}</span>
          </button>
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
