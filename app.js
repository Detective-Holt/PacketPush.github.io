(function () {
  const PAGES = [
    ["Home", "index.html", "home"],
    ["Blog", "blog.html", "blog"],
    ["Projects", "projects.html", "projects"],
    ["Journey", "journey.html", "journey"],
    ["About", "about.html", "about"]
  ];
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try {
    const t = localStorage.getItem("theme");
    if (t) root.dataset.theme = t;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.dataset.theme = "dark";
  } catch (e) {}

  /* ---------- helpers ---------- */
  const categories = [...new Set(POSTS.map(p => p.category))];
  const hue = c => 200 + (categories.indexOf(c) * 47) % 160;
  const fmt = d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const initials = SITE.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  function banner(seed, h) {
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const pts = Array.from({ length: 14 }, () => [rnd() * 600, rnd() * 300]);
    let lines = "", dots = "";
    pts.forEach((p, i) => {
      const q = pts[(i + 1 + Math.floor(rnd() * 3)) % pts.length];
      lines += `<line x1='${p[0]}' y1='${p[1]}' x2='${q[0]}' y2='${q[1]}'/>`;
      dots += `<circle cx='${p[0]}' cy='${p[1]}' r='${4 + rnd() * 5}'/>`;
    });
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 300' preserveAspectRatio='xMidYMid slice'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},70%,16%)'/>` +
      `<stop offset='1' stop-color='hsl(${h + 40},70%,32%)'/></linearGradient></defs>` +
      `<rect width='600' height='300' fill='url(#g)'/>` +
      `<g stroke='hsl(${h},90%,70%)' stroke-opacity='.5' stroke-width='1.5'>${lines}</g>` +
      `<g fill='hsl(${h},90%,75%)'>${dots}</g></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg).replace(/'/g, "%27");
  }

  const sampleTag = x => (x.sample ? `<span class="sample">Sample</span>` : x.draft ? `<span class="sample">Draft</span>` : "");

  function postCard(p, i) {
    return `<a class="card" href="post.html?slug=${p.slug}">
      <div class="thumb"><img src="${p.image || banner(i + 1, hue(p.category))}" alt=""></div>
      <div class="card-body">
        <span class="badge">${p.category}</span>${sampleTag(p)}
        <h3>${p.title}</h3><p>${p.excerpt}</p>
        <div class="meta">${fmt(p.date)} &middot; ${p.read} min read</div>
      </div></a>`;
  }

  function projectCard(p, i) {
    const open = p.link ? `<a class="ext" href="${p.link}" target="_blank" rel="noopener" aria-label="Open project">&#8599;</a>` : "";
    return `<div class="card">
      <div class="thumb"><img src="${p.image || banner(i + 20, 205 + (i * 35) % 120)}" alt=""></div>
      <div class="card-body">
        <span class="status">${p.status}${sampleTag(p)}</span>
        <div class="card-title-row"><h3>${p.title}</h3>${open}</div>
        <p>${p.desc}</p>
        <div>${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        ${p.post ? `<a class="readmore" href="post.html?slug=${p.post}">Read the write-up &rarr;</a>` : ""}
      </div></div>`;
  }

  /* ---------- chrome ---------- */
  document.title = (page === "home" ? "" : "") + SITE.brand;
  const header = `<header class="site-header"><div class="container nav">
    <a class="brand" href="index.html">${SITE.brand}</a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false">&#9776;</button>
    <nav class="links">${PAGES.map(([n, h, k]) => `<a href="${h}" class="${k === page ? "active" : ""}">${n}</a>`).join("")}
      <button class="theme-btn" aria-label="Toggle dark mode">&#9680;</button></nav>
  </div></header>`;
  const footer = `<footer class="site-footer"><div class="container">
    <div class="foot-grid">
      <div><h4>${SITE.brand}</h4><p>${SITE.footerBlurb}</p>
        <a href="${SITE.github}" target="_blank" rel="noopener">GitHub</a>
        <a href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
        <a href="mailto:${SITE.email}">Email</a></div>
      <div><h4>Quick Links</h4><a href="blog.html">All Posts</a><a href="projects.html">Projects</a><a href="about.html">About</a></div>
      <div><h4>Categories</h4>${categories.map(c => `<a href="blog.html?cat=${encodeURIComponent(c)}">${c}</a>`).join("")}</div>
    </div>
    <div class="copy">&copy; ${new Date().getFullYear()} ${SITE.brand}. All rights reserved.</div>
  </div></footer>`;
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  $(".theme-btn").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  const menuBtn = $(".menu-btn");
  menuBtn.addEventListener("click", () => {
    const open = $(".links").classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });

  /* ---------- pages ---------- */
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  if (page === "home") {
    const f = sorted[0];
    app.innerHTML = `
      <div class="hero"><div class="container hero-inner">
        <h1>${SITE.brand}</h1><p>${SITE.tagline}</p>
        <div class="hero-actions"><a class="btn primary" href="blog.html">View Blog Posts</a><a class="btn" href="projects.html">Explore Projects</a></div>
      </div><div class="hero-art" style='background-image:url("${banner(7, 215)}")'></div></div>
      <div class="container">
        <section class="block"><div class="section-head"><h2>Featured Post</h2></div>
          <a class="card featured" href="post.html?slug=${f.slug}">
            <div class="thumb"><img src="${f.image || banner(1, hue(f.category))}" alt=""></div>
            <div class="card-body"><span class="badge">${f.category}</span>${sampleTag(f)}
              <h3>${f.title}</h3><p>${f.excerpt}</p>
              <div class="meta">${fmt(f.date)} &middot; ${f.read} min read</div></div>
          </a></section>
        <section class="block"><div class="section-head"><h2>Recent Posts</h2><a class="btn" href="blog.html">View All</a></div>
          <div class="grid two">${sorted.slice(1, 3).map((p, i) => postCard(p, i + 1)).join("")}</div></section>
      </div>`;
  }

  if (page === "blog") {
    const params = new URLSearchParams(location.search);
    let cat = params.get("cat") || "All Posts", q = "";
    app.innerHTML = `<div class="container">
      <h1 class="page-title">Blog Posts</h1>
      <input class="search" type="search" placeholder="Search posts..." aria-label="Search posts">
      <div class="chips"></div><div class="grid" id="posts"></div></div>`;
    const draw = () => {
      $(".chips").innerHTML = ["All Posts", ...categories]
        .map(c => `<button class="chip ${c === cat ? "active" : ""}" data-c="${c}">${c}</button>`).join("");
      const list = sorted.filter(p =>
        (cat === "All Posts" || p.category === cat) &&
        (p.title + " " + p.excerpt + " " + p.category).toLowerCase().includes(q));
      $("#posts").innerHTML = list.length
        ? list.map(p => postCard(p, POSTS.indexOf(p))).join("")
        : `<p class="empty">No posts match your search.</p>`;
    };
    $(".chips").addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      cat = b.dataset.c; draw();
    });
    $(".search").addEventListener("input", e => { q = e.target.value.toLowerCase(); draw(); });
    draw();
  }

  if (page === "projects") {
    app.innerHTML = `<div class="container">
      <h1 class="page-title">Projects</h1>
      <p class="lead">A showcase of my networking labs, automation scripts and infrastructure work.</p>
      <div class="grid">${PROJECTS.map(projectCard).join("")}</div></div>`;
  }

  if (page === "journey") {
    app.innerHTML = `<div class="container">
      <h1 class="page-title">My Journey</h1>
      <p class="lead">Milestones on the road to becoming a network engineer.</p>
      <div class="timeline">${JOURNEY.map(j => `<div class="t-item">
        <div class="t-top"><span class="t-type">${j.type}</span><span class="t-date">${j.date}</span>${sampleTag(j)}</div>
        <h3>${j.title}</h3><p>${j.desc}</p></div>`).join("")}</div></div>`;
  }

  if (page === "about") {
    app.innerHTML = `<div class="container">
      <h1 class="page-title">About Me</h1>
      <div class="about"><div class="avatar" aria-hidden="true">${initials}</div>
        <div><h2>${ABOUT.heading}</h2>${ABOUT.paragraphs.map(t => `<p>${t}</p>`).join("")}
          <div class="about-actions">
            <a class="btn primary" href="mailto:${SITE.email}">Email Me</a>
            <a class="btn" href="${SITE.github}" target="_blank" rel="noopener">GitHub</a>
            <a class="btn" href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
          </div></div></div>
      <div class="grid two">
        <div class="panel"><h3>Skills &amp; Technologies</h3>${ABOUT.skills.map(s => `<span class="tag">${s}</span>`).join("")}</div>
        <div class="panel"><h3>Education &amp; Certifications</h3><ul>${ABOUT.certs.map(c => `<li>${c}</li>`).join("")}</ul></div>
      </div></div>`;
  }

  if (page === "post") {
    const slug = new URLSearchParams(location.search).get("slug");
    const i = POSTS.findIndex(p => p.slug === slug);
    if (i < 0) {
      app.innerHTML = `<div class="container post"><a class="back" href="blog.html">&larr; Back to blog</a><h1>Post not found</h1></div>`;
    } else {
      const p = POSTS[i];
      document.title = p.title + " | " + SITE.brand;
      app.innerHTML = `<div class="container"><article class="post">
        <a class="back" href="blog.html">&larr; Back to blog</a>
        <div style="margin-top:20px"><span class="badge">${p.category}</span>${sampleTag(p)}</div>
        <h1>${p.title}</h1>
        <div class="meta">${fmt(p.date)} &middot; ${p.read} min read</div>
        <div class="cover"><img src="${p.image || banner(i + 1, hue(p.category))}" alt=""></div>
        ${p.content}</article></div>`;
    }
  }
})();
