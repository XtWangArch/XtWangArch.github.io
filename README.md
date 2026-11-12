# Xitao Wang Architectural Portfolio

This repository is a static GitHub Pages portfolio website for Xitao Wang. It is built with plain HTML, CSS, and JavaScript, with most editable content stored in `assets/js/site-data.js`.

## Loading And Download Buttons (2026-11-12)

- Reverted the Liquid Glass experiment completely. The original orange three-second XITAO / PORTFOLIO percentage loading animation and expanding type-mask transition are restored. The original Hero video, inverse dots and breathing logo are unchanged. The ReactDrops files, React entry and build configuration were removed; no React build is required.
- Profile and Contact's **Download CV & Portfolio** links now use the same dark-red accent fill and hover treatment as **View CV**. They retain the combined PDF URL and native `download` behavior. Each matches its section's **Email Me** button dimensions: Profile 176 x 36px (shrinks with the narrow-screen contact column), Contact 260 x 62px (constrained to available width). The separate CV page is unchanged.
- Local preview: `http://127.0.0.1:5173/index.html`. These changes have not been pushed to GitHub.

This README is also the handoff note for continuing work in future Codex conversations. It records the design requirements, implemented changes, current structure, data conventions, and the bugs that have already been fixed.

## Latest Navigation Rules (2026-11-02)

These rules supersede the older floating-progress/circle-to-square notes below; those remain as change history.

- Keep only the right-hand floating primary menu. Remove the left triangle, its hover drawer, Dock effect and gathering animation. Restore the original compact numbered vertical progress rail and its single `rail-progress` element. Hide it and make it inert on Cover, Profile and Portfolio selection; show it on desktop only after entering either portfolio, including subsequent Experience/Other Work/Contact sections. The original mobile rule still hides this rail.
- The right-hand menu is now an orange triangle. Opening rotates the shape counterclockwise by 30 degrees; the upright Lucide hamburger still animates into an X. Preserve click disclosure, transparent right-aligned links, proximity-based Dock magnification, dark backdrop, outside-click/Escape dismissal and focus restoration.
- During either Architecture or Photography entry, retain the outgoing white header inside the chooser's inverse radial mask. Freeze its computed paint/layout before preparing the destination. The real, black destination header is already visible beneath that mask, so navigation never disappears and then reappears. Its six link labels hand off at identical positions to the gathering copies only after the radial reveal finishes.
- Sequence: radial reveal/crossfade completes first; black labels settle for 150 ms; the six links gather with the existing per-arrival compression/rebound; the small collection circle travels to the right and morphs into the final triangle. The brand fades gently. There is no left-side collection sequence. Header measurement is retained for existing scroll offsets and project centering.
- Prepare the initial architecture focus/metadata state and decode the first cover under the mask. The decorative mask does not block hover hit-testing; capture-phase pointer/click guards prevent accidental navigation during the reveal. Thus hover metadata is prepared underneath, not triggered only when the mask disappears. Photography reset returns its readiness promise and settles the initial feature before reveal; later carousel/category animations and autoplay are unchanged. No invented commercial photos are saved.
- Resize during the reveal refreshes the pending incoming label geometry without hiding its header. Returning to Profile/Portfolio, page exit and reduced-motion paths clear temporary layers. The backdrop does not lock scrolling or change scrollbar width.
- Main files: `index.html`, `assets/js/floating-navigation.js`, `assets/css/floating-navigation.css`, `assets/js/portfolio-portal.js`, `assets/js/main.js`, `assets/js/photography.js`. Public references to changed scripts/styles use cache version `20261102-10`.
- Regression coverage includes outgoing header freezing, one stable progress rail, delayed gathering, triangle rotation, accessibility cleanup and photography readiness. Desktop/mobile browser checks cover both branches, the radial handoff, menu state and reduced motion; existing portal crossfade, scrollbar width and forward/reverse project snapping checks also pass. Changes are local only; no GitHub push was requested.

## Photography & Film Making Update (2026-11-02)

- The chooser, photography detail-page titles and accessible portfolio label now use **Photography & Film Making**. Existing URLs/IDs remain unchanged, so album and return links still work.
- Category order is now **Commercial -> Film -> Journey -> Landscape**, including keyboard and wheel/touch boundaries. Film uses `videos.featured` followed by `videos.items` from `assets/js/site-data.js`: the existing four YouTube players, in order, with no extra Video 01/02 headings. Two columns on desktop, one on phones; players retain 16:9 proportions and full-screen controls. The **Other Work** footer links to `links.youtube` (`https://www.youtube.com/@lucaswang6740`). Leaving the Film tab removes its players.
- Manage videos in the existing local CMS **摄影与视频 -> 视频** editor; Film and Architecture's Other Work share that single source. The **摄影与影片作品集** settings include `photoSettings.filmLabel`. Film is a video directory, not a new photo-collection `kind`; existing collection schemas and photo uploads are unchanged.
- In the Photography & Film Making branch, the old bottom Photography/Videography section is hidden and its media is unmounted, avoiding duplicated players and offscreen audio. Its Other Work entries are omitted from both navigation lists. Visible progress steps are renumbered in order. Architecture retains its original Other Work content and all six navigation destinations.
- The incoming header can now have five links while the outgoing chooser has six. Capture the currently painted destination label positions at mask completion, then gather only visible links. Collection/rebound timing adapts to the actual link count; preserve the uninterrupted white/outgoing -> black/incoming -> gathering sequence.
- Tab underlines now draw at their real CSS width instead of scaling a 1 px strip. Convert client-rectangle coordinates back into the category bar's local layout coordinates before positioning, avoiding double scaling under page zoom/transforms. Keep smooth position/width transitions, late-font remeasurement and reduced-motion behavior. Wrapped tabs place the marker under the correct row; narrow screens keep four compact controls without horizontal overflow.
- Browser verification reproduced the legacy coordinate mismatch at 125% page scaling and checked corrected marker bounds at 80/100/125/150% scales, 1280/1366 laptop sizes, 1920 desktop, 320/393 phones, fractional DPR, all four categories, Film loading/teardown, channel link, wheel return, five-link portal handoff and CMS label editing. Public changed-resource cache version: `20261102-11`. No GitHub push was requested.

