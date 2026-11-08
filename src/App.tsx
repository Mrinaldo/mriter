import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ManuscriptProvider, useManuscript, EditorTheme } from './context/ManuscriptContext'
import { KeymapProvider, useKeymap } from './context/KeymapContext'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { ZenEditor } from './components/ZenEditor'
import { SceneInspector } from './components/SceneInspector'
import { CharacterWorldBible } from './components/CharacterWorldBible'
import { OutlinerMatrix } from './components/OutlinerMatrix'
import { PublishStudio } from './components/PublishStudio'
import { ProjectLibraryModal } from './components/ProjectLibraryModal'
import { ActionPaletteModal } from './components/ActionPaletteModal'
import { KeymapSettingsModal } from './components/KeymapSettingsModal'
import { SceneStatus } from './types/manuscript'
import { ChevronRight, PanelLeftOpen, Search } from 'lucide-react'

const MainLayout: React.FC = () => {
  const {
    project,
    activeView,
    setActiveView,
    focusMode,
    setFocusMode,
    saveProjectFile,
    openProjectFile,
    newProject,
    isLibraryOpen,
    setIsLibraryOpen,
    editorTheme,
    setEditorTheme,
    typewriterMode,
    setTypewriterMode,
    activeSceneId,
    setActiveSceneId,
    setActiveSectionId,
    currentScene,
    currentChapter,
    currentPart,
    addScene,
    addChapter,
    updateSceneMetadata,
  } = useManuscript()

  const { registerActionHandler } = useKeymap()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)

  // Resizable / Extendable panel widths persisted to localStorage
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('mriter_sidebar_width')
    return saved ? Math.max(180, Math.min(500, parseInt(saved, 10))) : 240
  })

  const [inspectorWidth, setInspectorWidth] = useState<number>(() => {
    const saved = localStorage.getItem('mriter_inspector_width')
    return saved ? Math.max(200, Math.min(520, parseInt(saved, 10))) : 272
  })

  const handleSidebarWidthChange = (w: number) => {
    setSidebarWidth(w)
    localStorage.setItem('mriter_sidebar_width', w.toString())
  }

  const handleInspectorWidthChange = (w: number) => {
    setInspectorWidth(w)
    localStorage.setItem('mriter_inspector_width', w.toString())
  }

  // Flattened list of all scenes for sequential next/previous traversal
  const allScenes = useMemo(() => {
    const list: { sceneId: string; chapterId: string; partId: string }[] = []
    project.parts.forEach((p) => {
      p.chapters.forEach((c) => {
        c.scenes.forEach((s) => {
          list.push({ sceneId: s.id, chapterId: c.id, partId: p.id })
        })
      })
    })
    return list
  }, [project])

  // Flattened list of all chapters
  const allChapters = useMemo(() => {
    const list: { partId: string; chapterId: string; firstSceneId?: string }[] = []
    project.parts.forEach((p) => {
      p.chapters.forEach((c) => {
        list.push({
          partId: p.id,
          chapterId: c.id,
          firstSceneId: c.scenes[0]?.id,
        })
      })
    })
    return list
  }, [project])

  // Sequential Scene Navigation
  const goToNextScene = useCallback(() => {
    if (allScenes.length === 0) return
    const idx = allScenes.findIndex((s) => s.sceneId === activeSceneId)
    if (idx >= 0 && idx < allScenes.length - 1) {
      setActiveSceneId(allScenes[idx + 1].sceneId)
      setActiveSectionId(null)
      setActiveView('editor')
    }
  }, [allScenes, activeSceneId, setActiveSceneId, setActiveSectionId, setActiveView])

  const goToPrevScene = useCallback(() => {
    if (allScenes.length === 0) return
    const idx = allScenes.findIndex((s) => s.sceneId === activeSceneId)
    if (idx > 0) {
      setActiveSceneId(allScenes[idx - 1].sceneId)
      setActiveSectionId(null)
      setActiveView('editor')
    }
  }, [allScenes, activeSceneId, setActiveSceneId, setActiveSectionId, setActiveView])

  // Chapter Navigation
  const goToNextChapter = useCallback(() => {
    if (allChapters.length === 0) return
    const currentChapIdx = allChapters.findIndex(
      (c) => c.chapterId === currentChapter?.id
    )
    if (currentChapIdx >= 0 && currentChapIdx < allChapters.length - 1) {
      const nextChap = allChapters[currentChapIdx + 1]
      if (nextChap.firstSceneId) {
        setActiveSceneId(nextChap.firstSceneId)
        setActiveSectionId(null)
        setActiveView('editor')
      }
    }
  }, [allChapters, currentChapter, setActiveSceneId, setActiveSectionId, setActiveView])

  const goToPrevChapter = useCallback(() => {
    if (allChapters.length === 0) return
    const currentChapIdx = allChapters.findIndex(
      (c) => c.chapterId === currentChapter?.id
    )
    if (currentChapIdx > 0) {
      const prevChap = allChapters[currentChapIdx - 1]
      if (prevChap.firstSceneId) {
        setActiveSceneId(prevChap.firstSceneId)
        setActiveSectionId(null)
        setActiveView('editor')
      }
    }
  }, [allChapters, currentChapter, setActiveSceneId, setActiveSectionId, setActiveView])

  // Cycle Theme Helper
  const cycleTheme = useCallback(() => {
    const themes: EditorTheme[] = ['paper', 'sepia', 'sage', 'dark']
    const currentIndex = themes.indexOf(editorTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    setEditorTheme(themes[nextIndex])
  }, [editorTheme, setEditorTheme])

  // Cycle Scene Status Helper
  const cycleSceneStatus = useCallback(() => {
    if (!activeSceneId || !currentScene) return
    const statuses: SceneStatus[] = ['idea', 'draft', 'revised', 'final']
    const curIdx = statuses.indexOf(currentScene.status)
    const nextIdx = (curIdx + 1) % statuses.length
    updateSceneMetadata(activeSceneId, { status: statuses[nextIdx] })
  }, [activeSceneId, currentScene, updateSceneMetadata])

  // Register All Keymap Action Handlers
  useEffect(() => {
    const unsubs: (() => void)[] = []

    // 1. Workspaces
    unsubs.push(registerActionHandler('view.write', () => setActiveView('editor')))
    unsubs.push(registerActionHandler('view.outline', () => setActiveView('outline')))
    unsubs.push(registerActionHandler('view.bible', () => setActiveView('bible')))
    unsubs.push(registerActionHandler('view.publish', () => setActiveView('publish')))
    unsubs.push(registerActionHandler('view.library', () => setIsLibraryOpen(true)))

    // 2. Layout & Focus
    unsubs.push(registerActionHandler('layout.toggleZen', () => setFocusMode(!focusMode)))
    unsubs.push(registerActionHandler('layout.toggleSidebar', () => setIsSidebarOpen((prev) => !prev)))
    unsubs.push(registerActionHandler('layout.toggleInspector', () => setIsInspectorOpen((prev) => !prev)))
    unsubs.push(registerActionHandler('layout.toggleTypewriter', () => setTypewriterMode(!typewriterMode)))
    unsubs.push(registerActionHandler('layout.cycleTheme', cycleTheme))

    // 3. Navigation
    unsubs.push(registerActionHandler('nav.nextScene', goToNextScene))
    unsubs.push(registerActionHandler('nav.prevScene', goToPrevScene))
    unsubs.push(registerActionHandler('nav.nextChapter', goToNextChapter))
    unsubs.push(registerActionHandler('nav.prevChapter', goToPrevChapter))
    unsubs.push(
      registerActionHandler('nav.focusEditor', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'focus' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('nav.focusTitle', () => {
        const titleInput = document.querySelector(
          'input[placeholder="Untitled Scene..."]'
        ) as HTMLInputElement
        if (titleInput) {
          titleInput.focus()
          titleInput.select()
        }
      })
    )

    // 4. Authoring & Project
    unsubs.push(
      registerActionHandler('scene.new', () => {
        const targetChap = currentChapter?.id || project.parts[0]?.chapters[0]?.id
        if (targetChap) {
          addScene(targetChap)
          setActiveView('editor')
        }
      })
    )
    unsubs.push(
      registerActionHandler('chapter.new', () => {
        const targetPart = currentPart?.id || project.parts[0]?.id
        if (targetPart) {
          addChapter(targetPart)
          setActiveView('editor')
        }
      })
    )
    unsubs.push(registerActionHandler('scene.cycleStatus', cycleSceneStatus))
    unsubs.push(registerActionHandler('project.save', () => saveProjectFile()))
    unsubs.push(registerActionHandler('project.open', () => openProjectFile()))
    unsubs.push(registerActionHandler('project.new', () => newProject()))

    // 5. In-Editor Formatting
    unsubs.push(
      registerActionHandler('format.sceneBreak', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'sceneBreak' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('format.bold', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'bold' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('format.italic', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'italic' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('format.heading1', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'heading1' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('format.heading2', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'heading2' } })
        )
      })
    )
    unsubs.push(
      registerActionHandler('format.blockquote', () => {
        window.dispatchEvent(
          new CustomEvent('mriter-editor-command', { detail: { command: 'blockquote' } })
        )
      })
    )

    return () => {
      unsubs.forEach((unsub) => unsub())
    }
  }, [
    registerActionHandler,
    setActiveView,
    focusMode,
    setFocusMode,
    typewriterMode,
    setTypewriterMode,
    cycleTheme,
    goToNextScene,
    goToPrevScene,
    goToNextChapter,
    goToPrevChapter,
    currentChapter,
    currentPart,
    project,
    addScene,
    addChapter,
    cycleSceneStatus,
    saveProjectFile,
    openProjectFile,
    newProject,
    setIsLibraryOpen,
  ])

  // Escape key to exit Zen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [focusMode, setFocusMode])

  return (
    <div
      data-theme={editorTheme}
      className="flex flex-col h-screen w-screen overflow-hidden bg-app text-main font-sans transition-colors duration-150"
    >
      {/* Title bar is hidden in full focus mode for zero distraction */}
      {!focusMode && <TitleBar />}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeView === 'editor' && (
          <>
            {!focusMode && isSidebarOpen && (
              <Sidebar
                onClose={() => setIsSidebarOpen(false)}
                width={sidebarWidth}
                onWidthChange={handleSidebarWidthChange}
              />
            )}

            {/* Collapsed Sidebar Rail */}
            {!focusMode && !isSidebarOpen && (
              <div className="w-8 bg-panel border-r border-subtle flex flex-col items-center py-2.5 text-muted-theme shrink-0 select-none transition-colors">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-md hover:text-main hover:bg-surface transition-colors cursor-pointer mb-2"
                  title="Expand Manuscript Panel (Ctrl+\)"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsSidebarOpen(true)
                    setTimeout(() => {
                      const input = document.querySelector('input[placeholder="Search manuscript..."]') as HTMLInputElement
                      input?.focus()
                    }, 80)
                  }}
                  className="p-1.5 rounded-md hover:text-main hover:bg-surface transition-colors cursor-pointer mb-3"
                  title="Search Manuscript (Ctrl+F)"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[9px] uppercase font-medium tracking-widest text-faint [writing-mode:vertical-lr] rotate-180">
                    Manuscript
                  </span>
                </div>
              </div>
            )}

            <ZenEditor />

            {!focusMode && (
              <SceneInspector
                isOpen={isInspectorOpen}
                onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
                width={inspectorWidth}
                onWidthChange={handleInspectorWidthChange}
              />
            )}
          </>
        )}

        {activeView === 'outline' && <OutlinerMatrix />}

        {activeView === 'bible' && <CharacterWorldBible />}

        {activeView === 'publish' && <PublishStudio />}
      </div>

      {/* Project Switcher & Library Modal */}
      <ProjectLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Find Action Command Palette (IntelliJ Style: Ctrl+Shift+A) */}
      <ActionPaletteModal />

      {/* Keyboard Shortcuts Keymap Configuration Dialog (IntelliJ Style) */}
      <KeymapSettingsModal />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <ManuscriptProvider>
      <KeymapProvider>
        <MainLayout />
      </KeymapProvider>
    </ManuscriptProvider>
  )
}

export default App
