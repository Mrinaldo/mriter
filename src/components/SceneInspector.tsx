import React, { useState } from 'react'
import {
  User,
  Target,
  FileSpreadsheet,
  StickyNote,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { SceneStatus } from '../types/manuscript'

interface SceneInspectorProps {
  isOpen: boolean
  onToggle: () => void
  width: number
  onWidthChange: (width: number) => void
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  isOpen,
  onToggle,
  width,
  onWidthChange,
}) => {
  const { project, currentScene, activeSceneId, updateSceneMetadata } = useManuscript()
  const [isResizing, setIsResizing] = useState(false)

  // Drag Resizing Logic for Inspector (Left border: extends 200px - 520px)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Dragging left increases width, dragging right decreases width
      const delta = startX - moveEvent.clientX
      const newWidth = Math.max(200, Math.min(520, Math.round(startWidth + delta)))
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

  // Collapsed Rail (Symmetrical to left collapsed rail)
  if (!isOpen) {
    return (
      <div className="w-8 bg-panel border-l border-subtle flex flex-col items-center py-2.5 text-muted-theme shrink-0 select-none transition-colors">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:text-main hover:bg-surface transition-colors cursor-pointer mb-2"
          title="Expand Scene Inspector (Ctrl+Alt+I)"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] uppercase font-medium tracking-widest text-faint [writing-mode:vertical-lr] rotate-180">
            Inspector
          </span>
        </div>
      </div>
    )
  }

  if (!currentScene || !activeSceneId) {
    return (
      <aside
        style={{ width: `${width}px` }}
        className="relative bg-panel border-l border-subtle flex flex-col h-full select-none text-muted-theme shrink-0 transition-colors duration-150"
      >
        {/* Draggable Resizer Handle on Left Edge */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => onWidthChange(272)}
          className={`absolute top-0 left-0 w-1.5 h-full cursor-col-resize z-30 transition-colors group ${
            isResizing ? 'bg-accent/80' : 'hover:bg-accent/40'
          }`}
          title="Drag to resize scene inspector (Double-click to reset)"
        >
          <div className={`w-0.5 h-full mr-auto transition-colors ${isResizing ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60'}`} />
        </div>

        <div className="h-11 px-3 border-b border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onToggle}
              className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-md transition-colors cursor-pointer"
              title="Collapse Scene Inspector (Ctrl+Alt+I)"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-serif font-semibold text-main uppercase tracking-wider">
              Inspector
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Sparkles className="w-7 h-7 text-faint mb-2.5 opacity-50" />
          <h4 className="font-serif text-xs font-medium text-main mb-1">No Active Scene</h4>
          <p className="text-[11px] text-faint leading-relaxed">
            Select a chapter or scene from the manuscript binder to edit POV, synopsis, status, and author notes.
          </p>
        </div>
      </aside>
    )
  }

  const povCharacter = project.characters.find((c) => c.id === currentScene.povCharacterId)
  const targetWords = currentScene.targetWords || 1500
  const progressPercent = Math.min(100, Math.round(((currentScene.wordCount || 0) / targetWords) * 100))

  const statuses: { id: SceneStatus; label: string; dotClass: string }[] = [
    { id: 'idea', label: 'Idea', dotClass: 'bg-[var(--status-idea)]' },
    { id: 'draft', label: 'Draft', dotClass: 'bg-[var(--status-draft)]' },
    { id: 'revised', label: 'Revised', dotClass: 'bg-[var(--status-revised)]' },
    { id: 'final', label: 'Final', dotClass: 'bg-[var(--status-final)]' },
  ]

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative bg-panel border-l border-subtle flex flex-col h-full select-none text-main shrink-0 transition-colors duration-150"
    >
      {/* Draggable Resizer Handle on Left Edge (Extendable width) */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onWidthChange(272)}
        className={`absolute top-0 left-0 w-1.5 h-full cursor-col-resize z-30 transition-colors group ${
          isResizing ? 'bg-accent/80' : 'hover:bg-accent/40'
        }`}
        title="Drag to resize scene inspector (Double-click to reset)"
      >
        <div className={`w-0.5 h-full mr-auto transition-colors ${isResizing ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60'}`} />
      </div>

      {/* Header with Consistent Symmetrical Close Button */}
      <div className="h-11 px-3 border-b border-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5 min-w-0">
          <button
            onClick={onToggle}
            className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-md transition-colors cursor-pointer"
            title="Collapse Scene Inspector (Ctrl+Alt+I)"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-serif font-semibold text-main tracking-tight uppercase truncate">
            Scene Details
          </span>
        </div>

        <span className="text-[10px] font-mono text-faint">
          {progressPercent}% target
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Status Selector */}
        <div>
          <label className="text-[10px] font-medium text-muted-theme block mb-1 uppercase tracking-wider">
            Status
          </label>
          <div className="grid grid-cols-4 gap-1 bg-surface p-1 rounded-md border border-subtle">
            {statuses.map((st) => (
              <button
                key={st.id}
                onClick={() => updateSceneMetadata(activeSceneId, { status: st.id })}
                className={`py-1 rounded text-[10px] font-medium transition-colors flex items-center justify-center space-x-1 ${
                  currentScene.status === st.id
                    ? 'bg-app text-main shadow-2xs border border-subtle'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* POV Character */}
        <div>
          <label className="text-[10px] font-medium text-muted-theme uppercase tracking-wider flex items-center space-x-1 mb-1">
            <User className="w-3 h-3 text-faint" />
            <span>POV Character</span>
          </label>
          <select
            value={currentScene.povCharacterId || ''}
            onChange={(e) => updateSceneMetadata(activeSceneId, { povCharacterId: e.target.value })}
            className="w-full bg-surface text-main text-xs px-2.5 py-1.5 rounded border border-subtle focus:border-muted-theme outline-none cursor-pointer"
          >
            <option value="">None / Omniscient</option>
            {project.characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name} ({char.role})
              </option>
            ))}
          </select>

          {/* POV Card */}
          {povCharacter && (
            <div className="mt-1.5 p-2 rounded bg-surface/70 border border-subtle space-y-0.5 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-medium text-main text-[11px]">{povCharacter.name}</span>
                {povCharacter.archetype && (
                  <span className="text-[10px] text-faint">· {povCharacter.archetype}</span>
                )}
              </div>
              {povCharacter.goal && (
                <p className="text-[10px] text-muted-theme italic line-clamp-2">
                  Goal: &ldquo;{povCharacter.goal}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Word Target */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-muted-theme uppercase tracking-wider flex items-center space-x-1">
              <Target className="w-3 h-3 text-faint" />
              <span>Goal</span>
            </label>
            <span className="text-[10px] text-faint font-mono">
              {currentScene.wordCount || 0} / {targetWords}
            </span>
          </div>
          <div className="w-full h-1 bg-surface rounded-full overflow-hidden border border-subtle">
            <div
              className="h-full bg-accent/70 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Synopsis / Outline Beats */}
        <div>
          <label className="text-[10px] font-medium text-muted-theme uppercase tracking-wider flex items-center space-x-1 mb-1">
            <FileSpreadsheet className="w-3 h-3 text-faint" />
            <span>Synopsis & Beats</span>
          </label>
          <textarea
            value={currentScene.synopsis || ''}
            onChange={(e) => updateSceneMetadata(activeSceneId, { synopsis: e.target.value })}
            placeholder="What happens in this scene? What is the turning point?"
            rows={3}
            className="w-full bg-surface text-main text-xs p-2 rounded border border-subtle focus:border-muted-theme outline-none resize-none placeholder:text-faint leading-relaxed font-sans"
          />
        </div>

        {/* Scene Notes */}
        <div>
          <label className="text-[10px] font-medium text-muted-theme uppercase tracking-wider flex items-center space-x-1 mb-1">
            <StickyNote className="w-3 h-3 text-faint" />
            <span>Scene Notes</span>
          </label>
          <textarea
            value={currentScene.notes || ''}
            onChange={(e) => updateSceneMetadata(activeSceneId, { notes: e.target.value })}
            placeholder="Sensory details, reminders, scratch notes..."
            rows={3}
            className="w-full bg-surface text-main text-xs p-2 rounded border border-subtle focus:border-muted-theme outline-none resize-none placeholder:text-faint leading-relaxed font-sans"
          />
        </div>
      </div>
    </aside>
  )
}
