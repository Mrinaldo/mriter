import React, { useState, useEffect, useRef } from 'react'
import { Search, Command, ArrowRight, Settings, Sparkles, Check, X } from 'lucide-react'
import { useKeymap } from '../context/KeymapContext'
import { useManuscript } from '../context/ManuscriptContext'
import { KeymapAction } from '../types/keymap'

export const ActionPaletteModal: React.FC = () => {
  const {
    actions,
    getKeyForAction,
    formatKeyDisplay,
    isActionPaletteOpen,
    setIsActionPaletteOpen,
    setIsKeymapModalOpen,
    executeAction,
  } = useKeymap()

  const { syncTitleBarModalOverlay } = useManuscript()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Synchronize native window titlebar overlay so buttons blend seamlessly with modal backdrop
  useEffect(() => {
    if (isActionPaletteOpen) {
      syncTitleBarModalOverlay(true)
      return () => {
        syncTitleBarModalOverlay(false)
      }
    }
  }, [isActionPaletteOpen, syncTitleBarModalOverlay])

  // Reset search and selection when palette opens
  useEffect(() => {
    if (isActionPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isActionPaletteOpen])

  // Scroll active item into view
  useEffect(() => {
    if (isActionPaletteOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isActionPaletteOpen, selectedIndex])

  if (!isActionPaletteOpen) return null

  // Filter actions based on query (name, category, description, or assigned key)
  const filteredActions = actions.filter((act) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    const key = getKeyForAction(act.id) || ''
    return (
      act.name.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    )
  })

  // Keep selected index within bounds
  const clampedIndex = Math.max(
    0,
    Math.min(selectedIndex, Math.max(0, filteredActions.length - 1))
  )

  const handleSelectAction = (action: KeymapAction) => {
    setIsActionPaletteOpen(false)
    executeAction(action.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredActions.length - 1) : prev - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredActions[clampedIndex]) {
        handleSelectAction(filteredActions[clampedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsActionPaletteOpen(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 pb-12 px-4 z-50 animate-in fade-in select-none"
      onClick={() => setIsActionPaletteOpen(false)}
    >
      <div
        className="bg-panel border border-subtle rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-main animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header (IntelliJ Find Action Style) */}
        <div className="h-13 px-4 border-b border-subtle flex items-center space-x-3 bg-panel shrink-0">
          <Search className="w-4 h-4 text-faint shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Find Action or type command (e.g. 'Zen', 'Next Scene', 'Theme')..."
            className="flex-1 bg-transparent text-main text-sm outline-none placeholder:text-faint font-sans"
          />
          <span className="text-[10px] text-faint px-2 py-0.5 rounded bg-surface border border-subtle font-mono hidden sm:inline">
            Ctrl+Shift+A
          </span>
          <button
            onClick={() => setIsActionPaletteOpen(false)}
            className="p-1 rounded-md text-muted-theme hover:text-main hover:bg-surface transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-muted-theme">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-faint opacity-50" />
              <p className="text-xs">No matching actions found for "{query}"</p>
              <button
                onClick={() => {
                  setIsActionPaletteOpen(false)
                  setIsKeymapModalOpen(true)
                }}
                className="mt-3 text-xs text-accent hover:underline flex items-center space-x-1 mx-auto"
              >
                <Settings className="w-3 h-3" />
                <span>Open Keymap Settings</span>
              </button>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isActive = idx === clampedIndex
              const keyCombo = getKeyForAction(action.id)
              const displayKey = formatKeyDisplay(keyCombo)

              return (
                <div
                  key={action.id}
                  data-active={isActive}
                  onClick={() => handleSelectAction(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-main font-medium'
                      : 'hover:bg-surface text-muted-theme'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate pr-4">
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'border-accent/30 text-accent font-semibold bg-surface'
                          : 'border-subtle text-faint bg-panel'
                      }`}
                    >
                      {action.category}
                    </span>
                    <div className="truncate">
                      <span className="text-xs text-main">{action.name}</span>
                      <p className="text-[10px] text-muted-theme truncate opacity-75">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  {/* Shortcut Badge */}
                  <div className="shrink-0 flex items-center space-x-1.5">
                    {keyCombo ? (
                      <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-subtle text-muted-theme shadow-2xs">
                        {displayKey}
                      </kbd>
                    ) : (
                      <span className="text-[10px] text-faint italic">No shortcut</span>
                    )}
                    {isActive && <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-9 px-4 border-t border-subtle bg-surface flex items-center justify-between text-[11px] text-muted-theme shrink-0">
          <div className="flex items-center space-x-3 text-[10px] text-faint">
            <span>
              <kbd className="font-mono bg-panel px-1 py-0.5 rounded border border-subtle">↑</kbd>{' '}
              <kbd className="font-mono bg-panel px-1 py-0.5 rounded border border-subtle">↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-panel px-1 py-0.5 rounded border border-subtle">↵</kbd>{' '}
              Run Action
            </span>
            <span>
              <kbd className="font-mono bg-panel px-1 py-0.5 rounded border border-subtle">Esc</kbd>{' '}
              Close
            </span>
          </div>

          <button
            onClick={() => {
              setIsActionPaletteOpen(false)
              setIsKeymapModalOpen(true)
            }}
            className="flex items-center space-x-1.5 text-xs text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer"
          >
            <Settings className="w-3 h-3" />
            <span>Keymap Settings...</span>
          </button>
        </div>
      </div>
    </div>
  )
}
