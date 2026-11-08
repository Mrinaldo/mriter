import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  ManuscriptProject,
  SceneItem,
  ChapterItem,
  PartItem,
  FrontBackMatterItem,
  CharacterItem,
  WorldItem,
  ActiveView,
} from '../types/manuscript'
import { createDefaultProject } from '../utils/initialProject'
import { createSampleProject2 } from '../utils/sampleProject2'
import { SAMPLE_COVER_IMAGE } from '../utils/sampleCoverBase64'

export type EditorTheme = 'paper' | 'dark' | 'sepia' | 'sage'
export type EditorFont =
  | 'garamond'
  | 'charter'
  | 'courier'
  | 'palatino'
  | 'literata'
  | 'lora'
  | 'merriweather'
  | 'newsreader'
  | 'ia-mono'
  | 'inter'

export interface FontInfo {
  id: EditorFont
  name: string
  pedigree: string
  category: 'Serif' | 'Monospace' | 'Sans-Serif'
}

export const WORLD_CLASS_FONTS: FontInfo[] = [
  { id: 'garamond', name: 'EB Garamond', pedigree: 'Scrivener / Classic Literary Serif', category: 'Serif' },
  { id: 'charter', name: 'Charter', pedigree: 'Ulysses Default / Book Masterpiece', category: 'Serif' },
  { id: 'courier', name: 'Courier Prime', pedigree: 'Scrivener / Screenplay Standard', category: 'Monospace' },
  { id: 'palatino', name: 'Palatino', pedigree: 'Apple Books / Fine Publishing', category: 'Serif' },
  { id: 'literata', name: 'Literata', pedigree: 'Google Play Books Reading Serif', category: 'Serif' },
  { id: 'lora', name: 'Lora', pedigree: 'Contemporary Editorial Serif', category: 'Serif' },
  { id: 'merriweather', name: 'Merriweather', pedigree: 'Bookish High-Legibility Serif', category: 'Serif' },
  { id: 'newsreader', name: 'Newsreader', pedigree: 'Production Type Long-form Serif', category: 'Serif' },
  { id: 'ia-mono', name: 'IBM Plex Mono', pedigree: 'iA Writer Distraction-Free Mono', category: 'Monospace' },
  { id: 'inter', name: 'Inter Sans', pedigree: 'Bear / Modern Clean Editorial Sans', category: 'Sans-Serif' },
]

export const THEME_TITLEBAR_COLORS: Record<
  EditorTheme,
  { panelBg: string; appBg: string; symbolColor: string }
> = {
  paper: {
    panelBg: '#efece5',
    appBg: '#f7f5f2',
    symbolColor: '#342f2b',
  },
  dark: {
    panelBg: '#272524',
    appBg: '#201f1e',
    symbolColor: '#ded9d2',
  },
  sepia: {
    panelBg: '#e9e1c9',
    appBg: '#f3edd9',
    symbolColor: '#382d20',
  },
  sage: {
    panelBg: '#e6ebe5',
    appBg: '#f2f4f2',
    symbolColor: '#2b332c',
  },
}

interface ManuscriptContextType {
  project: ManuscriptProject
  setProject: React.Dispatch<React.SetStateAction<ManuscriptProject>>
  projectsLibrary: ManuscriptProject[]
  switchProject: (projectId: string) => void
  createProject: (
    template?: 'blank' | 'fantasy' | 'cyberpunk' | 'mystery' | 'romance',
    customMetadata?: {
      title?: string
      author?: string
      genre?: string
      targetWordCount?: number
      description?: string
    }
  ) => void
  updateProjectInLibrary: (projectId: string, updates: Partial<ManuscriptProject>) => void
  importProjectData: (imported: ManuscriptProject) => void
  duplicateProject: (projectId: string) => void
  deleteProjectFromLibrary: (projectId: string) => void
  isLibraryOpen: boolean
  setIsLibraryOpen: (open: boolean) => void
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  activeSceneId: string | null
  setActiveSceneId: (id: string | null) => void
  activeSectionId: string | null
  setActiveSectionId: (id: string | null) => void
  editorTheme: EditorTheme
  setEditorTheme: (theme: EditorTheme) => void
  editorFont: EditorFont
  setEditorFont: (font: EditorFont) => void
  typewriterMode: boolean
  setTypewriterMode: (val: boolean) => void
  focusMode: boolean
  setFocusMode: (val: boolean) => void
  isDirty: boolean
  lastSavedAt: string | null
  currentFilePath: string | null
  
