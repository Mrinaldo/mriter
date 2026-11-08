export type KeymapCategory =
  | 'Workspaces'
  | 'Layout & Focus'
  | 'Navigation'
  | 'Authoring'
  | 'Writing & Formatting'
  | 'System'

export interface KeymapAction {
  id: string
  name: string
  category: KeymapCategory
  description: string
  defaultKey: string | null // e.g. "Ctrl+1", "Alt+Down", "Ctrl+Shift+A"
  aliases?: string[] // Additional fallback shortcuts (e.g. "Ctrl+K")
  allowInInput?: boolean // true if modifier combo should trigger even inside input/editor
}

export const DEFAULT_ACTIONS: KeymapAction[] = [
  // 1. Workspaces
  {
    id: 'view.write',
    name: 'Switch to Write Studio',
    category: 'Workspaces',
    description: 'Open the manuscript editor and binder tree',
    defaultKey: 'Ctrl+1',
    allowInInput: true,
  },
  {
    id: 'view.outline',
    name: 'Switch to Outliner Matrix',
    category: 'Workspaces',
    description: 'Open the chapter index cards & POV board',
    defaultKey: 'Ctrl+2',
    allowInInput: true,
  },
  {
    id: 'view.bible',
    name: 'Switch to Character & World Bible',
    category: 'Workspaces',
    description: 'Open character dossiers, lore, and worldbuilding entries',
    defaultKey: 'Ctrl+3',
    allowInInput: true,
  },
  {
    id: 'view.publish',
    name: 'Switch to Publish Studio',
    category: 'Workspaces',
    description: 'Open typography styling, preview, and book exporter',
    defaultKey: 'Ctrl+4',
    allowInInput: true,
  },
  {
    id: 'view.library',
    name: 'Open Manuscript Library',
    category: 'Workspaces',
    description: 'Switch active novel or create a new manuscript',
    defaultKey: 'Ctrl+Shift+P',
    allowInInput: true,
  },

  // 2. Layout & Focus
  {
    id: 'layout.toggleZen',
    name: 'Toggle Zen Focus Mode',
    category: 'Layout & Focus',
    description: 'Hide toolbars, sidebar, and panels for zero-distraction drafting',
    defaultKey: 'F11',
    allowInInput: true,
  },
  {
    id: 'layout.toggleSidebar',
    name: 'Toggle Binder Sidebar',
    category: 'Layout & Focus',
    description: 'Collapse or expand the left manuscript tree sidebar',
    defaultKey: 'Ctrl+\\',
    allowInInput: true,
  },
  {
    id: 'layout.toggleInspector',
    name: 'Toggle Scene Inspector',
    category: 'Layout & Focus',
    description: 'Collapse or expand the right scene synopsis & details panel',
    defaultKey: 'Ctrl+Alt+I',
    allowInInput: true,
  },
  {
    id: 'layout.toggleTypewriter',
    name: 'Toggle Typewriter Scrolling',
    category: 'Layout & Focus',
    description: 'Keep the active typing line vertically centered on the screen',
    defaultKey: 'Ctrl+Shift+T',
    allowInInput: true,
  },
  {
    id: 'layout.cycleTheme',
    name: 'Cycle Color Theme',
    category: 'Layout & Focus',
    description: 'Cycle between Linen (Paper), Sepia, Sage, and Charcoal (Dark) themes',
    defaultKey: 'Ctrl+Shift+L',
    allowInInput: true,
  },

  // 3. Navigation
  {
    id: 'nav.nextScene',
    name: 'Next Scene',
    category: 'Navigation',
    description: 'Advance to the subsequent scene in the manuscript sequence',
    defaultKey: 'Alt+Down',
    allowInInput: true,
  },
  {
    id: 'nav.prevScene',
    name: 'Previous Scene',
    category: 'Navigation',
    description: 'Return to the previous scene in the manuscript sequence',
    defaultKey: 'Alt+Up',
    allowInInput: true,
  },
  {
    id: 'nav.nextChapter',
    name: 'Next Chapter',
    category: 'Navigation',
    description: 'Jump to the first scene of the next chapter',
    defaultKey: 'Alt+Shift+Down',
    allowInInput: true,
  },
  {
    id: 'nav.prevChapter',
    name: 'Previous Chapter',
    category: 'Navigation',
    description: 'Jump to the first scene of the previous chapter',
    defaultKey: 'Alt+Shift+Up',
    allowInInput: true,
  },
  {
    id: 'nav.focusEditor',
    name: 'Focus Manuscript Editor',
    category: 'Navigation',
    description: 'Immediately return keyboard focus to the main text editor',
    defaultKey: 'Ctrl+Shift+E',
    allowInInput: true,
  },
  {
    id: 'nav.focusTitle',
    name: 'Rename / Focus Scene Title',
    category: 'Navigation',
    description: 'Jump to and highlight the active scene title input',
    defaultKey: 'Ctrl+Shift+R',
    allowInInput: true,
  },

  // 4. Authoring & Project
  {
    id: 'scene.new',
    name: 'New Scene',
    category: 'Authoring',
    description: 'Append a new scene to the active chapter',
    defaultKey: 'Ctrl+Shift+N',
    allowInInput: true,
  },
  {
    id: 'chapter.new',
    name: 'New Chapter',
    category: 'Authoring',
    description: 'Append a new chapter to the active part',
    defaultKey: 'Ctrl+Alt+N',
    allowInInput: true,
  },
  {
    id: 'scene.cycleStatus',
    name: 'Cycle Scene Status',
    category: 'Authoring',
    description: 'Cycle status between Idea, Draft, Revised, and Final',
    defaultKey: 'Ctrl+Alt+S',
    allowInInput: true,
  },
  {
    id: 'project.save',
    name: 'Save Manuscript',
    category: 'Authoring',
    description: 'Save current manuscript state to storage or file',
    defaultKey: 'Ctrl+S',
    allowInInput: true,
  },
  {
    id: 'project.open',
    name: 'Open Project File...',
    category: 'Authoring',
    description: 'Load an existing .mriter manuscript from disk',
    defaultKey: 'Ctrl+O',
    allowInInput: true,
  },
  {
    id: 'project.new',
    name: 'New Manuscript...',
    category: 'Authoring',
    description: 'Start a new novel manuscript project',
    defaultKey: 'Ctrl+Alt+M',
    allowInInput: true,
  },

  // 5. Writing & Formatting
  {
    id: 'format.sceneBreak',
    name: 'Insert Scene Break Divider',
    category: 'Writing & Formatting',
    description: 'Insert standard fiction beat separator (✦ ✦ ✦)',
    defaultKey: 'Ctrl+Enter',
    allowInInput: true,
  },
  {
    id: 'format.bold',
    name: 'Bold Formatting',
    category: 'Writing & Formatting',
    description: 'Toggle bold formatting on selected text',
    defaultKey: 'Ctrl+B',
    allowInInput: true,
  },
  {
    id: 'format.italic',
    name: 'Italic Formatting',
    category: 'Writing & Formatting',
    description: 'Toggle italic formatting on selected text',
    defaultKey: 'Ctrl+I',
    allowInInput: true,
  },
  {
    id: 'format.heading1',
    name: 'Heading 1',
    category: 'Writing & Formatting',
    description: 'Format current line as Heading 1',
    defaultKey: 'Ctrl+Alt+1',
    allowInInput: true,
  },
  {
    id: 'format.heading2',
    name: 'Heading 2',
    category: 'Writing & Formatting',
    description: 'Format current line as Heading 2',
    defaultKey: 'Ctrl+Alt+2',
    allowInInput: true,
  },
  {
    id: 'format.blockquote',
    name: 'Blockquote',
    category: 'Writing & Formatting',
    description: 'Format current line as blockquote quote or excerpt',
    defaultKey: 'Ctrl+Shift+.',
    allowInInput: true,
  },

  // 6. System & Keymap (IntelliJ style)
  {
    id: 'system.findAction',
    name: 'Find Action / Commands...',
    category: 'System',
    description: 'IntelliJ-style action search and instant command runner',
    defaultKey: 'Ctrl+Shift+A',
    aliases: ['Ctrl+K'],
    allowInInput: true,
  },
  {
    id: 'system.openKeymap',
    name: 'Configure Keyboard Shortcuts...',
    category: 'System',
    description: 'Open Keymap dialog to inspect, search, and rebind shortcuts',
    defaultKey: 'Ctrl+Alt+K',
    aliases: ['Ctrl+,'],
    allowInInput: true,
  },
]

