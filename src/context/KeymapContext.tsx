import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import {
  KeymapAction,
  DEFAULT_ACTIONS,
  normalizeKeyEvent,
  formatKeyDisplay,
} from '../types/keymap'

const KEYMAP_STORAGE_KEY = 'mriter_custom_keymap'

interface KeymapContextType {
  actions: KeymapAction[]
  customKeymap: Record<string, string | null>
  getKeyForAction: (actionId: string) => string | null
  setKeyForAction: (
    actionId: string,
    newCombo: string | null,
    resolveConflict?: boolean
  ) => { conflictAction?: KeymapAction; success: boolean }
  resetActionToDefault: (actionId: string) => void
  resetAllToDefaults: () => void
  isActionPaletteOpen: boolean
  setIsActionPaletteOpen: (open: boolean) => void
  isKeymapModalOpen: boolean
  setIsKeymapModalOpen: (open: boolean) => void
  registerActionHandler: (actionId: string, handler: () => void) => () => void
  executeAction: (actionId: string) => boolean
  formatKeyDisplay: (combo: string | null | undefined) => string
}

const KeymapContext = createContext<KeymapContextType | undefined>(undefined)

export const KeymapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customKeymap, setCustomKeymap] = useState<Record<string, string | null>>(() => {
    try {
      const saved = localStorage.getItem(KEYMAP_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse saved keymap', e)
    }
    return {}
  })

  const [isActionPaletteOpen, setIsActionPaletteOpen] = useState(false)
  const [isKeymapModalOpen, setIsKeymapModalOpen] = useState(false)

  // Map of registered execution handlers for actions
  const handlersRef = useRef<Record<string, () => void>>({})

  // Persist custom keymap changes
  useEffect(() => {
    try {
      localStorage.setItem(KEYMAP_STORAGE_KEY, JSON.stringify(customKeymap))
    } catch (e) {
      console.error('Failed to save keymap', e)
    }
  }, [customKeymap])

  // Get current active key for an action (custom or default)
  const getKeyForAction = useCallback(
    (actionId: string): string | null => {
      if (actionId in customKeymap) {
        return customKeymap[actionId]
      }
      const action = DEFAULT_ACTIONS.find((a) => a.id === actionId)
      return action?.defaultKey || null
    },
    [customKeymap]
  )

  // Register an action handler
  const registerActionHandler = useCallback((actionId: string, handler: () => void) => {
    handlersRef.current[actionId] = handler
    return () => {
      delete handlersRef.current[actionId]
    }
  }, [])

  // Execute an action by ID
  const executeAction = useCallback((actionId: string): boolean => {
    const handler = handlersRef.current[actionId]
    if (handler) {
      handler()
      return true
    }
    return false
  }, [])

  // Set or rebind shortcut with collision detection
  const setKeyForAction = useCallback(
    (
      actionId: string,
      newCombo: string | null,
      resolveConflict: boolean = false
    ): { conflictAction?: KeymapAction; success: boolean } => {
      if (newCombo) {
        // Check for conflict with another action
        const conflict = DEFAULT_ACTIONS.find((act) => {
          if (act.id === actionId) return false
          const activeKey = getKeyForAction(act.id)
          return activeKey && activeKey.toLowerCase() === newCombo.toLowerCase()
        })

        if (conflict && !resolveConflict) {
          return { conflictAction: conflict, success: false }
        }

        // If resolving conflict, clear the conflicting action's shortcut
        if (conflict && resolveConflict) {
          setCustomKeymap((prev) => ({
            ...prev,
            [conflict.id]: null,
            [actionId]: newCombo,
          }))
          return { conflictAction: conflict, success: true }
        }
      }

      setCustomKeymap((prev) => ({
        ...prev,
        [actionId]: newCombo,
      }))
      return { success: true }
    },
    [getKeyForAction]
  )

  // Reset a single action to default
  const resetActionToDefault = useCallback((actionId: string) => {
    setCustomKeymap((prev) => {
      const copy = { ...prev }
      delete copy[actionId]
      return copy
    })
  }, [])

  // Reset all shortcuts to factory defaults
  const resetAllToDefaults = useCallback(() => {
    setCustomKeymap({})
  }, [])

  // Built-in system actions (Find Action and Keymap Settings)
  useEffect(() => {
    const unregisterFind = registerActionHandler('system.findAction', () => {
      setIsActionPaletteOpen((prev) => !prev)
    })
    const unregisterKeymap = registerActionHandler('system.openKeymap', () => {
      setIsKeymapModalOpen(true)
      setIsActionPaletteOpen(false)
    })
    return () => {
      unregisterFind()
      unregisterKeymap()
    }
  }, [registerActionHandler])

  // Global Keydown Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const normalized = normalizeKeyEvent(e)
      if (!normalized) return

      // Find if any action is bound to this key
      const matchedAction = DEFAULT_ACTIONS.find((act) => {
        const key = getKeyForAction(act.id)
        if (key && key.toLowerCase() === normalized.toLowerCase()) {
          return true
        }
        if (!(act.id in customKeymap) && act.aliases) {
          return act.aliases.some((a) => a.toLowerCase() === normalized.toLowerCase())
        }
        return false
      })

      if (!matchedAction) return

      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable

      // If typing in input/editor, only trigger if action allows it (e.g. modifier shortcuts like Ctrl+S)
      if (isInput && !matchedAction.allowInInput) {
        return
      }

      // Check if modal or palette is open and user pressed Escape
      if (e.key === 'Escape' && (isActionPaletteOpen || isKeymapModalOpen)) {
        setIsActionPaletteOpen(false)
        setIsKeymapModalOpen(false)
        e.preventDefault()
        return
      }

      e.preventDefault()
      executeAction(matchedAction.id)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [getKeyForAction, executeAction, isActionPaletteOpen, isKeymapModalOpen, customKeymap])

  return (
    <KeymapContext.Provider
      value={{
        actions: DEFAULT_ACTIONS,
        customKeymap,
        getKeyForAction,
        setKeyForAction,
        resetActionToDefault,
        resetAllToDefaults,
        isActionPaletteOpen,
        setIsActionPaletteOpen,
        isKeymapModalOpen,
        setIsKeymapModalOpen,
        registerActionHandler,
        executeAction,
        formatKeyDisplay,
      }}
    >
      {children}
    </KeymapContext.Provider>
  )
}

export const useKeymap = () => {
  const context = useContext(KeymapContext)
  if (!context) {
    throw new Error('useKeymap must be used within a KeymapProvider')
  }
  return context
}