  // Navigation & Lookups
  currentScene: SceneItem | null
  currentSection: FrontBackMatterItem | null
  currentChapter: ChapterItem | null
  currentPart: PartItem | null
  
  // CRUD Actions
  updateSceneContent: (sceneId: string, content: string, plainText: string, wordCount: number) => void
  updateSceneMetadata: (sceneId: string, updates: Partial<SceneItem>) => void
  updateSectionContent: (sectionId: string, content: string) => void
  updateSectionMetadata: (sectionId: string, updates: Partial<FrontBackMatterItem>) => void
  addChapter: (partId: string, title?: string) => void
  addScene: (chapterId: string, title?: string) => void
  deleteScene: (sceneId: string) => void
  deleteChapter: (chapterId: string) => void
  addCharacter: (character: CharacterItem) => void
  updateCharacter: (id: string, updates: Partial<CharacterItem>) => void
  deleteCharacter: (id: string) => void
  addWorldItem: (item: WorldItem) => void
  updateWorldItem: (id: string, updates: Partial<WorldItem>) => void
  deleteWorldItem: (id: string) => void
  
  // File System
  saveProjectFile: (asNew?: boolean) => Promise<boolean>
  openProjectFile: () => Promise<boolean>
  newProject: () => void
  
  // Stats
  totalWordCount: number

  // Dynamic WCO Window Overlay Sync
  syncTitleBarModalOverlay: (isModalOpen: boolean) => void
}

const ManuscriptContext = createContext<ManuscriptContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'mriter_active_manuscript'
const LIBRARY_STORAGE_KEY = 'mriter_projects_library'
const ACTIVE_ID_KEY = 'mriter_active_project_id'
const THEME_STORAGE_KEY = 'mriter_editor_theme'
const FONT_STORAGE_KEY = 'mriter_editor_font'

