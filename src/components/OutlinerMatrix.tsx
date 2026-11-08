import React from 'react'
import { Plus, Layers } from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { SceneStatus } from '../types/manuscript'

export const OutlinerMatrix: React.FC = () => {
  const {
    project,
    setActiveSceneId,
    setActiveSectionId,
    setActiveView,
    addScene,
    addChapter,
  } = useManuscript()

  const getStatusBadge = (status: SceneStatus) => {
    switch (status) {
      case 'final':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--status-final)]/15 text-[var(--status-final)] border border-[var(--status-final)]/20">
            Final
          </span>
        )
      case 'revised':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--status-revised)]/15 text-[var(--status-revised)] border border-[var(--status-revised)]/20">
            Revised
          </span>
        )
      case 'draft':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--status-draft)]/15 text-[var(--status-draft)] border border-[var(--status-draft)]/20">
            Draft
          </span>
        )
      case 'idea':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--status-idea)]/15 text-[var(--status-idea)] border border-[var(--status-idea)]/20">
            Idea
          </span>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-app text-main overflow-y-auto p-8 select-none transition-colors duration-150">
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto mb-6 flex items-center justify-between border-b border-subtle pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-main">Manuscript Outliner</h2>
          <p className="text-xs text-muted-theme mt-0.5">
            Index card board of chapters, beats, synopses, and POV tracking.
          </p>
        </div>

        <button
          onClick={() => addChapter(project.parts[0]?.id || 'part-1')}
          className="flex items-center space-x-1.5 bg-panel hover:bg-surface border border-subtle text-main px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-muted-theme" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Outliner Matrix Grid */}
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {project.parts.map((part) => (
          <div key={part.id} className="space-y-3">
            {/* Part Banner */}
            <div className="flex items-center space-x-2 text-muted-theme text-xs font-medium uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-faint" />
              <span>{part.title}</span>
              {part.synopsis && (
                <span className="text-faint font-normal lowercase tracking-normal italic">
                  — {part.synopsis}
                </span>
              )}
            </div>

            {/* Chapters & Scenes Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {part.chapters.map((chapter, cIdx) => (
                <div
                  key={chapter.id}
                  className="bg-panel border border-subtle rounded-xl p-3.5 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-subtle">
                      <div>
                        <span className="text-[10px] font-mono text-faint uppercase font-medium">
                          Chapter {cIdx + 1}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-main truncate">
                          {chapter.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => addScene(chapter.id)}
                        className="p-1 text-muted-theme hover:text-main hover:bg-surface rounded transition-colors"
                        title="Add scene to this chapter"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Scene Cards Stack */}
                    <div className="space-y-2">
                      {chapter.scenes.map((scene) => {
                        const pov = project.characters.find((c) => c.id === scene.povCharacterId)

                        return (
                          <div
                            key={scene.id}
                            onClick={() => {
                              setActiveSceneId(scene.id)
                              setActiveSectionId(null)
                              setActiveView('editor')
                            }}
                            className="bg-surface hover:bg-surface/80 border border-subtle hover:border-muted-theme rounded-lg p-2.5 cursor-pointer transition-colors group shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-serif font-medium text-main group-hover:text-accent truncate">
                                {scene.title}
                              </span>
                              {getStatusBadge(scene.status)}
                            </div>

                            {/* Synopsis preview */}
                            <p className="text-[11px] text-muted-theme line-clamp-2 leading-relaxed mb-2 font-sans">
                              {scene.synopsis || (
                                <span className="italic text-faint">No synopsis written yet...</span>
                              )}
                            </p>

                            {/* Footer info: POV & Word count */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-subtle text-[10px]">
                              {pov ? (
                                <div className="flex items-center space-x-1.5 text-muted-theme">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: pov.color || 'var(--accent)' }}
                                  />
                                  <span>{pov.name}</span>
                                </div>
                              ) : (
                                <span className="text-faint">Omniscient</span>
                              )}

                              <span className="font-mono text-faint">
                                {scene.wordCount || 0}w
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