## Circle And Film Scroll Revision (2026-11-02)

- The right-hand menu is back to its original orange circle: 50 px desktop / 42 px mobile inside the existing 78/64 px hit area. Remove the triangle, counterclockwise rotation and final circle-to-triangle morph. Preserve header collection/rebound/travel, post-mask timing, hamburger/X, click disclosure, Dock magnification and dimmed backdrop. This supersedes the triangle rules above; the restored left progress rail is unchanged.
- Film's desktop grid now derives its width from the available viewport height, toolbar/header measurements and actual video-row count. Four 16:9 players and the channel footer fit in the desktop screen, so the usual wheel handler can advance Film -> Journey immediately instead of reading an over-height page. Phones retain one column and natural reading through all four videos before moving on.
- YouTube iframe wheel events do not bubble to the parent. While desktop Film is aligned, watch the resulting native page scroll too: an offset of 24 px switches to Journey downward or Commercial upward and realigns the portfolio section. Reset this guard outside Film, during category/portal transitions, on mobile, on resize and when the hash changes to another section. Reuse the category-change cooldown so inertia does not skip multiple categories. Native video controls remain usable; no click-blocking layer was placed over the players.
- Changed public assets use cache version `20261102-12`. Regression tests cover the round control, player aspect ratios/viewport fit and both parent-page and iframe-origin scrolling. No GitHub push was requested.

### Film Player Entrance

Film entrance refinement (`20261102-13`): the four players fade from opacity 0 and rise 12 px with a 600 ms ease-out, staggered 110 ms in reading order. Re-entering Film recreates the sequence; delays are capped for future larger video lists. Reduced motion shows players immediately. Layout, video sources and wheel/category behavior are unchanged.

Entrances wait for each iframe's load event and its predecessors' readiness, with a 2-second fallback for slow/offscreen embeds so an unavailable player never blocks the list indefinitely. Leaving/replacing Film aborts pending load listeners and timers; changing to reduced motion reveals the full list immediately.

### Progress Centering And Dock (`20261102-14`)

The classic left progress rail now uses `top:50%` and `translateY(-50%)`, sharing the right circle's vertical centerline for both the six-step Architecture and five-step Photography branch. Its original thin track/compact rows remain; it is still hidden on Cover/Profile/Portfolio and on mobile. Pointer proximity and keyboard focus magnify inner labels/numbers with the same smoothed cosine Dock logic as the right menu, anchored to the left. Row sizes and click targets do not change; growth is capped before the main content edge. Pointer leave, blur, resize, return navigation and reduced motion reset the effect. Progress fill uses untransformed row/number measurements so hovering cannot change its target positions. No left triangle, drawer or backdrop was reintroduced.

### Faster Film And No-Jump Scrolling (`20261102-15`)

This supersedes the load-wait and post-document-scroll behavior recorded above. Film no longer waits up to two seconds or for preceding iframe load events: players request eagerly and start a 350 ms ease-out immediately, staggered 70 ms. Entering Film uses a 100 ms outgoing fade and the individual player entrances, without an extra whole-directory entrance. Transitions from Film to Commercial/Journey crossfade at a fixed vertical position instead of translating the whole directory.

For desktop iframe wheel input, Film now has a scrollbar-free, overscroll-contained viewport. A tiny internal scroll range detects direction; sticky content stays visually pinned while that range moves. Its center uses the actual browser-reported scroll position, including fractional scaling. The event is consumed inside Film and switches category without moving `window.scrollY`; there is no global scroll-and-pull-back handler or transparent layer blocking video controls. Native scrollbars/page width stay unchanged. Mobile retains the normal one-column reading layout. Keep testing frame-by-frame document/toolbar/player positions, not only final category/scroll positions, so a temporary bounce cannot pass verification.

## Local Content Management

The local CMS runs only on this computer. GitHub Pages remains the public static website; no paid hosting, database, account or public admin service was added.

1. Double-click `启动内容管理.cmd` in the website folder and leave its terminal open.
2. Open `http://127.0.0.1:5174/admin/`.
3. Edit content, then click **保存全部更改**. Unsaved preview does not write website files. Local browser drafts can be resumed after reopening the manager.
4. Open the website from the toolbar to check the saved version. Push the changed website files and uploaded assets to GitHub separately when ready to publish. Saving is not publishing.

Management areas:

- **案例与图库:** create, duplicate, delete and reorder cases; edit titles, line breaks, metadata, Brief, cover and logo; choose Architecture or Photography; batch-upload gallery images, change their titles/captions, reorder, replace or remove references, select the first Impression, configure full-width items and random ordering.
- **页面文字:** select the home page, CV or shared project detail labels; edit text and image/video references in forms, or select an element in the preview. Profile paragraphs, About, skills, interests, buttons, navigation and Contact copy are included. Dynamic case and experience content is edited in its dedicated section.
- **经历与教育:** work, education and activity entries now share one content source between the home page and CV, including descriptions, dates and role/degree lines.
- **摄影与视频:** edit Other Work's photography preview and YouTube list; standard YouTube watch URLs populate an embed URL automatically. Photography cases can be added through the case manager; its Works branch stays empty until cases are added.
- **链接与文件:** email/social/MSA links and the downloadable PDF CV.
- **保存记录:** restore a previous content save. The current version is backed up again before restoration.

Storage and safety:

- Cases, gallery metadata, experiences and links remain in `assets/js/site-data.js`. Saving serializes this as readable JSON-compatible JavaScript; unknown existing fields are retained.
- Page text/image overrides live separately in `assets/js/page-content.js`, so the existing HTML/CSS layout is preserved. Use the manager for these overrides; reset a page's overrides to restore its HTML defaults.
- New media goes into `assets/images/uploads/`, `assets/pdfs/uploads/` or `assets/video/uploads/` with collision-resistant filenames. Existing files are not moved. JPG/PNG/WebP uploads get responsive previews automatically when Pillow is available; otherwise their originals still work. New SVG uploads are deliberately blocked; existing SVGs can be selected from the library.
- Removing a case or gallery image does **not** destroy its original media. This permits content recovery and safe reuse of the same image in multiple places.
- Backups are in `.local-admin/backups/`, excluded from Git. Local drafts stay in that browser profile. File-conflict detection prevents saving over content changed by another editor/window without reloading.
- Save updates data-script cache versions in the HTML files. Re-uploading a replacement image produces a new filename rather than a stale browser cache.
- The service binds `127.0.0.1` only, rejects unexpected Host/Origin headers, requires a random per-process token for APIs, blocks private repository files, restricts upload types and validates saved links/IDs. This is a local tool, not an internet login system. Do not expose its port publicly.
- The service requires Node.js; the launcher uses installed Node or the bundled Codex runtime on this machine. Image preview generation uses Python/Pillow, with an original-image fallback.
- Lucide icons are vendored in `admin/vendor/` with their license; the manager itself has no CDN dependency.

Tests: `node --test tests/admin.test.cjs tests/site.test.cjs tests/cover.test.cjs tests/portfolio-portal.test.cjs`. Browser CRUD tests use an isolated copy outside the repository, never the real content files.

## Current Site Structure

- `index.html`: main scrolling portfolio page.
- `project.html`: reusable project detail page, driven by `?project=PROJECT_ID`.
- `cv.html`: standalone CV page.
- `photography.html`: legacy address redirecting to the empty `index.html#photography-works` branch; its gallery/design is intentionally deferred.
- `assets/js/site-data.js`: main content source for projects, CV-related links, education, experience, activity, photography, and videos.
- `assets/js/page-content.js`: local CMS text/media overrides for static page content.
- `admin/`: local content manager interface; `scripts/admin-server.cjs` provides its localhost-only API and preview server.
- `assets/js/main.js`: homepage rendering, selected works rendering, scroll snap, profile "More about me", return-to-project positioning.
- `assets/js/cover.js`: responsive cover video, floating inverse-color dots, pause control, visibility and reduced-motion handling.
- `assets/js/portfolio-portal.js`: guarded circular-mask transitions from the portfolio selector, with a reduced-motion fade.
- `assets/js/project.js`: project detail rendering, gallery shuffle, lightbox, Previous/Next project transitions.
- `assets/css/styles.css`: all layout, typography, animations, responsive rules.
- `assets/images/projects/`: all project and profile images.
- `assets/pdfs/`: CV PDF only. PDF portfolio download was removed.

Current cache versions after the latest edits:

- `index.html`
  - `styles.css?v=20261101-04`
  - `site-data.js?v=20260603-05`
  - `page-content.js?v=20261101-admin-01`
  - `image-manifest.js?v=20261030-01`
  - `shared.js?v=20261101-admin-01`
  - `cover.js?v=20261031-02`
  - `portfolio-portal.js?v=20261031-03`
  - `main.js?v=20261101-admin-01`
- `project.html`
  - `styles.css?v=20261031-05`
  - `site-data.js?v=20260603-04`
  - `page-content.js?v=20261101-admin-01`
  - `image-manifest.js?v=20261030-01`
  - `shared.js?v=20261101-admin-01`
  - `project.js?v=20261101-admin-01`
- `cv.html`
  - `styles.css?v=20261031-05`
  - `page-content.js?v=20261101-admin-01`
  - `shared.js?v=20261101-admin-01`
- `photography.html`
  - `styles.css?v=20261031-06`

When editing CSS or JS, bump the relevant query string in the HTML files so the browser loads the new version.

## Local Preview

### 2026-11-01 Legibility And Progress

- Latest logo revision: removed the backplate and logo inversion entirely, restoring plain white lettering. Its display width is doubled: desktop `min(152vw, 1960px)` and mobile `min(164vw, 1960px)`. Transparent SVG margins extend beyond the viewport while the visible artwork stays centered; entry/reduced-motion transforms account for its optical center. The dots still invert against the original-color video. No keyline or background is rendered.
- Portfolio's portrait, caption and entry links move upward together by `--portfolio-lift` (5svh, bounded to 28-56px). The scroll-linked portrait automatically uses the new destination.
- Rail activation no longer depends on the order of IntersectionObserver callbacks. The line now interpolates between actual visible section anchors and their numbered rail markers, instead of using whole-document scroll percentage. Long Works lists stay within the Works interval; Photography maps to the same Works marker. Hidden branches are excluded. Measurements update on scroll, resize, font readiness and main-content resize.

### 2026-11-01 Cover Color

- Restored the video's original color appearance: footage opacity is 1 with no saturation/contrast filters. The existing full-duration web-optimized desktop/mobile MP4 files remain the playback sources; the original large source file is unchanged.
- Dots use `mix-blend-mode: difference` against the moving video, isolated at `.hero-grid`. Logo inversion was subsequently removed in favor of the enlarged plain-white logo described above.
- Logo breathing retains its scale movement but no longer reduces opacity, preserving full-strength inversion after the entrance fade. Pause, reduced-motion, poster and autoplay behavior are unchanged.

### 2026-10-31 Portfolio Choice

