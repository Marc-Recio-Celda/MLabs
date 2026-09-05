---
name: diagram
description: Draws and revises a diagram whose source stays editable — architecture, flow, before-and-after — by writing draw.io XML directly and checking the render without the operator in the loop. Use when a diagram is asked for, when one needs correcting, or when a picture of a system would settle an argument faster than prose.
---

# diagram

**The artefact is XML, not a picture.** A `.drawio` file is plain `mxGraphModel` markup, so a
diagram is editable the same way code is: read it, patch the lines that change, leave the rest.
Treating the output as an image is what makes diagram work expensive — and it is the default
mistake, because the thing everyone looks at *is* an image.

## Occasion

- A diagram is requested, or an existing one needs correcting.
- An explanation keeps failing in prose because the subject is a topology, a flow or a
  before-and-after.

## 1 · The loop, which closes without the operator

1. **Write the XML.** From a description, or from an image the operator sends — the reading of
   that image is the conversion, and there is no tool that does it.
2. **Render it** and **look at the result**. This is the step that gets skipped, and it is the
   one that finds the defects: an element off the page, two edges sharing a segment, a label
   colliding with a box. None of them are visible in the markup.
3. **Patch the XML** and render again.
4. Hand over the `.drawio`, never a flattened image — the operator has to keep editing it.

```
drawio --no-sandbox -x -f png -s 2 -o out.png file.drawio
```

⚠️ **It needs a graphical session** (a live `DISPLAY`). On a locked screen or a headless host it
fails, and then step 2 is not available — say so rather than shipping unrendered XML as if it had
been checked.

⛔ **Never ask for a screenshot in order to edit.** An image costs a great deal to read and cannot
be patched. Ask for the `.drawio`, or for the XML pasted from the editor's own
*Extras → Edit Diagram*. **An image is for judging a result, never for changing one.**

## 2 · What makes iteration cheap

- **Name every `id`.** `api-node`, `browser`, `note-cors` — never the editor's random ids. A named
  id is what lets a change be a one-line patch instead of a re-read of the file.
- **Patch, do not regenerate.** Rewriting the whole file to move one box discards the operator's
  own edits and costs the file twice.
- **Ask for the change, not the diagram.** *"Move X below Y", "make the dashed arrow green"* is a
  patch; *"redo it with X below Y"* is a rewrite.

## 3 · The markup, in the four things that matter

| | |
|---|---|
| **Box** | `<mxCell vertex="1">` with `<mxGeometry x y width height>`. Pixels, origin top-left |
| **Arrow** | `<mxCell edge="1" source="id" target="id">` — bound **by id**, so it follows a box that moves |
| **Waypoints** | `<Array as="points">` inside the edge. This is how an arrow is routed *around* something instead of through it |
| **Appearance** | the `style` attribute, `;`-separated. Everything visual lives here and nowhere else |

An arrow may target a **container** rather than a box inside it — and should, whenever the point
is that the interior is not the caller's business.

## 4 · Review it before handing it over

Read the render against this list. Each line is a defect seen in practice, not a preference.

- **One meaning per colour.** If a fill means *"this moved"*, nothing else may carry it — least of
  all in the panel where nothing has moved yet.
- **Arrows point the way the call goes**, from whoever initiates. Bidirectional arrows erase the
  one thing a topology diagram exists to show.
- **An arrow that does not enter a container must not cross it.** Route it around with waypoints:
  overlapping reads as *"it goes through there"*, which is usually the opposite of the argument.
- **No box appears twice.** Duplicates survive copy-paste and are invisible while editing.
- **Labels are names, not positions.** *"Left — the client"* is a layout instruction that leaked
  into the drawing.
- **Two panels being compared share their geometry.** Same box in the same place in both, or the
  comparison has to be worked out instead of seen.
- **A note sits on what it explains**, and three notes on one arrow is two too many.
- **Nothing crosses the page edge.** Only the render shows this.

## 5 · Verification, as a prediction

The exported PNG shows every element whole and inside the page · each colour carries one meaning ·
every edge leaves the box that initiates · and the operator can open the `.drawio` and move a box
without anything detaching.

## Improving this skill

⚠️ **This file is written from a small number of real sessions and is expected to be wrong in
places.** When a render shows a defect the checklist above did not predict, the fix belongs in §4
as one line, phrased as the defect rather than the remedy — that is what makes it checkable next
time. Growing §4 is the point; growing the rest usually is not.
