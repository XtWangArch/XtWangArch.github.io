# TaylorHare Reference Study And PDF Handoff

Date: 2026-11-02. Research only; no application code changed for this request.

## User Direction

Architecture should become a continuous editorial presentation. Visitors should see project titles, selected metadata, short design arguments and important drawings directly while scrolling, rather than having to enter a cover card to understand the work. Clicking is a second level for inspecting drawings. Wait for the user's annotated PDF before designing or implementing this replacement.

Keep the existing cover, Profile, Portfolio selector, Photography and site identity outside this redesign unless the PDF explicitly changes their relationship.

## Reference Observations

Sources inspected in a desktop browser and a mobile-width browser:

- [Homepage](https://taylorhare.com/)
- [Fields directory](https://taylorhare.com/project-category/fields/)
- [House Around a Garden project](https://taylorhare.com/projects/a-house-around-a-garden/)

The reference uses a continuous, smooth vertical reading flow, not mandatory project-by-project full-screen snaps. Its desktop composition repeatedly uses one-third/two-thirds column relationships, alternating sides, with occasional full-width media. Short arguments, images and captions form an editorial sequence rather than repeated cards.

Selected headings, text or media pin temporarily while surrounding content continues moving, then release at the end of their group. This is distinct from permanently fixing every title or applying identical parallax to every image. The inspected homepage uses GSAP ScrollSmoother and ScrollTrigger; the sampled triggers did not configure snapping.

For a sampled project image, hovering revealed an absolute caption through opacity and vertical movement; the sampled image itself did not receive a hover scale. The reference also retains category and project-detail pages. Its project detail combines metadata, prose, large drawings and paired images rather than a uniform thumbnail grid. Mobile changes widths, ordering and the number of pinned elements instead of simply scaling the desktop composition down.

Initial homepage captures encountered a media-loading intro overlay. Subsequent in-site navigation allowed the underlying desktop/mobile layouts to be inspected. Do not treat blank loading captures as intended layout or copy that loading dependency into this portfolio.

## Interpretation For This Portfolio

These are proposed implications, not implementation decisions:

- Replace Architecture's cover-card browsing with a curated sequence of project chapters. Each chapter should communicate the project without a mandatory click.
- Use a small number of deliberate composition patterns: project introduction, image plus argument, large drawing, paired drawings, short concluding statement and transition to the next project.
- Distinguish main-page highlights from the full drawing archive. The PDF should identify whether a click enlarges a drawing, opens its collection, or enters a complete project archive. Do not assume these are the same action.
- Prefer continuous reading within Architecture over the current one-project-per-screen wheel interception. Whether any chapter entry should still snap must be specified and confirmed.
- Keep drawings readable: preserve complete plans, sections and annotations by default. Photography-oriented fixed-ratio cropping is not automatically appropriate for architectural sheets.
- Preserve existing typography and palette unless the user changes them. Borrow composition and reading behavior, not the reference's branding or assets.
- A future CMS change would need ordered text/image presentation blocks, not merely a larger gallery array. Define those blocks from the PDF before changing the data model.

## Recommended PDF Structure

Start with **one complete project and the opening of the next project**. That is enough to establish composition, pacing and project boundaries before laying out every case.

1. Use a fixed desktop design width, for example 1440 px. Lay content vertically as a long page. If exported as multiple 1440 x 900 pages, mark their order and state that pagination is only for export, not website snapping.
2. Show intended relative image size, alignment, white space and the start/end of each project. Optional dashed viewport guides should be explicitly marked as annotations, not visible UI.
3. Number elements: `P01-T01` for a title, `P01-M01` for metadata, `P01-B01` for body copy, `P01-I01` for an image. Use a visibly different annotation color, or separate notes pages, to distinguish instructions from real site text.
4. Supply exact filenames for images in a final mapping table. Identify whether each is a hero/rendering, plan, section, diagram, model photo or detail; state what it is meant to communicate. PDF image previews are fine, but the website should use separate original assets.
5. Mark each image as complete/original-ratio or cropped/fill. For cropping, indicate the important area or focal point. State whether labels belong inside the source drawing, in a visible caption, or only in the enlarged viewer.
6. Describe interactions beside their element IDs: hover behavior, click destination, scroll entrance, temporary pinning and its release point. Before/after sketches are useful; label them as states of the same element so they are not mistaken for duplicate content.
7. Provide selectable real text, not only screenshots of paragraphs. Clearly mark any placeholder text. Show which metadata fields are needed for each project type rather than assuming every project has identical fields.
8. Add one representative mobile sketch, around 390 x 844 px, or simply number the mobile reading order. Specify which drawing must remain especially prominent. A complete mobile design for every project is not necessary at this stage.

### Example Mapping

| Element | Content / Asset | Display And Behavior |
| --- | --- | --- |
| P01-T01 | Actual project title | Title, not explanatory annotation |
| P01-M01 | Year / location / role | Visible text; define the fields |
| P01-I01 | `project1_section.png` | Complete drawing, no crop; click to enlarge |
| P01-B01 | Actual design argument | Body copy; any pinning must name its end point |

The important deliverable is not a print-ready PDF. It is an unambiguous description of reading order, hierarchy, asset identity and interaction. Do not implement the site as one flattened screenshot of the PDF.

## Next Step

When the PDF arrives, first restate the chapter structure, element roles, image handling, click behavior and responsive order for confirmation. Only then change Architecture's rendering, scrolling or CMS schema. No GitHub publishing is part of this research task.