- Latest hierarchy: 01 Profile -> 02 Portfolio -> 03 Selected Works -> 04 Experience -> 05 Other Work -> 06 Contact. Portfolio appears in the home header and progress rail, and has an entry in CV/project navigation. Architecture and Photography remain alternative branches of Selected Works.
- The selector now uses the existing deep-red `--accent`, not charcoal. The previous question is removed. During scrolling from Profile to Portfolio, an aria-hidden fixed copy of the profile photo follows the scroll progress, shrinking/moving into a centered portrait slot. Source and destination copies are hidden only during transit to avoid doubling. Reverse scrolling retraces the movement; the original Profile photo never changes layout. Reduced motion skips the flight.
- Once the photo arrives, "there are double sides of me" fades in below it. The two portfolio links sit farther below, retaining their breathing hover circles and radial entry animation. Header and rail remain visible in white on the red page; the selected Portfolio rail item is highlighted.
- Homepage mobile navigation uses an aligned three-column/two-row grid for the six entries, with the existing measured header offset; no horizontal navigation scrollbar is needed.
- Whitestone Gallery's desktop project-list cover (`#work-internship-03`) uses `object-position: 50% 85%` to show more of the lower gallery/artworks. Mobile crops, image dimensions and project-detail gallery images are unchanged.
- Scrollbar stability: portal transitions block wheel/touch/scroll keys without setting root `overflow: hidden`. The native scrollbar and viewport width remain unchanged throughout the reveal, avoiding the horizontal layout jump when the animation ends.
- Latest revision: the selector is full-bleed charcoal (`#202322`) with white text and the question "Which portfolio would you like to see?". Hover/focus reveals a breathing circular preview behind the label; clicking expands the circular opening into the light destination page, making the transition visibly contrast with the outgoing dark surface. Reduced motion keeps the circle static and uses a short fade.
- Photography now belongs to the same scrolling homepage, at `#photography-works`, as an alternative 02 Selected Works branch. Its Works section is intentionally empty apart from the section marker, using the same margins/header/rail as Architecture. Experience, Other Work and Contact remain shared below it. The Works navigation retains the active branch. The old `photography.html` address redirects here; the independent placeholder page described in the earlier revision below is retired.
- Branch changes are mutually exclusive; photography does not show architecture projects. Project return anchors still explicitly reopen Architecture. The selected branch is remembered for CV/contact returns within the browser session.

Earlier revision (superseded by the notes above):

- Entry flow is now Cover -> Profile -> a full-screen portfolio selector (`#portfolios`). The selector has only two text links: Photography on the left and Architecture on the right. Header and progress rail hide while the selector fills the screen.
- Architecture opens the existing Selected Works -> Experience -> Other Work -> Contact branch. This branch is hidden on a fresh entry until selected, but project, CV return and navigation anchors still open it directly. Content is visible if JavaScript is unavailable, preserving native anchor navigation.
- Desktop downward scrolling from Profile snaps to the selector and waits for a choice. Once inside Architecture, the existing centered project-by-project snapping remains. Up from the first project reaches the selector, and up again reaches Profile; it must not jump to Cover.
- Each selector label gently enlarges on hover, compresses on press, then fades out. A circular opening grows from the selected label's center for 1050ms, revealing the actual destination underneath the outgoing page. Architecture reveals live page content; Photography previews the same-origin new document before navigating to it. Inputs are guarded during the transition and restored afterward. Reduced motion uses a short fade instead of radial expansion.
- Photography is a separate `photography.html`, not the existing Other Work thumbnail section. Its Back to Portfolios link returns to `index.html#portfolios`. No photography gallery or additional design has been added yet.
- Use the HTTP preview server for the complete cross-page Photography reveal. Native links still work with `file://` or failed page fetches.
- Focused tests: `node --test tests/site.test.cjs tests/cover.test.cjs tests/portfolio-portal.test.cjs`. Browser checks cover desktop/mobile entry, circular-mask progress, keyboard activation, return anchors, navigation clearance, project snapping and Research -> Experience snapping.
- Project centering uses layout coordinates rather than animated reveal transforms, keeping navigation, return anchors and scroll snapping aligned.
- No GitHub push was requested for this change; preview locally before publishing.

### 2026-10-31 Profile Layout

- The three CV actions now remain 14px below the profile disclosure in normal document flow, instead of being pushed away from the paragraphs by an automatic top margin. This gap stays constant before, during and after expansion.
- More about me remains native `details` / `summary` for keyboard access and no-script fallback. Clicking it opens the paragraph with a 520ms ease-out height animation and a 420ms opacity fade; the CV action row moves down with the animated height. The label disappears after opening, paragraph spacing remains consistent, and the final height returns to automatic sizing. Reduced motion opens immediately; keyboard focus moves into the revealed paragraph without scrolling.
- Profile contact now has two columns: the two-line invitation with Email Me below on the left, and four compact social links stacked vertically on the right. Social links retain the original bottom-rule style, with no box borders or hover fill. The footer Contact section is unchanged.
- The photo retains its fixed square dimensions and does not move during expansion. On desktop, the contact block remains at the bottom of the matching right-hand frame; on tablet/mobile, all content flows naturally. Social buttons have larger targets on the stacked layout.

### 2026-10-31 Cover Video

- The original `assets/video/site cover video.mp4` is preserved unchanged: 1920 x 810, approximately 181 seconds, H.264, SDR Rec.709, square pixels. It is not loaded by the website.
- The cover uses `assets/video/cover-desktop.mp4` (approximately 36 MB) or `cover-mobile.mp4` (approximately 15 MB, 1280 x 540), keeping the full duration. Both are silent H.264 MP4 files with fast-start metadata. `cover-poster.jpg` provides the loading, error and reduced-motion fallback.
- The video fills the viewport with `object-fit: cover`: its proportions are preserved, with side cropping on narrower screens instead of stretching or baked-in black bars.
- A transparent canvas draws slowly floating white dots above the video. CSS `mix-blend-mode: difference` inverts the actual moving video only beneath each dot. Mobile uses fewer dots and a lower canvas pixel ratio; drawing is capped at 30 fps.
- Mouse/pen movement pushes nearby dots aside and emits outward travelling ripple displacements. Damped springs restore the original grid after the pointer leaves. Touch scrolling is not intercepted.
- The footage layer, including its poster fallback, uses 68% opacity, 55% saturation and 82% contrast over the paper background. These values are CSS variables on `.hero-cover`.
- The SVG gently breathes over a six-second cycle, scaling from 98.5% to 101.5% and changing opacity from 90% to 100%. It pauses together with the dots/video, and remains static with reduced motion.
- The supplied cover SVG remains centered, fades in, and is rendered white over the footage. Clicking the cover or its keyboard-accessible logo enters Profile. The lower-right play/pause icon controls both video and dots without entering Profile; Lucide icon attribution is beside the sprite in `assets/images/`.
- Playback and drawing stop offscreen or when the browser tab is hidden. Opening a Profile/project anchor directly does not download the video. Reduced-motion visitors get a static poster and dots; data-saver visitors can start playback explicitly.
- Muted inline autoplay is attempted immediately when the cover is visible. Initial fragment navigation has a bounded settling period, not a requirement to leave the cover first. Retaining a Profile hash while showing the cover must not prevent autoplay. Cover clicks always enter Profile; they are never intercepted as a required playback step. Browser-level autoplay restrictions can still prevent automatic video playback, in which case the independent playback control remains available.
- To replace the video, regenerate the two playback files and poster while preserving their filenames, or change `data-desktop-src`, `data-mobile-src` and `poster` in `index.html`. The poster background is also referenced in `assets/css/styles.css`.
- Checks: `node --test tests/site.test.cjs tests/cover.test.cjs`.

