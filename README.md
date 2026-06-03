# Xitao Wang Architectural Portfolio

This repository is a static GitHub Pages portfolio website for Xitao Wang. It is built with plain HTML, CSS, and JavaScript, with most editable content stored in `assets/js/site-data.js`.

This README is also the handoff note for continuing work in future Codex conversations. It records the design requirements, implemented changes, current structure, data conventions, and the bugs that have already been fixed.

## Current Site Structure

- `index.html`: main scrolling portfolio page.
- `project.html`: reusable project detail page, driven by `?project=PROJECT_ID`.
- `cv.html`: standalone CV page.
- `assets/js/site-data.js`: main content source for projects, CV-related links, education, experience, activity, photography, and videos.
- `assets/js/main.js`: homepage rendering, selected works rendering, scroll snap, profile "More about me", return-to-project positioning.
- `assets/js/project.js`: project detail rendering, gallery shuffle, lightbox, Previous/Next project transitions.
- `assets/css/styles.css`: all layout, typography, animations, responsive rules.
- `assets/images/projects/`: all project and profile images.
- `assets/pdfs/`: CV PDF only. PDF portfolio download was removed.

Current cache versions after the latest edits:

- `index.html`
  - `styles.css?v=20260602-17`
  - `site-data.js?v=20260603-01`
  - `main.js?v=20260602-13`
- `project.html`
  - `styles.css?v=20260602-17`
  - `site-data.js?v=20260603-01`
  - `project.js?v=20260602-11`
- `cv.html`
  - `styles.css?v=20260602-17`

When editing CSS or JS, bump the relevant query string in the HTML files so the browser loads the new version.

## Local Preview

Preferred local URL:

```text
http://127.0.0.1:5173/index.html
```

If preview shows `ERR_CONNECTION_REFUSED`, restart a local static server from this folder. One working option is:

```powershell
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173/index.html
```

Hard refresh if the page still shows old content.

## GitHub Pages Goal

The site is intended to deploy on GitHub Pages. The user only needed a stable domain first for a QR code/business card; detailed content can continue changing later.

Current target domain discussed:

```text
https://xtwangarch.github.io
```

The site is static, so it can be deployed on GitHub Pages without a backend.

## High-Level Design Requirements

- The website should feel like an architectural portfolio, not a marketing landing page.
- Use the full browser width. Desktop should only keep a small left rail space and a similar small right margin.
- On mobile, remove the right blank margin and let content fill the screen width.
- The page background uses a quiet paper/off-white tone. The old page-wide grid background was removed.
- Keep the left vertical section progress rail on desktop. It is hidden on mobile.
- Section labels like `01 Profile / Overview`, `02 Selected Works`, etc. should remain between major sections.
- Do not add large unnecessary intro blocks before project subsections.
- Keep typography restrained. Smaller headings should be lighter/thinner than the huge cover/project title style.
- General UI/body font is Futura-style/DengXian fallback. Name display uses a serif style as described below.

## Cover And Profile Requirements

### Cover

- First viewport is a full-screen cover.
- Cover can use a full-screen video/visual background.
- A provided `COVER.svg` replaced the old text title on the cover.
- Cover logo fades in slowly at the center.
- Cover text/logo should be white when over the cover visual.
- Clicking anywhere on the cover should scroll to the second page/profile section.

### Profile

- The second page is the profile/overview page.
- Layout: left profile image, right name/title text, profile paragraphs, and buttons.
- Profile image should remain a fixed square crop. Expanding "More about me" must not move or resize the image.
- The profile image and right text gap should be relatively tight.
- Profile name is `Xitao Wang` with case preserved.
- Profile name uses the Alice serif font by Ksenia Erulevich, italic.
- Profile "How to pronounce it?" text uses the body text style/DengXian style, italic, prefixed with `*`.
- Pronunciation hover tooltip text: `Shee-Tao Wang`.
- On cover, the pronunciation line was removed.
- On profile page, `How to pronounce it?` must be black/dark, not white.
- Profile intro text is split into paragraphs:
  - paragraph 1 starts with `Hello! I'm Xitao Wang.`
  - paragraph 2 starts with `I am...`
  - paragraph 3 starts with `My view...`
