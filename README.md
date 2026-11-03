# 🌳 Kutumb — Family Tree App

A modern, high-performance family tree web application built with Next.js 16, HTML5 Canvas, and MongoDB. Features real-time pan/zoom navigation, Gujarati/English dual-language support, intelligent search, and a complete style engine — **100% zero-cost stack**.

## ✨ Features

| Category | Features |
|---|---|
| **Canvas Engine** | 60 FPS RAF loop, pan/zoom, pinch-to-zoom, viewport frustum culling |
| **Semantic Zoom** | Macro (< 40%) → Medium (40–85%) → Detail (> 85%) rendering |
| **Localization** | Gujarati primary names, one-click EN/ગુ toggle |
| **Search** | Fuzzy + phonetic Gujarati transliteration search |
| **Edit Mode** | Drag nodes, add/delete, relationship editor, style panel |
| **Style Engine** | Dot/Grid/Cross backgrounds, Snap-to-grid, Curved/Step/Zigzag edges |
| **Photo Editor** | Client-side crop/mask (circle or square), no server upload |
| **Tree Collapse** | Per-subtree collapse/expand with +N indicators |
| **Stats Panel** | Counts, avg lifespan, generational depth, relationship calculator |
| **Timeline** | Birth-year histogram with click-to-focus navigation |
| **Minimap** | Corner viewport thumbnail for large trees |
| **Undo/Redo** | 50-step command history |
| **Export/Import** | One-click JSON backup and restore |
| **Error Detection** | Real-time circular reference detection (red highlight) |
| **Multi-tree** | Create and manage multiple independent family trees |

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- pnpm 8+
- MongoDB Atlas free account (or local MongoDB)

### 2. Install

```bash
cd family
pnpm install
```

### 3. Environment Setup

Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/familytree?retryWrites=true&w=majority
```

Get your connection string from [MongoDB Atlas](https://cloud.mongodb.com/) → Database → Connect → Drivers.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel (Free)

```bash
pnpm add -g vercel
vercel
# Add MONGODB_URI in Vercel dashboard → Project Settings → Environment Variables
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                  # Home — Tree selector
│   ├── tree/[treeId]/
│   │   ├── page.tsx              # Server wrapper (Suspense)
│   │   └── TreePageClient.tsx    # Client canvas page
│   └── api/
│       ├── trees/route.ts        # GET, POST trees
│       ├── trees/[id]/route.ts   # GET, PATCH, DELETE tree
│       ├── nodes/route.ts        # GET, POST, PUT (bulk import)
│       └── nodes/[id]/route.ts   # GET, PATCH, DELETE node
├── components/
│   ├── canvas/
│   │   ├── FamilyCanvas.tsx      # Canvas component
│   │   ├── useCanvasEngine.ts    # RAF loop + input handling
│   │   └── NodeRenderer.ts      # Draw nodes, edges, grid, minimap
│   └── ui/
│       ├── Toolbar.tsx           # Top toolbar
│       ├── SearchPanel.tsx       # Fuzzy search overlay
│       ├── NodeEditor.tsx        # Person editor panel
│       ├── StylePanel.tsx        # Canvas style controls
│       ├── StatsPanel.tsx        # Statistics + relationship calc
│       ├── Timeline.tsx          # Birth-year histogram
│       ├── PhotoCropper.tsx      # Client-side photo editor
│       └── TreeSelector.tsx      # Home page list
├── lib/
│   ├── db.ts                     # MongoDB connection
│   ├── models/Tree.ts            # Mongoose Tree schema
│   ├── models/Node.ts            # Mongoose Node schema
│   ├── culling.ts                # Viewport frustum culling
│   ├── layout.ts                 # Reingold-Tilford layout + relationship calc
│   └── gujarati.ts               # Phonetic transliteration + fuzzy search
├── store/treeStore.ts            # Zustand global state
└── types/index.ts                # TypeScript types
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+F` | Open search |
| `Esc` | Close panels / deselect |
| `+` / `-` | Zoom in / out |
| `Home` | Reset view |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |

## 📦 Zero-Cost Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Canvas | HTML5 Canvas API (pure, no React Flow) |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Database | MongoDB Atlas Free Tier |
| Hosting | Vercel Hobby Plan |