/**
 * Normalizes a keyboard event into a standardized combo string (e.g. "Ctrl+Shift+A")
 */
export function normalizeKeyEvent(e: KeyboardEvent): string | null {
  // Ignore standalone modifier presses
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null
  }

  const parts: string[] = []

  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  // Normalize key name using e.code when available for consistent letter/digit resolution
  let key = e.key
  if (e.code && /^Key[A-Z]$/i.test(e.code)) {
    key = e.code.replace(/^Key/i, '').toUpperCase()
  } else if (e.code && /^Digit\d$/i.test(e.code)) {
    key = e.code.replace(/^Digit/i, '')
  } else if (key === ' ') key = 'Space'
  else if (key === 'ArrowDown') key = 'Down'
  else if (key === 'ArrowUp') key = 'Up'
  else if (key === 'ArrowLeft') key = 'Left'
  else if (key === 'ArrowRight') key = 'Right'
  else if (key === 'Escape') key = 'Escape'
  else if (key === 'Enter') key = 'Enter'
  else if (key === 'Tab') key = 'Tab'
  else if (key === 'Backspace') key = 'Backspace'
  else if (key === 'Delete') key = 'Delete'
  else if (key.length === 1) {
    key = key.toUpperCase()
  }

  // If no modifier is pressed and it is a simple letter, check if it's a function key or Escape
  const isFunctionKey = /^F\d{1,2}$/i.test(key)
  const isEscape = key === 'Escape'

  if (parts.length === 0 && !isFunctionKey && !isEscape) {
    // Single non-modifier key (like typing 'a' or '1')
    return key
  }

  parts.push(key)
  return parts.join('+')
}

