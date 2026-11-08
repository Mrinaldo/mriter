# Mriter — The Novelist & Publishing Studio 📖✨

> A distraction-free desktop manuscript writing and self-publishing studio for authors, novelists, and storytellers. Built with Electron, React, TypeScript, Tailwind CSS, and TipTap.

---

## 🌟 Key Capabilities

### 1. ✍️ Distraction-Free Manuscript Writing
- **Minimalist Zen Editor**: Focus on words without clutter.
- **Paper Themes**: Warm Paper / Cream, Golden Sepia, Midnight Obsidian, and Minimal White.
- **Classic Typography**: Typeset in *EB Garamond*, *Lora*, *Merriweather*, or *Inter Sans*.
- **Typewriter Scrolling Mode**: Keeps your active line vertically centered in your line of sight.
- **Distraction-Free Zen Mode**: Toggle fullscreen writing with `F11` / `Escape`.
- **Live Word Targets & Pace**: Scene word counts, reading time estimates, and project goal trackers (e.g. 80,000 words).

### 2. 🗂️ Novel Structure & Manuscript Binder
- **Front Matter**: Dedicated sections for Title Page, Copyright, and Dedication.
- **Manuscript Hierarchy**: Volumes / Parts $\rightarrow$ Chapters $\rightarrow$ Scenes with drag-and-drop or accordion navigation.
- **Scene Status Tracking**: Visual status pills (`Idea`, `Draft`, `Revised`, `Final`).
- **Scene Inspector**: Manage POV character, synopsis / beat sheets, word goals, and author notes per scene.
- **Back Matter**: Epilogue, Acknowledgments, and About the Author.

### 3. 👥 Story Bible & Lore Tracking
- **Character Profiles**: Track Protagonists, Antagonists, Mentors, and Supporting cast with dramatic goals, conflicts, archetypes, and color badges.
- **World Building Database**: Organize lore, locations, factions, pre-deluge technology, and relics.

### 4. 🗃️ Outliner Matrix & Corkboard
- Visual card-matrix overview of all chapters, scenes, POV perspectives, and synopses at a glance.

### 5. 🚀 Book Publishing & Export Studio
- **EPUB 3 (.epub)**: Valid, standards-compliant EPUB 3 ebook package ready for **Amazon KDP, Apple Books, Kobo, and Barnes & Noble**.
- **Standard Manuscript Format (.docx)**: Industry-standard **William Shunn format** (1-inch margins, 12pt Times New Roman, double-spaced lines, running header with `SURNAME / SHORT TITLE / PAGE #`, centered `#` scene breaks) ready for literary agents and editors.
- **Print Mockup & PDF**: Live preview on E-Reader (Kindle frame), Print Spread (5.5"×8.5", 6"×9", 5"×8", A5), or Mobile with ornamental drop caps and custom scene dividers (`✦ ✦ ✦`).
- **Local-first Data Ownership**: Save and load native `.mriter` / `.json` manuscript files directly from your disk.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the directory
cd mriter

# Install dependencies (already installed)
npm install
```

### Running in Development
```bash
# Launch the desktop Electron application with Live HMR
npm run dev

# Or launch as a web app in your browser
npm run dev:web
```

### Packaging Desktop Installers (.exe, .dmg, .zip, .AppImage)
```bash
# Build desktop installer for your current OS
npm run dist

