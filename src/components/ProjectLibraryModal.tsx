import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Book,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  Check,
  Download,
  X,
  Search,
  Sparkles,
  LayoutGrid,
  List,
  Edit3,
  ArrowLeft,
  Clock,
  FileText,
  Users,
  Feather,
  UploadCloud,
  ChevronRight,
  Compass,
  Cpu,
  SearchCheck,
  Heart,
  FileCheck,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { ManuscriptProject } from '../types/manuscript'
import { BookCoverThumbnail } from './BookCoverThumbnail'

interface ProjectLibraryModalProps {
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'grid' | 'list'
type TemplateType = 'blank' | 'fantasy' | 'cyberpunk' | 'mystery' | 'romance'
type SortOption = 'recent' | 'title' | 'words' | 'progress'

interface TemplateOption {
  id: TemplateType
  title: string
  subtitle: string
  genre: string
  icon: React.ReactNode
  description: string
  highlights: string[]
  defaultTarget: number
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'blank',
    title: 'Blank Canvas',
    subtitle: 'Pure Distraction-Free Slate',
    genre: 'General Fiction',
    icon: <Feather className="w-5 h-5 text-accent" />,
    description: 'Clean slate with Part 1 and Scene 1 ready for your organic writing process.',
    highlights: ['Minimalist layout', 'Customizable structure', 'Zero preconceptions'],
    defaultTarget: 80000,
  },
  {
    id: 'fantasy',
    title: 'Epic Fantasy & Lore',
    subtitle: 'The Cartographer of Lost Stars',
    genre: 'Epic Fantasy / Adventure',
    icon: <Compass className="w-5 h-5 text-amber-500" />,
    description: 'Multi-part quest architecture, rich world-building bible, and protagonist dossier.',
    highlights: ['3-Part quest structure', 'World bible with lore tags', 'Sample prologue & scenes'],
    defaultTarget: 90000,
  },
  {
    id: 'cyberpunk',
    title: 'Sci-Fi & Cyberpunk Noir',
    subtitle: 'Neon Horizon: Protocol Zero',
    genre: 'Cyberpunk / Tech Noir',
    icon: <Cpu className="w-5 h-5 text-cyan-500" />,
    description: 'Fast-paced speculative thriller structure with faction profiles and tech glossary.',
    highlights: ['High-stakes chapter cadence', 'Tech glossary & dossiers', 'Atmospheric sample scenes'],
    defaultTarget: 75000,
  },
  {
    id: 'mystery',
    title: 'Mystery & Suspense',
    subtitle: 'A Whispering in the Fog',
    genre: 'Mystery / Noir Suspense',
    icon: <SearchCheck className="w-5 h-5 text-indigo-500" />,
    description: 'Classic 3-act suspense architecture with locked-room crime scene and suspects tracking.',
    highlights: ['3-Act suspense pacing', 'Suspects & clues bible', 'Investigator protagonist arc'],
    defaultTarget: 75000,
  },
  {
    id: 'romance',
    title: 'Contemporary Romance',
    subtitle: 'Between the Lines',
    genre: 'Contemporary Romance',
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    description: 'Emotional beat sheet with dual POV structure and relationship conflict tracking.',
    highlights: ['Dual-POV chapter framework', 'Emotional conflict matrix', 'Archival romance premise'],
    defaultTarget: 70000,
  },
]

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 2) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({ isOpen, onClose }) => {
  const {
    project: activeProject,
    projectsLibrary,
    switchProject,
    createProject,
    updateProjectInLibrary,
    importProjectData,
    duplicateProject,
    deleteProjectFromLibrary,
    openProjectFile,
    syncTitleBarModalOverlay,
  } = useManuscript()

  // View state
  const [activeTab, setActiveTab] = useState<'library' | 'create'>('library')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  // Creation form state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('blank')
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [newTargetWords, setNewTargetWords] = useState<number>(80000)
  const [newDescription, setNewDescription] = useState('')

  // Edit metadata modal state
  const [editingProject, setEditingProject] = useState<ManuscriptProject | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editGenre, setEditGenre] = useState('')
  const [editTargetWords, setEditTargetWords] = useState<number>(80000)
  const [editDescription, setEditDescription] = useState('')

  // Delete confirmation state
  const [projectToDelete, setProjectToDelete] = useState<ManuscriptProject | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync modal overlay with titlebar drag region
  useEffect(() => {
    if (isOpen) {
      syncTitleBarModalOverlay(true)
      return () => syncTitleBarModalOverlay(false)
    }
  }, [isOpen, syncTitleBarModalOverlay])

  // Reset creation form when opening create tab
  const handleOpenCreateTab = (templateId: TemplateType = 'blank') => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]
    setSelectedTemplate(tmpl.id)
    setNewTitle(tmpl.id === 'blank' ? 'Untitled Novel' : tmpl.subtitle)
    setNewAuthor(activeProject.author || 'Author')
    setNewGenre(tmpl.genre)
    setNewTargetWords(tmpl.defaultTarget)
    setNewDescription(tmpl.description)
    setActiveTab('create')
  }

  // Handle template selection change
  const handleSelectTemplate = (t: TemplateOption) => {
    setSelectedTemplate(t.id)
    if (!newTitle || newTitle === 'Untitled Novel' || TEMPLATES.some((tp) => tp.subtitle === newTitle)) {
      setNewTitle(t.id === 'blank' ? 'Untitled Novel' : t.subtitle)
    }
    setNewGenre(t.genre)
    setNewTargetWords(t.defaultTarget)
    setNewDescription(t.description)
  }

  // Handle create submission
  const handleConfirmCreate = () => {
    createProject(selectedTemplate, {
      title: newTitle.trim() || 'Untitled Novel',
      author: newAuthor.trim() || activeProject.author || 'Author',
      genre: newGenre.trim() || 'Fiction',
      targetWordCount: newTargetWords || 80000,
      description: newDescription.trim(),
    })
    setActiveTab('library')
    onClose()
  }

  // Handle Edit details open
  const handleOpenEdit = (p: ManuscriptProject, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(p)
    setEditTitle(p.title)
    setEditAuthor(p.author)
    setEditGenre(p.genre || '')
    setEditTargetWords(p.targetWordCount || 80000)
    setEditDescription(p.description || '')
  }

  // Handle Edit details save
  const handleSaveEdit = () => {
    if (!editingProject) return
    updateProjectInLibrary(editingProject.id, {
      title: editTitle.trim() || 'Untitled',
      author: editAuthor.trim() || 'Author',
      genre: editGenre.trim(),
      targetWordCount: editTargetWords || 80000,
      description: editDescription.trim(),
    })
    setEditingProject(null)
  }

  // Stats calculation
  const calculateTotalWords = (p: ManuscriptProject) => {
    let total = 0
    p.parts?.forEach((part) => {
      part.chapters?.forEach((chap) => {
        chap.scenes?.forEach((s) => {
          total += s.wordCount || 0
        })
      })
    })
    return total
  }

  const calculateTotalChapters = (p: ManuscriptProject) => {
    return p.parts?.reduce((acc, part) => acc + (part.chapters?.length || 0), 0) || 0
  }

  const calculateTotalScenes = (p: ManuscriptProject) => {
    let count = 0
    p.parts?.forEach((part) => {
      part.chapters?.forEach((chap) => {
        count += chap.scenes?.length || 0
      })
    })
    return count
  }

  // Extract unique genres for filter pills
  const availableGenres = useMemo(() => {
    const set = new Set<string>()
    projectsLibrary.forEach((p) => {
      if (p.genre) {
        // Grab main genre before slash if present
        const main = p.genre.split('/')[0].trim()
        if (main) set.add(main)
      }
    })
    return Array.from(set)
  }, [projectsLibrary])

  // Filter & sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let list = projectsLibrary.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.genre && p.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchSearch) return false

      if (selectedGenre === 'active') {
        return p.id === activeProject.id
      }
      if (selectedGenre !== 'all') {
        return p.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      }
      return true
    })

    // Sort
    list.sort((a, b) => {
      if (sortOption === 'recent') {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return db - da
      }
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortOption === 'words') {
        return calculateTotalWords(b) - calculateTotalWords(a)
      }
      if (sortOption === 'progress') {
        const progA = calculateTotalWords(a) / (a.targetWordCount || 80000)
        const progB = calculateTotalWords(b) / (b.targetWordCount || 80000)
        return progB - progA
      }
      return 0
    })

    return list
  }, [projectsLibrary, searchQuery, selectedGenre, sortOption, activeProject.id])

  // Total words across entire library
  const totalLibraryWords = useMemo(() => {
    return projectsLibrary.reduce((sum, p) => sum + calculateTotalWords(p), 0)
  }, [projectsLibrary])

  const handleExportSingle = (p: ManuscriptProject, e: React.MouseEvent) => {
    e.stopPropagation()
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${p.title.replace(/[/\\?%*:|"<>]/g, '_') || 'manuscript'}.mriter`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Drag and drop import handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.mriter') || file.name.endsWith('.json'))) {
      try {
        const text = await file.text()
        const imported = JSON.parse(text)
        if (imported && imported.title && imported.parts) {
          importProjectData(imported)
          onClose()
        }
      } catch (err) {
        console.error('Failed to import dropped file', err)
      }
    }
  }

  // Keyboard shortcut support (Esc to close, / to search)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingProject) {
          setEditingProject(null)
        } else if (projectToDelete) {
          setProjectToDelete(null)
        } else if (activeTab === 'create') {
          setActiveTab('library')
        } else {
          onClose()
        }
      } else if (e.key === '/' && activeTab === 'library' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeTab, editingProject, projectToDelete, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in select-none"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingFile(true)
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
    >
      <div className="bg-panel border border-subtle rounded-2xl max-w-5xl w-full h-[88vh] max-h-[760px] min-h-[560px] flex flex-col shadow-2xl overflow-hidden text-main relative">
        {/* Drag-and-drop overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-panel/95 backdrop-blur-md z-50 flex flex-col items-center justify-center border-2 border-dashed border-accent m-3 rounded-xl animate-in fade-in">
            <UploadCloud className="w-12 h-12 text-accent mb-3 animate-bounce" />
            <h3 className="font-serif text-lg font-bold text-main">Drop Manuscript to Import</h3>
            <p className="text-xs text-muted-theme mt-1">Accepts .mriter and JSON project archives</p>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-subtle flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-accent-soft border border-subtle flex items-center justify-center text-accent shadow-xs">
              <Book className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-base font-semibold text-main tracking-wide">
                  Manuscript Library
                </h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-subtle">
                  {projectsLibrary.length} {projectsLibrary.length === 1 ? 'novel' : 'novels'}
                </span>
              </div>
              <p className="text-[11px] text-muted-theme mt-0.5">
                Curate your novel bookshelf, track word milestones, or begin a new manuscript.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Library Quick Stats Pill */}
            <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-panel border border-subtle text-[11px] text-muted-theme">
              <span className="flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>
                  <strong className="text-main font-mono">{totalLibraryWords.toLocaleString()}</strong> total words
                </span>
              </span>
              <span className="w-1 h-1 rounded-full bg-border-muted" />
              <span className="flex items-center space-x-1.5 truncate max-w-[170px]" title={activeProject.title}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">Writing: <strong className="text-main">{activeProject.title}</strong></span>
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 text-muted-theme hover:text-main hover:bg-surface rounded-lg border border-transparent hover:border-subtle transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN BODY SWITCHER */}
        {activeTab === 'create' ? (
          /* ===================================================
             CREATE NEW MANUSCRIPT STUDIO VIEW
             =================================================== */
          <div className="flex-1 overflow-y-auto p-5 flex flex-col bg-panel">
            <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4">
              <button
                onClick={() => setActiveTab('library')}
                className="flex items-center space-x-1.5 text-xs text-muted-theme hover:text-main px-2.5 py-1.5 rounded-lg hover:bg-surface border border-subtle transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Library</span>
              </button>
              <div className="text-center">
                <h3 className="font-serif text-sm font-semibold text-main">Start a New Novel</h3>
                <p className="text-[11px] text-muted-theme">Select a structured template or begin with a pure blank slate</p>
              </div>
              <div className="w-24" /> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start max-w-4xl mx-auto w-full">
              {/* Left Column: Template Selection & Details */}
              <div className="lg:col-span-7 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-main uppercase tracking-wider mb-1.5">
                    1. Choose Starter Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TEMPLATES.map((tmpl) => {
                      const isSelected = selectedTemplate === tmpl.id
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleSelectTemplate(tmpl)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center space-x-2 ${
                            isSelected
                              ? 'bg-accent-soft border-[var(--accent)] shadow-xs ring-1 ring-[var(--accent)]/30'
                              : 'bg-surface hover:bg-surface-hover border-subtle hover:border-[var(--border-muted)]'
                          }`}
                        >
                          <div className="p-1 rounded-md bg-panel border border-subtle shrink-0">
                            {tmpl.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-main truncate">{tmpl.title}</h4>
                            <p className="text-[9px] text-muted-theme font-mono">
                              {tmpl.defaultTarget.toLocaleString()} words
                            </p>
                          </div>
                          <div className="shrink-0">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-accent bg-accent text-on-accent' : 'border-subtle'
                              }`}
                            >
                              {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Step 2: Novel Details Form */}
                <div className="p-3.5 rounded-xl bg-surface border border-subtle space-y-2.5">
                  <label className="block text-xs font-semibold text-main uppercase tracking-wider">
                    2. Novel Details & Target
                  </label>

                  <div>
                    <label className="block text-[11px] text-muted-theme mb-0.5">Book Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. The Cartographer of Lost Stars"
                      className="w-full bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-muted-theme mb-0.5">Author Name</label>
                      <input
                        type="text"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        className="w-full bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-theme mb-0.5">Genre</label>
                      <input
                        type="text"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        placeholder="e.g. Epic Fantasy"
                        className="w-full bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-muted-theme">Target Word Count Goal</label>
                      <span className="text-xs font-mono text-accent font-semibold">
                        {newTargetWords.toLocaleString()} words
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[50000, 75000, 85000, 100000].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setNewTargetWords(count)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            newTargetWords === count
                              ? 'bg-accent text-on-accent border-accent font-semibold'
                              : 'bg-panel text-muted-theme border-subtle hover:text-main'
                          }`}
                        >
                          {(count / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted-theme mb-0.5">
                      Logline / Premise <span className="text-faint">(Optional)</span>
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief one or two-sentence hook for your novel..."
                      rows={2}
                      className="w-full bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button
                    onClick={() => setActiveTab('library')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-panel text-muted-theme hover:text-main border border-subtle transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCreate}
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                    className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    <span>Create Novel & Start Writing</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Book Cover & Spine Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-surface border border-subtle text-center">
                <span className="text-[10px] font-semibold text-muted-theme uppercase tracking-wider mb-3">
                  Live Bookshelf Preview
                </span>

                <div className="transform hover:scale-105 transition-transform duration-300">
                  <BookCoverThumbnail
                    title={newTitle || 'Untitled Novel'}
                    author={newAuthor || activeProject.author || 'Author'}
                    genre={newGenre || 'General Fiction'}
                    size="md"
                    className="shadow-xl"
                  />
                </div>

                <div className="mt-4 w-full">
                  <h4 className="font-serif text-sm font-bold text-main line-clamp-1">
                    {newTitle || 'Untitled Novel'}
                  </h4>
                  <p className="text-xs text-muted-theme mt-0.5">by {newAuthor || 'Author'}</p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-panel text-muted-theme border border-subtle">
                      {newGenre || 'Fiction'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-panel text-accent border border-subtle font-semibold">
                      Goal: {newTargetWords.toLocaleString()} words
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-subtle w-full text-left text-[11px] text-muted-theme space-y-1">
                  <p className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Distraction-free markdown & scene editor</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>EPUB 3, DOCX & Print publishing ready</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Auto-saves offline to your local library</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================
             BOOKSHELF / LIBRARY VIEW
             =================================================== */
          <>
            {/* Action Bar (Search, Filters, View Switcher & New Novel CTA) */}
            <div className="p-3.5 px-6 border-b border-subtle bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Left Side: Search Box */}
              <div className="flex items-center space-x-2.5 flex-1 min-w-[240px] max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-muted-theme absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books by title, author, or genre... (/)"
                    className="w-full bg-panel text-main text-xs pl-8 pr-7 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 p-0.5 text-muted-theme hover:text-main"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle: Genre Filter Chips */}
              <div className="hidden sm:flex items-center space-x-1.5 overflow-x-auto py-0.5">
                <button
                  onClick={() => setSelectedGenre('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedGenre === 'all'
                      ? 'bg-accent text-on-accent font-semibold shadow-xs'
                      : 'bg-panel text-muted-theme hover:text-main border border-subtle'
                  }`}
                  style={selectedGenre === 'all' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
                >
                  All ({projectsLibrary.length})
                </button>
                <button
                  onClick={() => setSelectedGenre('active')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedGenre === 'active'
                      ? 'bg-accent text-on-accent font-semibold shadow-xs'
                      : 'bg-panel text-muted-theme hover:text-main border border-subtle'
                  }`}
                  style={selectedGenre === 'active' ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
                >
                  Active Only
                </button>
                {availableGenres.slice(0, 3).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedGenre === g
                        ? 'bg-accent text-on-accent font-semibold shadow-xs'
                        : 'bg-panel text-muted-theme hover:text-main border border-subtle'
                    }`}
                    style={selectedGenre === g ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : {}}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Right Side: Sort, View Switcher & Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Sort dropdown */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-panel text-main text-xs px-2.5 py-1.5 rounded-lg border border-subtle outline-none focus:border-accent cursor-pointer"
                >
                  <option value="recent">Recently Modified</option>
                  <option value="title">Title (A–Z)</option>
                  <option value="words">Word Count</option>
                  <option value="progress">Goal Progress</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-panel border border-subtle rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Bookshelf Grid View"
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-surface text-accent font-medium shadow-xs'
                        : 'text-muted-theme hover:text-main'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="Ledger List View"
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-surface text-accent font-medium shadow-xs'
                        : 'text-muted-theme hover:text-main'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Import Button */}
                <button
                  onClick={() => {
                    openProjectFile()
                    onClose()
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-panel hover:bg-surface text-main border border-subtle shadow-xs hover:border-[var(--border-muted)] transition-colors cursor-pointer"
                  title="Import an existing .mriter file from your computer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-muted-theme" />
                  <span>Import</span>
                </button>

                {/* HIGH-CONTRAST, PROMINENT "+ New Novel" CTA BUTTON */}
                <button
                  onClick={() => handleOpenCreateTab('blank')}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  title="Start a new manuscript with templates"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="tracking-wide">New Novel</span>
                </button>
              </div>
            </div>

            {/* Bookshelf Projects Shelf / Grid / List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-app">
              {filteredAndSortedProjects.length === 0 ? (
                /* Empty / No Results State */
                <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-subtle flex items-center justify-center text-accent mb-3">
                    <Book className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-main">
                    {searchQuery ? `No manuscripts match "${searchQuery}"` : 'Your library is empty'}
                  </h4>
                  <p className="text-xs text-muted-theme max-w-sm mt-1 mb-4">
                    {searchQuery
                      ? 'Try clearing your search query or filter tags to reveal more projects.'
                      : 'Begin crafting your literary masterpiece with our novelist templates.'}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedGenre('all')
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-panel border border-subtle text-main transition-colors cursor-pointer"
                    >
                      Clear Search Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCreateTab('blank')}
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer hover:opacity-90"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Start Your First Novel</span>
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* ===================================================
                   BOOKSHELF GRID VIEW (3D Covers & Rich Metrics)
                   =================================================== */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredAndSortedProjects.map((p) => {
                    const isActive = p.id === activeProject.id
                    const totalWords = calculateTotalWords(p)
                    const target = p.targetWordCount || 80000
                    const progressPct = Math.min(100, Math.round((totalWords / target) * 100))
                    const chaptersCount = calculateTotalChapters(p)
                    const scenesCount = calculateTotalScenes(p)
                    const updatedText = formatRelativeTime(p.updatedAt || p.createdAt)

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (!isActive) {
                            switchProject(p.id)
                          }
                          onClose()
                        }}
                        className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer flex space-x-4 relative ${
                          isActive
                            ? 'bg-accent-soft/30 border-[var(--accent)] ring-1 ring-[var(--accent)]/30 shadow-md'
                            : 'bg-surface border-subtle hover:border-[var(--border-muted)] hover:shadow-md'
                        }`}
                      >
                        {/* 3D Realistic Book Cover Thumbnail with spine curvature */}
                        <div className="shrink-0 transition-transform duration-200 group-hover:-translate-y-1">
                          <BookCoverThumbnail
                            title={p.title}
                            author={p.author}
                            genre={p.genre}
                            coverImage={p.exportSettings?.coverImage}
                            size="md"
                          />
                        </div>

                        {/* Book Metadata & Progress */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Title & Status Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 pr-1">
                                <h3 className="font-serif text-sm font-bold text-main truncate group-hover:text-accent transition-colors">
                                  {p.title}
                                </h3>
                                <p className="text-[11px] text-muted-theme truncate font-medium">
                                  by {p.author}
                                </p>
                              </div>

                              {isActive ? (
                                <span
                                  style={{
                                    backgroundColor: 'var(--accent)',
                                    color: 'var(--accent-contrast)',
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 shadow-xs"
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium px-2 py-0.5 rounded bg-panel text-muted-theme border border-subtle shrink-0 transition-opacity">
                                  Switch Project
                                </span>
                              )}
                            </div>

                            {/* Genre & Structure Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {p.genre && (
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-panel text-muted-theme border border-subtle font-medium truncate max-w-[150px]">
                                  {p.genre}
                                </span>
                              )}
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-panel text-faint border border-subtle font-mono">
                                {chaptersCount} {chaptersCount === 1 ? 'chap' : 'chaps'} • {scenesCount} {scenesCount === 1 ? 'scene' : 'scenes'}
                              </span>
                            </div>

                            {/* Description / Logline excerpt */}
                            {p.description && (
                              <p className="text-[11px] text-muted-theme line-clamp-2 mt-2 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                          </div>

                          {/* Writing Progress Section */}
                          <div className="mt-3 pt-2.5 border-t border-subtle">
                            <div className="flex items-center justify-between text-[10px] text-muted-theme mb-1 font-mono">
                              <span className="flex items-center space-x-1">
                                <strong className="text-main font-semibold">
                                  {totalWords.toLocaleString()}
                                </strong>
                                <span>/ {target.toLocaleString()} words</span>
                              </span>
                              <span className="text-accent font-bold">{progressPct}%</span>
                            </div>

                            {/* Rounded Progress Track */}
                            <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden border border-subtle">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progressPct}%`,
                                  backgroundColor: 'var(--accent)',
                                }}
                              />
                            </div>

                            {/* Footer Row: Timestamp & Quick Action Buttons */}
                            <div className="flex items-center justify-between mt-2.5 pt-0.5 text-[10px] text-faint">
                              <span className="flex items-center space-x-1 text-muted-theme">
                                <Clock className="w-3 h-3 text-muted-theme" />
                                <span>Edited {updatedText}</span>
                              </span>

                              {/* Card Action Button Group */}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => handleOpenEdit(p, e)}
                                  title="Edit details (Title, Author, Target)"
                                  className="p-1.5 text-muted-theme hover:text-main rounded-md hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleExportSingle(p, e)}
                                  title="Export .mriter backup"
                                  className="p-1.5 text-muted-theme hover:text-main rounded-md hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    duplicateProject(p.id)
                                  }}
                                  title="Duplicate manuscript"
                                  className="p-1.5 text-muted-theme hover:text-accent rounded-md hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {projectsLibrary.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setProjectToDelete(p)
                                    }}
                                    title="Delete manuscript"
                                    className="p-1.5 text-muted-theme hover:text-rose-500 rounded-md hover:bg-panel transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* ===================================================
                   LEDGER / LIST VIEW (Structured Table Format)
                   =================================================== */
                <div className="bg-surface rounded-xl border border-subtle overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-subtle bg-panel/70 text-[10px] uppercase font-semibold text-muted-theme tracking-wider">
                        <th className="py-2.5 px-4">Manuscript</th>
                        <th className="py-2.5 px-3">Genre</th>
                        <th className="py-2.5 px-3">Word Progress</th>
                        <th className="py-2.5 px-3">Structure</th>
                        <th className="py-2.5 px-3">Last Modified</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {filteredAndSortedProjects.map((p) => {
                        const isActive = p.id === activeProject.id
                        const totalWords = calculateTotalWords(p)
                        const target = p.targetWordCount || 80000
                        const progressPct = Math.min(100, Math.round((totalWords / target) * 100))
                        const chaptersCount = calculateTotalChapters(p)
                        const scenesCount = calculateTotalScenes(p)
                        const updatedText = formatRelativeTime(p.updatedAt || p.createdAt)

                        return (
                          <tr
                            key={p.id}
                            onClick={() => {
                              if (!isActive) switchProject(p.id)
                              onClose()
                            }}
                            className={`group cursor-pointer transition-colors ${
                              isActive ? 'bg-accent-soft/30' : 'hover:bg-panel/50'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <BookCoverThumbnail
                                  title={p.title}
                                  author={p.author}
                                  genre={p.genre}
                                  coverImage={p.exportSettings?.coverImage}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-serif font-bold text-main truncate max-w-[200px] group-hover:text-accent transition-colors">
                                      {p.title}
                                    </h4>
                                    {isActive && (
                                      <span
                                        style={{
                                          backgroundColor: 'var(--accent)',
                                          color: 'var(--accent-contrast)',
                                        }}
                                        className="text-[9px] font-semibold px-2 py-0.2 rounded-full"
                                      >
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-theme truncate">
                                    by {p.author}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-panel border border-subtle text-muted-theme">
                                {p.genre || 'Fiction'}
                              </span>
                            </td>

                            <td className="py-3 px-3 w-48">
                              <div className="text-[10px] font-mono text-muted-theme flex justify-between mb-1">
                                <span>{totalWords.toLocaleString()} / {target.toLocaleString()}</span>
                                <span className="text-accent font-semibold">{progressPct}%</span>
                              </div>
                              <div className="w-full h-1 bg-panel rounded-full overflow-hidden border border-subtle">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${progressPct}%`,
                                    backgroundColor: 'var(--accent)',
                                  }}
                                />
                              </div>
                            </td>

                            <td className="py-3 px-3 text-[11px] text-muted-theme font-mono">
                              {chaptersCount} chap • {scenesCount} scenes
                            </td>

                            <td className="py-3 px-3 text-[11px] text-muted-theme">
                              {updatedText}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={(e) => handleOpenEdit(p, e)}
                                  title="Edit details"
                                  className="p-1.5 text-muted-theme hover:text-main rounded hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleExportSingle(p, e)}
                                  title="Export .mriter backup"
                                  className="p-1.5 text-muted-theme hover:text-main rounded hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    duplicateProject(p.id)
                                  }}
                                  title="Duplicate manuscript"
                                  className="p-1.5 text-muted-theme hover:text-accent rounded hover:bg-panel transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {projectsLibrary.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setProjectToDelete(p)
                                    }}
                                    title="Delete manuscript"
                                    className="p-1.5 text-muted-theme hover:text-rose-500 rounded hover:bg-panel transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="h-11 px-6 border-t border-subtle bg-surface flex items-center justify-between text-[11px] text-muted-theme shrink-0">
              <div className="flex items-center space-x-2">
                <span>
                  <strong>{projectsLibrary.length}</strong> manuscripts stored locally
                </span>
                <span>•</span>
                <span className="font-mono">
                  {totalLibraryWords.toLocaleString()} total words written
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline text-faint">
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-panel border border-subtle font-mono text-[9px]">Esc</kbd> to close
                </span>
                <span className="text-accent font-medium">Click any novel to switch active studio</span>
              </div>
            </div>
          </>
        )}

        {/* ===================================================
           EDIT DETAILS MODAL DIALOG OVERLAY
           =================================================== */}
        {editingProject && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-panel border border-subtle rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-main">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-accent" />
                  <h4 className="font-serif font-bold text-sm">Edit Manuscript Metadata</h4>
                </div>
                <button
                  onClick={() => setEditingProject(null)}
                  className="p-1 text-muted-theme hover:text-main rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-muted-theme mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-surface text-main px-3 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-theme mb-1">Author</label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full bg-surface text-main px-3 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-theme mb-1">Genre</label>
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      className="w-full bg-surface text-main px-3 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted-theme mb-1">Target Word Count Goal</label>
                  <input
                    type="number"
                    value={editTargetWords}
                    onChange={(e) => setEditTargetWords(Number(e.target.value))}
                    step={1000}
                    className="w-full bg-surface text-main px-3 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-muted-theme mb-1">Logline / Premise</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-surface text-main px-3 py-1.5 rounded-lg border border-subtle focus:border-accent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-subtle">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-panel border border-subtle text-muted-theme hover:text-main cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
           DELETE CONFIRMATION MODAL OVERLAY
           =================================================== */}
        {projectToDelete && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-panel border border-rose-500/30 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 text-main">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h4 className="font-serif font-bold text-sm text-main">Delete Manuscript?</h4>
                <p className="text-xs text-muted-theme mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-main">"{projectToDelete.title}"</strong> from your library?
                  This action cannot be undone unless you have a saved .mriter backup.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-panel border border-subtle text-main cursor-pointer"
                >
                  Keep Manuscript
                </button>
                <button
                  onClick={() => {
                    deleteProjectFromLibrary(projectToDelete.id)
                    setProjectToDelete(null)
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