### 2026-10-30 UI Fixes

- Kept the existing MSA placeholder URLs and font configuration unchanged, as requested.
- Profile uses equal desktop columns with a centered square photo (maximum 560px) on the left and the complete information block on the right. The name is included in that block; expanded text, CV actions and contact links fit between the photo's upper and lower edges. Expanding More about me does not move or resize the photo. The contact arrangement was subsequently updated as described in the 2026-10-31 Profile Layout note above. Profile content that exceeds the viewport scrolls normally before advancing to a project. Tablet/mobile layouts remain vertically stacked with normal scrolling.
- Header height is measured with ResizeObserver instead of relying on a mobile height estimate. Navigation is visible by default on CV and project pages.
- Fixed Email Me hover contrast and darkened the text/button accent while retaining the original decorative accent.
- The image viewer uses a native modal dialog, keeps keyboard focus inside, restores focus on close, and locks background scrolling. Full-resolution originals are still used for enlarged images.
- Fixed project exit transitions and added a reduced-motion alternative for scrolling and animations.
- Responsive WebP previews live in `assets/images/optimized/`; original images have not been changed. `assets/js/image-manifest.js` contains generated source dimensions and preview variants.

After adding or replacing images, regenerate previews with Pillow installed:

```powershell
python scripts/optimize-images.py
```

Unlisted new image paths still fall back to their original files. Rebuild previews before publishing, and update the `image-manifest.js` cache version in `index.html` and `project.html` after a rebuild.

Run focused checks with Node.js:

```powershell
node --test tests/site.test.cjs
```

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
- Cover uses the responsive video and inverse-color floating dot layer described above.
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
- Scrolling down from the final Research project snaps to the beginning of Experience / Work Experience, with its section label and first work entry visible below the header. Experience is the final `data-snap-stop`; further downward scrolling remains natural so Work Experience, Education and Activity can be read without being trapped. Scrolling back up from its beginning returns to the Research project. The existing no-wheel-snap mobile behavior is unchanged.
- Native navigation to `#timeline` retains the header-height scroll margin, including on mobile; wheel snapping still aligns the section itself to the viewport.
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
Please read README.md first. This is Xitao Wang's static portfolio. Most content is in assets/js/site-data.js. Preserve the current flow: full-screen cover, Profile second page, full-screen Photography/Architecture selector with circular reveal, then the existing Architecture project-by-project snap. Photography now has Commercial and Elsewhere directories inside the Photography Works branch, and photography.html?collection=ID for galleries. Manage photoCollections in the local admin Photography section; keep photography separate from architecture projects. Preserve project detail feature image matching gallery width, three-column randomized architecture gallery, fixed centered lightbox, and opacity-from-0 reveal animations. Photography galleries use manual order, not random order. Do not reintroduce PDF portfolio download, large unused section intro blocks, timeline visual design, or page-wide grid background.
```

## Photography Portfolio: Commercial And Elsewhere (2026-11-02)

- Reference analysis: `docs/reference-study-felix-peault.md`. The user approved the reference site's navigation and viewing logic, not a wholesale replacement of this site's visual identity.
- Photography entry still uses the existing circular reveal from Portfolio. Its first screen is Commercial: one centered cover, project name and year underneath, automatic rotation, manual arrows, project dots, pause/resume, keyboard and horizontal touch gestures. Hover, focus, hidden tabs and reduced-motion preferences pause automatic rotation.
- Four initial editable commercial placeholders: Polestar, Guesthouse, Holiday Home, Artist. The user has not supplied photos, final names or years yet. Do not invent dates or use architecture images as commercial photographs.
- Elsewhere groups photos by location, with photo counts and a contact-sheet layout. Desktop XS/SM/MD controls change thumbnail density. No fictional locations are prepopulated.
- Commercial detail (`photography.html?collection=ID`) displays one original-ratio photo at a time, with thumbnails, arrows, wheel/keyboard/touch navigation, optional Details text and a centered native-dialog large-image viewer. The first-screen layout reserves space for the controls. Elsewhere detail uses a naturally scrolling original-ratio image stream and a live position counter.
- Large-image views retain original aspect ratio and do not crop to fill. They include previous/next arrows, Escape dismissal, focus restoration and scroll preservation. Transitions respect reduced-motion preferences.
- Back links identify the collection and directory: `index.html?photo=ID&photo-view=commercial#photography-works` or `photo-view=elsewhere`. A fresh click on the Photography selector starts in Commercial.
- Data: `portfolioData.photoCollections` and `portfolioData.photoSettings` in `assets/js/site-data.js`. A collection has `id`, `kind` (`commercial` or `elsewhere`), `title`, `year`, `location`, `cover`, `brief`, `gallery`, and optional `published`. Gallery items have `image`, `label`, optional `alt`. Order is manual. A separately selected cover is not automatically inserted into the gallery; without a cover, the first gallery photo supplies the directory cover.
- Frontend: `assets/js/photography.js`, `assets/css/photography.css`, `photography.html`, plus a mount in `index.html`. The photography wheel handler is isolated from architecture snapping. Keep shared homepage navigation and progress behavior intact.
- Local backend: launch `启动内容管理.cmd`, then open `http://127.0.0.1:5174/admin/`. Use the new **摄影作品集** item, not the legacy Other Work preview editor. Add commercial projects or location albums, edit names/years/introductions/covers, batch-upload photos, edit image titles/alt text, reorder, duplicate, hide or remove collections. Save settings control commercial rotation and the two directory labels.
- Existing local backup, draft preview, upload optimization, file validation and concurrent-edit protection also cover photography. Saves bump the data cache version in photography.html as well as other public pages. Removing a photo or collection never deletes source files.
- Saving is local only. No GitHub push or deployment was requested for this change.
- Hidden collections remain available in the authenticated local draft preview. Visibility is not privacy: GitHub Pages data and uploaded media are public files, so do not upload confidential work relying on the hide toggle.
- Elsewhere restores the selected place, its on-screen position and thumbnail density after returning from an album. Keyboard focus is retained when replacing the active cover or gallery image.
- Focused tests: `tests/photography.test.cjs`; photography persistence coverage is also in `tests/admin.test.cjs`.

