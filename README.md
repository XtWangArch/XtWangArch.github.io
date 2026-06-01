# Xitao Wang - Architectural Portfolio

This is a static GitHub Pages portfolio template for an architectural portfolio.

## File map

- `index.html`: the long scrolling portfolio homepage.
- `cv.html`: CV detail page.
- `project.html`: reusable project detail page.
- `assets/css/styles.css`: visual style, layout, responsive rules.
- `assets/js/site-data.js`: the main content file to edit.
- `assets/js/main.js`: homepage rendering and scroll interactions.
- `assets/js/project.js`: project detail rendering.
- `assets/images/projects/`: project images.
- `assets/images/photography/`: photography wall images.
- `assets/images/timeline/`: timeline hover images.
- `assets/images/video/`: video thumbnails.
- `assets/pdfs/`: PDF portfolio and CV.

## How to fill the template

1. Put project images into `assets/images/projects/`.
2. Put photography images into `assets/images/photography/`.
3. Put timeline images into `assets/images/timeline/`.
4. Put video thumbnails into `assets/images/video/`.
5. Put PDFs into `assets/pdfs/` and name them:
   - `Xitao_Wang_Portfolio.pdf`
   - `Xitao_Wang_CV.pdf`
6. Edit `assets/js/site-data.js`.
7. Replace placeholder email and social links in `assets/js/site-data.js`.

Example image path:

```js
cover: "assets/images/projects/academic-01-cover.jpg"
```

Example project page link:

```text
project.html?project=academic-01
```

## GitHub Pages deployment from zero

1. Log in to GitHub.
2. Create a new repository named `xitao-portfolio` or `portfolio`.
3. Upload all files and folders in this directory.
4. Open the repository Settings.
5. Open Pages.
6. Under Build and deployment, choose:
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/root`
7. Save.
8. Wait one or two minutes.
9. Open the GitHub Pages link shown by GitHub.

Your free website URL will look like:

```text
https://your-github-username.github.io/portfolio/
```

If the repository is named exactly `your-github-username.github.io`, the URL will be:

```text
https://your-github-username.github.io/
```
