---
name: feedback-editor
description: Install the visual feedback editor — click-to-annotate UI, single JS file, works in any web project
---

# Feedback Editor Skill

Single-file visual annotation editor. Zero dependencies. One `<script>` tag.

Do NOT generate, modify, or reinterpret the source file. Copy it verbatim.

## Installation

### Step 1

Read the source file at this absolute path:

```
~/.claude/skills/feedback-editor/feedback-editor.js
```

Write its contents verbatim to the project's static assets directory, e.g.:

```
public/feedback-editor.js
```

### Step 2

Add one `<script>` tag to the entry HTML/layout file, immediately before `</body>`:

```html
<script src="/feedback-editor.js"></script>
```

If the project uses Next.js App Router, add to `src/app/layout.tsx`:

```tsx
import Script from "next/script";

// Before </body>
<Script src="/feedback-editor.js" />
```

### Done

A pencil icon appears at top-right. Click to enter edit mode.

## Exclusions

- Do NOT add any buttons, features, or behaviors not present in the source file.
- Do NOT add "导出 JSON" or any export functionality.
- The pencil button lives at top-right (`top:80px; right:16px`).
- The cancel/save buttons live at top-right during edit mode.
- If no `/api/feedback` endpoint exists, feedback is downloaded as JSON file.
