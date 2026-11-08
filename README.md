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

### Packaging Desktop Installers (.exe, .dmg, .AppImage)
```bash
# Build desktop installer for your current OS
npm run dist

# Specific platforms:
npm run dist:win    # Windows installer & portable executable (.exe)
npm run dist:mac    # macOS DMG (.dmg)
npm run dist:linux  # Linux AppImage
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Save Manuscript Project (`.mriter`) |
| `Ctrl + B` | Bold text |
| `Ctrl + I` | Italic text |
| `Ctrl + Alt + 1` | Chapter Heading 1 |
| `Ctrl + Alt + 2` | Section Heading 2 |
| `F11` | Toggle Zen Distraction-Free Mode |
| `Esc` | Exit Zen Mode |

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