/**
 * Detects whether the current execution platform is macOS
 */
export function isMacOS(): boolean {
  if (typeof window !== 'undefined' && window.electronAPI?.platform) {
    return window.electronAPI.platform === 'darwin'
  }
  if (typeof navigator !== 'undefined') {
    return /Mac|iPhone|iPad|iPod/i.test(
      navigator.userAgent || (navigator as any).userAgentData?.platform || (navigator as any).platform || ''
    )
  }
  return false
}

/**
 * Formats a combo string for display with platform adaptation (macOS vs Windows)
 */
export function formatKeyDisplay(combo: string | null | undefined): string {
  if (!combo) return 'None'
  const isMac = isMacOS()

  if (isMac) {
    return combo
      .replace(/Ctrl/g, '⌘')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Enter/g, '↵')
      .replace(/Escape/g, '⎋')
      .replace(/Backspace/g, '⌫')
      .replace(/Delete/g, '⌦')
      .replace(/Down/g, '↓')
      .replace(/Up/g, '↑')
      .replace(/Left/g, '←')
      .replace(/Right/g, '→')
      .replace(/\+/g, '')
  }

  return combo
    .replace(/Down/g, '↓')
    .replace(/Up/g, '↑')
    .replace(/Left/g, '←')
    .replace(/Right/g, '→')
    .replace(/\+/g, ' + ')
}
