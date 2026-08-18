// MLabs & NEXUS Operations Cockpit Prototype v3.0
// Views render entirely from /api/model; this file names no instance.,
// Task Lifecycle, CheatSheet, Modals, Scratchpad.

const STORAGE_KEYS = {
  TASKS: "mlabs_nexus_tasks_v3",
  IDEAS: "mlabs_nexus_ideas_v3",
  SCRATCHPAD: "mlabs_nexus_scratchpad_v3"
};

// Initial Core Data
// ─────────────────────────────────────────────────────────────────────────────
// The model, from the server. Everything below renders from this.
//
// This was a 377-line hand-written literal until 2026-08-18 — which is why the page
// showed 6 skills against 14 on disk, omitted two projects that exist, and offered a
// tab reading "Decisiones (92)" over a list of 2. A view that types its own data is
// a screenshot of a moment that has already passed.
//
// Shape is unchanged on purpose: the renderers below are Gemini's and are kept whole.
// This only fills them from /api/model instead of from memory.
// ─────────────────────────────────────────────────────────────────────────────

let DATA = {
  activeFront: null, projects: [], tasks: [], livePlan: [],
  mailbox: [], ideas: [], decisions: [], skills: [],
  problems: [], loaded: false,
  cheatsheet: [
    {
      category: "session",
      catLabel: "Session ⭐",
      groups: [
        {
          title: "Session lifecycle",
          desc: "The canonical loop: open -> orient -> flight -> close -> audit.",
          cmds: [
            { label: "Open session", code: "claude -p 'open a session: read Schedule.md, report the active front, and ask if we work it'", hint: "Prompt" },
            { label: "Close task cleanly", code: "claude -p 'close this task: strike each item in Current_plan.md with its destination, update state.md, empty the plan, and run superauditor'", hint: "Prompt" },
            { label: "Audit working tree", code: "claude -p 'run the superauditor over everything touched in this task'", hint: "Prompt" }
          ]
        },
        {
          title: "Quick status & verification",
          desc: "Check workspace consistency in 2 seconds.",
          cmds: [
            { label: "Check git status", code: "git status -s && git branch -vv", hint: "Shell" },
            { label: "Verify release allowlist", code: "git ls-files | sort", hint: "Shell" }
          ]
        }
      ]
    },
    // A category of commands naming an instance's own files lived here and was
    // removed 2026-08-18. They are instance content; M-113 routes each home to the
    // note that owns it and has the interface collect the view.
    // A project-specific category lived here and was removed 2026-08-18: instance
    // content inside the public engine. M-113 routes each block home to the note that
    // owns it, and the interface collects the view — it does not carry a copy.
    {
      category: "git",
      catLabel: "Git & Worktrees",
      groups: [
        {
          title: "Worktree management",
          desc: "Manage parallel agent branches safely.",
          cmds: [
            { label: "List active worktrees", code: "git worktree list", hint: "Shell" },
            { label: "Prune stale worktrees", code: "git worktree prune", hint: "Shell" },
            // a subrepo-status command was here and hard-coded the repo list
          ]
        }
      ]
    },
    {
      category: "claude",
      catLabel: "Claude Code",
      groups: [
        {
          title: "Claude Code CLI invocations",
          desc: "Autonomous runs and custom skill triggering.",
          cmds: [
            { label: "Autonomous run", code: "claude -p 'execute autonomous-run: objective: \"<describe>\"'", hint: "Prompt" },
            { label: "Triage mailbox", code: "claude -p 'triage the mailbox and route each entry to its destination'", hint: "Prompt" },
            { label: "Code cleanup sweep", code: "claude -p 'run code-cleanup over src/ removing private terminology and changelogs'", hint: "Prompt" }
          ]
        }
      ]
    }
  ]
};

const byKind = (m, k) => (m.entities || []).filter(e => e.kind === k);

function buildDATA(model) {
  const front = byKind(model, "front").find(e => e.active) || null;
  const states = byKind(model, "project-state");
  const fronts = byKind(model, "front");

  // A project is its state file plus whatever fronts name it. Fields the file does
  // not carry are left null and rendered as unknown — never invented, because a
  // progress bar with no source behind it is the drift this rewrite removes.
  const projects = states.map(st => {
    const mine = fronts.filter(f => f.project === st.project);
    return {
      id: st.project, name: st.project, tagline: st.current_phase || null,
      phase: st.current_phase || null, status: st.released ? "released" : null,
      progressPct: null,
      lastUpdated: st.last_updated || null,
      integratedThrough: st.integrated_through || null,
      nextAction: st.next_action || null,
      repo: null, com: null,
      stats: { decisions: null, blocksTotal: null, blocksDone: null },
      blocks: [],
      fronts: mine.map(f => ({ name: f.name, waitsOn: f.waits_on || f.moves_when, active: !!f.active })),
      raw: st,
    };
  });

  return {
    ...DATA,
    loaded: true,
    problems: model.problems || [],
    activeFront: front && { title: front.name, movesWhen: front.moves_when, project: front.project },
    // The queued fronts were two literal cards. They are the compass's own rows now,
    // so a front that moves on disk moves here.
    queuedFronts: fronts.filter(f => f.marker && !f.active)
                        .map(f => ({ marker: f.marker, name: f.name,
                                     project: f.project, movesWhen: f.moves_when })),
    projects,
    tasks: byKind(model, "task").map(e => ({
      id: e.id_raw || e.id, project: e.project, title: e.title, status: e.status || "⬜",
      why: e.why || null, author: e.author || null, date: e.date || null,
      comments: e.comments || [], text: e.title,
    })),
    livePlan: byKind(model, "plan-item").map(e => ({
      index: e.index, text: e.text, struck: e.struck, dest: e.destination || null,
    })),
    mailbox: byKind(model, "mailbox-entry").map(e => ({
      id: e.id, state: e.state, dest: e.destination, project: e.project,
      title: e.title, author: e.author, date: e.date,
    })),
    ideas: byKind(model, "idea").map(e => ({
      title: e.title, project: e.project, scope: e.scope || null, body: e.body || "",
    })),
    // Decisions are not in the model yet — they are 172 entries across five formats,
    // and converting them is P1. An empty list is the truthful answer today; four
    // typed-in examples were not.
    decisions: byKind(model, "decision").map(e => ({
      id: e.id_raw || e.id, project: e.project, title: e.title,
      why: e.why, author: e.author, date: e.date, discarded: e.discarded,
    })),
    skills: byKind(model, "skill").map(e => ({
      name: e.title, type: e.trigger, summary: e.summary,
      trigger: e.when || e.evidence || null,
    })),
  };
}