## Floating Portfolio Navigation (2026-11-02)

- On the homepage, selecting Architecture or Photography switches the works-and-later sections to geometric floating navigation. The cover, Profile and Portfolio chooser retain their original header behavior.
- The original brand/header is visually hidden and inert, but keeps its layout measurement. Do not use `display:none` on that header: project centering and scroll offsets rely on its measured height.
- Right side: an orange circle morphs into a square and opens the six primary links to its left. Left side: an orange upward triangle rotates 90 degrees to the right and opens the existing numbered progress navigation to its right. Entries fade/translate in sequentially from top to bottom with 55 ms stagger.
- Links use larger Futura PT text with current-location highlighting. Only one menu opens at a time. Hover, tap, keyboard Enter/Tab, Escape, focus restoration, outside click and reduced-motion paths are supported.
- The progress drawer reuses the original rail and its single `rail-progress` element. Its real section tracking remains in `main.js`; opening/closing announces `portfolio-navigation-change` to recalculate the line.
- The floating primary links are cloned from the original top navigation and stay in sync with edited labels. The CMS excludes those clones from page-field collection, so edit the original header labels rather than a second set.
- Files: `assets/js/floating-navigation.js`, `assets/css/floating-navigation.css`, markup in `index.html`, integration in `main.js`. These rules do not replace navigation on CV or project-detail pages.
- Tests: `tests/floating-navigation.test.cjs`. No GitHub push was requested.

### Floating Navigation Dock Refinement (2026-11-02)

- Enlarged the orange circle and triangle on desktop and mobile. Expanded navigation and progress panels have transparent backgrounds; the right-hand navigation text is right-aligned.
- Both menus magnify text near the pointer with a smooth distance-based falloff, including smaller growth in neighboring entries, similar to the macOS Dock. Only inner text scales; row positions and clickable areas remain fixed. Moving away restores the original size.
- Larger Futura PT labels and progress numbers, plus a 3 px progress track/fill. Short landscape screens use compact rows to keep all six destinations visible.
- Touch keeps tap-to-open behavior. Keyboard-focused entries also magnify; reduced-motion preferences disable magnification. Existing circle-to-square and triangle rotation are retained.
- `.nav-dock-content` wraps each link's text without changing its destination or numbering. Shared page-content overrides and the local CMS read labels inside this wrapper to avoid duplicates and retain editable progress labels.
- Verified desktop pointer tracking, fixed hit areas, right alignment, transparent panels, mobile widths 375/393/820, short landscape, reduced motion, original Profile navigation, and architecture project centering.

### Profile Portrait Transit Fix (2026-11-02)

During the Profile-to-Portfolio portrait movement, hide the entire `.profile-panel-media` container with `visibility:hidden`, not just its image. This prevents its paper-soft background from remaining as a gray placeholder while preserving the source dimensions for animation and text alignment. Restore visibility when the portrait is not in transit. Desktop/mobile intermediate states, settling, reverse scroll, and reduced-motion behavior were verified.

### Portfolio Entry Alignment And Crossfade (2026-11-02)

- On tall desktop screens, centering the first Architecture project could leave 47-74 px of the orange Portfolio chooser visible at the top. `alignWorksEntry()` in `main.js` now reserves the missing leading space in Selected Works via `--works-entry-space`. It preserves the existing project-center calculation rather than offsetting the image away from the center. Entry, return navigation, font loading and responsive changes recalculate this space. Mobile entry rounds the target upwards to avoid a fractional colored edge.
- The circular reveal retains its hovered preview image in a separate `.portfolio-portal-preview` layer. The outgoing chooser is masked by `.portfolio-portal-outgoing`; the preview expands with the hole and fades to transparent over 650 ms while the live destination is revealed underneath. The original 1050 ms radial expansion remains. The initial circle uses the breathing preview's actual position and size, avoiding a jump on click.
- Reduced motion retains the short opacity-only transition. Scrollbar width, input cleanup, keyboard focus, branch selection, and subsequent project snapping remain unchanged. Added regression coverage in `tests/portfolio-portal.test.cjs`; desktop 1440/2048, tall 1280, mobile 393, forward/reverse snapping, Photography entry and reduced-motion paths were checked in the browser.

### Navigation Gathering Transition (2026-11-02)

- Changing from the original header/rail to floating controls now has a coordinated entry animation. A small orange circle appears in the upper-right corner. Header links enter one by one, from the nearest/rightmost item; each arrival compresses and rebounds the circle. After all six enter, the circle grows and travels to the right-side center.
- The original left progress labels compress toward the middle of their track. The track shortens and morphs into a right-facing triangle, compresses/rebounds once, then rotates counterclockwise by 90 degrees and moves into the final left-center position.
- Timing: navigation collection/rebounds and final travel take about 2.19 seconds; the left rail sequence takes about 1.54 seconds. These are decorative, noninteractive, `aria-hidden`/inert visual copies; real controls replace them exactly at the end. Header dimensions and scroll offsets are unchanged. Existing Dock magnification remains after the transition.
- `portfolio-portal.js` emits `portfolio-navigation-prepare`, `portfolio-navigation-reveal`, and `portfolio-navigation-finish`. Floating navigation captures the original appearance before the live destination scroll, then starts the gathering as the circular reveal starts. Ordinary scroll entry also animates; opening a direct Works URL does not fabricate an outgoing header.
- Returning to Profile/Portfolio, resizing, page exit and reduced-motion changes cancel and remove all temporary elements. Reduced motion skips the collection/bounce. On phones the hidden legacy rail is not duplicated; the visible header links and new geometry still transition.
- Focused coverage: `tests/floating-navigation.test.cjs`, `tests/portfolio-portal.test.cjs`. No GitHub push was requested.

