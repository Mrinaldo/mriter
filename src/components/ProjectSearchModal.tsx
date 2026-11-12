import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search,
  Replace,
  UserCheck,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'

interface SearchMatchItem {
  id: string
  sceneId: string
  chapterTitle: string
  sceneTitle: string
  matchIndex: number
  rawLength: number
  snippetBefore: string
  matchedWord: string
  snippetAfter: string
  field: 'content' | 'synopsis' | 'notes' | 'world'
}

export const ProjectSearchModal: React.FC = () => {
  const {
    project,
    isProjectSearchOpen,
    setIsProjectSearchOpen,
    projectSearchInitialQuery,
    setActiveSceneId,
    setActiveSectionId,
    setActiveView,
    batchReplaceAcrossManuscript,
    renameCharacterAcrossProject,
    currentChapter,
    activeSceneId,
    updateSceneMetadata,
  } = useManuscript()

  const [activeTab, setActiveTab] = useState<'search' | 'character'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(true)
  const [useRegex, setUseRegex] = useState(false)
  const [scope, setScope] = useState<'manuscript' | 'activeChapter' | 'activeScene' | 'synopses' | 'all'>('manuscript')

  // Selected matches set for selective replacement
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set())

  // Character rename tab state
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [renameFeedback, setRenameFeedback] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize query when modal opens
  useEffect(() => {
    if (isProjectSearchOpen) {
      if (projectSearchInitialQuery) {
        setSearchQuery(projectSearchInitialQuery)
      }
      setRenameFeedback(null)
      setTimeout(() => searchInputRef.current?.focus(), 60)
    }
  }, [isProjectSearchOpen, projectSearchInitialQuery])

  // Select initial character when character tab is opened
  useEffect(() => {
    if (project.characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(project.characters[0].id)
      setNewCharacterName(project.characters[0].name)
    }
  }, [project.characters, selectedCharacterId])

  const selectedCharacter = useMemo(() => {
    return project.characters.find((c) => c.id === selectedCharacterId) || null
  }, [project.characters, selectedCharacterId])

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '')

  // Scan project scenes for matches
  const searchResults = useMemo(() => {
    const term = activeTab === 'character' ? selectedCharacter?.name || '' : searchQuery
    if (!term || !term.trim()) return []

    let flags = 'g'
    if (!caseSensitive) flags += 'i'

    let pattern: string
    if (useRegex && activeTab !== 'character') {
      pattern = term
    } else {
      pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (wholeWord || activeTab === 'character') {
        pattern = `\\b${pattern}\\b`
      }
    }

    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch {
      return []
    }

    const matches: SearchMatchItem[] = []

    project.parts.forEach((part) => {
      part.chapters.forEach((chap) => {
        if (scope === 'activeChapter' && chap.id !== currentChapter?.id) return

        chap.scenes.forEach((scene) => {
          if (scope === 'activeScene' && scene.id !== activeSceneId) return

          // 1. Scene Prose
          if (scope !== 'synopses') {
            const plain = stripHtml(scene.content || '')
            let match: RegExpExecArray | null
            regex.lastIndex = 0

            let count = 0
            while ((match = regex.exec(plain)) !== null && count < 30) {
              count++
              const start = Math.max(0, match.index - 35)
              const end = Math.min(plain.length, match.index + match[0].length + 35)

              matches.push({
                id: `${scene.id}-content-${match.index}`,
                sceneId: scene.id,
                chapterTitle: chap.title || 'Untitled Chapter',
                sceneTitle: scene.title || 'Untitled Scene',
                matchIndex: match.index,
                rawLength: match[0].length,
                snippetBefore: plain.substring(start, match.index),
                matchedWord: match[0],
                snippetAfter: plain.substring(match.index + match[0].length, end),
                field: 'content',
              })
            }
          }

          // 2. Synopses & Notes
          if (scope === 'synopses' || scope === 'all') {
            if (scene.synopsis) {
              let match: RegExpExecArray | null
              regex.lastIndex = 0
              while ((match = regex.exec(scene.synopsis)) !== null) {
                const start = Math.max(0, match.index - 30)
                const end = Math.min(scene.synopsis.length, match.index + match[0].length + 30)
                matches.push({
                  id: `${scene.id}-synopsis-${match.index}`,
                  sceneId: scene.id,
                  chapterTitle: chap.title || 'Untitled Chapter',
                  sceneTitle: `${scene.title} (Synopsis)`,
                  matchIndex: match.index,
                  rawLength: match[0].length,
                  snippetBefore: scene.synopsis.substring(start, match.index),
                  matchedWord: match[0],
                  snippetAfter: scene.synopsis.substring(match.index + match[0].length, end),
                  field: 'synopsis',
                })
              }
            }
          }
        })
      })
    })

    return matches
  }, [
    activeTab,
    selectedCharacter,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    project.parts,
    scope,
    currentChapter?.id,
    activeSceneId,
  ])

  // Select all matches by default when results change
  useEffect(() => {
    setSelectedMatchIds(new Set(searchResults.map((m) => m.id)))
  }, [searchResults])

  // Group matches by scene
  const groupedResults = useMemo(() => {
    const map = new Map<string, { chapterTitle: string; sceneTitle: string; matches: SearchMatchItem[] }>()
    searchResults.forEach((m) => {
      if (!map.has(m.sceneId)) {
        map.set(m.sceneId, {
          chapterTitle: m.chapterTitle,
          sceneTitle: m.sceneTitle,
          matches: [],
        })
      }
      map.get(m.sceneId)!.matches.push(m)
    })
    return Array.from(map.entries())
  }, [searchResults])

  if (!isProjectSearchOpen) return null

  const handleJumpToScene = (sceneId: string) => {
    setActiveSceneId(sceneId)
    setActiveSectionId(null)
    setActiveView('editor')
    setIsProjectSearchOpen(false)
  }

  // Toggle single match selection
  const toggleMatchSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedMatchIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle all matches
  const toggleSelectAll = () => {
    if (selectedMatchIds.size === searchResults.length) {
      setSelectedMatchIds(new Set())
    } else {
      setSelectedMatchIds(new Set(searchResults.map((m) => m.id)))
    }
  }

  // Execute Replace on Selected Matches
  const handleBatchReplace = () => {
    if (!searchQuery.trim()) return

    // If all matches in scope are selected, run the fast batch replacer
    if (selectedMatchIds.size === searchResults.length) {
      const res = batchReplaceAcrossManuscript({
        searchTerm: searchQuery,
        replaceTerm: replaceQuery,
        caseSensitive,
        wholeWord,
        scope: scope === 'all' || scope === 'synopses' ? 'manuscript' : scope,
      })
      setRenameFeedback(`Replaced ${res.replacedOccurrences} occurrences across ${res.affectedScenes} scenes.`)
      return
    }

    // Replace selected occurrences scene by scene
    let replacedCount = 0
    groupedResults.forEach(([sceneId, group]) => {
      const checkedInScene = group.matches.filter((m) => selectedMatchIds.has(m.id))
      if (checkedInScene.length === 0) return

      // Find scene in project
      for (const part of project.parts) {
        for (const chap of part.chapters) {
          const sc = chap.scenes.find((s) => s.id === sceneId)
          if (sc) {
            let content = sc.content
            // Sort matches descending by index so offsets remain valid
            const sorted = [...checkedInScene].sort((a, b) => b.matchIndex - a.matchIndex)
            sorted.forEach((m) => {
              // Replace in raw text
              const escaped = m.matchedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const reg = new RegExp(escaped, caseSensitive ? '' : 'i')
              content = content.replace(reg, replaceQuery)
              replacedCount++
            })
            updateSceneMetadata(sceneId, { content })
          }
        }
      }
    })

    setRenameFeedback(`Replaced ${replacedCount} selected occurrences.`)
  }

  // Execute Character Rename
  const handleCharacterRename = () => {
    if (!selectedCharacterId || !newCharacterName.trim()) return
    const res = renameCharacterAcrossProject(selectedCharacterId, newCharacterName.trim())
    setRenameFeedback(
      `Renamed character to "${newCharacterName.trim()}" and updated ${res.replacedCount} occurrences in manuscript.`
    )
  }

  const effectiveReplacement = activeTab === 'character' ? newCharacterName : replaceQuery

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-surface border border-subtle rounded-xl shadow-2xl flex flex-col max-h-[88vh] text-main overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Switcher */}
        <div className="px-5 py-3 border-b border-subtle bg-panel flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex bg-surface p-0.5 rounded-lg border border-subtle text-xs">
              <button
                onClick={() => {
                  setActiveTab('search')
                  setRenameFeedback(null)
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find & Replace</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('character')
                  setRenameFeedback(null)
                  if (project.characters.length > 0) {
                    const c = project.characters.find((ch) => ch.id === selectedCharacterId) || project.characters[0]
                    setSelectedCharacterId(c.id)
                    setNewCharacterName(c.name)
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'character'
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Rename Character</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsProjectSearchOpen(false)}
            className="p-1 rounded-md text-muted-theme hover:text-main hover:bg-surface transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert if Action Executed */}
        {renameFeedback && (
          <div className="px-5 py-2.5 bg-accent-soft border-b border-subtle text-xs text-main flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span>{renameFeedback}</span>
            </div>
            <button
              onClick={() => setRenameFeedback(null)}
              className="text-muted-theme hover:text-main text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Standard Find & Replace */}
        {activeTab === 'search' && (
          <div className="p-4 sm:p-5 border-b border-subtle bg-surface space-y-3">
            {/* Search Input Row */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-muted-theme absolute left-3 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find text across manuscript..."
                  className="w-full bg-panel text-main text-xs pl-8 pr-3 py-2 rounded-lg border border-subtle focus:border-accent outline-none placeholder:text-faint"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  title="Match Case (Aa)"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    caseSensitive
                      ? 'bg-accent-soft text-accent border-accent font-semibold'
                      : 'border-subtle text-muted-theme hover:text-main bg-panel'
                  }`}
                >
                  Aa
                </button>
                <button
                  onClick={() => setWholeWord(!wholeWord)}
                  title="Whole Word Only (\b)"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    wholeWord
                      ? 'bg-accent-soft text-accent border-accent font-semibold'
                      : 'border-subtle text-muted-theme hover:text-main bg-panel'
                  }`}
                >
                  \b
                </button>
                <button
                  onClick={() => setUseRegex(!useRegex)}
                  title="Regular Expression (.*)"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    useRegex
                      ? 'bg-accent-soft text-accent border-accent font-semibold'
                      : 'border-subtle text-muted-theme hover:text-main bg-panel'
                  }`}
                >
                  .*
                </button>
              </div>
            </div>

            {/* Replace Input Row */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Replace className="w-3.5 h-3.5 text-muted-theme absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full bg-panel text-main text-xs pl-8 pr-3 py-2 rounded-lg border border-subtle focus:border-accent outline-none placeholder:text-faint"
                />
              </div>

              {/* Scope Selector */}
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="bg-panel text-main text-xs px-2.5 py-2 rounded-lg border border-subtle outline-none cursor-pointer"
              >
                <option value="manuscript">All Scenes</option>
                <option value="activeChapter">Current Chapter</option>
                <option value="activeScene">Current Scene</option>
                <option value="synopses">Synopses & Notes</option>
                <option value="all">Entire Project</option>
              </select>

              {/* Replace Button */}
              <button
                onClick={handleBatchReplace}
                disabled={!searchQuery.trim() || selectedMatchIds.size === 0}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-accent text-on-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              >
                Replace ({selectedMatchIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Smart Character Rename */}
        {activeTab === 'character' && (
          <div className="p-4 sm:p-5 border-b border-subtle bg-surface space-y-3">
            <div className="flex items-center space-x-2">
              {/* Select Character */}
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                  Select Story Character
                </label>
                <select
                  value={selectedCharacterId}
                  onChange={(e) => {
                    setSelectedCharacterId(e.target.value)
                    const ch = project.characters.find((c) => c.id === e.target.value)
                    if (ch) setNewCharacterName(ch.name)
                  }}
                  className="w-full bg-panel text-main text-xs px-3 py-2 rounded-lg border border-subtle outline-none cursor-pointer"
                >
                  {project.characters.length === 0 && <option value="">No characters in Story Bible</option>}
                  {project.characters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* New Name Input */}
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-muted-theme mb-1">
                  New Character Name
                </label>
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="Enter new name..."
                  className="w-full bg-panel text-main text-xs px-3 py-2 rounded-lg border border-subtle focus:border-accent outline-none placeholder:text-faint"
                />
              </div>

              {/* Execute Rename CTA */}
              <div className="shrink-0 self-end">
                <button
                  onClick={handleCharacterRename}
                  disabled={!selectedCharacterId || !newCharacterName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-accent text-on-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Rename Everywhere
                </button>
              </div>
            </div>

            <p className="text-[11px] text-muted-theme">
              Safely updates the character profile in Story Bible and renames every whole-word occurrence across all scenes.
            </p>
          </div>
        )}

        {/* Action Toolbar: Match Counter & Select/Deselect All */}
        {searchResults.length > 0 && (
          <div className="px-5 py-2 bg-panel border-b border-subtle flex items-center justify-between text-xs text-muted-theme">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-1.5 text-xs text-muted-theme hover:text-main cursor-pointer"
              >
                {selectedMatchIds.size === searchResults.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-faint" />
                )}
                <span>
                  {selectedMatchIds.size === searchResults.length ? 'Deselect All' : 'Select All'} ({selectedMatchIds.size}/{searchResults.length})
                </span>
              </button>
            </div>

            {effectiveReplacement && (
              <span className="text-[10px] text-faint font-mono">
                Previewing: &quot;{searchQuery || selectedCharacter?.name}&quot; → &quot;{effectiveReplacement}&quot;
              </span>
            )}
          </div>
        )}

        {/* Search Results Summary & Results List with Interactive Diff Previews */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {groupedResults.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-theme">
              <Search className="w-8 h-8 text-faint mb-2" />
              <p className="text-xs">Type a search query above to inspect occurrences across your manuscript.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedResults.map(([sceneId, group]) => (
                <div key={sceneId} className="border border-subtle rounded-lg bg-panel/40 overflow-hidden">
                  {/* Scene Header */}
                  <div className="px-3.5 py-2 bg-panel border-b border-subtle flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-xs font-medium text-main truncate">{group.sceneTitle}</span>
                      <span className="text-[10px] text-faint truncate">({group.chapterTitle})</span>
                    </div>
                    <button
                      onClick={() => handleJumpToScene(sceneId)}
                      className="text-[10px] text-accent hover:underline shrink-0 cursor-pointer"
                    >
                      Open Scene →
                    </button>
                  </div>

                  {/* Occurrences in this scene with Checkbox & Diff Preview */}
                  <div className="divide-y divide-subtle/50">
                    {group.matches.map((m) => {
                      const isChecked = selectedMatchIds.has(m.id)

                      return (
                        <div
                          key={m.id}
                          onClick={(e) => toggleMatchSelection(m.id, e)}
                          className={`w-full text-left px-3.5 py-2 hover:bg-surface text-xs font-serif leading-relaxed transition-colors cursor-pointer flex items-center space-x-2.5 ${
                            isChecked ? 'bg-surface/50' : 'opacity-60'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => toggleMatchSelection(m.id, e)}
                            className="p-0.5 text-muted-theme hover:text-main cursor-pointer shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-faint" />
                            )}
                          </button>

                          <div className="truncate flex-1 pr-2">
                            <span className="text-muted-theme opacity-80">...{m.snippetBefore}</span>
                            <span className="font-semibold text-main bg-accent-soft px-1 rounded mx-0.5 border-b border-accent">
                              {m.matchedWord}
                            </span>
                            <span className="text-muted-theme opacity-80">{m.snippetAfter}...</span>

                            {/* Diff preview when replacement text is present */}
                            {effectiveReplacement && (
                              <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-accent font-sans">
                                <ArrowRight className="w-3 h-3 text-faint" />
                                <span className="opacity-75">Becomes:</span>
                                <span className="font-serif italic font-medium bg-panel px-1.5 py-0.5 rounded border border-subtle">
                                  ...{m.snippetBefore}
                                  <strong className="text-accent underline font-semibold">{effectiveReplacement}</strong>
                                  {m.snippetAfter}...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
