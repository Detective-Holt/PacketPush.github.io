# NetworkingPro: a free blog and portfolio site

A plain HTML/CSS/JS site (no build step, no dependencies). All content lives in **`data.js`**.

## 1. Make it yours
Open `data.js` and edit:
- `SITE`: brand name, your name, email, GitHub and LinkedIn links.
- `POSTS`: your blog posts (title, category, date, excerpt, content in simple HTML).
- `PROJECTS`: your labs and projects (add a `link` to the GitHub repo).
- `JOURNEY`: your timeline.
- `ABOUT`: your bio, skills and certifications.

Items with `draft: true` show a "Draft" tag and `sample: true` shows "Sample". **Delete that line once you're happy with the content.**

The site is already filled in from your CV. Before publishing, replace the GitHub link in `SITE.github` with your real profile URL.

> Only list certifications, roles and experience you actually have. Recruiters check, and honest "in progress" entries look better than invented ones.

## 2. Preview locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000

## 3. Publish free on GitHub Pages
1. Create a GitHub repo named `yourusername.github.io` (public).
2. Upload all files in this folder to it, or from a terminal:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/yourusername/yourusername.github.io.git
   git push -u origin main
   ```
3. In the repo go to **Settings > Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Your site goes live at `https://yourusername.github.io` within a minute or two.

## 4. Optional: custom domain
Buy a domain (roughly 10 to 15 GBP a year), then in **Settings > Pages > Custom domain** enter it and follow GitHub's DNS instructions.

## Adding a new post
Copy an entry in `POSTS`, give it a unique `slug`, and write the `content`. Commit and push; the site updates automatically.

## Safety reminder
Never publish real passwords, public IPs, or configs from an employer's or client's network.