### Photography Categories And Motion Update (2026-11-02)

- The centered photography directory now has three larger category controls: **Commercial**, **Journey**, **Landscape**. Journey replaces the visible name Elsewhere. Journey and Landscape share the location/contact-sheet directory, density controls, original-ratio scrolling album, large-image viewer and return-position behavior. They remain empty until real photos are supplied.
- Canonical collection `kind` values are `commercial`, `journey`, `landscape`. Old `elsewhere` collections and `photo-view=elsewhere` URLs still resolve to Journey. The backend accepts the legacy kind; its editor normalizes it to Journey in memory, which is written on the next intentional save. Settings are `commercialLabel`, `journeyLabel`, `landscapeLabel`, `autoplay`, `interval`.
- Fixed the rotation pause logic: resting the mouse over the photography area or clicking a category no longer stalls autoplay indefinitely. The explicit pause button, keyboard-visible focus, reduced motion, hidden tabs, offscreen content and portfolio transitions still pause it. Default interval remains 6000 ms; CMS range remains 2500-60000 ms.
- Commercial covers and captions crossfade with a subtle 10 px upward entrance; hovering gently enlarges the cover by 2.5%. Controls stay mounted so keyboard focus is preserved. A single solid indicator travels between the outlined project dots, rather than replacing the filled dot instantly. Category underlines slide to the new label, and category content fades between views. These effects use `cubic-bezier(0.4, 0, 0.2, 1)` and reduced-motion alternatives.
- Photography owns its wheel boundaries before homepage snapping: Commercial projects -> Journey -> Landscape -> Experience. Up from Journey returns to Commercial, up from Landscape returns to Journey. Long album directories scroll naturally; a large gesture clamps at their edge instead of escaping directly to Portfolio. Vertical touch gestures share these boundaries with one category change per swipe; native album reading, horizontal photo swipes and multi-touch remain available. Keyboard arrows/Home/End work on the category controls.
- The local CMS includes category filters, add/edit controls and labels for all three kinds. Save/upload/removal behavior is unchanged; removing a reference still does not delete originals. The local server was restarted for the expanded schema; public publishing was not requested.
- Regression tests cover autoplay eligibility, canonical/legacy return links, all three kinds in CMS persistence, shared album rendering and wheel delegation. Browser verification uses temporary in-memory fixtures only; test architecture images were never added to the real photography data or presented as commercial work.

### Architecture Editorial Direction Research (2026-11-02)

The user now wants Architecture to become a continuous editorial presentation of project titles, metadata, arguments and important drawings, referencing TaylorHare rather than the existing cover-card/detail-entry workflow. Research and the PDF handoff checklist are in `docs/reference-study-taylorhare.md`. This is planning only: wait for the user's annotated layout PDF and confirm its content/interaction structure before changing Architecture, snapping or the CMS schema. Do not modify the other portfolio branch as part of this redesign without instruction.

### Navigation Timing And Menu Disclosure Revision (2026-11-02)

- The gathering animation now waits for `portfolio-navigation-finish`, after the radial mask has been removed. It does not start on `portfolio-navigation-reveal`. Original-layout visual labels use the normal ink color, including underlines, and remain stationary for 150 ms before gathering. This supersedes the earlier simultaneous-mask/gathering sequence.
- The right-hand circle is optically smaller: 50 px desktop / 42 px mobile, while preserving the original 78/64 px button hit areas. The triangle size is unchanged. The circle remains round and contains the local Lucide three-line Menu icon. Clicking opens the navigation and morphs those paths into an X; a second click, outside click, Escape, link navigation or leaving keyboard focus closes it. Hover alone no longer opens or closes the right menu.
- The left triangle retains hover/tap disclosure. Either open menu adds a full-viewport dark backdrop below the controls, with light navigation text and pale-orange current/hover highlighting. The panels themselves remain transparent; right alignment and Dock magnification remain. The backdrop does not hide the scrollbar or change page dimensions.
- Backdrop state clears when menus close or navigation returns to Profile/Portfolio. Reduced-motion preferences skip gathering and backdrop/icon transitions while retaining functional controls.
- The user's final phrase "然后中间" was incomplete. Clarification was requested; no unrelated center-page redesign was inferred from it.

### Photography Category Underline Alignment Fix (2026-11-02)

The active underline now uses the selected button's current, fractional bounding-box width and its position relative to the category bar. A late-loading font could previously change label widths without resizing the outer photography area, leaving the marker too long or too short. Observe each category button, remeasure after font loading and viewport changes, and skip zero-width measurements while the branch is hidden. Geometry corrections are immediate; deliberate category switches retain the sliding animation. This change does not alter category content or overall layout.

### Liverpool Architecture Festival Drawing Prize (20261102-16)

- The Activity entry now opens `project.html?activity=laf-drawing-prize`, a dedicated drawing exhibition using the existing detail-page renderer and lightbox.
- Both the homepage Experience entry and CV Activities title link to it in the same tab. The CV link includes `return=cv`; the top and bottom Back links return to CV or homepage Experience accordingly.
- Two original PNGs copied from the supplied LAF Drawing Prize folder into `assets/images/activities/laf-drawing-prize/`: `energy-to-plan.png`, then `energy.png`. Both appear uncropped, in order, in a single-column gallery. Click either to view the original at full resolution, with previous/next and keyboard controls.
- Content is stored on the `researchExperience` record with ID `laf-drawing-prize` in `assets/js/site-data.js`; award/date remain Runner-up / Jun. 2023. It does not create an extra Selected Works project or change project pagination.
- Layout overrides are isolated in `assets/css/drawing-prize.css`. Existing architecture impressions, three-column galleries and project navigation remain unchanged.

### Architecture Other Work Portfolio Entry (20261102-17)