let __stamp = null;

async function loadModel() {
  const r = await fetch("/api/model");
  const model = await r.json();
  DATA = buildDATA(model);
  if (!selectedProjectId) selectedProjectId = DATA.projects[0]?.id || null;
  updateBadges();   // also fills the project selects from the data
  renderView();     // repaint whatever is open, now with real numbers
}

// Polling, not a socket: every push mechanism needs a build step, and the axiom
// forbidding one outranks the nicer mechanism.
async function watchModel() {
  try {
    const s = (await (await fetch("/api/stamp")).json()).stamp;
    if (__stamp !== null && s !== __stamp) await loadModel();
    __stamp = s;
  } catch (e) { /* the server stopped; the page keeps what it has */ }
}

// Global State
let currentView = "overview";
let selectedProjectId = null;   // set from the model on first load
let selectedProjectTab = "roadmap";
let activeFilter = "ALL";
let selectedCsCat = "session";
let taskListFilter = "ALL";

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Load persisted state from localStorage
function loadPersistedData() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) DATA.tasks = JSON.parse(savedTasks);
    
    const savedIdeas = localStorage.getItem(STORAGE_KEYS.IDEAS);
    if (savedIdeas) DATA.ideas = JSON.parse(savedIdeas);

    const savedScratch = localStorage.getItem(STORAGE_KEYS.SCRATCHPAD);
    if (savedScratch && $("#scratchpadInput")) $("#scratchpadInput").value = savedScratch;
  } catch (e) {
    console.warn("Could not load from localStorage", e);
  }
}

// ⚠️ Writing to disk is P3 and its boundary is already enumerated in interface:AX-3.
// Until it lands these keep the change on screen only — and say so — rather than
// looking like they saved something.
function persistTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DATA.tasks));
  } catch (e) {
    console.warn("Error saving tasks", e);
  }
}

function navigateTo(viewName) {
  currentView = viewName;
  $$(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.view === viewName);
  });
  renderView();
}

// App Initialization
function initApp() {
  // No loadPersistedData(): localStorage held tasks and ideas because nothing else
  // did. The server does now, and a browser keeping its own copy would be a second
  // source that silently disagrees with the files. The scratchpad stays local — it
  // is a notepad, not a record.
  updateBadges();
  loadModel().catch(e => {
    const main = document.querySelector("#viewContainer") || document.body;
    main.insertAdjacentHTML("afterbegin",
      `<div class="problems" style="margin:20px">Could not reach the model: ${e}.` +
      ` The server may not be running, or it was started without an adapter.</div>`);
  });
  setInterval(watchModel, 2000);

  $$(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      renderView();
    });
  });

  $("#projectFilter").addEventListener("change", e => {
    activeFilter = e.target.value;
    if (currentView === "overview") navigateTo("projects");
    else renderView();
  });

  // Scratchpad live auto-save
  const scratch = $("#scratchpadInput");
  if (scratch) {
    scratch.addEventListener("input", () => {
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, scratch.value);
    });
  }

  // Live modal markdown preview update
  $("#taskTitle")?.addEventListener("input", updateTaskPreview);
  $("#taskProject")?.addEventListener("change", updateTaskPreview);
  $("#taskStatus")?.addEventListener("change", updateTaskPreview);
  $("#taskWhy")?.addEventListener("input", updateTaskPreview);

  // Keyboard shortcut (Ctrl+K or Cmd+K) for search
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      $("#globalSearch")?.focus();
    }
  });

  renderView();
}

function updateBadges() {
  if ($("#badgeProjects")) $("#badgeProjects").textContent = DATA.projects.length;
  if ($("#badgeInbox")) $("#badgeInbox").textContent = DATA.mailbox.filter(m => m.state === "open").length + DATA.tasks.filter(t => t.status === "⬜" || t.status === "🔨").length;
  if ($("#badgeIdeas")) $("#badgeIdeas").textContent = DATA.ideas.length;
  if ($("#badgeDecisions")) $("#badgeDecisions").textContent = DATA.decisions.length;
  if ($("#badgeSkills")) $("#badgeSkills").textContent = DATA.skills.length;
  fillProjectSelects();
}

// The project lists come from the data, never from the markup. Typing them is how the
// page ended up offering two projects with no cartridge while omitting two that exist.
function fillProjectSelects() {
  // The project lists come from the data, never from the markup. Typing them is how
  // this page ended up offering two projects with no cartridge while omitting two
  // that exist on disk.
  const names = [...new Set(DATA.projects.map(p => p.id).filter(Boolean))].sort();
  const opts = (keep, extra) =>
    names.map(n => `<option${n === keep ? " selected" : ""}>${n}</option>`).join("") + (extra || "");

  const filter = $("#projectFilter");
  if (filter) {
    const keep = filter.value;
    filter.innerHTML = `<option value="ALL">Todos los proyectos</option>` + opts(keep);
  }
  for (const id of ["#taskProject", "#ideaProject"]) {
    const sel = $(id);
    if (!sel) continue;
    const keep = sel.value;
    sel.innerHTML = opts(keep,
      `<option value="cross"${keep === "cross" ? " selected" : ""}>cross (general)</option>`);
  }
}

