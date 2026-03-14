# How to View Visual Diagrams

All diagrams in the `diagrams/` folder use **Mermaid** syntax, which is supported by many tools and platforms.

## Quick View Options

### Option 1: GitHub (Easiest)
If you push this repository to GitHub, simply open any `.md` file in the `diagrams/` folder directly on GitHub. GitHub automatically renders Mermaid diagrams.

### Option 2: VS Code Extension
1. Install the **Markdown Preview Mermaid Support** extension in VS Code:
   - Extension ID: `bierner.markdown-mermaid`
2. Open any diagram file (e.g., `diagrams/ERD.md`)
3. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to open Markdown preview
4. Diagrams will render automatically

### Option 3: Online Mermaid Live Editor
1. Go to https://mermaid.live/
2. Copy the Mermaid code block from any diagram file (the part between `` ```mermaid `` and `` ``` ``)
3. Paste into the editor
4. View and export as PNG/SVG

### Option 4: Obsidian (Advanced)
1. Install Obsidian: https://obsidian.md/
2. Open the `PulseControl` folder as an Obsidian vault
3. Obsidian has native Mermaid support and will render diagrams automatically

### Option 5: Typora (Markdown Editor)
1. Install Typora: https://typora.io/
2. Open any diagram `.md` file
3. Diagrams render automatically in live preview

### Option 6: Export as PNG/SVG
Using Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagrams/ERD.md -o diagrams/ERD.png
mmdc -i diagrams/Workflow.md -o diagrams/Workflow.png
mmdc -i diagrams/Architecture.md -o diagrams/Architecture.png
```

## Diagram Files Overview

| File | Description | Key Visuals |
|------|-------------|-------------|
| `diagrams/ERD.md` | Database schema relationships | Entity-relationship diagram with all tables, foreign keys, and tenant isolation pattern |
| `diagrams/Workflow.md` | Department workflow processes | End-to-end order flow, approval workflows, notification flows, QA decisions |
| `diagrams/Architecture.md` | System technical architecture | High-level architecture, request flow, multi-tenancy strategy, deployment diagram |

## Recommended Viewing Order

1. **Start with Architecture** (`diagrams/Architecture.md`)
   - Understand the technical stack and how components communicate
   - See tenant isolation at the system level

2. **Review Workflow** (`diagrams/Workflow.md`)
   - Follow the order from creation to shipment
   - Understand approval gates and notification triggers

3. **Study ERD** (`diagrams/ERD.md`)
   - See how data is structured
   - Understand table relationships and tenant boundaries

## Interactive Diagram Features (in supported viewers)

- **Click to zoom**: Most viewers allow zooming on complex diagrams
- **Pan**: Drag to move around large diagrams
- **Export**: Save as image for presentations or documentation

## Customizing Diagrams

All diagrams use standard Mermaid syntax. To modify:

1. Open the `.md` file in any text editor
2. Find the `` ```mermaid `` code block
3. Edit the Mermaid syntax (refer to https://mermaid.js.org/intro/ for syntax)
4. Save and preview using any method above

## Printing Diagrams

For best print quality:

1. Export diagram as SVG using Mermaid Live Editor or CLI
2. Open SVG in Inkscape or Illustrator
3. Adjust page size and export as PDF

## Troubleshooting

**Diagram not rendering?**
- Ensure Mermaid syntax is correct (check for syntax errors)
- Update your viewer/extension to latest version
- Try copying code block to Mermaid Live Editor to validate syntax

**Diagram too large?**
- Use zoom controls in your viewer
- Export as high-resolution PNG/SVG
- Split complex diagrams into smaller sections

## Additional Resources

- Mermaid Documentation: https://mermaid.js.org/
- Mermaid Live Editor: https://mermaid.live/
- GitHub Mermaid Support: https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/