- Architecture's former Photography image wall and Videography embeds are merged into a single Other Work screen with one `Photography & Film Making` link. No duplicate Instagram/YouTube links or players remain in this screen; Film still uses the original four shared video records.
- Hover or keyboard focus shows a breathing circular preview using the existing Instagram screenshot (`photography[0].image`, with its optimized preview). Clicking reuses the portfolio radial reveal and preview crossfade, switching directly to Commercial in the existing Photography branch.
- The source is captured with the normal paper background and the currently visible progress/menu controls. The red portfolio chooser is not shown during this transition, and already-floating navigation does not gather a second time.
- Browser Back restores `#other-work` with Architecture selected, even when the remembered branch is Photography. Standard chooser transitions remain unchanged. Mobile, keyboard focus and reduced-motion behavior use the same shared portal.
- Styles are isolated in `assets/css/portfolio-entry.css`; the local CMS's existing Photography preview image record still controls this entry's preview. Video content is maintained in the existing video editor for Film. No GitHub push was requested.

#### Always-Visible Entry Preview (20261102-18)

The Architecture Other Work entry's circular Instagram preview is always visible and stationary at rest, including on mobile. Hover or keyboard focus starts the existing breathing animation; leaving stops it without hiding the image. The cross-portfolio portal starts at this visible circle even without hover, preserving touch/keyboard transition continuity. The original red Portfolio chooser's hover-only previews remain unchanged.

### Architecture Photography Category (20261103-01)

- Photography & Film Making now has five directories: Commercial, Film, Journey, Landscape, Architecture. This new Architecture tab is for architectural photographs, separate from the main architectural design portfolio.
- Architecture uses the same ordered contact-sheet albums, density controls, scroll/category transitions, image stream/lightbox and return-anchor behavior as Journey/Landscape. The existing responsive category underline supports wrapped tab rows on phones. It starts empty until the user adds albums; no architectural design drawings or invented photography albums were inserted.
- The local CMS supports `architecture` in new-album commands, filtering, category selection, duplication, uploads and saving. The tab name is editable via `photoSettings.architectureLabel`. Server validation accepts the category, and photography return links preserve `photo-view=architecture`.
- To add photos: open the photography editor, choose the new architectural-photography album command, then upload images in its gallery and save. Existing albums and media remain unchanged.

### Harry Boulton Spotify Link (20261103-02)

- Renamed the Commercial collection with stable ID `artist` from Artist to Harry Boulton. The cover still opens `photography.html?collection=artist` and does not redirect straight to Spotify.
- Added the supplied Spotify album URL as `spotifyUrl`. The detail page shows a `Listen on Spotify` text link in its heading, opening the album in a new tab. It appears before photos are uploaded and remains when the gallery is filled. No album title or credits were inferred, and no player was embedded.
- Commercial collection basic settings now include an optional Spotify album URL field. Server URL-safety validation includes this field. Existing album IDs, gallery order and Commercial return position are unchanged.

### Stable Commercial Details Disclosure (20261103-03)

- Commercial album descriptions now use a fixed-height space in the heading above the image, whether the disclosure is closed or open. The text panel is absolutely positioned within that space, so opening or closing Details does not change the image, thumbnails, controls or footer geometry.
- Removed the previous `:has(details[open])` rules that changed page height and resized the viewer. Long copy scrolls inside the reserved description panel instead of growing the page or overlapping images. Journey/Landscape/Architecture photo streams retain their existing Details behavior.
- Details opens with a 400 ms clipped reveal/fade and closes in 240 ms. Rapid reversals continue from the current visual state; native summary keyboard behavior remains, and reduced-motion skips animation. Viewer wheel navigation still works while Details is open.
- No user text, uploaded photos or project metadata changed. Only the photography stylesheet/script cache versions were bumped; user-managed data/manifest versions remain as saved by the CMS.
- Bound the Commercial grid column and its children to the viewport width, fixing mobile title/viewer/thumbnail overflow exposed by real uploaded content. The description region is keyboard-focusable and scrollable. Browser checks cover 1440x900, 1280x720 and 393x852, rapid reversal, long copy, reduced motion and photo switching while expanded; all 43 checks pass.

### Photo Pinning And Image-First Commercial Detail (20261103-04)

- Photography gallery item toolbars now have a Lucide `arrow-up-to-line` action, labelled/titled `置顶照片`. It moves the selected image to index zero, preserving every image object and the relative order of the others. The first picture's button is disabled. The independent collection cover is not changed; ordering remains a draft until saved.
- Supersedes the previous above-image reserved Details space: Commercial now has a larger, centered, fixed-height image stage containing its title/metadata, uncropped photograph and thumbnail/arrow controls. Details follows that stage, above the return links, and its content grows downward in natural flow without changing the photograph's geometry. Empty albums place Details after their empty-image area too.
- The Details marker uses the local Lucide triangle, rotating smoothly between right/down with the intended disclosure state. The text animates height and opacity; rapid reversals and reduced-motion remain supported. No user images, description text, saved order or cover were changed by implementing this feature.

### Commercial Image Side Arrows (20261103-05)

- Previous/next controls now sit in dedicated left/right gutters beside the Commercial main image, centered vertically. They use the existing Lucide chevrons, 44 px hit areas, hover/focus styling and boundary-disabled states; the duplicate lower arrow pair was removed. Thumbnails and counter remain below.
- Only the middle image slot is replaced when switching, so the side buttons retain keyboard focus. Existing thumbnail, wheel, swipe, lightbox and Details behavior is unchanged. Mobile arrows use the outer gutters and do not cover or crop the photograph.

### Last Photograph To Next Commercial Project (20261103-06)

- On a Commercial album's final photo, the right-side next-photo arrow is replaced with a visible `Next project` link and arrow, in the same reserved gutter. Earlier photos retain normal next-photo navigation. Switching back hides the project link again without moving the image.
- The destination follows the published Commercial collection order and excludes Journey, Landscape, Architecture photography and hidden collections. The final Commercial project loops back to the first. With only one published Commercial collection, the last-photo arrow stays disabled rather than linking to itself.
- Links identify the destination project in their tooltip/accessible name and open its normal detail route at the first photo. Keyboard focus hands off between the next-photo button and the project link; wheel/swipe do not automatically navigate to another project. No content or media order changed.