- The third paragraph is collapsed under an inline text link:

```text
More about me >>
```

- Clicking `More about me >>` reveals the third paragraph; the link then disappears.
- The `More about me >>` text should match body font/size but use the accent color.

### Profile Buttons

Current buttons on profile:

- `View CV`
- `Download CV`
- `MSA Graduate Page`

The old `Download Portfolio` / PDF portfolio feature was removed.

## Selected Works Requirements

### Sections

Current work groups:

- `Academic Projects`
- `Professional Works`
- `Research`

`Internship / Professional Work` was renamed to `Professional Works`.

`Research / Writing` was renamed to `Research` for the section/category. The project title may still say `Research / Writing 01` unless changed later.

### Project Card Layout

- Each project card is a large split layout: cover image on one side, title/metadata on the other.
- Cover images alternate left/right by project index.
- On hover over the cover image or title/content area, metadata appears.
- Metadata should appear only when hovering the image or project title/content.
- Metadata lower edge should align with the cover image lower edge.
- When image is on the right, title and metadata on the left should be right-aligned.
- Project cover hover overlay text uses the same serif family as profile name, but not italic and with a very light weight.
- Project cover hover overlay text should be smaller than before.
- The right-side project title in the normal card is bold and larger than body text.
- In mobile view, project name/metadata must not overlap the next project image.

### Selected Works Snap Behavior

This has been debugged several times. Current behavior should be:

- Scrolling from cover goes to profile.
- Scrolling from profile goes to selected works / first academic project.
- Each selected work project snaps independently.
- On snap, the visual group `cover image + project title/metadata area` must be vertically centered in the visible viewport below the fixed header.
- A screen should show only one project. The next project cover must not peek at the bottom.
- Scrolling upward from project 2 to project 1 must not jump to cover.
- Scrolling upward from selected works should return to profile, not cover.
- Returning from a project detail page using `Back to Selected Works` should position the corresponding project exactly centered.

Implementation notes:

- `main.js` uses `data-snap-stop` and `data-snap-kind="project"`.
- `stopTop()` now aligns by the visual center of `.project-media` and `.project-content`, not by whole card height.
- `setupProjectReturn()` performs multiple post-load alignment checks because browser hash scrolling and image loading can otherwise push the result too low.
- `history.scrollRestoration` is set to `manual`.

## Project Detail Page Requirements

### General

- Project detail page is `project.html?project=PROJECT_ID`.
- Title size was reduced so title, metadata, and brief can fit better on first view.
- Project title supports manual line breaks in `site-data.js` using `\n` or `titleLines`.
- Brief supports paragraph breaks using blank lines (`\n\n`).
- `My Role`, `Idea`, and `Execution` blocks were removed from project detail rendering unless explicitly re-added later.
- Brief remains above the first image.
- Brief is left-aligned.
- Brief has a slightly larger distance from metadata.

### Feature/Impression Image

- The first item in each project's `gallery` is used as the fixed top `Impression` / feature image.
- This top image is no longer full bleed.
- It has the same width as the gallery below.
- It remains fixed at the top of gallery order and is not randomized.
- It is static: no hover enlargement and no click-to-lightbox.
- For Chaoyin Temple, `External View` was moved to the first gallery item so it becomes the top impression image.

### Gallery

- Images after the first gallery item are randomly shuffled each time the detail page loads.
- Gallery is a three-column masonry-style layout on desktop.
- Gallery is one column on mobile.
- Gallery total width is centered and aligned with the feature image.
- Unless later marked otherwise, gallery images do not show captions/text below them.
- Captions can still be shown if a gallery item has `showCaption: true`.
- Individual gallery items can span all columns with `layout: "full"`, but this was rolled back for `Enigma Field` and `Site History`.
- `cover` images must not be placed in `gallery`.

### Lightbox

