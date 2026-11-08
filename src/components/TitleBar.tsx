import React, { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
  Users,
  LayoutGrid,
  Sparkles,
  Save,
  FolderOpen,
  FilePlus,
  Maximize2,
  Minimize2,
  Check,
  Library,
  ChevronDown,
  Edit3,
  Command,
  Keyboard,
  Palette,
} from 'lucide-react'
import { useManuscript, EditorTheme } from '../context/ManuscriptContext'
import { useKeymap } from '../context/KeymapContext'
import { isMacOS } from '../types/keymap'
import { MriterLogo } from './MriterLogo'

export const TitleBar: React.FC = () => {
  const {
    project,
    setProject,
    projectsLibrary,
    setIsLibraryOpen,
    activeView,
    setActiveView,
    editorTheme,
    setEditorTheme,
    focusMode,
    setFocusMode,
    isDirty,
    lastSavedAt,
    saveProjectFile,
    openProjectFile,
    newProject,
    totalWordCount,
  } = useManuscript()

  const {
    setIsActionPaletteOpen,
    setIsKeymapModalOpen,
    getKeyForAction,
    formatKeyDisplay,
  } = useKeymap()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(project.title)
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)

  const projectMenuRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false)
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTitleSubmit = () => {
    setIsEditingTitle(false)
    if (titleInput.trim()) {
      setProject((p) => ({ ...p, title: titleInput.trim(), updatedAt: new Date().toISOString() }))
    }
  }

  const themes: { id: EditorTheme; label: string; desc: string }[] = [
    { id: 'paper', label: 'Linen', desc: 'Warm Paper' },
    { id: 'sepia', label: 'Sepia', desc: 'Antique Parchment' },
    { id: 'sage', label: 'Sage', desc: 'Morning Mist' },
    { id: 'dark', label: 'Charcoal', desc: 'Warm Umber Dark' },
  ]

  const currentTheme = themes.find((t) => t.id === editorTheme) || themes[0]

  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI)
  const isMac = isElectron ? window.electronAPI?.platform === 'darwin' : isMacOS()
  const isWindows = isElectron && window.electronAPI?.platform !== 'darwin'
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Track window maximized and fullscreen states for layout and caption controls
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

  return (
    <header
      style={{
        paddingLeft: isMac && !isFullScreen ? '80px' : '0.75rem',
        paddingRight: isWindows ? '0' : '0.75rem',
      }}
      className="h-11 bg-panel border-b border-subtle flex items-center justify-between select-none z-30 shrink-0 text-main transition-colors duration-150 titlebar-drag-region"
    >
      {/* ======================================================== */}
      {/* LEFT: Monogram & Unified Project Dropdown Menu */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 shrink">
        {/* Mriter Brand Monogram */}
        <div className="w-6 h-6 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0 border border-subtle/70 shadow-xs" title="Mriter Studio">
          <MriterLogo size={16} variant="monogram" />
        </div>

        {/* Project Dropdown Trigger & Popover */}
        <div className="relative no-drag-region" ref={projectMenuRef}>
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-surface text-main text-xs px-2 py-0.5 rounded border border-muted-theme outline-none w-36 sm:w-44 font-serif"
            />
          ) : (
            <button
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              title="Manuscript Actions & Library"
              className="flex items-center space-x-1.5 px-2 py-1 rounded-md hover:bg-surface border border-transparent hover:border-subtle text-xs transition-colors group cursor-pointer max-w-[140px] sm:max-w-[200px] md:max-w-[260px]"
            >
              <span className="font-serif font-medium text-main truncate">
                {project.title}
              </span>
              <span className="text-muted-theme text-[11px] hidden lg:inline truncate">
                · {project.author}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-theme group-hover:text-main shrink-0 transition-transform duration-150" />
            </button>
          )}

          {/* Clean Project Dropdown Menu */}
          {isProjectMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-surface rounded-lg shadow-xl border border-subtle p-1 z-50 text-xs text-main font-sans animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-theme uppercase border-b border-subtle mb-1">
                Manuscript Actions
              </div>

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false)
                  newProject()
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-app flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FilePlus className="w-3.5 h-3.5 text-muted-theme" />
                  <span>New Manuscript...</span>
                </div>
                <kbd className="text-[10px] text-faint font-mono">
                  {formatKeyDisplay(getKeyForAction('project.new'))}
                </kbd>
              </button>

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false)
                  openProjectFile()
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-app flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-3.5 h-3.5 text-muted-theme" />
                  <span>Open Manuscript...</span>
                </div>
                <kbd className="text-[10px] text-faint font-mono">
                  {formatKeyDisplay(getKeyForAction('project.open'))}
                </kbd>
              </button>

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false)
                  saveProjectFile()
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-app flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Save className="w-3.5 h-3.5 text-muted-theme" />
                  <span>Save Project</span>
                </div>
                <kbd className="text-[10px] text-faint font-mono">
                  {formatKeyDisplay(getKeyForAction('project.save'))}
                </kbd>
              </button>

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false)
                  setTitleInput(project.title)
                  setIsEditingTitle(true)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-app flex items-center space-x-2 text-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted-theme" />
                <span>Rename Title...</span>
              </button>

              <div className="border-t border-subtle my-1" />

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false)
                  setIsLibraryOpen(true)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-app flex items-center justify-between text-xs font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Library className="w-3.5 h-3.5 text-accent" />
                  <span>Manuscript Library</span>
                </div>
                <span className="text-[10px] font-mono text-muted-theme bg-panel px-1.5 py-0.5 rounded border border-subtle">
                  {projectsLibrary.length}
                </span>
              </button>

              <div className="border-t border-subtle my-1" />

              {/* Theme Selector for quick access */}
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-theme uppercase border-b border-subtle mb-1">
                Appearance Theme
              </div>
              <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setEditorTheme(t.id)
                      setIsProjectMenuOpen(false)
                    }}
                    className={`px-2 py-1 rounded text-xs text-left flex items-center justify-between cursor-pointer ${
                      editorTheme === t.id
                        ? 'bg-accent-soft text-accent font-medium'
                        : 'hover:bg-app text-muted-theme hover:text-main'
                    }`}
                  >
                    <span>{t.label}</span>
                    {editorTheme === t.id && <Check className="w-3 h-3 text-accent" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quiet Save Status Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-theme pl-1 shrink-0">
          {isDirty ? (
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent opacity-80 shrink-0"
              title="Unsaved changes (autosaves every 1.5s)"
            />
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-600 opacity-75 shrink-0"
              title={`Saved ${lastSavedAt || ''}`}
            />
          )}
          <span className="text-faint text-[11px] hidden xl:inline">
            {isDirty ? 'Unsaved' : 'Saved'}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CENTER: Responsive Segmented View Switcher */}
      {/* ======================================================== */}
      <nav className="flex items-center bg-surface p-0.5 rounded-lg border border-subtle no-drag-region shrink-0 mx-1 sm:mx-2">
        {[
          { id: 'editor', label: 'Write', icon: BookOpen },
          { id: 'outline', label: 'Outline', icon: LayoutGrid },
          { id: 'bible', label: 'Bible', icon: Users },
          { id: 'publish', label: 'Publish', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              title={`${tab.label} View`}
              className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-app text-main shadow-xs border border-subtle'
                  : 'text-muted-theme hover:text-main'
              }`}
            >
              <Icon className="w-3.5 h-3.5 opacity-75 shrink-0" />
              {/* Responsive: labels show on screens >= lg (1024px) */}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ======================================================== */}
      {/* RIGHT: Consolidated Word Count, Palette & Zen Mode */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 no-drag-region shrink-0 ml-auto">
        {/* Word Count Progress Badge - ALWAYS VISIBLE */}
        <div
          title={`Total Words: ${totalWordCount.toLocaleString()} / Target: ${(project.targetWordCount || 80000).toLocaleString()} words`}
          className="flex items-center space-x-1 text-xs text-muted-theme font-mono px-2 py-0.5 rounded bg-surface border border-subtle shrink-0"
        >
          <span className="text-main font-medium">{totalWordCount.toLocaleString()}</span>
          <span className="text-faint hidden sm:inline">
            / {(project.targetWordCount || 80000).toLocaleString()}w
          </span>
          <span className="text-faint sm:hidden">w</span>
        </div>

        {/* Consolidated Theme Switcher Popover */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            title={`Active Theme: ${currentTheme.label} (${currentTheme.desc})`}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-md hover:bg-surface border border-transparent hover:border-subtle text-xs transition-colors cursor-pointer group"
          >
            <Palette className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-[11px] text-muted-theme group-hover:text-main hidden md:inline font-medium capitalize">
              {currentTheme.label}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-faint group-hover:text-main shrink-0" />
          </button>

          {/* Theme Picker Dropdown */}
          {isThemeMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-xl border border-subtle p-1 z-50 text-xs text-main animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-theme uppercase border-b border-subtle mb-1">
                Color Palette
              </div>
              {themes.map((t) => {
                const isSelected = editorTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setEditorTheme(t.id)
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-app text-main font-medium border border-subtle shadow-xs'
                        : 'hover:bg-app text-muted-theme hover:text-main'
                    }`}
                  >
                    <div>
                      <span>{t.label}</span>
                      <span className="text-[10px] text-faint ml-1.5">({t.desc})</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Find Action Command Palette Trigger */}
        <button
          onClick={() => setIsActionPaletteOpen(true)}
          title={`Find Action (${formatKeyDisplay(getKeyForAction('system.findAction'))})`}
          className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-md border border-transparent hover:border-subtle transition-colors cursor-pointer shrink-0"
        >
          <Command className="w-3.5 h-3.5 opacity-75" />
        </button>

        {/* Keyboard Shortcuts Settings Button - visible on screens >= sm */}
        <button
          onClick={() => setIsKeymapModalOpen(true)}
          title={`Keyboard Shortcuts Settings (${formatKeyDisplay(getKeyForAction('system.openKeymap'))})`}
          className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-md border border-transparent hover:border-subtle transition-colors cursor-pointer hidden sm:inline-flex shrink-0"
        >
          <Keyboard className="w-3.5 h-3.5 opacity-75" />
        </button>

        {/* Focus / Zen Mode - ALWAYS VISIBLE */}
        <button
          onClick={() => setFocusMode(!focusMode)}
          title={focusMode ? `Exit Zen Mode (${formatKeyDisplay('Escape')})` : `Zen Focus Mode (${formatKeyDisplay('F11')})`}
          className={`p-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${
            focusMode
              ? 'bg-accent-soft text-accent'
              : 'text-muted-theme hover:text-main hover:bg-surface'
          }`}
        >
          {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Windows / Linux Native Frameless Window Caption Controls (GUARANTEED VISIBLE, ANCHORED, NEVER HIDDEN) */}
        {isWindows && (
          <div className="flex items-center h-11 ml-1.5 sm:ml-2 pl-0.5 sm:pl-1 border-l border-subtle no-drag-region shrink-0">
            {/* Minimize */}
            <button
              onClick={() => window.electronAPI?.minimizeWindow?.()}
              title="Minimize"
              className="w-11 h-11 flex items-center justify-center hover:bg-surface text-muted-theme hover:text-main transition-colors cursor-pointer shrink-0"
            >
              <span className="w-2.5 h-[1.2px] bg-current" />
            </button>
            {/* Maximize / Restore */}
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
            {/* Close */}
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
    </header>
  )
}
