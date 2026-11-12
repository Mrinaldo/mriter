import React, { useState, useMemo } from 'react'
import {
  Camera,
  History,
  RotateCcw,
  Trash2,
  X,
  Copy,
  Check,
  ArrowRight,
  GitCompare,
  FileText,
  Clock,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { SceneSnapshot } from '../types/manuscript'
import { computeWordDiff } from '../utils/diffHelper'

export const SceneSnapshotModal: React.FC = () => {
  const {
    project,
    snapshotActiveSceneId,
    isSnapshotModalOpen,
    setIsSnapshotModalOpen,
    takeSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  } = useManuscript()

  const [newSnapshotLabel, setNewSnapshotLabel] = useState('')
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'diff' | 'snapshot' | 'current'>('diff')
  const [copied, setCopied] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // Find the target scene
  const targetScene = useMemo(() => {
    if (!snapshotActiveSceneId) return null
    for (const p of project.parts) {
      for (const c of p.chapters) {
        for (const s of c.scenes) {
          if (s.id === snapshotActiveSceneId) return s
        }
      }
    }
    return null
  }, [project, snapshotActiveSceneId])

  const snapshots: SceneSnapshot[] = targetScene?.snapshots || []

  // Default selected snapshot to the latest one
  const selectedSnapshot = useMemo(() => {
    if (selectedSnapshotId) {
      return snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0] || null
    }
    return snapshots[0] || null
  }, [snapshots, selectedSnapshotId])

  const stripHtml = (html: string) => {
    return html
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }

  const currentScenePlainText = useMemo(() => {
    if (!targetScene) return ''
    return targetScene.plainText || stripHtml(targetScene.content || '')
  }, [targetScene])

  const snapshotPlainText = useMemo(() => {
    if (!selectedSnapshot) return ''
    return selectedSnapshot.plainText || stripHtml(selectedSnapshot.content || '')
  }, [selectedSnapshot])

  // Word-level diff computation
  const diffChunks = useMemo(() => {
    if (!selectedSnapshot || !targetScene) return []
    // Compare historical snapshot -> current scene
    return computeWordDiff(snapshotPlainText, currentScenePlainText)
  }, [snapshotPlainText, currentScenePlainText, selectedSnapshot, targetScene])

  const diffStats = useMemo(() => {
    let addedWords = 0
    let removedWords = 0
    diffChunks.forEach((c) => {
      const words = c.text.trim().split(/\s+/).filter(Boolean).length
      if (c.type === 'added') addedWords += words
      if (c.type === 'removed') removedWords += words
    })
    return { addedWords, removedWords }
  }, [diffChunks])

  if (!isSnapshotModalOpen || !targetScene) return null

  const handleTakeSnapshot = () => {
    if (!targetScene) return
    const created = takeSnapshot(targetScene.id, newSnapshotLabel)
    if (created) {
      setSelectedSnapshotId(created.id)
      setNewSnapshotLabel('')
      setSuccessNotice(`Snapshot "${created.label || 'Revision'}" recorded!`)
      setTimeout(() => setSuccessNotice(null), 3000)
    }
  }

  const handleRestore = (snap: SceneSnapshot) => {
    if (
      confirm(
        `Restore this snapshot from ${new Date(snap.createdAt).toLocaleDateString()}?\n\nMriter will automatically create a safety backup snapshot of your current text before restoring.`
      )
    ) {
      restoreSnapshot(targetScene.id, snap.id)
      setSuccessNotice('Snapshot restored! A safety backup was saved.')
      setTimeout(() => setSuccessNotice(null), 3000)
    }
  }

  const handleCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-panel border border-subtle w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-main">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-subtle flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center text-accent">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-bold text-sm text-main">Scene Snapshots & Revisions</h2>
                <span className="text-xs text-faint">•</span>
                <span className="text-xs text-muted-theme font-medium truncate max-w-sm">
                  {targetScene.title}
                </span>
              </div>
              <p className="text-[11px] text-muted-theme">
                Capture point-in-time versions, compare visual diffs, and safely restore past prose.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSnapshotModalOpen(false)}
            className="p-1.5 rounded-lg text-muted-theme hover:text-main hover:bg-panel transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
            <span>{successNotice}</span>
            <button onClick={() => setSuccessNotice(null)} className="hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Snapshot Timeline & Capture */}
          <div className="w-80 border-r border-subtle flex flex-col bg-panel">
            {/* Take Snapshot Form */}
            <div className="p-4 border-b border-subtle space-y-2.5 bg-surface">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-faint block">
                Capture New Snapshot
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTakeSnapshot()
                  }}
                  placeholder="Optional label (e.g. 'Before rewrite')..."
                  className="flex-1 bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none placeholder:text-faint"
                />
                <button
                  onClick={handleTakeSnapshot}
                  className="flex items-center space-x-1.5 bg-accent text-on-accent px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
                  title="Record point-in-time snapshot"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap</span>
                </button>
              </div>
            </div>

            {/* Snapshots List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-faint tracking-wider">
                Revision History ({snapshots.length})
              </div>

              {snapshots.length === 0 ? (
                <div className="p-6 text-center text-muted-theme space-y-2">
                  <Clock className="w-8 h-8 text-faint mx-auto" />
                  <p className="text-xs">No snapshots recorded for this scene yet.</p>
                  <p className="text-[11px] text-faint">
                    Take snapshots before major revisions to safely experiment without fear of losing prose.
                  </p>
                </div>
              ) : (
                snapshots.map((snap) => {
                  const isSelected = selectedSnapshot?.id === snap.id
                  const date = new Date(snap.createdAt)

                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-accent-soft border-accent shadow-xs'
                          : 'bg-surface border-subtle hover:border-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-main truncate">
                          {snap.label || 'Revision Snapshot'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this snapshot permanently?')) {
                              deleteSnapshot(targetScene.id, snap.id)
                            }
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-theme">
                        <span>
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-mono text-[10px] bg-panel px-1.5 py-0.5 rounded border border-subtle">
                          {snap.wordCount?.toLocaleString() || 0}w
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Diff Comparison & Viewer */}
          <div className="flex-1 flex flex-col bg-surface overflow-hidden">
            {selectedSnapshot ? (
              <>
                {/* Comparison Toolbar */}
                <div className="h-12 px-6 border-b border-subtle flex items-center justify-between bg-panel shrink-0">
                  <div className="flex items-center space-x-1 bg-surface p-0.5 rounded-lg border border-subtle text-xs">
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'diff'
                          ? 'bg-panel text-main font-semibold shadow-xs'
                          : 'text-muted-theme hover:text-main'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Visual Diff</span>
                    </button>
                    <button
                      onClick={() => setViewMode('snapshot')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'snapshot'
                          ? 'bg-panel text-main font-semibold shadow-xs'
                          : 'text-muted-theme hover:text-main'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Snapshot Prose</span>
                    </button>
                    <button
                      onClick={() => setViewMode('current')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'current'
                          ? 'bg-panel text-main font-semibold shadow-xs'
                          : 'text-muted-theme hover:text-main'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Current Prose</span>
                    </button>
                  </div>

                  {viewMode === 'diff' && (
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        +{diffStats.addedWords} words in current
                      </span>
                      <span className="text-red-700 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        -{diffStats.removedWords} words removed
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyText(snapshotPlainText)}
                      className="flex items-center space-x-1 text-xs text-muted-theme hover:text-main px-2.5 py-1 rounded bg-surface border border-subtle transition-colors cursor-pointer"
                      title="Copy snapshot prose to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleRestore(selectedSnapshot)}
                      className="flex items-center space-x-1 text-xs font-medium bg-accent-soft hover:bg-accent text-accent hover:text-white px-3 py-1 rounded border border-accent transition-colors cursor-pointer"
                      title="Restore this version (safe backup created automatically)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Snapshot</span>
                    </button>
                  </div>
                </div>

                {/* Content Reading Area */}
                <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-sm select-text">
                  <div className="max-w-2xl mx-auto space-y-4">
                    {viewMode === 'diff' ? (
                      <div className="whitespace-pre-wrap leading-relaxed text-main">
                        {diffChunks.map((chunk, index) => {
                          if (chunk.type === 'unchanged') {
                            return <span key={index}>{chunk.text}</span>
                          }
                          if (chunk.type === 'removed') {
                            return (
                              <mark
                                key={index}
                                className="bg-red-500/20 text-red-700 dark:text-red-300 line-through rounded-xs px-0.5 mx-0.5"
                                title="Removed in current draft"
                              >
                                {chunk.text}
                              </mark>
                            )
                          }
                          if (chunk.type === 'added') {
                            return (
                              <mark
                                key={index}
                                className="bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 rounded-xs px-0.5 mx-0.5 no-underline font-medium"
                                title="Added in current draft"
                              >
                                {chunk.text}
                              </mark>
                            )
                          }
                          return null
                        })}
                      </div>
                    ) : viewMode === 'snapshot' ? (
                      <div className="whitespace-pre-wrap text-main">{snapshotPlainText}</div>
                    ) : (
                      <div className="whitespace-pre-wrap text-main">{currentScenePlainText}</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-theme space-y-3">
                <History className="w-10 h-10 text-faint" />
                <p className="text-sm font-medium">No snapshot selected.</p>
                <p className="text-xs text-faint max-w-sm text-center">
                  Select a past revision from the list on the left, or capture a new snapshot of this scene's prose.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