- Gallery images can be clicked to open a large image preview.
- Lightbox has Previous/Next arrows.
- Lightbox open animation and image-switching animation have ease-out behavior.
- Lightbox must appear in the current viewport center, not at the page top.
- This was fixed by moving `#image-lightbox` to `document.body` after rendering, so `position: fixed` is not affected by transformed parent containers.
- Large image modal should have no extra visible frame beyond the image itself.

### Project Page Animations

- Project page entering animation lasts about `0.82s` now.
- Previous/Next project button click triggers a `0.5s` exit animation before navigation.
- Impression and gallery images reveal on scroll.
- All reveal/fade animations should start from `opacity: 0` and slowly increase to `opacity: 1` while easing out from a slight vertical offset.
- Shared CSS variables:
  - `--reveal-ease`
  - `--reveal-opacity-duration`
  - `--reveal-transform-duration`

## CV Page Requirements

The CV page is `cv.html`.

### Layout

- Top CV name should use the same Alice serif style as profile.
- CV has a `Back to Portfolio` link.
- Returning from CV should preserve context:
  - If opened from profile, return to profile/profile-intro.
  - If opened from contact, return to contact.
- CV content includes:
  - About
  - Contact
  - Softwares
  - Skills
  - Work Experience
  - Education
  - Activity

### About / Contact / Skills / Softwares

- Nationality was removed from About.
- About is its own row.
- Contact is a card to the right of About.
- Interests are text in About, not tag pills.
- Interests include:
  - Adaptive Reuse
  - Heritage Study
  - Vernacular & Indigenous Architectural Study
  - Renovations
  - Extensions
  - Cultural Architecture
  - Public Architecture
- Softwares replaced the old Interests tag area and uses tag/pill layout.
- Softwares:
  - AutoCAD
  - Adobe Suites (Photoshop / Illustrator / InDesign)
  - BIM (Revit)
  - 3D Design (SketchUp, Rhinoceros)
  - Rendering (V-Ray / Enscape / D5)
  - Microsoft Office Suites
  - Video Editing (Adobe Premiere / After Effects)
  - Video Colour Grading (DaVinci Resolve)
- Skills:
  - Team Collaboration
  - Physical & Digital Model Making
  - Design development and visual communication
  - Liaison & Presentation
  - Graphic Design and Layout
  - Project documentation
  - Photography & Videography
  - Video Editing & Colour Grading

### Work Experience / Education / Activity

- Timeline visual design was abandoned because it was too complex.
- Experience section was replaced by clean vertical CV sections.
- `Timeline` heading became `Experience`.
- Work Experience and Education were swapped on the CV page.
- Work Experience title is black, not blue.
- Section layout: left section heading, right content column.
- Work/Education/Activity group separators only between major sections, not between every item.
- Small labels in CV should be slightly larger/readable.
- The second line in CV item headings, such as dates/role, should not be bold.
- KKAA bullet descriptions should not be italic.
- CCTEG work summary text width should align with KKAA content and use justified text with the last line left-aligned.

## Current Project Data

All project data is in `assets/js/site-data.js`.

Current projects:

1. `academic-01`
   - Category: `Academic Projects`
   - Title: `Mycelium Cave Manchester`
   - Cover: `assets/images/projects/academic-01/project1_cover.jpg`
   - Gallery count: 18

2. `academic-02`
   - Category: `Academic Projects`
   - Title: `Paris Rive Gauche / Sorbonne University Complex`
   - Cover: `assets/images/projects/academic-02/project2_cover.jpg`
   - Gallery count: 16

3. `academic-03`
   - Category: `Academic Projects`
   - Title: `Elevated Village`
   - Cover: `assets/images/projects/academic-03/project3_cover.jpg`
   - Gallery count: 12

4. `academic-04`
   - Category: `Academic Projects`
   - Title: `Rhythmic Oasis Venue`
   - Cover: `assets/images/projects/academic-04/project04_cover.jpg`
   - Gallery count: 19
   - This project was added after `Elevated Village`.

5. `internship-01`
   - Category: `Professional Works`
   - Title: `Hangzhou Chaoyin Temple`
   - Cover: `assets/images/projects/professional-01/project1_cover.png`
   - Status: `On going`
   - Architect: `Kengo Kuma`
   - Gallery count: 8
   - Feature/impression image: `External View` (`project1_external.jpg`)