# Specific platforms:
npm run dist:win            # Windows installer & portable executable (.exe)
npm run dist:mac            # macOS Apple Silicon & Intel DMG and ZIP
npm run dist:mac:arm64      # macOS Apple Silicon (M1/M2/M3/M4)
npm run dist:mac:x64        # macOS Intel
npm run dist:mac:universal  # macOS Universal Binary
npm run dist:linux          # Linux AppImage
```

---

## 🍎 macOS First-Class Support

Mriter is built from the ground up to feel like a native macOS application:
- **Native macOS Window Controls**: Clean frameless window with macOS traffic lights (Close, Minimize, Zoom) positioned with native inset padding.
- **Dynamic Full-Screen Handling**: When entering macOS full-screen space, layout automatically shifts to standard padding as traffic lights move to the macOS menubar.
- **macOS System Menu Bar**: Full system menu integration with standard macOS keyboard shortcuts (`⌘Q` Quit, `⌘W` Close, `⌘,` Preferences, `⌘Z` Undo, `⌘⇧Z` Redo, `⌘X` Cut, `⌘C` Copy, `⌘V` Paste, `⌘A` Select All).
- **Apple Silicon & Intel Universal Binaries**: Fully optimized builds packaged in both `.dmg` (drag-and-drop to Applications folder) and `.zip` archives.
- **macOS Entitlements & Hardened Runtime**: Includes Apple Hardened Runtime entitlements for Gatekeeper validation.
- **Retina Icon & Typography Smoothing**: Multi-resolution `icon.icns` (16px to 1024px Retina) and subpixel font antialiasing (`-webkit-font-smoothing: antialiased`).

---

## 📦 Publishing Releases to GitHub

Releases are fully automated with GitHub Actions via `.github/workflows/release.yml`.

### How to Publish a New Release:
1. Update the version number in `package.json` (e.g. `"version": "1.0.1"`).
2. Commit your changes:
   ```bash
   git add .
   git commit -m "chore: bump version to v1.0.1"
   ```
3. Tag the commit and push:
   ```bash
   git tag v1.0.1
   git push origin main --tags
   ```
4. GitHub Actions runs a multi-platform matrix (`windows-latest` and `macos-latest`) and will automatically:
   - Compile and package Windows NSIS (`.exe`) and portable builds.
   - Compile and package macOS Apple Silicon (`arm64`) and Intel (`x64`) `.dmg` and `.zip` bundles.
   - Create a GitHub Release under your repository with all platform assets attached.

> **Data Safety Guarantee**: Upgrades overwrite only application binaries. User manuscript data, story bibles, and settings in system app data are completely isolated and preserved across installations and updates.

---

## ⌨️ Keyboard Shortcuts

Mriter automatically detects your operating system and adapts keyboard shortcuts:

| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Save Manuscript Project** | `Ctrl + S` | `⌘S` |
| **New Manuscript...** | `Ctrl + Alt + M` | `⌥⌘M` |
| **Open Manuscript File** | `Ctrl + O` | `⌘O` |
| **Find Action / Command Palette** | `Ctrl + Shift + A` / `Ctrl + K` | `⌘⇧A` / `⌘K` |
| **Keymap Settings & Preferences** | `Ctrl + Alt + K` | `⌘,` / `⌥⌘K` |
| **Toggle Zen Distraction-Free Mode** | `F11` | `F11` / `⎋` |
| **Toggle Binder Sidebar** | `Ctrl + \` | `⌘\` |
| **Toggle Scene Inspector** | `Ctrl + Alt + I` | `⌥⌘I` |
| **Typewriter Scrolling Mode** | `Ctrl + Shift + T` | `⌘⇧T` |
| **Next / Previous Scene** | `Alt + ↓` / `Alt + ↑` | `⌥↓` / `⌥↑` |
| **Bold / Italic** | `Ctrl + B` / `Ctrl + I` | `⌘B` / `⌘I` |
| **Heading 1 / Heading 2** | `Ctrl + Alt + 1` / `Ctrl + Alt + 2` | `⌥⌘1` / `⌥⌘2` |
| **Insert Scene Break (✦ ✦ ✦)** | `Ctrl + Enter` | `⌘↵` |

---

## 🏗️ Project Architecture

```
mriter/
├── electron/
│   ├── main.ts             # Electron main process (IPC handlers, dialogs, window lifecycle)
│   └── preload.ts          # Secure contextBridge exposure to renderer
├── src/
│   ├── components/
│   │   ├── TitleBar.tsx            # Top header, project title, view switcher, word count meter
│   │   ├── Sidebar.tsx             # Manuscript binder (Front matter, Parts, Chapters, Scenes)
│   │   ├── ZenEditor.tsx           # TipTap rich-text writing surface & paper themes
│   │   ├── SceneInspector.tsx      # Right panel (POV, synopsis, scene goal, status)
│   │   ├── CharacterWorldBible.tsx # Character sheets & world lore entries
│   │   ├── OutlinerMatrix.tsx      # Card-based outline board
│   │   └── PublishStudio.tsx       # Live book preview & EPUB/DOCX export engine
│   ├── context/
│   │   └── ManuscriptContext.tsx   # Project state, auto-save, and CRUD operations
│   ├── types/
│   │   └── manuscript.ts           # Type definitions for project, scenes, and export settings
│   ├── utils/
│   │   ├── initialProject.ts       # Starter manuscript template
│   │   ├── epubGenerator.ts        # Valid EPUB 3 zip generator with metadata & styles
│   │   └── docxGenerator.ts        # William Shunn standard manuscript .docx generator
│   ├── App.tsx                     # Main layout & view router
│   ├── main.tsx                    # React DOM entry
│   └── index.css                   # Tailwind v4 styles & book typography
├── package.json
├── tsconfig.json
└── vite.config.ts
```
