export type SceneStatus = 'idea' | 'draft' | 'revised' | 'final'

export type SectionType =
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'toc'
  | 'acknowledgments'
  | 'about-author'
  | 'custom'

export interface SceneSnapshot {
  id: string
  sceneId: string
  title: string
  content: string // HTML
  plainText?: string
  wordCount: number
  createdAt: string
  label?: string
}

export interface SceneItem {
  id: string
  title: string
  content: string // HTML
  plainText?: string
  synopsis: string
  povCharacterId?: string
  status: SceneStatus
  wordCount: number
  targetWords?: number
  notes: string
  snapshots?: SceneSnapshot[]
  createdAt: string
  updatedAt: string
}

export interface ChapterItem {
  id: string
  title: string
  synopsis?: string
  scenes: SceneItem[]
}

export interface PartItem {
  id: string
  title: string
  synopsis?: string
  chapters: ChapterItem[]
}

export interface FrontBackMatterItem {
  id: string
  type: SectionType
  title: string
  content: string // HTML or custom text
  includedInExport: boolean
}

export interface CharacterItem {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  archetype?: string
  traits: string[]
  goal: string
  conflict: string
  epiphany?: string
  bio: string
  notes: string
  color?: string
  avatar?: string
}

export interface WorldItem {
  id: string
  name: string
  category: 'location' | 'lore' | 'culture' | 'technology' | 'magic' | 'item' | 'other'
  description: string
  notes: string
  tags: string[]
}

export type BookTheme = 'classic' | 'modern' | 'minimal' | 'fantasy' | 'romantic'
export type TrimSize = '5x8' | '5.5x8.5' | '6x9' | 'a5'

export type ProjectType = 'novel' | 'short-story' | 'article'

export type EditorContentWidth = 'compact' | 'standard' | 'wide' | 'fluid'
export type ParagraphStyle = 'indented' | 'block'
export type EditorLineSpacing = 'tight' | 'normal' | 'relaxed' | 'double'
export type EditorFontSizeScale = 'small' | 'standard' | 'medium' | 'large'

export interface EditorLayoutPreferences {
  contentWidth: EditorContentWidth
  paragraphStyle: ParagraphStyle
  lineSpacing: EditorLineSpacing
  fontSizeScale: EditorFontSizeScale
  showChapterSubtitle: boolean
  textAlignment: 'left' | 'justify'
}

export interface ExportSettings {
  bookTheme: BookTheme
  trimSize: TrimSize
  dropCaps: boolean
  firstParagraphIndent: boolean
  includeSceneDividers: boolean
  sceneDividerSymbol: string // e.g. "✦ ✦ ✦" or "* * *"
  includeChapterNumbers: boolean
  chapterTitleStyle: 'num-and-title' | 'title-only' | 'num-only' | 'none'
  fontSize: number
  lineSpacing: number
  textAlignment?: 'justify' | 'left'
  authorHeader: string
  includeCoverPage: boolean
  coverImage?: string
}

export interface ManuscriptProject {
  id: string
  version: string
  projectType?: ProjectType
  title: string
  subtitle?: string
  author: string
  authorBio?: string
  publisher?: string
  isbn?: string
  language: string
  genre?: string
  description?: string
  targetWordCount: number
  editorLayout?: Partial<EditorLayoutPreferences>
  frontMatter: FrontBackMatterItem[]
  parts: PartItem[]
  backMatter: FrontBackMatterItem[]
  characters: CharacterItem[]
  worldBible: WorldItem[]
  exportSettings: ExportSettings
  createdAt: string
  updatedAt: string
}

export type ActiveView = 'editor' | 'bible' | 'publish' | 'outline'
