import React, { useState, useEffect, useRef } from 'react'
import {
  Keyboard,
  Search,
  X,
  RotateCcw,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  Sparkles,
  Command,
} from 'lucide-react'
import { useKeymap } from '../context/KeymapContext'
import { useManuscript } from '../context/ManuscriptContext'
import { KeymapAction, KeymapCategory, normalizeKeyEvent, isMacOS } from '../types/keymap'

const CATEGORIES: ('All' | KeymapCategory)[] = [
  'All',
  'Workspaces',
  'Layout & Focus',
  'Navigation',
  'Authoring',
  'Writing & Formatting',
  'System',
]

export const KeymapSettingsModal: React.FC = () => {
  const {
    actions,
    customKeymap,
    getKeyForAction,
    setKeyForAction,
    resetActionToDefault,
    resetAllToDefaults,
    formatKeyDisplay,
    isKeymapModalOpen,
    setIsKeymapModalOpen,
  } = useKeymap()

  const { syncTitleBarModalOverlay } = useManuscript()

  useEffect(() => {
    if (isKeymapModalOpen) {
      syncTitleBarModalOverlay(true)
      return () => syncTitleBarModalOverlay(false)
    }
  }, [isKeymapModalOpen, syncTitleBarModalOverlay])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | KeymapCategory>('All')
  const isMac = isMacOS()
  
  // Key Recorder State
  const [editingAction, setEditingAction] = useState<KeymapAction | null>(null)
  const [recordedCombo, setRecordedCombo] = useState<string | null>(null)
  const [conflictAction, setConflictAction] = useState<KeymapAction | null>(null)
  const [showConfirmResetAll, setShowConfirmResetAll] = useState(false)

  // When editing action starts, pre-fill with current key
  useEffect(() => {
    if (editingAction) {
      const current = getKeyForAction(editingAction.id)
      setRecordedCombo(current)
      setConflictAction(null)
    }
  }, [editingAction, getKeyForAction])

  // Key recorder event listener
  useEffect(() => {
    if (!editingAction) return

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Backspace or Delete to clear
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setRecordedCombo(null)
        setConflictAction(null)
        return
      }

      // Escape to cancel editing
      if (e.key === 'Escape') {
        setEditingAction(null)
        return
      }

      const combo = normalizeKeyEvent(e)
      if (combo) {
        setRecordedCombo(combo)

        // Check for collision
        const conflict = actions.find((act) => {
          if (act.id === editingAction.id) return false
          const activeKey = getKeyForAction(act.id)
          return activeKey && activeKey.toLowerCase() === combo.toLowerCase()
        })
        setConflictAction(conflict || null)
      }
    }

    window.addEventListener('keydown', handleRecordKey, true)
    return () => window.removeEventListener('keydown', handleRecordKey, true)
  }, [editingAction, actions, getKeyForAction])

  if (!isKeymapModalOpen) return null

  // Filter actions by category and search query
  const filteredActions = actions.filter((act) => {
    if (selectedCategory !== 'All' && act.category !== selectedCategory) {
      return false
    }
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const currentKey = getKeyForAction(act.id) || ''
    return (
      act.name.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q) ||
      currentKey.toLowerCase().includes(q)
    )
  })

  // Handle saving new recorded shortcut
  const handleSaveRecorded = () => {
    if (!editingAction) return
    setKeyForAction(editingAction.id, recordedCombo, true)
    setEditingAction(null)
  }

  // Count modified shortcuts
  const customCount = Object.keys(customKeymap).length

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none"
      onClick={() => {
        if (!editingAction) setIsKeymapModalOpen(false)
      }}
    >
      <div
        className="bg-panel border border-subtle rounded-xl max-w-4xl w-full h-[650px] shadow-2xl flex flex-col text-main overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-subtle flex items-center justify-between shrink-0 bg-panel">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent-soft border border-subtle flex items-center justify-center text-accent">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif text-sm font-semibold text-main">
                  Keyboard Shortcuts (Keymap)
                </h3>
                {customCount > 0 && (
                  <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded font-mono font-medium">
                    {customCount} customized
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-theme">
                Customize keyboard combinations, rebind keys, and configure distraction-free controls.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfirmResetAll(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-muted-theme hover:text-main hover:bg-surface border border-subtle rounded-md transition-colors"
              title="Reset all shortcuts to defaults"
            >
              <RotateCcw className="w-3 h-3 text-faint" />
              <span>Reset All</span>
            </button>

            <button
              onClick={() => setIsKeymapModalOpen(false)}
              className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-faint absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMac ? "Filter actions or search shortcut (e.g. '⌘S')..." : "Filter actions or search shortcut (e.g. 'Ctrl+S')..."}
              className="w-full bg-panel text-main text-xs pl-8 pr-3 py-1.5 rounded-md border border-subtle focus:border-accent outline-none placeholder:text-faint font-sans"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-accent-soft text-accent border border-accent/20'
                    : 'text-muted-theme hover:text-main hover:bg-panel'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {filteredActions.length === 0 ? (
            <div className="py-16 text-center text-muted-theme">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-faint opacity-50" />
              <p className="text-xs">No matching shortcuts found</p>
            </div>
          ) : (
            filteredActions.map((action) => {
              const currentKey = getKeyForAction(action.id)
              const isCustom = action.id in customKeymap
              const displayKey = formatKeyDisplay(currentKey)

              return (
                <div
                  key={action.id}
                  className="px-3.5 py-2.5 rounded-lg border border-subtle bg-surface hover:border-muted-theme/40 transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-main truncate">{action.name}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded border border-subtle text-faint bg-panel shrink-0">
                        {action.category}
                      </span>
                      {isCustom && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" title="Custom shortcut" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-theme truncate mt-0.5 opacity-80">
                      {action.description}
                    </p>
                  </div>

                  {/* Right side: Key combination and Action controls */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="min-w-[110px] text-right">
                      {currentKey ? (
                        <kbd className="px-2.5 py-1 rounded text-xs font-mono bg-panel border border-subtle text-main shadow-2xs font-medium">
                          {displayKey}
                        </kbd>
                      ) : (
                        <span className="text-xs text-faint italic">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 border-l border-subtle pl-2">
                      <button
                        onClick={() => setEditingAction(action)}
                        title="Rebind Shortcut"
                        className="p-1.5 text-muted-theme hover:text-main hover:bg-panel rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {currentKey && (
                        <button
                          onClick={() => setKeyForAction(action.id, null)}
                          title="Remove Shortcut"
                          className="p-1.5 text-muted-theme hover:text-red-400 hover:bg-panel rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isCustom && (
                        <button
                          onClick={() => resetActionToDefault(action.id)}
                          title="Revert to Default"
                          className="p-1.5 text-muted-theme hover:text-main hover:bg-panel rounded transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-faint" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-10 px-6 border-t border-subtle bg-panel flex items-center justify-between text-[11px] text-muted-theme shrink-0">
          <span>
            Click <Edit2 className="w-3 h-3 inline mx-0.5 text-faint" /> to record a new key combination.
          </span>
          <span>
            Press <kbd className="font-mono bg-surface px-1.5 py-0.5 rounded border border-subtle">{formatKeyDisplay(getKeyForAction('system.findAction'))}</kbd> anytime for Find Action.
          </span>
        </div>
      </div>

      {/* --- POPUP KEY RECORDER DIALOG (IntelliJ Style) --- */}
      {editingAction && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in"
          onClick={() => setEditingAction(null)}
        >
          <div
            className="bg-panel border border-subtle rounded-xl max-w-md w-full shadow-2xl p-5 text-main flex flex-col space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-sm font-semibold font-serif text-main">
                Assign Shortcut: {editingAction.name}
              </h4>
              <p className="text-[11px] text-muted-theme mt-0.5">
                Press the desired key combination on your keyboard.
              </p>
            </div>

            {/* Visual Key Combination Display */}
            <div className="h-20 bg-surface border-2 border-dashed border-subtle rounded-lg flex flex-col items-center justify-center text-center p-3">
              {recordedCombo ? (
                <div className="flex items-center space-x-1.5">
                  <kbd className="px-3.5 py-1.5 rounded-lg text-sm font-mono font-bold bg-panel border border-subtle text-accent shadow-sm">
                    {formatKeyDisplay(recordedCombo)}
                  </kbd>
                </div>
              ) : (
                <div className="text-xs text-faint flex items-center space-x-1.5">
                  <Command className="w-4 h-4 text-faint opacity-60" />
                  <span>Recording keystrokes... (Press Backspace to clear)</span>
                </div>
              )}
            </div>

            {/* Conflict Warning */}
            {conflictAction && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-medium">Conflict Detected:</span> Already assigned to{' '}
                  <span className="font-semibold underline">{conflictAction.name}</span>.
                  Saving will reassign this shortcut.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-subtle">
              <button
                onClick={() => {
                  setRecordedCombo(null)
                  setConflictAction(null)
                }}
                className="text-xs text-muted-theme hover:text-red-400 transition-colors"
              >
                Clear Shortcut
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingAction(null)}
                  className="px-3 py-1.5 text-xs text-muted-theme hover:text-main hover:bg-surface rounded-md border border-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecorded}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors shadow-2xs"
                >
                  {conflictAction ? 'Reassign & Save' : 'Save Shortcut'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM RESET ALL MODAL --- */}
      {showConfirmResetAll && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60"
          onClick={() => setShowConfirmResetAll(false)}
        >
          <div
            className="bg-panel border border-subtle rounded-xl max-w-sm w-full p-5 text-main space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-sm font-semibold">Reset all shortcuts?</h4>
            <p className="text-xs text-muted-theme">
              This will restore all keyboard shortcuts back to factory default configurations.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmResetAll(false)}
                className="px-3 py-1.5 text-xs text-muted-theme hover:text-main hover:bg-surface rounded-md border border-subtle"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllToDefaults()
                  setShowConfirmResetAll(false)
                }}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
