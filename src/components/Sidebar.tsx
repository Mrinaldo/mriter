import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  BookMarked,
  Scroll,
  Layers,
  Trash2,
  PanelLeftClose,
  X,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { SceneStatus } from '../types/manuscript'
import { formatKeyDisplay } from '../types/keymap'

interface SidebarProps {
  onClose?: () => void
  width: number
  onWidthChange: (width: number) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, width, onWidthChange }) => {
  const {
    project,
    activeSceneId,
    setActiveSceneId,
    activeSectionId,
    setActiveSectionId,
    setActiveView,
    addChapter,
    addScene,
    deleteChapter,
    totalWordCount,
  } = useManuscript()

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isResizing, setIsResizing] = useState(false)
  const [collapsedParts, setCollapsedParts] = useState<Record<string, boolean>>({})
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({})
  const [showFrontMatter, setShowFrontMatter] = useState(true)
  const [showBackMatter, setShowBackMatter] = useState(true)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Drag Resizing Logic for Sidebar (Extendable width: 180px - 500px)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(180, Math.min(500, Math.round(startWidth + delta)))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const totalScenesCount = project.parts.reduce(
    (acc, p) => acc + p.chapters.reduce((cAcc, c) => cAcc + c.scenes.length, 0),
    0
  )

  const togglePart = (partId: string) => {
    setCollapsedParts((prev) => ({ ...prev, [partId]: !prev[partId] }))
  }

  const toggleChapter = (chapId: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapId]: !prev[chapId] }))
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '')

  const getStatusColor = (status: SceneStatus) => {
    switch (status) {
      case 'final':
        return 'bg-[var(--status-final)]'
      case 'revised':
        return 'bg-[var(--status-revised)]'
      case 'draft':
        return 'bg-[var(--status-draft)]'
      case 'idea':
      default:
        return 'bg-[var(--status-idea)]'
    }
  }

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative bg-panel border-r border-subtle flex flex-col h-full select-none text-main shrink-0 transition-colors duration-150"
    >
      {/* Draggable Panel Resizer Handle (Right Edge) */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onWidthChange(240)}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-30 transition-colors group ${
          isResizing ? 'bg-accent/80' : 'hover:bg-accent/40'
        }`}
        title="Drag to resize manuscript panel (Double-click to reset)"
      >
        <div className={`w-0.5 h-full ml-auto transition-colors ${isResizing ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60'}`} />
      </div>
      {/* Binder Header with Search Icon & Close Button */}
      <div className="h-11 px-3 border-b border-subtle flex items-center justify-between bg-panel shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <BookMarked className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-serif font-semibold text-xs tracking-tight truncate">
            Manuscript
          </span>
          <span className="text-[10px] text-faint font-mono">
            ({totalScenesCount})
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Search Toggle Icon Button */}
          <button
            onClick={() => {
              setIsSearchOpen((prev) => {
                const next = !prev
                if (next) setTimeout(() => searchInputRef.current?.focus(), 50)
                return next
              })
            }}
            title={`Search Manuscript (${formatKeyDisplay('Ctrl+F')})`}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              searchQuery
                ? 'bg-accent-soft text-accent'
                : 'text-muted-theme hover:text-main hover:bg-surface'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Close Manuscript Panel UI Button */}
          {onClose && (
            <button
              onClick={onClose}
              title={`Close Manuscript Panel (${formatKeyDisplay('Ctrl+\\')})`}
              className="p-1.5 rounded-md text-muted-theme hover:text-main hover:bg-surface transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar (Expandable) */}
      {isSearchOpen && (
        <div className="p-2 border-b border-subtle bg-surface/50">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-faint absolute left-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscript..."
              className="w-full bg-surface text-main text-xs pl-7 pr-6 py-1 rounded border border-subtle focus:border-muted-theme outline-none placeholder:text-faint"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-faint hover:text-main p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-muted-theme">
              <span className="font-mono">Searching in scenes & lore...</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-accent hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Binder Tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-3">
        {/* FRONT MATTER */}
        <div>
          <button
            onClick={() => setShowFrontMatter(!showFrontMatter)}
            className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-theme tracking-wider uppercase rounded hover:bg-surface transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <Scroll className="w-3 h-3 opacity-60" />
              <span>Front Matter</span>
            </div>
            {showFrontMatter ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronRight className="w-3 h-3 opacity-60" />}
          </button>

          {showFrontMatter && (
            <div className="mt-0.5 space-y-0.5 pl-2">
              {project.frontMatter.map((fm) => {
                const isSelected = activeSectionId === fm.id
                const sectionText = stripHtml(fm.content || '')
                const matches = !searchQuery || fm.title.toLowerCase().includes(searchQuery.toLowerCase()) || sectionText.toLowerCase().includes(searchQuery.toLowerCase())
                if (!matches) return null

                return (
                  <button
                    key={fm.id}
                    onClick={() => {
                      setActiveSectionId(fm.id)
                      setActiveSceneId(null)
                      setActiveView('editor')
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent-soft text-main font-medium'
                        : 'text-muted-theme hover:text-main hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{fm.title}</span>
                    <span className="text-[10px] text-faint">Front</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* MANUSCRIPT BODY (PARTS & CHAPTERS) */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-theme tracking-wider uppercase">
            <div className="flex items-center space-x-1.5">
              <BookMarked className="w-3 h-3 opacity-60" />
              <span>Manuscript</span>
            </div>
            <button
              onClick={() => {
                const targetPart = project.parts[0]?.id || 'part-1'
                addChapter(targetPart)
              }}
              title="Add Chapter"
              className="p-1 text-muted-theme hover:text-main hover:bg-surface rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1 mt-0.5">
            {project.parts.map((part) => {
              const isPartCollapsed = collapsedParts[part.id]

              return (
                <div key={part.id} className="space-y-0.5">
                  {/* Part Title Header */}
                  {project.parts.length > 1 && (
                    <button
                      onClick={() => togglePart(part.id)}
                      className="w-full flex items-center justify-between px-2 py-1 text-xs font-serif font-medium text-main rounded hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <Layers className="w-3 h-3 text-faint" />
                        <span className="truncate">{part.title}</span>
                      </div>
                      {isPartCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-faint" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-faint" />
                      )}
                    </button>
                  )}

                  {/* Chapters within Part */}
                  {!isPartCollapsed && (
                    <div className="space-y-0.5 pl-1">
                      {part.chapters.map((chap) => {
                        const isChapCollapsed = collapsedChapters[chap.id]
                        const chapWordCount = chap.scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0)

                        return (
                          <div key={chap.id} className="group">
                            {/* Chapter Header */}
                            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-surface transition-colors">
                              <button
                                onClick={() => toggleChapter(chap.id)}
                                className="flex items-center space-x-1.5 flex-1 min-w-0 text-left"
                              >
                                {isChapCollapsed ? (
                                  <ChevronRight className="w-3 h-3 text-faint shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-faint shrink-0" />
                                )}
                                <span className="text-xs font-medium text-main truncate">
                                  {chap.title}
                                </span>
                              </button>

                              <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-faint font-mono mr-1">
                                  {chapWordCount}w
                                </span>
                                <button
                                  onClick={() => addScene(chap.id)}
                                  title="Add Scene"
                                  className="p-0.5 text-muted-theme hover:text-main rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete "${chap.title}"?`)) {
                                      deleteChapter(chap.id)
                                    }
                                  }}
                                  title="Delete Chapter"
                                  className="p-0.5 text-faint hover:text-red-500 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Scenes */}
                            {!isChapCollapsed && (
                              <div className="pl-3.5 space-y-0.5 mt-0.5 border-l border-subtle ml-2">
                                {chap.scenes.map((scene) => {
                                  const isSelected = activeSceneId === scene.id
                                  const sceneText = scene.plainText || stripHtml(scene.content || '')
                                  const matchesSearch =
                                    !searchQuery ||
                                    scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    scene.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    sceneText.toLowerCase().includes(searchQuery.toLowerCase())

                                  if (!matchesSearch) return null

                                  return (
                                    <button
                                      key={scene.id}
                                      onClick={() => {
                                        setActiveSceneId(scene.id)
                                        setActiveSectionId(null)
                                        setActiveView('editor')
                                      }}
                                      className={`w-full group/scene flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                                        isSelected
                                          ? 'bg-accent-soft text-main font-medium shadow-2xs'
                                          : 'text-muted-theme hover:text-main hover:bg-surface'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 min-w-0">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                                            scene.status
                                          )}`}
                                          title={`Status: ${scene.status}`}
                                        />
                                        <span className="truncate text-left">{scene.title}</span>
                                      </div>

                                      <span className="text-[10px] text-faint font-mono shrink-0">
                                        {scene.wordCount || 0}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* BACK MATTER */}
        <div>
          <button
            onClick={() => setShowBackMatter(!showBackMatter)}
            className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-muted-theme tracking-wider uppercase rounded hover:bg-surface transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <Scroll className="w-3 h-3 opacity-60" />
              <span>Back Matter</span>
            </div>
            {showBackMatter ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronRight className="w-3 h-3 opacity-60" />}
          </button>

          {showBackMatter && (
            <div className="mt-0.5 space-y-0.5 pl-2">
              {project.backMatter.map((bm) => {
                const isSelected = activeSectionId === bm.id
                return (
                  <button
                    key={bm.id}
                    onClick={() => {
                      setActiveSectionId(bm.id)
                      setActiveSceneId(null)
                      setActiveView('editor')
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent-soft text-main font-medium'
                        : 'text-muted-theme hover:text-main hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{bm.title}</span>
                    <span className="text-[10px] text-faint">Back</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Binder Footer / Summary */}
      <div className="p-2.5 border-t border-subtle bg-panel text-muted-theme text-xs flex items-center justify-between">
        <span className="text-[10px]">Manuscript Total</span>
        <span className="font-mono text-main font-medium text-[11px]">
          {totalWordCount.toLocaleString()} words
        </span>
      </div>
    </aside>
  )
}