export const ManuscriptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Projects Library State
  const [projectsLibrary, setProjectsLibrary] = useState<ManuscriptProject[]>(() => {
    const savedLib = localStorage.getItem(LIBRARY_STORAGE_KEY)
    if (savedLib) {
      try {
        const parsed = JSON.parse(savedLib)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse saved projects library', e)
      }
    }
    const defaultP1 = createDefaultProject()
    const defaultP2 = createSampleProject2()
    const initialLib = [defaultP1, defaultP2]
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(initialLib))
    return initialLib
  })

  // 2. Active Project State
  const [project, setProject] = useState<ManuscriptProject>(() => {
    const activeId = localStorage.getItem(ACTIVE_ID_KEY)
    const savedLib = localStorage.getItem(LIBRARY_STORAGE_KEY)
    if (savedLib) {
      try {
        const parsedLib = JSON.parse(savedLib)
        if (Array.isArray(parsedLib) && parsedLib.length > 0) {
          const found = parsedLib.find((p: any) => p.id === activeId)
          if (found) return found
          return parsedLib[0]
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (!parsed.exportSettings?.coverImage) {
          parsed.exportSettings = {
            ...(parsed.exportSettings || {}),
            coverImage: SAMPLE_COVER_IMAGE,
            includeCoverPage: true,
          }
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse saved project', e)
      }
    }
    return createDefaultProject()
  })

  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>('editor')
  const [activeSceneId, setActiveSceneId] = useState<string | null>(() => {
    return project.parts[0]?.chapters[0]?.scenes[0]?.id || null
  })
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'sepia' || saved === 'sage') return saved as EditorTheme
    return 'paper'
  })
  const [editorFont, setEditorFont] = useState<EditorFont>(() => {
    return (localStorage.getItem(FONT_STORAGE_KEY) as EditorFont) || 'garamond'
  })
  const [typewriterMode, setTypewriterMode] = useState<boolean>(false)
  const [focusMode, setFocusMode] = useState<boolean>(false)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)

  const [isModalOverlayActive, setIsModalOverlayActive] = useState<boolean>(false)

  // Persist theme settings
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, editorTheme)
  }, [editorTheme])

  const syncTitleBarModalOverlay = useCallback((isModalOpen: boolean) => {
    setIsModalOverlayActive(isModalOpen)
  }, [])

  useEffect(() => {
    localStorage.setItem(FONT_STORAGE_KEY, editorFont)
  }, [editorFont])

  // Auto-save to localStorage every 1.5s if dirty and update library
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project))
        localStorage.setItem(ACTIVE_ID_KEY, project.id)
        setProjectsLibrary((prev) => {
          const exists = prev.some((p) => p.id === project.id)
          const updated = exists
            ? prev.map((p) => (p.id === project.id ? project : p))
            : [project, ...prev]
          localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        setIsDirty(false)
        setLastSavedAt(new Date().toLocaleTimeString())
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [project, isDirty])

  // Calculate current scene & chapter
  let currentScene: SceneItem | null = null
  let currentChapter: ChapterItem | null = null
  let currentPart: PartItem | null = null

  if (activeSceneId) {
    for (const part of project.parts) {
      for (const chap of part.chapters) {
        const found = chap.scenes.find((s) => s.id === activeSceneId)
        if (found) {
          currentScene = found
          currentChapter = chap
          currentPart = part
          break
        }
      }
      if (currentScene) break
    }
  }

  let currentSection: FrontBackMatterItem | null = null
  if (activeSectionId) {
    currentSection =
      project.frontMatter.find((s) => s.id === activeSectionId) ||
      project.backMatter.find((s) => s.id === activeSectionId) ||
      null
  }

  // Calculate total words
  let totalWordCount = 0
  project.parts.forEach((p) => {
    p.chapters.forEach((c) => {
      c.scenes.forEach((s) => {
        totalWordCount += s.wordCount || 0
      })
    })
  })

  // Switch Project Action
  const switchProject = useCallback((projectId: string) => {
    // Save current active project state before switching
    setProjectsLibrary((prev) => {
      const updatedLib = prev.map((p) => (p.id === project.id ? project : p))
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updatedLib))

      const target = updatedLib.find((p) => p.id === projectId)
      if (target) {
        setProject(target)
        localStorage.setItem(ACTIVE_ID_KEY, target.id)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(target))
        setCurrentFilePath(null)
        setActiveSceneId(target.parts[0]?.chapters[0]?.scenes[0]?.id || null)
        setActiveSectionId(null)
        setActiveView('editor')
        setIsDirty(false)
      }
      return updatedLib
    })
  }, [project])

  // Create Project Action
  const createProject = useCallback(
    (
      template: 'blank' | 'fantasy' | 'cyberpunk' | 'mystery' | 'romance' = 'blank',
      customMetadata?: {
        title?: string
        author?: string
        genre?: string
        targetWordCount?: number
        description?: string
      }
    ) => {
      const now = new Date().toISOString()
      let newProj: ManuscriptProject

      if (template === 'fantasy') {
        newProj = createDefaultProject()
        newProj.id = 'proj-' + Math.random().toString(36).substring(2, 9)
        newProj.title = customMetadata?.title || 'The Cartographer of Lost Stars'
        newProj.author = customMetadata?.author || project.author || 'Elena Vance'
        newProj.genre = customMetadata?.genre || 'Epic Fantasy / Adventure'
      } else if (template === 'cyberpunk') {
        newProj = createSampleProject2()
        newProj.id = 'proj-' + Math.random().toString(36).substring(2, 9)
        newProj.title = customMetadata?.title || 'Neon Horizon: Protocol Zero'
        newProj.author = customMetadata?.author || project.author || 'Marcus Cole'
        newProj.genre = customMetadata?.genre || 'Cyberpunk / Tech Noir'
      } else if (template === 'mystery') {
        newProj = {
          id: 'proj-' + Math.random().toString(36).substring(2, 9),
          version: '1.0.0',
          title: customMetadata?.title || 'A Whispering in the Fog',
          subtitle: 'A Detective Alan Cross Investigation',
          author: customMetadata?.author || project.author || 'Author',
          language: 'en',
          genre: customMetadata?.genre || 'Mystery / Noir Suspense',
          description:
            customMetadata?.description ||
            'A locked-room homicide during an unseasonable autumnal storm draws a disgraced detective into high-society secrets.',
          targetWordCount: customMetadata?.targetWordCount || 75000,
          frontMatter: [
            {
              id: 'fm-title-' + Math.random().toString(36).substring(2, 6),
              type: 'title-page',
              title: 'Title Page',
              content: `<h1>${customMetadata?.title || 'A Whispering in the Fog'}</h1><p style="text-align:center; font-style:italic;">A Novel of Suspense</p>`,
              includedInExport: true,
            },
          ],
          parts: [
            {
              id: 'part-1',
              title: 'Part One: The Incident at Blackwood',
              chapters: [
                {
                  id: 'chap-1',
                  title: 'Chapter 1: The Midnight Call',
                  synopsis: 'Detective Cross is summoned to the Blackwood conservatory.',
                  scenes: [
                    {
                      id: 'scene-1',
                      title: 'The Conservatory Glass',
                      content: `<p>Rain struck the conservatory glass like a scatter of lead shot. Detective Alan Cross pulled his collar tight against the draft that seeped between iron mullions.</p><p>"The door was bolted from the inside," Constable Miller said, nodding toward the heavy brass latch still resting firmly in its keeper. "No footprints in the flowerbeds. No broken panes. Yet Lord Blackwood sits in that wicker armchair, cold as slate."</p>`,
                      synopsis: 'Cross arrives at the scene of the locked-room mystery.',
                      status: 'draft',
                      wordCount: 71,
                      notes: 'Establish atmospheric tension and the central impossibility.',
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                },
              ],
            },
          ],
          backMatter: [],
          characters: [
            {
              id: 'char-1',
              name: 'Alan Cross',
              role: 'protagonist',
              archetype: 'Weary Detective',
              traits: ['Perceptive', 'Obsessive', 'Cynical'],
              goal: 'Unravel the locked-room puzzle before innocent blood is spilled.',
              conflict: 'Haunted by a previous case gone wrong.',
              bio: 'Former inspector turned private investigator.',
              notes: 'Prefers listening to talking. Noticed the faint scent of bitter almonds.',
            },
          ],
          worldBible: [
            {
              id: 'world-1',
              name: 'Blackwood Manor Conservatory',
              category: 'location',
              description: 'An octagonal Victorian glasshouse filled with exotic orchids and iron filigree benches.',
              notes: 'Only one entrance with a heavy mortise lock.',
              tags: ['Crime Scene', 'Locked Room'],
            },
          ],
          exportSettings: {
            bookTheme: 'classic',
            trimSize: '5.5x8.5',
            dropCaps: true,
            firstParagraphIndent: true,
            includeSceneDividers: true,
            sceneDividerSymbol: '✦   ✦   ✦',
            includeChapterNumbers: true,
            chapterTitleStyle: 'num-and-title',
            fontSize: 11,
            lineSpacing: 1.6,
            authorHeader: customMetadata?.author || project.author || 'Author',
            includeCoverPage: false,
          },
          createdAt: now,
          updatedAt: now,
        }
      } else if (template === 'romance') {
        newProj = {
          id: 'proj-' + Math.random().toString(36).substring(2, 9),
          version: '1.0.0',
          title: customMetadata?.title || 'Between the Lines',
          subtitle: 'A Contemporary Romance',
          author: customMetadata?.author || project.author || 'Author',
          language: 'en',
          genre: customMetadata?.genre || 'Contemporary Romance',
          description:
            customMetadata?.description ||
            'Two rival book restorers are forced to collaborate on preserving a legendary 18th-century manuscript collection.',
          targetWordCount: customMetadata?.targetWordCount || 70000,
          frontMatter: [
            {
              id: 'fm-title-' + Math.random().toString(36).substring(2, 6),
              type: 'title-page',
              title: 'Title Page',
              content: `<h1>${customMetadata?.title || 'Between the Lines'}</h1><p style="text-align:center; font-style:italic;">A Novel</p>`,
              includedInExport: true,
            },
          ],
          parts: [
            {
              id: 'part-1',
              title: 'Part One: The Archive Agreement',
              chapters: [
                {
                  id: 'chap-1',
                  title: 'Chapter 1: The Binding Dispute',
                  synopsis: 'First encounter in the dim cellar of the antiquarian library.',
                  scenes: [
                    {
                      id: 'scene-1',
                      title: 'The Dust of Old Vellum',
                      content: `<p>Clara had three cardinal rules in manuscript restoration: always use pH-neutral paste, never rush leather conditioning, and under no circumstances work alongside Julian Ward.</p><p>Yet here he was, leaning casually against her worktable with that infuriatingly composed half-smile, holding the very folio she had spent three months petitioning the university board to examine.</p>`,
                      synopsis: 'Clara discovers Julian is her appointed partner.',
                      status: 'draft',
                      wordCount: 65,
                      notes: 'Spark witty banter and unspoken mutual respect.',
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                },
              ],
            },
          ],
          backMatter: [],
          characters: [
            {
              id: 'char-1',
              name: 'Clara Hayes',
              role: 'protagonist',
              archetype: 'Meticulous Specialist',
              traits: ['Observant', 'Passionate', 'Guarded'],
              goal: 'Secure tenure by restoring the lost Valerius Folio.',
              conflict: 'Refuses to let anyone get close after her trust was burned.',
              bio: 'Master book conservator with ten years of archival experience.',
              notes: 'Drinks black tea with lavender; possesses photographic memory for paper watermarks.',
            },
          ],
          worldBible: [
            {
              id: 'world-1',
              name: 'St. Jude Antiquarian Archive',
              category: 'location',
              description: 'A quiet subterranean archive with arched limestone ceilings and rows of climate-controlled cedar cabinets.',
              notes: 'Smells of beeswax, aged oak, and vanilla notes of old paper.',
              tags: ['Setting', 'Library'],
            },
          ],
          exportSettings: {
            bookTheme: 'classic',
            trimSize: '5.5x8.5',
            dropCaps: true,
            firstParagraphIndent: true,
            includeSceneDividers: true,
            sceneDividerSymbol: '✦   ✦   ✦',
            includeChapterNumbers: true,
            chapterTitleStyle: 'num-and-title',
            fontSize: 11,
            lineSpacing: 1.6,
            authorHeader: customMetadata?.author || project.author || 'Author',
            includeCoverPage: false,
          },
          createdAt: now,
          updatedAt: now,
        }
      } else {
        newProj = {
          id: 'proj-' + Math.random().toString(36).substring(2, 9),
          version: '1.0.0',
          title: customMetadata?.title || 'Untitled Manuscript',
          author: customMetadata?.author || project.author || 'Author',
          language: 'en',
          genre: customMetadata?.genre || 'Fiction',
          description: customMetadata?.description || '',
          targetWordCount: customMetadata?.targetWordCount || 80000,
          frontMatter: [
            {
              id: 'fm-title-' + Math.random().toString(36).substring(2, 6),
              type: 'title-page',
              title: 'Title Page',
              content: `<h1>${customMetadata?.title || 'Untitled Manuscript'}</h1>`,
              includedInExport: true,
            },
          ],
          parts: [
            {
              id: 'part-1',
              title: 'Part One',
              chapters: [
                {
                  id: 'chap-1',
                  title: 'Chapter 1',
                  scenes: [
                    {
                      id: 'scene-1',
                      title: 'Scene 1',
                      content: `<p>Start writing here...</p>`,
                      synopsis: '',
                      status: 'draft',
                      wordCount: 3,
                      notes: '',
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                },
              ],
            },
          ],
          backMatter: [],
          characters: [],
          worldBible: [],
          exportSettings: {
            bookTheme: 'classic',
            trimSize: '5.5x8.5',
            dropCaps: true,
            firstParagraphIndent: true,
            includeSceneDividers: true,
            sceneDividerSymbol: '✦   ✦   ✦',
            includeChapterNumbers: true,
            chapterTitleStyle: 'num-and-title',
            fontSize: 11,
            lineSpacing: 1.6,
            authorHeader: customMetadata?.author || project.author || 'Author',
            includeCoverPage: false,
          },
          createdAt: now,
          updatedAt: now,
        }
      }

      if (customMetadata) {
        if (customMetadata.title) newProj.title = customMetadata.title
        if (customMetadata.author) newProj.author = customMetadata.author
        if (customMetadata.genre) newProj.genre = customMetadata.genre
        if (customMetadata.targetWordCount) newProj.targetWordCount = customMetadata.targetWordCount
        if (customMetadata.description) newProj.description = customMetadata.description
      }

      setProjectsLibrary((prev) => {
        const updated = [newProj, ...prev]
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
        return updated
      })

      setProject(newProj)
      localStorage.setItem(ACTIVE_ID_KEY, newProj.id)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProj))
      setCurrentFilePath(null)
      setActiveSceneId(newProj.parts[0]?.chapters[0]?.scenes[0]?.id || null)
      setActiveSectionId(null)
      setActiveView('editor')
      setIsDirty(false)
    },
    [project.author]
  )

  // Duplicate Project Action
  const duplicateProject = useCallback((projectId: string) => {
    setProjectsLibrary((prev) => {
      const source = prev.find((p) => p.id === projectId)
      if (!source) return prev
      const clone: ManuscriptProject = JSON.parse(JSON.stringify(source))
      clone.id = 'proj-' + Math.random().toString(36).substring(2, 9)
      clone.title = `${source.title} (Copy)`
      clone.createdAt = new Date().toISOString()
      clone.updatedAt = new Date().toISOString()

      const updated = [clone, ...prev]
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Delete Project Action
  const deleteProjectFromLibrary = useCallback((projectId: string) => {
    setProjectsLibrary((prev) => {
      const filtered = prev.filter((p) => p.id !== projectId)
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(filtered))

      if (project.id === projectId) {
        const next = filtered[0] || createDefaultProject()
        setProject(next)
        localStorage.setItem(ACTIVE_ID_KEY, next.id)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next))
        setActiveSceneId(next.parts[0]?.chapters[0]?.scenes[0]?.id || null)
        setActiveSectionId(null)
      }
      return filtered
    })
  }, [project.id])

  // Update Project in Library
  const updateProjectInLibrary = useCallback(
    (projectId: string, updates: Partial<ManuscriptProject>) => {
      setProjectsLibrary((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const mod = { ...p, ...updates, updatedAt: new Date().toISOString() }
            if (project.id === projectId) {
              setProject(mod)
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mod))
            }
            return mod
          }
          return p
        })
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
    },
    [project.id]
  )

  // Direct import project data
  const importProjectData = useCallback((imported: ManuscriptProject) => {
    setProjectsLibrary((prev) => {
      const exists = prev.some((p) => p.id === imported.id)
      const updated = exists
        ? prev.map((p) => (p.id === imported.id ? imported : p))
        : [imported, ...prev]
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    setProject(imported)
    localStorage.setItem(ACTIVE_ID_KEY, imported.id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(imported))
    setActiveSceneId(imported.parts?.[0]?.chapters?.[0]?.scenes?.[0]?.id || null)
    setActiveSectionId(null)
    setActiveView('editor')
    setIsDirty(false)
  }, [])

  // Update scene content
  const updateSceneContent = useCallback(
    (sceneId: string, content: string, plainText: string, wordCount: number) => {
      setProject((prev) => {
        const updatedParts = prev.parts.map((part) => ({
          ...part,
          chapters: part.chapters.map((chap) => ({
            ...chap,
            scenes: chap.scenes.map((scene) => {
              if (scene.id === sceneId) {
                return {
                  ...scene,
                  content,
                  plainText,
                  wordCount,
                  updatedAt: new Date().toISOString(),
                }
              }
              return scene
            }),
          })),
        }))
        return {
          ...prev,
          parts: updatedParts,
          updatedAt: new Date().toISOString(),
        }
      })
      setIsDirty(true)
    },
    []
  )

  // Update scene metadata
  const updateSceneMetadata = useCallback((sceneId: string, updates: Partial<SceneItem>) => {
    setProject((prev) => {
      const updatedParts = prev.parts.map((part) => ({
        ...part,
        chapters: part.chapters.map((chap) => ({
          ...chap,
          scenes: chap.scenes.map((scene) => {
            if (scene.id === sceneId) {
              return { ...scene, ...updates, updatedAt: new Date().toISOString() }
            }
            return scene
          }),
        })),
      }))
      return { ...prev, parts: updatedParts, updatedAt: new Date().toISOString() }
    })
    setIsDirty(true)
  }, [])

  // Update front/back section content
  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setProject((prev) => {
      const updatedFront = prev.frontMatter.map((s) => (s.id === sectionId ? { ...s, content } : s))
      const updatedBack = prev.backMatter.map((s) => (s.id === sectionId ? { ...s, content } : s))
      return {
        ...prev,
        frontMatter: updatedFront,
        backMatter: updatedBack,
        updatedAt: new Date().toISOString(),
      }
    })
    setIsDirty(true)
  }, [])

  // Update front/back section metadata
  const updateSectionMetadata = useCallback((sectionId: string, updates: Partial<FrontBackMatterItem>) => {
    setProject((prev) => {
      const updatedFront = prev.frontMatter.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
      const updatedBack = prev.backMatter.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
      return {
        ...prev,
        frontMatter: updatedFront,
        backMatter: updatedBack,
        updatedAt: new Date().toISOString(),
      }
    })
    setIsDirty(true)
  }, [])

  // Add Chapter
  const addChapter = useCallback((partId: string, title?: string) => {
    const newChapId = 'chap-' + Math.random().toString(36).substring(2, 8)
    const newSceneId = 'scene-' + Math.random().toString(36).substring(2, 8)
    const now = new Date().toISOString()

    setProject((prev) => {
      const targetPart = prev.parts.find((p) => p.id === partId) || prev.parts[0]
      const chapNum = (targetPart?.chapters.length || 0) + 1
      const newChapter: ChapterItem = {
        id: newChapId,
        title: title || `Chapter ${chapNum}`,
        synopsis: '',
        scenes: [
          {
            id: newSceneId,
            title: `Scene 1`,
            content: `<p>Start writing here...</p>`,
            synopsis: '',
            status: 'draft',
            wordCount: 3,
            notes: '',
            createdAt: now,
            updatedAt: now,
          },
        ],
      }

      return {
        ...prev,
        parts: prev.parts.map((p) => (p.id === targetPart?.id ? { ...p, chapters: [...p.chapters, newChapter] } : p)),
        updatedAt: now,
      }
    })

    setActiveSceneId(newSceneId)
    setActiveSectionId(null)
    setActiveView('editor')
    setIsDirty(true)
  }, [])

  // Add Scene
  const addScene = useCallback((chapterId: string, title?: string) => {
    const newSceneId = 'scene-' + Math.random().toString(36).substring(2, 8)
    const now = new Date().toISOString()

    setProject((prev) => {
      let sceneNum = 1
      const updatedParts = prev.parts.map((part) => ({
        ...part,
        chapters: part.chapters.map((chap) => {
          if (chap.id === chapterId) {
            sceneNum = chap.scenes.length + 1
            const newScene: SceneItem = {
              id: newSceneId,
              title: title || `Scene ${sceneNum}`,
              content: `<p></p>`,
              synopsis: '',
              status: 'draft',
              wordCount: 0,
              notes: '',
              createdAt: now,
              updatedAt: now,
            }
            return { ...chap, scenes: [...chap.scenes, newScene] }
          }
          return chap
        }),
      }))
      return { ...prev, parts: updatedParts, updatedAt: now }
    })

    setActiveSceneId(newSceneId)
    setActiveSectionId(null)
    setActiveView('editor')
    setIsDirty(true)
  }, [])

  // Delete Scene
  const deleteScene = useCallback((sceneId: string) => {
    setProject((prev) => {
      const updatedParts = prev.parts.map((part) => ({
        ...part,
        chapters: part.chapters.map((chap) => ({
          ...chap,
          scenes: chap.scenes.filter((s) => s.id !== sceneId),
        })),
      }))
      return { ...prev, parts: updatedParts, updatedAt: new Date().toISOString() }
    })
    setIsDirty(true)
  }, [])

  // Delete Chapter
  const deleteChapter = useCallback((chapterId: string) => {
    setProject((prev) => {
      const updatedParts = prev.parts.map((part) => ({
        ...part,
        chapters: part.chapters.filter((c) => c.id !== chapterId),
      }))
      return { ...prev, parts: updatedParts, updatedAt: new Date().toISOString() }
    })
    setIsDirty(true)
  }, [])

  // Character Bible Actions
  const addCharacter = useCallback((char: CharacterItem) => {
    setProject((prev) => ({
      ...prev,
      characters: [...prev.characters, char],
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  const updateCharacter = useCallback((id: string, updates: Partial<CharacterItem>) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== id),
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  // World Bible Actions
  const addWorldItem = useCallback((item: WorldItem) => {
    setProject((prev) => ({
      ...prev,
      worldBible: [...prev.worldBible, item],
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  const updateWorldItem = useCallback((id: string, updates: Partial<WorldItem>) => {
    setProject((prev) => ({
      ...prev,
      worldBible: prev.worldBible.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  const deleteWorldItem = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      worldBible: prev.worldBible.filter((w) => w.id !== id),
      updatedAt: new Date().toISOString(),
    }))
    setIsDirty(true)
  }, [])

  // Save Project File to Disk (.mriter)
  const saveProjectFile = async (asNew?: boolean) => {
    try {
      if (window.electronAPI) {
        if (!currentFilePath || asNew) {
          const res = await window.electronAPI.saveProject({
            defaultPath: `${project.title || 'My Novel'}.mriter`,
            data: project,
          })
          if (!res.canceled && res.filePath) {
            setCurrentFilePath(res.filePath)
            setIsDirty(false)
            setLastSavedAt(new Date().toLocaleTimeString())
            return true
          }
        } else {
          await window.electronAPI.saveFile({
            filePath: currentFilePath,
            content: JSON.stringify(project, null, 2),
          })
          setIsDirty(false)
          setLastSavedAt(new Date().toLocaleTimeString())
          return true
        }
      } else {
        // Fallback in web/preview: download JSON file
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.title || 'manuscript'}.mriter`
        a.click()
        URL.revokeObjectURL(url)
        setIsDirty(false)
        setLastSavedAt(new Date().toLocaleTimeString())
        return true
      }
    } catch (err) {
      console.error('Save failed', err)
    }
    return false
  }

  // Open Project File from Disk (.mriter / .json)
  const openProjectFile = async () => {
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.openProject()
        if (!res.canceled && res.data) {
          const imported = res.data
          setProjectsLibrary((prev) => {
            const exists = prev.some((p) => p.id === imported.id)
            const updated = exists
              ? prev.map((p) => (p.id === imported.id ? imported : p))
              : [imported, ...prev]
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
            return updated
          })
          setProject(imported)
          setCurrentFilePath(res.filePath || null)
          if (imported.parts?.[0]?.chapters?.[0]?.scenes?.[0]?.id) {
            setActiveSceneId(imported.parts[0].chapters[0].scenes[0].id)
            setActiveSectionId(null)
          }
          setIsDirty(false)
          return true
        }
      } else {
        // Fallback in web/preview
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.mriter,.json'
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0]
          if (file) {
            const text = await file.text()
            const imported = JSON.parse(text)
            setProjectsLibrary((prev) => {
              const exists = prev.some((p) => p.id === imported.id)
              const updated = exists
                ? prev.map((p) => (p.id === imported.id ? imported : p))
                : [imported, ...prev]
              localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated))
              return updated
            })
            setProject(imported)
            if (imported.parts?.[0]?.chapters?.[0]?.scenes?.[0]?.id) {
              setActiveSceneId(imported.parts[0].chapters[0].scenes[0].id)
              setActiveSectionId(null)
            }
            setIsDirty(false)
          }
        }
        input.click()
        return true
      }
    } catch (err) {
      console.error('Open project failed', err)
    }
    return false
  }

  const newProject = () => {
    setIsLibraryOpen(true)
  }

  return (
    <ManuscriptContext.Provider
      value={{
        project,
        setProject,
        projectsLibrary,
        switchProject,
        createProject,
        updateProjectInLibrary,
        importProjectData,
        duplicateProject,
        deleteProjectFromLibrary,
        isLibraryOpen,
        setIsLibraryOpen,
        activeView,
        setActiveView,
        activeSceneId,
        setActiveSceneId,
        activeSectionId,
        setActiveSectionId,
        editorTheme,
        setEditorTheme,
        editorFont,
        setEditorFont,
        typewriterMode,
        setTypewriterMode,
        focusMode,
        setFocusMode,
        isDirty,
        lastSavedAt,
        currentFilePath,
        currentScene,
        currentSection,
        currentChapter,
        currentPart,
        updateSceneContent,
        updateSceneMetadata,
        updateSectionContent,
        updateSectionMetadata,
        addChapter,
        addScene,
        deleteScene,
        deleteChapter,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        addWorldItem,
        updateWorldItem,
        deleteWorldItem,
        saveProjectFile,
        openProjectFile,
        newProject,
        totalWordCount,
        syncTitleBarModalOverlay,
      }}
    >
      {children}
    </ManuscriptContext.Provider>
  )
}

export function useManuscript() {
  const context = useContext(ManuscriptContext)
  if (!context) {
    throw new Error('useManuscript must be used within ManuscriptProvider')
  }
  return context
}
