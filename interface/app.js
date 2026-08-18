// interface/ui/app.js
// Operations Centre Shell: dynamic model fetch, reactive view routing, live stamp polling (AX-7).
// Contains 0 hard-coded entities — renders 100% from /api/model.

import { VIEWS, esc, el } from "./views.js";

const $ = s => document.querySelector(s);
let MODEL = { entities: [], problems: [] };
let STAMP = null;
let IS_LOADING = true;
let SERVER_ERROR = null;

// Filter state persisted during navigation and live polls
const FILTERS = {
  taskProject: "",
  taskStatus: "",
  taskDateSort: "newest",
  taskSearch: "",
  decisionProject: "",
  decisionStatus: "",
  showFrozen: false,
  decisionSearch: "",
  globalFilter: ""
};

const ORDER = ["front", "plan-item", "task", "decision", "mailbox-entry", "idea", "project-state", "skill"];

function currentView() {
  const hash = location.hash.replace(/^#\/?/, "").split("?")[0];
  return VIEWS[hash] ? hash : ORDER[0];
}

function getProjects() {
  return [...new Set(MODEL.entities.map(e => e.project).filter(Boolean))].sort();
}

function updateHUD() {
  const front = MODEL.entities.find(e => e.kind === "front" && e.active);
  const frontEl = $("#hudActiveFront");
  if (frontEl) {
    if (front) {
      frontEl.innerHTML = `
        <span class="front-marker">▶ ACTIVE FRONT</span>
        <span class="front-title">${esc(front.name)}</span>
      `;
    } else {
      frontEl.innerHTML = `
        <span class="front-marker">⏸ COMPASS</span>
        <span class="front-title">No active front selected</span>
      `;
    }
  }

  const countBadge = $("#count");
  if (countBadge) {
    if (SERVER_ERROR) {
      countBadge.innerHTML = `<span class="error-badge">⚠️ offline</span>`;
    } else if (IS_LOADING) {
      countBadge.textContent = "loading...";
    } else {
      countBadge.textContent = `${MODEL.entities.length} entities · ${new Date().toLocaleTimeString()}`;
    }
  }
}

function draw() {
  const kind = currentView();
  const main = $("#main");
  if (!main) return;

  // 1. Loading State
  if (IS_LOADING) {
    main.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <h3>Loading operations model...</h3>
        <p>Fetching entities from <code>/api/model</code></p>
      </div>
    `;
    return;
  }

  // 2. Error State
  if (SERVER_ERROR) {
    main.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Server disconnected</h3>
        <p>${esc(SERVER_ERROR)}</p>
        <button class="btn-retry" onclick="window.retryLoad()">Retry Connection</button>
      </div>
    `;
    return;
  }

  // Update Navigation Tabs with dynamic counts
  const tabsNav = $("#tabs");
  if (tabsNav) {
    tabsNav.innerHTML = ORDER.filter(k => VIEWS[k]).map(k => {
      let count = 0;
      if (k === "decision") {
        // Count decisions (+ method-decisions)
        count = MODEL.entities.filter(e => e.kind === "decision" || e.kind === "method-decision").length;
      } else {
        count = MODEL.entities.filter(e => e.kind === k).length;
      }
      return `
        <a href="#/${k}" class="nav-tab ${k === kind ? "on" : ""}">
          <span class="tab-label">${esc(VIEWS[k].label)}</span>
          <span class="tab-count">${count}</span>
        </a>
      `;
    }).join("");
  }

  // Preserve open rows across re-renders
  const openIds = new Set([...main.querySelectorAll("details[open]")].map(d => d.id).filter(Boolean));
  main.innerHTML = "";

  // Render Parser Problems banner if any
  if (MODEL.problems && MODEL.problems.length) {
    const probDiv = el("div", "problems-banner");
    probDiv.innerHTML = `
      <div class="problems-header">
        <span class="warn-icon">⚠️</span>
        <strong>${MODEL.problems.length} entries reported with parse problems (never skipped)</strong>
      </div>
      <ul class="problems-list">
        ${MODEL.problems.map(p => `
          <li>
            <code>${esc(p.path ? p.path.split("/").slice(-2).join("/") : "file")}${p.line ? ":" + p.line : ""}</code>:
            ${esc(p.why)} ${p.text ? `<em>(${esc(p.text)})</em>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
    main.append(probDiv);
  }

  // Filter list by kind
  let list = [];
  if (kind === "decision") {
    list = MODEL.entities.filter(e => e.kind === "decision" || e.kind === "method-decision");
  } else {
    list = MODEL.entities.filter(e => e.kind === kind);
  }

  // 3. Render View via Views Module
  const viewRenderer = VIEWS[kind];
  if (viewRenderer) {
    const renderedNode = viewRenderer.render(list, MODEL, FILTERS);
    main.append(renderedNode);
  } else {
    main.append(el("div", "empty-state", `<p>Unknown view: ${esc(kind)}</p>`));
  }

  // Re-open previously open details rows
  for (const id of openIds) {
    const d = main.querySelector(`#${CSS.escape(id)}`);
    if (d) d.open = true;
  }

  // Attach dynamic event listeners to toolbar inputs inside the rendered view
  attachToolbarEvents(kind);
}

function attachToolbarEvents(kind) {
  if (kind === "task") {
    const projSel = $("#taskFilterProj");
    if (projSel) {
      projSel.addEventListener("change", e => {
        FILTERS.taskProject = e.target.value;
        draw();
      });
    }

    const statusSel = $("#taskFilterStatus");
    if (statusSel) {
      statusSel.addEventListener("change", e => {
        FILTERS.taskStatus = e.target.value;
        draw();
      });
    }

    const dateSortSel = $("#taskFilterDateSort");
    if (dateSortSel) {
      dateSortSel.addEventListener("change", e => {
        FILTERS.taskDateSort = e.target.value;
        draw();
      });
    }

    const searchInput = $("#taskSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        FILTERS.taskSearch = e.target.value;
        draw();
      });
    }
  } else if (kind === "decision") {
    const projSel = $("#decFilterProj");
    if (projSel) {
      projSel.addEventListener("change", e => {
        FILTERS.decisionProject = e.target.value;
        draw();
      });
    }

    const statusSel = $("#decFilterStatus");
    if (statusSel) {
      statusSel.addEventListener("change", e => {
        FILTERS.decisionStatus = e.target.value;
        draw();
      });
    }

    const frozenToggle = $("#decToggleFrozen");
    if (frozenToggle) {
      frozenToggle.addEventListener("change", e => {
        FILTERS.showFrozen = e.target.checked;
        draw();
      });
    }

    const searchInput = $("#decSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        FILTERS.decisionSearch = e.target.value;
        draw();
      });
    }
  }
}

async function load() {
  try {
    const res = await fetch("/api/model");
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    MODEL = await res.json();
    SERVER_ERROR = null;
    IS_LOADING = false;
    updateHUD();
    draw();
  } catch (err) {
    SERVER_ERROR = `Could not connect to /api/model: ${err.message}`;
    IS_LOADING = false;
    updateHUD();
    draw();
  }
}

async function watch() {
  try {
    const res = await fetch("/api/stamp");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const newStamp = data.stamp;
    if (STAMP !== null && newStamp !== STAMP) {
      await load();
    }
    STAMP = newStamp;
    if (SERVER_ERROR) {
      SERVER_ERROR = null;
      updateHUD();
      draw();
    }
  } catch {
    SERVER_ERROR = "Server stopped or unreachable";
    updateHUD();
  }
}

window.retryLoad = () => {
  IS_LOADING = true;
  SERVER_ERROR = null;
  draw();
  load();
};

window.addEventListener("hashchange", draw);
load().then(watch);
setInterval(watch, 2000);