6. `internship-02`
   - Category: `Professional Works`
   - Title: `Hanling Museum of Fine Art`
   - Cover: `assets/images/projects/professional-02/project2_cover.jpg`
   - Year: `2022`
   - Location: `Ningbo, Zhejiang Province, China`
   - Use: `Gallery / Museum / Culture`
   - Status: `Completed`
   - Architect: `Kengo Kuma`
   - Area: `4175 m²`
   - Website: `https://kkaa.co.jp/en/project/hanling-museum-of-art/`
   - Gallery count: 6

7. `internship-03`
   - Category: `Professional Works`
   - Title: `Whitestone Gallery Beijing`
   - Cover: `assets/images/projects/professional-03/project3_cover.jpg`
   - Year: `2023`
   - Location: `Beijing, China`
   - Use: `Gallery / Museum / Culture`
   - Status: `Completed`
   - Architect: `Kengo Kuma`
   - Area: `523 m²`
   - Website: `https://kkaa.co.jp/en/project/whitestone-gallery-beijing-798/`
   - Gallery count: 6

8. `research-01`
   - Category: `Research`
   - Title: `Research / Writing 01`
   - Cover: currently empty
   - Gallery count: 4

## Professional Works Specific Notes

### Hangzhou Chaoyin Temple

Current metadata:

- Year: `2023`
- Location: `Hangzhou, China`
- Use/type: `Religous / Cultural / Hospitality / Public Architecture` (note spelling can be corrected later)
- Role: `Architectural intern`
- Status: `On going`
- Architect: `Kengo Kuma`

Image folder:

```text
assets/images/projects/professional-01/
```

Files detected/used:

- Cover: `project1_cover.png`
- Feature/impression: `project1_external.jpg`
- Gallery:
  - `OPA2-2.png`
  - `project1_claddingdesign1.jpg`
  - `project1_claddingdesign2.jpg`
  - `project1_lightdesign.jpg`
  - `project1_render1.png`
  - `project1_render2.png`
  - `project1_render3.png`

### Hanling Museum of Fine Art

Image folder:

```text
assets/images/projects/professional-02/
```

Files detected/used:

- Cover: `project2_cover.jpg`
- Gallery:
  - `project2_exploded.jpg`
  - `project2_nightrender.jpg`
  - `project2_render1.jpg`
  - `project2_render2.png`
  - `project2_render3.jpg`
  - `project2_render4.jpg`

Brief was rewritten from the user's reference text and CV information:

- Paragraph 1: Dongqian Lake site, Ningbo/Xiangshan Port context, peninsula, "small mountain" concept, merging with landscape.
- Paragraph 2: site visit during internship, final publication drawings, visualization renderings, external presentation/documentation.

### Whitestone Gallery Beijing

Image folder:

```text
assets/images/projects/professional-03/
```

Files detected/used:

- Cover: `project3_cover.jpg`
- Gallery:
  - `project3_plan1f.jpg`
  - `project3_plan2f.jpg`
  - `project3_plan3f.jpg`
  - `project3_render1.png`
  - `project3_render2.png`
  - `project3_render3.png`

Brief was rewritten from the user's reference text and CV information:

- Paragraph 1: Beijing 798 Art District, Bauhaus factory site, folded aluminium panel canopy with wood grain, bamboo forest-like corridor, white walls, arched roof, exposed concrete, artwork floating in space.
- Paragraph 2: plan/section drawings for KKAA publication and external media including website and ArchDaily.

## Image And Content Editing Rules

### Add Or Replace A Project Cover

1. Put the cover image in the correct project folder.
2. Update the `cover` field in `assets/js/site-data.js`.
3. Do not also put the cover image in `gallery`.

Example:

```js
cover: "assets/images/projects/academic-01/project1_cover.jpg"
```

### Add Gallery Images

Add objects to the project's `gallery` array.

```js
gallery: [
  { label: "Image Label", image: "assets/images/projects/project-folder/image.jpg", caption: "" }
]
```