function showToast(msg) {
  const toast = $("#toast");
  const msgEl = $("#toastMsg");
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// --------------------------------------------------------------------------
// TASK LIFECYCLE ACTIONS
// --------------------------------------------------------------------------
function updateTaskStatus(taskId, newStatus) {
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = newStatus;
  persistTasks();
  updateBadges();
  showToast(`Tarea ${taskId} actualizada a: ${newStatus}`);
  renderView();
}

function completeTask(taskId) {
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = "✅";
  const today = new Date().toISOString().split("T")[0];
  if (!task.comments) task.comments = [];
  task.comments.push({
    author: DATA.operator || "operator",
    date: today,
    text: "✅ Tarea completada y validada en sesión."
  });
  persistTasks();
  updateBadges();
  showToast(`¡Tarea ${taskId} completada! ✅`);
  renderView();
}

function openCommentModal(taskId) {
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task) return;
  $("#commentTaskId").value = taskId;
  $("#commentTaskTitleLabel").textContent = `Tarea ${task.id} (${task.project}): "${task.title}"`;
  $("#commentTextInput").value = "";
  $("#commentModal")?.classList.add("active");
  $("#commentTextInput")?.focus();
}

function closeCommentModal() {
  $("#commentModal")?.classList.remove("active");
}

function handleSaveComment(e) {
  e.preventDefault();
  const taskId = $("#commentTaskId").value;
  const text = $("#commentTextInput").value.trim();
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task || !text) return;

  if (!task.comments) task.comments = [];
  const today = new Date().toISOString().split("T")[0];
  task.comments.push({
    author: DATA.operator || "operator",
    date: today,
    text
  });

  persistTasks();
  closeCommentModal();
  showToast(`Comentario añadido a ${taskId}`);
  renderView();
}

function openDiscardModal(taskId) {
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task) return;
  $("#discardTaskId").value = taskId;
  $("#discardTaskTitleLabel").textContent = `Tarea ${task.id} (${task.project}): "${task.title}"`;
  $("#discardReasonInput").value = "";
  $("#discardModal")?.classList.add("active");
  $("#discardReasonInput")?.focus();
}

function closeDiscardModal() {
  $("#discardModal")?.classList.remove("active");
}

function handleSaveDiscard(e) {
  e.preventDefault();
  const taskId = $("#discardTaskId").value;
  const reason = $("#discardReasonInput").value.trim();
  const task = DATA.tasks.find(t => t.id === taskId);
  if (!task || !reason) return;

  task.status = "⚫";
  task.discardReason = reason;
  const today = new Date().toISOString().split("T")[0];
  if (!task.comments) task.comments = [];
  task.comments.push({
    author: DATA.operator || "operator",
    date: today,
    text: `⚫ Descartada (PH-3). Motivo: ${reason}`
  });

  persistTasks();
  closeDiscardModal();
  updateBadges();
  showToast(`Tarea ${taskId} descartada con registro`);
  renderView();
}

// --------------------------------------------------------------------------
// MODALS: ADD TASK & ADD IDEA
// --------------------------------------------------------------------------
function openTaskModal(prefillTitle = "", prefillProject = null) {
  const modal = $("#taskModal");
  if (!modal) return;
  if (prefillTitle) $("#taskTitle").value = prefillTitle;
  if (prefillProject) $("#taskProject").value = prefillProject;
  updateTaskPreview();
  modal.classList.add("active");
  $("#taskTitle").focus();
}

function closeTaskModal() {
  $("#taskModal")?.classList.remove("active");
}

function updateTaskPreview() {
  const title = $("#taskTitle")?.value || "<título de la tarea>";
  const proj = $("#taskProject")?.value || DATA.projects[0]?.id || "cross";
  const status = $("#taskStatus")?.value || "⬜";
  const why = $("#taskWhy")?.value || "<razón técnica>";
  const today = new Date().toISOString().split("T")[0];
  const nextId = "T" + (DATA.tasks.length + 60);

  const preview = `### ${nextId} · ${title} ${status}\n**project:** \`${proj}\`\n**Why** *(${DATA.operator || "operator"}, ${today})*. ${why}`;
  if ($("#taskMarkdownPreview")) $("#taskMarkdownPreview").textContent = preview;
}

function handleCreateTask(e) {
  e.preventDefault();
  const title = $("#taskTitle").value.trim();
  const project = $("#taskProject").value;
  const status = $("#taskStatus").value;
  const why = $("#taskWhy").value.trim();
  const today = new Date().toISOString().split("T")[0];
  const nextId = "T" + (DATA.tasks.length + 60);

  const newTask = {
    id: nextId,
    project,
    title,
    status,
    why,
    author: DATA.operator || "operator",
    date: today,
    comments: []
  };

  DATA.tasks.unshift(newTask);
  persistTasks();

  $("#taskForm").reset();
  closeTaskModal();
  updateBadges();
  showToast(`Tarea ${nextId} añadida a ${project}`);

  if (currentView === "inbox" || currentView === "projects") renderView();
}

function openIdeaModal(prefillTitle = "", prefillBody = "") {
  const modal = $("#ideaModal");
  if (!modal) return;
  if (prefillTitle) $("#ideaTitle").value = prefillTitle;
  if (prefillBody) $("#ideaBody").value = prefillBody;
  modal.classList.add("active");
  $("#ideaTitle").focus();
}

function closeIdeaModal() {
  $("#ideaModal")?.classList.remove("active");
}

function handleCreateIdea(e) {
  e.preventDefault();
  const title = $("#ideaTitle").value.trim();
  const project = $("#ideaProject").value;
  const scope = $("#ideaScope").value.trim() || "general";
  const body = $("#ideaBody").value.trim();

  const newIdea = {
    title,
    project,
    scope,
    body
  };

  DATA.ideas.unshift(newIdea);
  localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(DATA.ideas));

  $("#ideaForm").reset();
  closeIdeaModal();
  updateBadges();
  showToast(`Idea "${title}" aparcada`);

  if (currentView === "ideas") renderView();
}

function toggleScratchpad() {
  $("#scratchpadDrawer")?.classList.toggle("open");
}

function convertScratchpadToTask() {
  const text = $("#scratchpadInput")?.value.trim();
  if (!text) {
    alert("El bloc de notas está vacío.");
    return;
  }
  const lines = text.split("\n");
  const title = lines[0].replace(/^#*\s*/, "").slice(0, 100);
  const why = lines.slice(1).join("\n").trim() || "Anotado desde el bloc de notas rápido.";
  
  toggleScratchpad();
  openTaskModal(title);
  if ($("#taskWhy")) $("#taskWhy").value = why;
  updateTaskPreview();
}

function convertScratchpadToIdea() {
  const text = $("#scratchpadInput")?.value.trim();
  if (!text) {
    alert("El bloc de notas está vacío.");
    return;
  }
  const lines = text.split("\n");
  const title = lines[0].replace(/^#*\s*/, "").slice(0, 80);
  const body = lines.slice(1).join("\n").trim() || text;

  toggleScratchpad();
  openIdeaModal(title, body);
}

// --------------------------------------------------------------------------
// VIEW ROUTER
// --------------------------------------------------------------------------
function renderView() {
  const container = $("#mainContent");
  container.innerHTML = "";

  switch (currentView) {
    case "overview":
      renderOverview();
      break;
    case "projects":
      renderProjectsHub();
      break;
    case "cockpit":
      renderCockpit();
      break;
    case "cheatsheet":
      renderCheatSheet();
      break;
    case "inbox":
      renderInbox();
      break;
    case "ideas":
      renderIdeas();
      break;
    case "decisions":
      renderDecisions();
      break;
    case "skills":
      renderSkills();
      break;
  }
}

function selectProject(projId) {
  selectedProjectId = projId;
  selectedProjectTab = "roadmap";
  renderProjectsHub();
}

function setProjectTab(tabName) {
  selectedProjectTab = tabName;
  renderProjectsHub();
}

function setCsCategory(cat) {
  selectedCsCat = cat;
  renderCheatSheet();
}

function setTaskListFilter(filter) {
  taskListFilter = filter;
  renderInbox();
}

function copyCode(btn, codeText) {
  navigator.clipboard.writeText(codeText).then(() => {
    const parentRow = btn.closest(".cs-cmd-row");
    if (parentRow) parentRow.classList.add("copied");
    btn.textContent = "COPIED!";
    showToast("Comando copiado");
    setTimeout(() => {
      if (parentRow) parentRow.classList.remove("copied");
      btn.textContent = "COPY";
    }, 1800);
  });
}

// --------------------------------------------------------------------------
// 0. OVERVIEW & INFOGRAPHIC (HOME PAGE)
// --------------------------------------------------------------------------
function renderOverview() {
  const container = $("#mainContent");
  container.innerHTML = `
    <!-- HERO BANNER -->
    <div class="overview-hero">
      <div class="hero-main-title">
        <span>⚡</span> <span class="gradient-text">MLabs</span>
        <span class="tag-pill tag-project" style="font-size: 13px; font-weight: 700;">v1.1.0</span>
      </div>
      <p class="hero-tagline">
        <strong>A working methodology for building knowledge systems with AI agents — packaged as a company.</strong><br>
        MLabs es la <em>constitución</em> pública; NEXUS es el <em>país</em> privado y operativo; cada proyecto es un <em>cartridge</em> soberano e independiente.
      </p>

      <!-- METRICS HUD -->
      <div class="hero-metrics-row">
        <div class="hero-metric-card" onclick="navigateTo('projects')" style="cursor: pointer;">
          <span class="hero-metric-val">${DATA.projects.length}</span>
          <span class="hero-metric-label">Proyectos Activos</span>
        </div>
        <div class="hero-metric-card" onclick="navigateTo('decisions')" style="cursor: pointer;">
          <span class="hero-metric-val">${DATA.decisions.length}+</span>
          <span class="hero-metric-label">Decisiones Registradas (Dn)</span>
        </div>
        <div class="hero-metric-card">
          <span class="hero-metric-val" style="color: var(--emerald);">1</span>
          <span class="hero-metric-label">Frente Activo Único (▶)</span>
        </div>
        <div class="hero-metric-card" onclick="navigateTo('skills')" style="cursor: pointer;">
          <span class="hero-metric-val" style="color: var(--accent-cyan);">14</span>
          <span class="hero-metric-label">Skills & Empleados</span>
        </div>
      </div>
    </div>

    <!-- 3-TIER ARCHITECTURE INFOGRAPHIC -->
    <div class="infographic-section-title">
      <span>🏛️</span> Los 3 Niveles Arquitectónicos de MLabs
    </div>

    <div class="tiers-grid">
      <!-- LEVEL 1 -->
      <div class="tier-card tier-1">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 1 · REGLA SUPREMA</div>
            <h3 class="tier-name">Filosofía</h3>
          </div>
          <span class="tier-file">PHILOSOPHY.md</span>
        </div>
        <div class="tier-body">
          Seis cláusulas rectoras inmutables. <strong>Rompe todos los empates.</strong> Cambia casi nunca y sólo por decisión explícita del operador.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>💎</span> <strong>PH-1:</strong> Verdad sobre coherencia</div>
          <div class="tier-rule-item"><span>📜</span> <strong>PH-3:</strong> Nada se pierde sin registro</div>
          <div class="tier-rule-item"><span>🧠</span> <strong>PH-6:</strong> Ergonomía de atención</div>
        </div>
      </div>

      <!-- LEVEL 2 -->
      <div class="tier-card tier-2">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 2 · LEYES TÉCNICAS</div>
            <h3 class="tier-name">Axiomas</h3>
          </div>
          <span class="tier-file">AXIOMS.md</span>
        </div>
        <div class="tier-body">
          28 reglas settleadas que implementan las cláusulas de filosofía y <strong>nunca se violan</strong>. Cada una nombra la cláusula a la que sirve.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>🔒</span> <strong>AX-1:</strong> Default-deny allowlist</div>
          <div class="tier-rule-item"><span>🚫</span> <strong>AX-5:</strong> Cero datos personales en git</div>
          <div class="tier-rule-item"><span>🤖</span> <strong>AX-11:</strong> Umbral de despido N / K</div>
        </div>
      </div>

      <!-- LEVEL 3 -->
      <div class="tier-card tier-3">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 3 · ESTADO PRIVADO</div>
            <h3 class="tier-name">NEXUS & Decisiones</h3>
          </div>
          <span class="tier-file">NEXUS/ (Repo Privado)</span>
        </div>
        <div class="tier-body">
          Donde vive el trabajo real: registro inmutable de decisiones con autor, fecha, justificación y alternativas descartadas.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>📁</span> <strong>Centro de operaciones:</strong> el estado privado de la instancia</div>
          <div class="tier-rule-item"><span>📦</span> <strong>Cartuchos de proyecto:</strong> definición, axiomas, decisiones y estado de cada uno</div>
          <div class="tier-rule-item"><span>📬</span> <strong>Sistema:</strong> brújula, plan vivo, buzón, tareas e ideas</div>
        </div>
      </div>
    </div>

    <!-- FLOWCHART: METHOD WORKING LOOP -->
    <div class="flowchart-card">
      <div class="infographic-section-title" style="margin-bottom: 0;">
        <span>🔄</span> El Ciclo de Trabajo Canónico (METHOD.md)
      </div>
      <p style="font-size: 13px; color: var(--text-secondary);">
        Flujo reproducible de cada sesión de trabajo con agentes: de la brújula al cierre enrutado sin tareas invisibles.
      </p>

      <div class="flowchart-nodes">
        <div class="flow-node">
          <span class="flow-node-step">PASO 1 · ORIENTAR</span>
          <div class="flow-node-title">🧭 Brújula (Schedule)</div>
          <div class="flow-node-desc">Exactamente 1 frente activo (▶). Si lo que haces no coincide, algo está mal.</div>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 2 · EJECUTAR</span>
          <div class="flow-node-title">⚡ Plan en Vuelo</div>
          <div class="flow-node-desc">Current_plan.md se actualiza en vivo. Cero tareas en memoria volátil.</div>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 3 · CERRAR</span>
          <div class="flow-node-title">🚪 Cierre Enrutado</div>
          <div class="flow-node-desc">Cada ítem tachado lleva su destino explícito (✅ resuelto, ⚫ descartado).</div>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 4 · AUDITAR</span>
          <div class="flow-node-title">🤖 Superauditor</div>
          <div class="flow-node-desc">Verifica estructuralmente que nada violó los axiomas antes de vaciar el plan.</div>
        </div>
      </div>
    </div>

    <!-- TOPOLOGY MATRIX -->
    <div class="infographic-section-title">
      <span>🌐</span> Topología de Repositorios y Cartridges (${DATA.projects.length} Proyectos)
    </div>

    <div class="topology-grid">
      ${DATA.projects.map(p => `
        <div class="topology-card" onclick="selectProject('${p.id}'); navigateTo('projects');" style="cursor: pointer;">
          <div class="topology-card-title">
            <span>${p.name}</span>
            <span class="status-chip ${p.status === 'ACTIVE' ? 'status-active' : 'status-paused'}">${p.status}</span>
          </div>
          <div class="topology-card-desc">${p.tagline}</div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan); margin-top: 4px;">
            ${p.stats.blocksDone}/${p.stats.blocksTotal} bloques · ${p.stats.decisions} decisiones
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 1. PROJECTS HUB
// --------------------------------------------------------------------------
function renderProjectsHub() {
  const container = $("#mainContent");
  const filteredProjects = DATA.projects.filter(p => activeFilter === "ALL" || p.id === activeFilter);
  const selectedProj = DATA.projects.find(p => p.id === selectedProjectId) || DATA.projects[0];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🚀</span> Projects Hub</h1>
        <p class="view-subtitle">Cartera de proyectos ordenada por profundidad, volumen de decisiones y madurez técnica.</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-hud-action btn-add-task" onclick="openTaskModal('', '${selectedProj.id}')">
          <span>➕</span> Añadir Tarea a ${selectedProj.name}
        </button>
      </div>
    </div>

    <!-- PROJECT CARDS GRID -->
    <div class="projects-matrix-grid">
      ${filteredProjects.map((p, idx) => `
        <div class="project-card ${p.id === selectedProjectId ? 'active-selected' : ''}" onclick="selectProject('${p.id}')">
          <div class="card-top">
            <div class="project-name-group">
              <span class="project-rank">#${idx + 1}</span>
              <h3 class="project-name">${p.name}</h3>
            </div>
            <span class="status-chip ${p.status === 'ACTIVE' ? 'status-active' : 'status-paused'}">${p.status}</span>
          </div>
          
          <div class="progress-section">
            <div class="progress-labels">
              <span>Progreso de bloques</span>
              <strong style="font-family: var(--font-mono);">${p.stats.blocksDone}/${p.stats.blocksTotal} (${p.progressPct}%)</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${p.progressPct}%"></div>
            </div>
          </div>

          <div class="next-action-preview" title="${p.nextAction}">
            <strong>Next:</strong> ${p.nextAction}
          </div>

          <div class="card-meta-row">
            <div class="meta-item">
              <span>📜</span>
              <span><strong>${p.stats.decisions}</strong> decisiones</span>
            </div>
            <div class="meta-item">
              <span>⏱️</span>
              <span>${p.lastUpdated}</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>

    <!-- PROJECT DEEP-DIVE -->
    <div class="project-detail-panel">
      <div class="detail-header">
        <div class="detail-title-group">
          <h2>${selectedProj.name} <span class="tag-pill tag-project">${selectedProj.phase}</span></h2>
          <p class="detail-subtitle">${selectedProj.tagline}</p>
        </div>
        <div class="detail-header-actions">
          <button class="action-btn" onclick="navigator.clipboard.writeText('${selectedProj.repo}'); showToast('Git remote copiado: ${selectedProj.repo}')">
            <span>📋</span> Copiar Git Remote
          </button>
        </div>
      </div>

      <!-- HERO: NEXT ACTION CALLOUT -->
      <div class="next-action-hero-card">
        <div class="hero-icon">🎯</div>
        <div class="hero-content">
          <div class="hero-label">NEXT ACTION (QUÉ DESBLOQUEA EL PROYECTO HOY)</div>
          <div class="hero-text">${selectedProj.nextAction}</div>
        </div>
      </div>

      <!-- INTERACTIVE STEPPER ROADMAP -->
      <div>
        <div class="stepper-section-title">
          <span>ROADMAP DE BLOQUES (${selectedProj.blocks.length} BLOQUES SECUENCIALES)</span>
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--emerald);">
            ${selectedProj.stats.blocksDone} de ${selectedProj.stats.blocksTotal} completados
          </span>
        </div>

        <div class="stepper-container">
          ${selectedProj.blocks.map((b, bIdx) => `
            <div class="step-node ${b.status === 'completed' ? 'completed' : (b.status === 'active' ? 'active-flight' : 'pending')}" title="${b.note}">
              <div class="step-id">
                <span>${b.status === 'completed' ? '✅' : (b.status === 'active' ? '🔵' : '⏳')}</span>
                <span>${b.id}</span>
              </div>
              <div class="step-title">${b.name}</div>
            </div>
            ${bIdx < selectedProj.blocks.length - 1 ? `
              <div class="step-connector ${b.status === 'completed' ? 'completed' : ''}"></div>
            ` : ''}
          `).join("")}
        </div>
      </div>

      <!-- INTERNAL PROJECT TABS -->
      <div class="detail-tabs-bar">
        <button class="subtab-btn ${selectedProjectTab === 'roadmap' ? 'active' : ''}" onclick="setProjectTab('roadmap')">
          📊 Bloque Activo & Subtareas
        </button>
        <button class="subtab-btn ${selectedProjectTab === 'decisions' ? 'active' : ''}" onclick="setProjectTab('decisions')">
          📜 Decisiones del Proyecto (${selectedProj.stats.decisions})
        </button>
        <button class="subtab-btn ${selectedProjectTab === 'meta' ? 'active' : ''}" onclick="setProjectTab('meta')">
          🏛️ Ficha Técnica & Repositorio
        </button>
      </div>

      <!-- SUBTAB CONTENT -->
      <div class="detail-tab-content">
        ${renderProjectSubtabContent(selectedProj)}
      </div>
    </div>
  `;
}

function renderProjectSubtabContent(proj) {
  if (selectedProjectTab === "roadmap") {
    return `
      <div class="info-card">
        <h3><span>⚡</span> Tareas del Bloque Actual (${proj.activeBlockDetails.blockId})</h3>
        <div class="tickets-list">
          ${proj.activeBlockDetails.subtasks.map(t => `
            <div class="plan-item-row ${t.status === 'done' ? 'completed' : ''}">
              <span class="plan-idx">${t.ref}</span>
              <span class="plan-text">${t.name}</span>
              <span class="dest-tag ${t.status === 'done' ? 'dest-resolved' : 'dest-inflight'}">
                ${t.status === 'done' ? '✅ Hecho' : (t.status === 'inflight' ? '🔵 En Vuelo' : '⏳ Pendiente')}
              </span>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="info-card">
        <h3><span>📌</span> Estado Invariante</h3>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-key">Última actualización</span><span class="kv-val">${proj.lastUpdated}</span></div>
          <div class="kv-row"><span class="kv-key">Integrado hasta</span><span class="kv-val">${proj.integratedThrough}</span></div>
          <div class="kv-row"><span class="kv-key">Dataset / Gold Set</span><span class="kv-val">${proj.stats.papers}</span></div>
          <div class="kv-row"><span class="kv-key">Estado de Auditor</span><span class="kv-val" style="color: var(--emerald);">✅ Sin infracciones</span></div>
        </div>
      </div>
    `;
  } else if (selectedProjectTab === "decisions") {
    const projDecisions = DATA.decisions.filter(d => d.project === proj.id);
    return `
      <div class="info-card" style="grid-column: span 2;">
        <h3><span>📜</span> Decisiones Recientes de ${proj.name}</h3>
        <div class="tickets-list">
          ${(projDecisions.length ? projDecisions : DATA.decisions.slice(0, 3)).map(d => `
            <div class="ticket-card">
              <div class="ticket-top">
                <span class="tag-pill tag-purple">${d.id}</span>
                <span class="ticket-title">${d.title}</span>
                <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted);">${d.author} · ${d.date}</span>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);"><strong>Por qué:</strong> ${d.why}</div>
              <div style="font-size: 12px; color: var(--coral); background: rgba(239, 68, 68, 0.08); padding: 6px 10px; border-radius: 4px;">
                <strong>Descartado:</strong> ${d.discarded}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else {
    return `
      <div class="info-card">
        <h3><span>🏛️</span> Configuración del Cartridge</h3>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-key">Repositorio Git</span><span class="kv-val">${proj.repo}</span></div>
          ${proj.raw?.file ? `<div class="kv-row"><span class="kv-key">Cartridge</span><span class="kv-val">${proj.raw.file}</span></div>` : ""}
          <div class="kv-row"><span class="kv-key">Standing State</span><span class="kv-val">state.md</span></div>
          <div class="kv-row"><span class="kv-key">Log de Decisiones</span><span class="kv-val">Decision_Log.md</span></div>
        </div>
      </div>
      <div class="info-card">
        <h3><span>🤖</span> Auditoría y Agentes</h3>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-key">Auditor Scoped</span><span class="kv-val">skills/auditor/</span></div>
          <div class="kv-row"><span class="kv-key">Filtro de Log</span><span class="kv-val">LOG_AGENTS.md</span></div>
        </div>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// 2. CHEATSHEET VIEW
// --------------------------------------------------------------------------
function renderCheatSheet() {
  const container = $("#mainContent");
  const activeCatObj = DATA.cheatsheet.find(c => c.category === selectedCsCat) || DATA.cheatsheet[0];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📖</span> CheatSheet · NEXUS & MLabs</h1>
        <p class="view-subtitle">Chuleta de comandos ejecutables rápidos, flujos de sesión y atajos de ingeniería.</p>
      </div>
      <div class="hud-pill">
        <span>Click en cualquier fila para copiar comando</span>
      </div>
    </div>

    <div class="cheatsheet-container">
      <div class="cheatsheet-toolbar">
        <div class="cs-tabs">
          ${DATA.cheatsheet.map(c => `
            <button class="cs-tab-btn ${c.category === selectedCsCat ? 'active' : ''}" onclick="setCsCategory('${c.category}')">
              ${c.catLabel}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="cs-groups-grid">
        ${activeCatObj.groups.map(g => `
          <div class="cs-group-card">
            <div class="cs-group-header">
              <h3>${g.title}</h3>
              <p>${g.desc}</p>
            </div>
            
            <div class="tickets-list">
              ${g.cmds.map(cmd => `
                <div class="cs-cmd-row" onclick="copyCode(this.querySelector('.cs-cmd-copy-btn'), \`${cmd.code.replace(/`/g, '\\`')}\`)">
                  <span class="cs-cmd-label">${cmd.label}</span>
                  <code class="cs-cmd-code">${cmd.code}</code>
                  <span class="tag-pill" style="font-size: 10px;">${cmd.hint}</span>
                  <button class="cs-cmd-copy-btn" type="button">COPY</button>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. COCKPIT VIEW
// --------------------------------------------------------------------------
function renderCockpit() {
  const container = $("#mainContent");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🧭</span> Cockpit & Live Session</h1>
        <p class="view-subtitle">La brújula (Schedule.md) y el plan en vuelo activo (Current_plan.md).</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-hud-action btn-add-task" onclick="openTaskModal()">
          <span>➕</span> Añadir Tarea
        </button>
      </div>
    </div>

    <div class="cockpit-grid">
      <div class="cockpit-column">
        <div class="cockpit-panel">
          <div class="panel-header">
            <h2><span>🧭</span> Brújula — Frentes de Trabajo</h2>
            <span class="tag-pill tag-project">Schedule.md</span>
          </div>

          <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.3); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--accent-cyan);">▶ FRENTE ACTIVO ÚNICO</div>
            <div style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 4px;">${DATA.activeFront.title}</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 6px;">
              <strong>Avanza cuando:</strong> ${DATA.activeFront.movesWhen}
            </div>
          </div>

          <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-top: 8px;">FRENTES EN COLA</div>
          <div class="tickets-list">
            ${(DATA.queuedFronts || []).map(f => `
            <div class="ticket-card" style="padding: 12px;">
              <div class="ticket-top">
                <span class="tag-pill">${f.marker || ""}</span>
                <span style="font-weight: 600;">${f.name}</span>
                ${f.project ? `<span class="tag-pill tag-project">${f.project}</span>` : ""}
              </div>
              ${f.movesWhen ? `<div class="ticket-meta">${f.movesWhen}</div>` : ""}
            </div>`).join("") || `<div class="empty">Sin frentes en cola.</div>`}
          </div>
        </div>
      </div>

      <div class="cockpit-column">
        <div class="cockpit-panel">
          <div class="panel-header">
            <h2><span>⚡</span> Plan en Vuelo</h2>
            <span class="tag-pill tag-purple">Current_plan.md</span>
          </div>

          <div class="tickets-list">
            ${DATA.livePlan.map(item => `
              <div class="plan-item-row ${item.struck ? 'completed' : ''}">
                <span class="plan-idx">${item.index}</span>
                <span class="plan-text">${item.text}</span>
                <span class="dest-tag ${item.struck ? 'dest-resolved' : 'dest-inflight'}">${item.dest}</span>
              </div>
            `).join("")}
          </div>

          <div style="font-size: 12px; color: var(--text-muted); padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 2px solid var(--emerald);">
            <strong>Regla de Cierre:</strong> Todo ítem tachado lleva su destino explícito del vocabulario cerrado antes de vaciar el plan.
          </div>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 4. INBOX & TASKS LIFECYCLE
// --------------------------------------------------------------------------
function renderInbox() {
  const container = $("#mainContent");
  
  let filteredTasks = DATA.tasks;
  if (taskListFilter === "ACTIVE") {
    filteredTasks = DATA.tasks.filter(t => t.status === "⬜" || t.status === "🔨" || t.status === "⛔" || t.status === "🔴");
  } else if (taskListFilter === "COMPLETED") {
    filteredTasks = DATA.tasks.filter(t => t.status === "✅");
  } else if (taskListFilter === "DISCARDED") {
    filteredTasks = DATA.tasks.filter(t => t.status === "⚫");
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📬</span> Inbox & Tasks Lifecycle</h1>
        <p class="view-subtitle">Gestión interactiva del flujo de tareas: comentar, completar o descartar con trazabilidad (PH-3).</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-hud-action btn-add-task" onclick="openTaskModal()">
          <span>➕</span> Añadir Tarea
        </button>
      </div>
    </div>

    <div class="detail-tabs-bar" style="margin-bottom: 18px;">
      <button class="subtab-btn ${taskListFilter === 'ALL' ? 'active' : ''}" onclick="setTaskListFilter('ALL')">
        Todas (${DATA.tasks.length})
      </button>
      <button class="subtab-btn ${taskListFilter === 'ACTIVE' ? 'active' : ''}" onclick="setTaskListFilter('ACTIVE')">
        Activas (${DATA.tasks.filter(t => t.status === '⬜' || t.status === '🔨' || t.status === '⛔' || t.status === '🔴').length})
      </button>
      <button class="subtab-btn ${taskListFilter === 'COMPLETED' ? 'active' : ''}" onclick="setTaskListFilter('COMPLETED')">
        ✅ Completadas (${DATA.tasks.filter(t => t.status === '✅').length})
      </button>
      <button class="subtab-btn ${taskListFilter === 'DISCARDED' ? 'active' : ''}" onclick="setTaskListFilter('DISCARDED')">
        ⚫ Descartadas (${DATA.tasks.filter(t => t.status === '⚫').length})
      </button>
    </div>

    <div style="margin-bottom: 30px;">
      <div class="tickets-list">
        ${filteredTasks.length === 0 ? `
          <div style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
            No hay tareas en este filtro.
          </div>
        ` : filteredTasks.map(t => `
          <div class="ticket-card ${t.status === '✅' ? 'completed' : (t.status === '⚫' ? 'discarded' : '')}">
            <div class="ticket-top">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tag-pill tag-purple">${t.id}</span>
                <span class="ticket-title" style="${t.status === '✅' ? 'text-decoration: line-through; opacity: 0.8;' : ''}">${t.title}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tag-pill tag-project">${t.project}</span>
                <span class="status-chip ${t.status === '✅' ? 'status-active' : (t.status === '⚫' ? 'status-discarded' : 'status-paused')}">
                  ${t.status} ${t.status === '✅' ? 'Completada' : (t.status === '⚫' ? 'Descartada' : (t.status === '🔨' ? 'En curso' : 'Pendiente'))}
                </span>
              </div>
            </div>

            <div style="font-size: 13px; color: var(--text-secondary);">
              <strong>Why:</strong> ${t.why}
            </div>

            ${t.discardReason ? `
              <div class="task-discard-callout">
                <strong>⚫ Motivo del descarte:</strong> ${t.discardReason}
              </div>
            ` : ''}

            ${t.comments && t.comments.length > 0 ? `
              <div class="task-comments-list">
                ${t.comments.map(c => `
                  <div class="comment-bubble">
                    <span class="comment-meta">${c.author} · ${c.date}</span>
                    <span class="comment-text">${c.text}</span>
                  </div>
                `).join("")}
              </div>
            ` : ''}

            <div class="ticket-meta">
              <span>Registrado por <strong>${t.author}</strong> el ${t.date}</span>
            </div>

            <div class="task-actions-toolbar">
              ${t.status !== '✅' ? `
                <button class="btn-task-action btn-task-complete" onclick="completeTask('${t.id}')">
                  <span>✅</span> Completar
                </button>
              ` : ''}
              ${t.status !== '🔨' && t.status !== '✅' && t.status !== '⚫' ? `
                <button class="btn-task-action" onclick="updateTaskStatus('${t.id}', '🔨')">
                  <span>🔨</span> Poner en Curso
                </button>
              ` : ''}
              <button class="btn-task-action btn-task-comment" onclick="openCommentModal('${t.id}')">
                <span>💬</span> Comentar (${(t.comments || []).length})
              </button>
              ${t.status !== '⚫' ? `
                <button class="btn-task-action btn-task-discard" onclick="openDiscardModal('${t.id}')">
                  <span>⚫</span> Descartar
                </button>
              ` : ''}
              ${t.status === '✅' || t.status === '⚫' ? `
                <button class="btn-task-action" onclick="updateTaskStatus('${t.id}', '⬜')">
                  <span>🔄</span> Reabrir
                </button>
              ` : ''}
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div>
      <h2 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <span>📬</span> Buzón de Entrada (MAILBOX.md)
      </h2>
      <div class="tickets-list">
        ${DATA.mailbox.map(m => `
          <div class="ticket-card">
            <div class="ticket-top">
              <span class="tag-pill ${m.state === 'open' ? 'warn-badge' : 'tag-project'}">[${m.state}]</span>
              <span class="ticket-title">${m.title}</span>
              <span class="tag-pill tag-project">${m.project}</span>
            </div>
            <div class="ticket-meta">
              <span>Destino: <strong>${m.dest}</strong></span>
              <span>·</span>
              <span>Creado por <strong>${m.author}</strong> el ${m.date}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 5. IDEA PARK VIEW
// --------------------------------------------------------------------------
function renderIdeas() {
  const container = $("#mainContent");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>💡</span> Idea Park</h1>
        <p class="view-subtitle">Ideas aparcadas sin compromiso de fecha ni obligación de revisión.</p>
      </div>
      <div>
        <button class="btn-hud-action btn-add-idea" onclick="openIdeaModal()">
          <span>💡</span> Aparcar Nueva Idea
        </button>
      </div>
    </div>

    <div class="projects-matrix-grid">
      ${DATA.ideas.map(i => `
        <div class="ticket-card">
          <div class="ticket-top">
            <span class="tag-pill tag-project">${i.project}</span>
            <span class="tag-pill tag-purple">scope: ${i.scope}</span>
          </div>
          <h3 style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 6px;">${i.title}</h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${i.body}</p>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 6. DECISION LOG VIEW
// --------------------------------------------------------------------------
function renderDecisions() {
  const container = $("#mainContent");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📜</span> Decision Log & Trace</h1>
        <p class="view-subtitle">Registro inmutable de decisiones con justificación y alternativas descartadas (PH-3 / PH-4).</p>
      </div>
    </div>

    <div class="tickets-list">
      ${DATA.decisions.map(d => `
        <div class="ticket-card">
          <div class="ticket-top">
            <span class="tag-pill tag-purple">${d.id}</span>
            <span class="ticket-title">${d.title}</span>
            <span class="tag-pill tag-project">${d.project}</span>
            <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted);">${d.author} · ${d.date}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            <strong>Justificación:</strong> ${d.why}
          </div>
          <div style="font-size: 12px; color: var(--coral); background: rgba(239, 68, 68, 0.08); padding: 8px 12px; border-radius: 6px; margin-top: 6px;">
            <strong>Alternativa descartada:</strong> ${d.discarded}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 7. SKILLS & ORG CHART VIEW
// --------------------------------------------------------------------------
function renderSkills() {
  const container = $("#mainContent");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>⚡</span> Skills & Company Org Chart</h1>
        <p class="view-subtitle">Cada empleado es un archivo skill; un rol se define por dispararse por evento.</p>
      </div>
    </div>

    <div class="skills-grid">
      ${DATA.skills.map(s => `
        <div class="skill-card">
          <div class="skill-header">
            <span class="skill-name">${s.name}</span>
            <span class="status-chip ${s.type === 'event' ? 'status-active' : (s.type === 'locked' ? 'status-paused' : 'tag-project')}">
              ${s.type === 'event' ? '🔔 Event Role' : (s.type === 'locked' ? '🔒 Locked' : '🛠️ Capability')}
            </span>
          </div>
          <div class="skill-desc">${s.summary}</div>
          <div class="skill-evidence">
            <strong>Disparador:</strong> ${s.trigger}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// Boot
document.addEventListener("DOMContentLoaded", initApp);