Rules:

- First gallery item becomes the top feature/impression image.
- Later gallery items are randomized on page load.
- Captions are hidden by default unless `showCaption: true` is added.
- Optional full-width gallery item:

```js
{ label: "Large Drawing", image: "path/to/image.jpg", caption: "", layout: "full" }
```

### Manual Line Breaks

Project title line breaks:

```js
title: "Line One\nLine Two"
```

or:

```js
titleLines: ["Line One", "Line Two"]
```

Brief paragraph breaks:

```js
brief: "First paragraph.\n\nSecond paragraph."
```

Single line breaks inside a paragraph can use `\n`.

## Removed Or Rolled Back Work

- Removed PDF portfolio download feature and associated buttons.
- Removed `Download Portfolio` button from profile/contact.
- Contact button behavior changed to CV-related actions and MSA Graduate Page.
- Removed unnecessary large intro/hero blocks before selected works subsections.
- Removed page-wide grid background.
- Removed extra grey separator lines.
- Removed small numeric counters on the right of work subsection headings.
- Timeline visual design was abandoned; replaced with vertical CV-style Experience/Education/Activity sections.
- Interactive dot-map "My Study Journey" profile image concept was rolled back.
- `Enigma Field` and `Site History` were briefly made full-width gallery items, then rolled back to normal three-column gallery items.
- Cover `How to pronounce it?` was removed.
- Project detail `My Role / Idea / Execution` sections were removed from rendering.

## Bugs Already Fixed

- Local preview failing with `ERR_CONNECTION_REFUSED`: restart server on port `5173`.
- Selected works scroll snap jumping back to cover when scrolling upward.
- Project-to-project snap not centering.
- Project snap showing next project cover at bottom.
- Returning from detail page to selected works positioned too low.
- Profile "More about me" expansion moving/resizing the profile image.
- Mobile project metadata overlapping the next project.
- Lightbox opening at page top instead of viewport center.
- Feature/impression image being full bleed when it should align with gallery width.
- Gallery captions/text showing when not wanted.
- Browser caching stale data: fixed by bumping `?v=` versions.

## Testing Notes

Automated checks have been run with headless Edge using Chrome DevTools Protocol scripts. Temporary folders named `.tmp-edge-*` were created during testing. They are local testing artifacts and should not be committed unless intentionally needed.

Important checks performed:

- Selected works snap:
  - each project visual center aligns with viewport center within about 1px.
  - next project cover is not visible after snap.
- Return from detail page:
  - `Back to Selected Works` lands on the correct project and centers it.
- Project detail gallery:
  - feature image and gallery have matching width.
  - gallery computes as 3 columns on desktop.
- Lightbox:
  - parent is `BODY`.
  - position is `fixed`.
  - large image opens centered in current viewport.
- Reveal animation:
  - gallery items start at `opacity: 0`.
  - reveal transitions use opacity and transform.

## Future Work Checklist

- Replace placeholder social links in `assets/js/site-data.js`:
  - email
  - LinkedIn
  - Instagram
  - YouTube
  - MSA Graduate Page
- Replace placeholder research project content and images.
- Review spelling in Chaoyin metadata:
  - `Religous` should probably become `Religious`.
- Fill missing professional/academic gallery captions only where desired.
- Update CV PDF file in `assets/pdfs/Xitao_Wang_CV.pdf`.
- Confirm GitHub Pages deployment after each major content update.
- Keep bumping cache versions in HTML after edits to CSS/JS/data.

## Quick Handoff Prompt For Future Codex Conversations

Use this if starting a new chat:

```text
Please read README.md first. This is Xitao Wang's static architectural portfolio. Most content is in assets/js/site-data.js. Preserve the current design rules: full-screen cover, profile second page, selected works project-by-project snap using visual center, project detail feature image same width as gallery, three-column randomized gallery, fixed centered lightbox, and opacity-from-0 reveal animations. Do not reintroduce PDF portfolio download, large unused section intro blocks, timeline visual design, or page-wide grid background.
```
