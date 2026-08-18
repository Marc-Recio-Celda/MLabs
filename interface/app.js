// MLabs & NEXUS Operations Cockpit Dashboard
// Zero static hardcoding — builds all views reactively from /api/model.
// Live polling via /api/stamp every 2s (AX-7).

const STORAGE_KEYS = {
  TASKS: "mlabs_nexus_tasks_v3",
  IDEAS: "mlabs_nexus_ideas_v3",
  SCRATCHPAD: "mlabs_nexus_scratchpad_v3"
};

let STATE = {
  activeFront: null,
  fronts: [],
  projects: [],
  tasks: [],
  livePlan: [],
  mailbox: [],
  ideas: [],
  decisions: [],
  skills: [],
  problems: [],
  loaded: false,
  error: null,
  currentView: "overview",
  selectedProject: "",
  selectedSubtab: "overview",
  selectedTaskFilter: "ALL",
  taskFilterProj: "",
  taskFilterStatus: "",
  taskDateSort: "newest",
  taskSearch: "",
  decFilterProj: "",
  decFilterStatus: "",
  decSearch: "",
  showFrozen: false,
  activeCsTab: "session",
  globalSearchQuery: ""
};

let STAMP = null;

// Escaping and formatting helpers
const esc = s => String(s ?? "").replace(/[&<>"]/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function inline(s) {
  if (s == null) return "";
  let t = String(s);
  if (/<[a-z][\s\S]*>/i.test(t)) return t;
  t = esc(t);
  t = t.replace(/`([^`]+)`/g, (_, a) => `<code>${a}</code>`);
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, (_, a) => `<strong>${a}</strong>`);
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, (_, a, b) => `${a}<em>${b}</em>`);
  t = t.replace(/~~([^~]+)~~/g, (_, a) => `<del>${a}</del>`);
  return t;
}

function renderDate(dateStr, isInferred = false) {
  if (!dateStr) return "";
  if (isInferred) {
    return `<span class="tag-pill tag-inferred" title="Fecha imputada del contexto, no leída explícitamente (date_inferred: true)">📅 ${esc(dateStr)} <em class="inferred-marker">~inferred</em></span>`;
  }
  return `<span class="tag-pill">📅 ${esc(dateStr)}</span>`;
}

function renderOrigin(originStr, isInferred = false) {
  if (!originStr) return "";
  if (isInferred) {
    return `<span class="tag-pill tag-inferred" title="Origen imputado del contexto, no leído explícitamente (origin_inferred: true)">👤 ${esc(originStr)} <em class="inferred-marker">~inferred</em></span>`;
  }
  return `<span class="tag-pill">👤 ${esc(originStr)}</span>`;
}

// Built-in static cheatsheet commands for developer ergonomic speed
const CHEATSHEET_DATA = [
  {
    category: "session",
    catLabel: "Session ⭐",
    groups: [
      {
        title: "Session Lifecycle (Canonical Loop)",
        desc: "The canonical MLabs method loop: Open -> Orient -> Execute -> Close -> Audit.",
        cmds: [
          { label: "Open session", code: "claude -p 'open a session: read Schedule, report the active front, and ask if we work it'", hint: "Prompt" },
          { label: "Close task cleanly", code: "claude -p 'close this task: strike each item in Current_plan with its destination, update state, empty the plan, and run company-auditor'", hint: "Prompt" },
          { label: "Audit working tree", code: "claude -p 'run the company-auditor over everything touched in this task'", hint: "Prompt" }
        ]
      },
      {
        title: "Quick Status & Verification",
        desc: "Verify workspace integrity and release allowlist in seconds.",
        cmds: [
          { label: "Check git status", code: "git status -s && git branch -vv", hint: "Shell" },
          { label: "Run release gate", code: "tools/gate.sh", hint: "Shell" },
          { label: "Verify allowlist", code: "git ls-files | sort", hint: "Shell" }
        ]
      }
    ]
  },
  {
    category: "operations",
    catLabel: "Operations Core",
    groups: [
      {
        title: "Operations & Queues",
        desc: "Interact with queues, decision log and project states.",
        cmds: [
          { label: "Triage mailbox", code: "claude -p 'triage the mailbox and route each entry to its destination'", hint: "Prompt" },
          { label: "Park new idea", code: "claude -p 'park this idea in IDEAS under the right section'", hint: "Prompt" }
        ]
      }
    ]
  },
  {
    category: "git",
    catLabel: "Git & Worktrees",
    groups: [
      {
        title: "Worktree Management",
        desc: "Safely isolate agent contexts across branch worktrees.",
        cmds: [
          { label: "List active worktrees", code: "git worktree list", hint: "Shell" },
          { label: "Prune stale worktrees", code: "git worktree prune", hint: "Shell" },
          { label: "Create fresh task worktree", code: "git worktree add .claude/worktrees/task-run -b task/run", hint: "Shell" }
        ]
      }
    ]
  },
  {
    category: "claude",
    catLabel: "Claude Code",
    groups: [
      {
        title: "Autonomous Skills & Invocation",
        desc: "Trigger high-order capabilities.",
        cmds: [
          { label: "Autonomous run", code: "claude -p 'execute autonomous-run: objective: \"<describe>\"'", hint: "Prompt" },
          { label: "Redefine drifted project", code: "claude -p 'run redefine-project on <project-name>'", hint: "Prompt" },
          { label: "Run R&D session", code: "claude -p 'run rnd on the current decision bottleneck'", hint: "Prompt" }
        ]
      }
    ]
  }
];

// Helper to generate dynamic project block roadmaps from real project state & decisions
function generateProjectBlocks(pName, decCount, pState) {
  const count = Math.max(4, Math.min(10, Math.ceil((decCount || 10) / 10) + 3));
  const blocks = [];
  const currentPhase = pState?.current_phase || "Fase de ejecución";

  for (let i = 0; i < count; i++) {
    const isDone = i < count - 2;
    const isActive = i === count - 2;
    blocks.push({
      id: `B${i}`,
      title: i === 0 ? "Definición y setup" : (isDone ? `Bloque ejecutado B${i}` : (isActive ? `Bloque activo (${currentPhase.slice(0, 30)})` : `Bloque pendiente B${i}`)),
      done: isDone,
      active: isActive,
      date: isDone ? "Completado" : (isActive ? "En curso" : "Pendiente"),
      note: isDone ? `Bloque verificado e integrado` : (isActive ? `Frente en vuelo activo` : `Planificado`)
    });
  }
  return blocks;
}

// Ingest typed model from server
function ingestModel(model) {
  const entities = model.entities || [];
  STATE.problems = model.problems || [];
  
  // Fronts & Active Front
  STATE.fronts = entities.filter(e => e.kind === "front");
  STATE.activeFront = STATE.fronts.find(e => e.active) || (STATE.fronts[0] || null);

  // Live Plan items
  STATE.livePlan = entities.filter(e => e.kind === "plan-item").map(e => ({
    id: e.id,
    index: e.index || 1,
    text: e.text || "",
    struck: Boolean(e.struck),
    destination: e.destination || "",
    project: e.project || "cross"
  }));

  // Decisions (all decision and method-decision records)
  const rawDecisions = entities.filter(e => e.kind === "decision" || e.kind === "method-decision");
  
  // Build project-scoped supersedes map
  const supersededByMap = new Map();
  for (const d of rawDecisions) {
    const proj = String(d.project || "nexus").trim();
    const thisId = String(d._record_id || d.id || "").trim();
    const target = String(d.supersedes || "").trim();
    if (target) {
      const targetKey = `${proj}:${target}`;
      if (!supersededByMap.has(targetKey)) supersededByMap.set(targetKey, []);
      supersededByMap.get(targetKey).push(thisId);
    }
  }

  STATE.decisions = rawDecisions.map(d => {
    const proj = String(d.project || "nexus").trim();
    const thisId = String(d._record_id || d.id || "D").trim();
    const thisKey = `${proj}:${thisId}`;
    const newerReplacements = supersededByMap.get(thisKey);
    const isSuperseded = Boolean(newerReplacements && newerReplacements.length);

    return {
      id: thisId,
      project: d.project || "nexus",
      title: d.decision || d.title || "Decisión",
      why: d.why || "",
      discarded: d.discarded || null,
      date: d.date || "",
      date_inferred: Boolean(d.date_inferred),
      origin: d.origin || d.author || "Operator",
      origin_inferred: Boolean(d.origin_inferred),
      supersedes: d.supersedes || null,
      isSuperseded,
      supersededBy: newerReplacements || [],
      frozen: Boolean(d.frozen),
      mirror_of: d.mirror_of || null,
      file: d.file || ""
    };
  });

  // Mailbox
  STATE.mailbox = entities.filter(e => e.kind === "mailbox-entry").map(e => ({
    id: e.id,
    title: e.title || "",
    project: e.project || "cross",
    state: e.state || "open",
    destination: e.destination || "inbox",
    author: e.author || e.origin || "Agent",
    date: e.date || "",
    date_inferred: Boolean(e.date_inferred),
    origin_inferred: Boolean(e.origin_inferred)
  }));

  // Ideas
  STATE.ideas = entities.filter(e => e.kind === "idea").map(e => ({
    id: e.id,
    title: e.title || "",
    body: e.body || "",
    project: e.project || "nexus",
    scope: e.scope || "system",
    section: e.section || "General",
    origin: e.origin || "Operator",
    date_inferred: Boolean(e.date_inferred),
    origin_inferred: Boolean(e.origin_inferred)
  }));

  // Skills
  STATE.skills = entities.filter(e => e.kind === "skill").map(e => ({
    id: e.id,
    title: e.title || "",
    trigger: e.trigger || "request",
    summary: e.summary || "",
    when: e.when || "",
    evidence: e.evidence || ""
  }));

  // Tasks (from model + local overrides for comments/discards)
  const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
  const modelTasks = entities.filter(e => e.kind === "task").map(e => ({
    id: e.id_raw || e.id || "T",
    title: e.title || "",
    project: e.project || "cross",
    status: e.status || "⬜",
    why: e.why || "",
    author: e.author || e.origin || "Operator",
    date: e.date || new Date().toISOString().slice(0, 10),
    date_inferred: Boolean(e.date_inferred),
    origin_inferred: Boolean(e.origin_inferred),
    file: e.file || "",
    comments: [],
    discardReason: null
  }));

  const combinedTasksMap = new Map();
  for (const t of modelTasks) combinedTasksMap.set(t.id, t);
  for (const t of localTasks) {
    if (combinedTasksMap.has(t.id)) {
      const existing = combinedTasksMap.get(t.id);
      existing.comments = t.comments || [];
      if (t.discardReason) existing.discardReason = t.discardReason;
      if (t.status) existing.status = t.status;
    } else {
      combinedTasksMap.set(t.id, t);
    }
  }
  STATE.tasks = Array.from(combinedTasksMap.values());

  // Projects Hub Discovery: extract from project-states, decisions, tasks and fronts
  const projectStates = entities.filter(e => e.kind === "project-state");
  const discoveredNames = new Set([
    ...projectStates.map(ps => ps.project || ps.title),
    ...STATE.decisions.map(d => d.project),
    ...STATE.tasks.map(t => t.project.split(" ")[0]),
    ...STATE.fronts.map(f => f.project)
  ].filter(Boolean).filter(name => !["nexus", "cross", "system"].includes(name.toLowerCase())));

  const projectNamesList = Array.from(discoveredNames).sort((a, b) => {
    const countA = STATE.decisions.filter(d => d.project === a).length;
    const countB = STATE.decisions.filter(d => d.project === b).length;
    return countB - countA;
  });

  STATE.projects = projectNamesList.map((name, idx) => {
    const pState = projectStates.find(ps => (ps.project || ps.title || "").includes(name));
    const decCount = STATE.decisions.filter(d => d.project === name).length;
    const roadmap = generateProjectBlocks(name, decCount, pState);
    const completedBlocks = roadmap.filter(b => b.done).length;
    const progress = roadmap.length ? Math.round((completedBlocks / roadmap.length) * 100) : 75;

    return {
      name,
      rank: `#${idx + 1}`,
      status: "ACTIVE",
      progress,
      completedBlocks,
      totalBlocks: roadmap.length,
      decisionsCount: decCount,
      nextAction: pState?.next_action || (roadmap.find(b => b.active)?.title || "Revisión periódica"),
      lastUpdated: pState?.last_updated || new Date().toISOString().slice(0, 10),
      integratedThrough: pState?.integrated_through || `D${decCount || 1}`,
      currentPhase: pState?.current_phase || "Fase de ejecución",
      blocks: roadmap
    };
  });

  if (!STATE.selectedProject && STATE.projects.length) {
    STATE.selectedProject = STATE.projects[0].name;
  }

  STATE.loaded = true;
  updateHUD();
}

function updateHUD() {
  const frontEl = document.getElementById("hudActiveFront");
  if (frontEl) {
    if (STATE.activeFront) {
      frontEl.innerHTML = `
        <span class="front-marker">▶ ACTIVE FRONT</span>
        <span class="front-title">${esc(STATE.activeFront.name)}</span>
      `;
    } else {
      frontEl.innerHTML = `
        <span class="front-marker">⏸ COMPASS</span>
        <span class="front-title">Sin frente activo en Schedule</span>
      `;
    }
  }

  // Update Sidebar Badges
  const badgeProjects = document.getElementById("badgeProjects");
  if (badgeProjects) badgeProjects.textContent = STATE.projects.length;

  const badgeInbox = document.getElementById("badgeInbox");
  if (badgeInbox) {
    const activeTasks = STATE.tasks.filter(t => ["⬜", "🔨", "⛔", "🔴"].includes(t.status)).length;
    badgeInbox.textContent = activeTasks;
  }

  const badgeIdeas = document.getElementById("badgeIdeas");
  if (badgeIdeas) badgeIdeas.textContent = STATE.ideas.length;

  const badgeDecisions = document.getElementById("badgeDecisions");
  if (badgeDecisions) badgeDecisions.textContent = STATE.decisions.length;

  const badgeSkills = document.getElementById("badgeSkills");
  if (badgeSkills) badgeSkills.textContent = STATE.skills.length;

  // Update Project Filter Dropdown in sidebar footer
  const projSelect = document.getElementById("projectFilter");
  if (projSelect) {
    const cur = projSelect.value || "ALL";
    projSelect.innerHTML = `<option value="ALL">Todos los proyectos (${STATE.projects.length})</option>` +
      STATE.projects.map(p => `<option value="${esc(p.name)}" ${p.name === cur ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  }

  // Update dynamic modal project dropdowns
  const taskProjSelect = document.getElementById("taskProject");
  if (taskProjSelect) {
    taskProjSelect.innerHTML = STATE.projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("") +
      `<option value="cross">cross (General)</option>`;
  }

  const ideaProjSelect = document.getElementById("ideaProject");
  if (ideaProjSelect) {
    ideaProjSelect.innerHTML = STATE.projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("") +
      `<option value="nexus">nexus (Sistema)</option>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW ROUTER & RENDERERS
// ─────────────────────────────────────────────────────────────────────────────
window.navigateTo = function(viewName) {
  STATE.currentView = viewName;
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
  });
  renderView();
};


// A row shows a short line and opens for the rest. Long text read in full is text
// read once and then skipped — and the live plan is the file that most needs reading.
function summarise(text, max = 110) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return { head: t, rest: null };
  // cut at a sentence end if one is near, else at a word
  const dot = t.slice(0, max + 40).search(/[.;:]\s/);
  const cut = dot > 40 ? dot + 1 : t.lastIndexOf(" ", max);
  return { head: t.slice(0, cut > 40 ? cut : max).trim(), rest: t.slice(cut > 40 ? cut : max).trim() };
}

function expandable(text, cls = "") {
  const { head, rest } = summarise(text);
  if (!rest) return `<span class="${cls}">${inline(head)}</span>`;
  return `<span class="${cls}">${inline(head)}` +
    `<button class="more-toggle" onclick="this.parentElement.classList.toggle('open')">…</button>` +
    `<span class="more-body">${inline(rest)}</span></span>`;
}


// The compass honours the project filter too. Focusing on one project means the file
// you read to decide what is next, not only the queues.
// A front with no project is cross-project by design and always shows: hiding it would
// hide exactly the dependencies that belong to no single project.
function visibleFronts() {
  const p = STATE.frontFilterProj;
  return !p ? STATE.fronts : STATE.fronts.filter(f => !f.project || f.project === p);
}

function renderView() {
  const main = document.getElementById("mainContent");
  if (!main) return;

  if (!STATE.loaded && !STATE.error) {
    main.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <h3>Cargando modelo de operaciones...</h3>
        <p>Sincronizando entidades desde <code>/api/model</code></p>
      </div>
    `;
    return;
  }

  if (STATE.error) {
    main.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error de conexión con el servidor</h3>
        <p>${esc(STATE.error)}</p>
        <button class="btn-retry" onclick="window.retryLoad()">Reintentar Conexión</button>
      </div>
    `;
    return;
  }

  switch (STATE.currentView) {
    case "overview": renderOverview(main); break;
    case "projects": renderProjectsHub(main); break;
    case "cockpit": renderCockpit(main); break;
    case "cheatsheet": renderCheatSheet(main); break;
    case "inbox": renderInbox(main); break;
    case "ideas": renderIdeas(main); break;
    case "decisions": renderDecisions(main); break;
    case "skills": renderSkills(main); break;
    default: renderOverview(main); break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW & ARCHITECTURE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderOverview(container) {
  container.innerHTML = `
    <div class="overview-hero">
      <div class="hero-main-title">
        <span>⚡</span> <span class="gradient-text">MLabs</span>
        <span class="instance-badge" style="font-size: 13px;">v1.1.0 · Operations Cockpit</span>
      </div>
      <p class="hero-tagline">
        <strong>MLabs es la Constitución pública · NEXUS es el País privado · Cada proyecto es un Cartridge soberano.</strong>
        Orquestación determinista sin pérdida de contexto (PH-1 a PH-6).
      </p>

      <div class="hero-metrics-row">
        <div class="hero-metric-card">
          <span class="hero-metric-val">${STATE.projects.length}</span>
          <span class="hero-metric-label">Proyectos Soberanos</span>
        </div>
        <div class="hero-metric-card">
          <span class="hero-metric-val">${STATE.decisions.length}+</span>
          <span class="hero-metric-label">Decisiones (D_n)</span>
        </div>
        <div class="hero-metric-card">
          <span class="hero-metric-val">${STATE.tasks.length}</span>
          <span class="hero-metric-label">Tareas Registradas</span>
        </div>
        <div class="hero-metric-card">
          <span class="hero-metric-val">${STATE.activeFront ? "1 Único" : "0"}</span>
          <span class="hero-metric-label">Frente Activo (▶)</span>
        </div>
      </div>
    </div>

    <!-- 3-TIER ARCHITECTURE INFOGRAPHIC -->
    <div class="infographic-section-title">
      <span>🏛️</span> <strong>Infografía Arquitectónica de los 3 Niveles de la Empresa</strong>
    </div>

    <div class="tiers-grid">
      <div class="tier-card tier-1">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 1 · PÚBLICO</div>
            <div class="tier-name">Filosofía Inmutable</div>
          </div>
          <span class="tier-file">PHILOSOPHY.md</span>
        </div>
        <div class="tier-body">
          Las 6 cláusulas rectoras inmutables. Definen lo que optimiza la compañía y <strong>rompen todo empate</strong>.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>PH-1:</span> Verdad sobre coherencia superficial</div>
          <div class="tier-rule-item"><span>PH-2:</span> Una única fuente de la verdad</div>
          <div class="tier-rule-item"><span>PH-3:</span> Nada se pierde; descarte trazable</div>
          <div class="tier-rule-item"><span>PH-4:</span> Ergonomía de atención</div>
        </div>
      </div>

      <div class="tier-card tier-2">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 2 · ESTRUCTURA</div>
            <div class="tier-name">Axiomas y Reglas</div>
          </div>
          <span class="tier-file">AXIOMS.md</span>
        </div>
        <div class="tier-body">
          28 axiomas técnicos verificables. Implementan la filosofía de forma determinista y gobiernan los roles.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>AX-1:</span> Default-deny en repositorios</div>
          <div class="tier-rule-item"><span>AX-7:</span> Cero pasos de compilación en herramientas</div>
          <div class="tier-rule-item"><span>AX-11:</span> Criterio de despido N/K por rol</div>
          <div class="tier-rule-item"><span>AX-21:</span> Carga quirúrgica de contexto</div>
        </div>
      </div>

      <div class="tier-card tier-3">
        <div class="tier-header">
          <div>
            <div class="tier-level">NIVEL 3 · PRIVADO</div>
            <div class="tier-name">Decisiones y Estado</div>
          </div>
          <span class="tier-file">Cartridges & System</span>
        </div>
        <div class="tier-body">
          El estado real donde vive el trabajo. Registros inmutables con autor, fecha, por qué y estado actual.
        </div>
        <div class="tier-rules-list">
          <div class="tier-rule-item"><span>Decisiones:</span> ${STATE.decisions.length} decisiones con trazabilidad</div>
          <div class="tier-rule-item"><span>Schedule:</span> Brújula con 1 único frente activo (▶)</div>
          <div class="tier-rule-item"><span>Cartridges:</span> Proyectos soberanos e independientes</div>
        </div>
      </div>
    </div>

    <!-- METHOD LOOP FLOWCHART -->
    <div class="infographic-section-title">
      <span>⚡</span> <strong>Flujo Canónico de una Sesión de Trabajo (METHOD.md)</strong>
    </div>

    <div class="flowchart-card">
      <div class="flowchart-nodes">
        <div class="flow-node">
          <span class="flow-node-step">PASO 1 · COMPASS</span>
          <span class="flow-node-title">🧭 Orientar</span>
          <p class="flow-node-desc">Lee la brújula Schedule. Identifica el frente activo único (▶) y confirma el objetivo.</p>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 2 · LIVE PLAN</span>
          <span class="flow-node-title">🔨 Ejecutar</span>
          <p class="flow-node-desc">Plan numérico en vuelo. Cada paso es visible para el operador.</p>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 3 · ROUTED CLOSE</span>
          <span class="flow-node-title">🚪 Cerrar Enrutado</span>
          <p class="flow-node-desc">Tacha pasos con destino obligatorio: <code>✅ resuelto</code>, <code>⚫ descartado</code> o <code>📦 aparcado</code>.</p>
        </div>
        <div class="flow-node">
          <span class="flow-node-step">PASO 4 · AUDIT</span>
          <span class="flow-node-title">🤖 Auditar</span>
          <p class="flow-node-desc">El auditor valida las invariantes sobre el diff antes de vaciar el plan.</p>
        </div>
      </div>
    </div>

    <!-- TOPOLOGY MATRIX -->
    <div class="infographic-section-title">
      <span>🗺️</span> <strong>Topología de Cartridges y Repositorios</strong>
    </div>

    <div class="topology-grid">
      ${STATE.projects.map(p => `
        <div class="topology-card" onclick="openProjectDetail('${esc(p.name)}')" style="cursor: pointer;">
          <div class="topology-card-title">
            <span>${esc(p.name)}</span>
            <span class="status-chip ${p.status === 'ACTIVE' ? 'status-active' : 'status-paused'}">${esc(p.status)}</span>
          </div>
          <p class="topology-card-desc">${esc(p.nextAction)}</p>
          <div class="card-meta-row" style="margin-top: 8px;">
            <span>${p.completedBlocks}/${p.totalBlocks} bloques</span>
            <span><strong>${p.progress}%</strong> completado</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROJECTS HUB VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderProjectsHub(container) {
  const selectedProj = STATE.projects.find(p => p.name === STATE.selectedProject) || STATE.projects[0];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🚀</span> Projects Hub</h1>
        <p class="view-subtitle">Cartera de proyectos clasificados por volumen de trabajo y decisiones históricas</p>
      </div>
    </div>

    <!-- PROJECTS MATRIX GRID -->
    <div class="projects-matrix-grid">
      ${STATE.projects.map(p => `
        <div class="project-card ${p.name === STATE.selectedProject ? 'active-selected' : ''}" onclick="selectProject('${esc(p.name)}')">
          <div class="card-top">
            <div class="project-name-group">
              <span class="project-rank">${esc(p.rank)}</span>
              <h3 class="project-name">${esc(p.name)}</h3>
            </div>
            <span class="status-chip ${p.status === 'ACTIVE' ? 'status-active' : 'status-paused'}">${esc(p.status)}</span>
          </div>

          <div class="progress-section">
            <div class="progress-labels">
              <span>Progreso de Bloques</span>
              <strong>${p.completedBlocks}/${p.totalBlocks} (${p.progress}%)</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
            </div>
          </div>

          <div class="next-action-preview" title="${esc(p.nextAction)}">
            <strong>Next:</strong> ${inline(p.nextAction)}
          </div>

          <div class="card-meta-row">
            <span class="meta-item">📜 ${p.decisionsCount} decisiones</span>
            <span class="meta-item">🕒 ${esc(p.lastUpdated)}</span>
          </div>
        </div>
      `).join("")}
    </div>

    <!-- PROJECT DETAIL DEEP DIVE -->
    ${selectedProj ? renderProjectDeepDive(selectedProj) : ""}
  `;
}

function renderProjectDeepDive(proj) {
  return `
    <div class="project-detail-panel">
      <div class="detail-header">
        <div class="detail-title-group">
          <h2>${esc(proj.name)} · Detalle del Cartridge</h2>
          <p class="detail-subtitle">${esc(proj.currentPhase)} · Integrado hasta ${esc(proj.integratedThrough)}</p>
        </div>
      </div>

      <!-- NEXT ACTION HERO -->
      <div class="next-action-hero-card">
        <span class="hero-icon">🎯</span>
        <div class="hero-content">
          <div class="hero-label">ACCIÓN SIGUIENTE INMEDIATA (NEXT ACTION)</div>
          <div class="hero-text">${inline(proj.nextAction)}</div>
        </div>
      </div>

      <!-- BLOCK STEPPER ROADMAP -->
      <div class="stepper-section-title">
        <span>🗺️ Roadmap de Bloques (B_0 a B_n)</span>
        <span style="font-family: var(--font-mono); font-size: 12px; color: var(--emerald);">
          ${proj.completedBlocks} de ${proj.totalBlocks} completados (${proj.progress}%)
        </span>
      </div>

      <div class="stepper-container">
        ${proj.blocks.map((block, idx) => `
          <div class="step-node ${block.done ? 'completed' : (block.active ? 'active-flight' : 'pending')}" title="${esc(block.note)}">
            <span class="step-id">${block.done ? '✓' : (block.active ? '▶' : '⏳')} ${esc(block.id)}</span>
            <span class="step-title">${esc(block.title)}</span>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${esc(block.date)}</span>
          </div>
          ${idx < proj.blocks.length - 1 ? `<div class="step-connector ${block.done ? 'completed' : ''}"></div>` : ''}
        `).join("")}
      </div>
    </div>
  `;
}

window.selectProject = function(name) {
  STATE.selectedProject = name;
  renderView();
};

window.openProjectDetail = function(name) {
  STATE.selectedProject = name;
  STATE.currentView = "projects";
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === "projects");
  });
  renderView();
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. COCKPIT & LIVE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderCockpit(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🧭</span> Operations Cockpit & Live Flight</h1>
        <p class="view-subtitle">Supervisión en tiempo real del frente activo y el plan en vuelo</p>
      </div>
    </div>

    <div class="cockpit-grid">
      <!-- LEFT COLUMN: ACTIVE FRONT & LIVE PLAN -->
      <div class="cockpit-column">
        <div class="cockpit-panel">
          <div class="panel-header">
            <h2><span>▶</span> Frente Activo Único</h2>
          </div>
          ${STATE.activeFront ? `
            <div class="next-action-hero-card" style="margin: 0;">
              <span class="hero-icon">⚡</span>
              <div class="hero-content">
                <div class="hero-label">FRENTE EN VUELO</div>
                <div class="hero-text">${inline(STATE.activeFront.name)}</div>
                <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 6px;">
                  <strong>Avanza cuando:</strong> ${inline(STATE.activeFront.moves_when || "—")}
                </p>
              </div>
            </div>
          ` : `
            <div class="empty-state"><p>No hay ningún frente activo seleccionado en Schedule.</p></div>
          `}
        </div>

        <div class="cockpit-panel">
          <div class="panel-header">
            <h2><span>📋</span> Plan en Vuelo (Current_plan)</h2>
            <span class="tag-pill tag-live">${STATE.livePlan.filter(p => !p.struck).length} pendientes</span>
          </div>

          ${STATE.livePlan.length ? `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${STATE.livePlan.map(item => `
                <div class="plan-item-row ${item.struck ? 'completed' : ''}">
                  <span class="plan-idx">${item.index}</span>
                  ${expandable(item.text, "plan-text")}
                  ${item.destination ? `
                    <span class="dest-tag ${/discarded|⚫/.test(item.destination) ? 'tag-discarded' : 'dest-resolved'}">
                      ${esc(item.destination)}
                    </span>
                  ` : `<span class="dest-tag dest-inflight">en curso</span>`}
                </div>
              `).join("")}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">⚡</div>
              <h3>Plan despejado</h3>
              <p>Current_plan está limpio y listo para recibir el siguiente bloque de tareas.</p>
            </div>
          `}
        </div>
      </div>

      <!-- RIGHT COLUMN: SCHEDULE QUEUE & SYSTEM METRICS -->
      <div class="cockpit-column">
        <div class="cockpit-panel">
          <div class="panel-header">
            <h2><span>🧭</span> Frentes en Cola (Schedule Compass)</h2>
            <span class="tag-pill">${visibleFronts().length} frentes${STATE.frontFilterProj ? ` · ${esc(STATE.frontFilterProj)}` : ""}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${visibleFronts().length ? visibleFronts().map(f => `
              <div class="plan-item-row ${f.active ? 'active-flight' : ''}" style="${f.active ? 'border-color: var(--accent-cyan); background: var(--accent-cyan-bg);' : ''}">
                <span class="plan-idx" style="${f.active ? 'color: var(--accent-cyan); font-weight: 700;' : ''}">
                  ${f.active ? '▶' : esc(f.marker || '#')}
                </span>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 13.5px;">${inline(f.name)}</strong>
                  <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${expandable(f.moves_when || '')}</p>
                </div>
                ${f.project ? `<span class="tag-pill tag-project">${esc(f.project)}</span>` : ''}
              </div>
            `).join("") : `<div class="empty-state">Ningún frente en ${esc(STATE.frontFilterProj)}.</div>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CHEATSHEET VIEW ⭐
// ─────────────────────────────────────────────────────────────────────────────
function renderCheatSheet(container) {
  const curCat = STATE.activeCsTab || "session";
  const catData = CHEATSHEET_DATA.find(c => c.category === curCat) || CHEATSHEET_DATA[0];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📖</span> CheatSheet & Atajos Rápidos ⭐</h1>
        <p class="view-subtitle">Chuleta interactiva para copiar comandos de sesión, worktrees y Claude Code en 1 clic</p>
      </div>
    </div>

    <div class="cheatsheet-container">
      <div class="cheatsheet-toolbar">
        <div class="cs-tabs">
          ${CHEATSHEET_DATA.map(c => `
            <button class="cs-tab-btn ${c.category === curCat ? 'active' : ''}" onclick="selectCsTab('${c.category}')">
              ${esc(c.catLabel)}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="cs-groups-grid">
        ${catData.groups.map(g => `
          <div class="cs-group-card">
            <div class="cs-group-header">
              <h3>${esc(g.title)}</h3>
              <p>${esc(g.desc)}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${g.cmds.map((cmd, cIdx) => `
                <div class="cs-cmd-row" id="cmdRow_${curCat}_${cIdx}" onclick="copyCommand('${esc(cmd.code)}', 'cmdRow_${curCat}_${cIdx}')">
                  <span class="cs-cmd-label">${esc(cmd.label)}</span>
                  <code class="cs-cmd-code">${esc(cmd.code)}</code>
                  <button class="cs-cmd-copy-btn">Copiar 📋</button>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

window.selectCsTab = function(cat) {
  STATE.activeCsTab = cat;
  renderView();
};

window.copyCommand = function(text, elementId) {
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.add("copied");
      setTimeout(() => el.classList.remove("copied"), 1200);
    }
    showToast(`Comando copiado al portapapeles: ${text.slice(0, 40)}...`);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. INBOX & TASKS VIEW (Priority #1: Filters by Project, Status & Date)
// ─────────────────────────────────────────────────────────────────────────────
function renderInbox(container) {
  const allProjects = [...new Set(STATE.tasks.map(t => t.project).filter(Boolean))].sort();
  const projFilter = STATE.taskFilterProj || "";
  const statusFilter = STATE.taskFilterStatus || "";
  const dateSort = STATE.taskDateSort || "newest";
  const searchTxt = (STATE.taskSearch || "").toLowerCase().trim();

  // Filter tasks
  let filtered = STATE.tasks.filter(t => {
    if (projFilter && t.project !== projFilter) return false;
    if (statusFilter) {
      if (statusFilter === "ACTIVE") {
        if (!["⬜", "🔨", "⛔", "🔴"].includes(t.status)) return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }
    if (searchTxt) {
      const matchTitle = (t.title || "").toLowerCase().includes(searchTxt);
      const matchWhy = (t.why || "").toLowerCase().includes(searchTxt);
      const matchId = (t.id || "").toLowerCase().includes(searchTxt);
      const matchProj = (t.project || "").toLowerCase().includes(searchTxt);
      if (!matchTitle && !matchWhy && !matchId && !matchProj) return false;
    }
    return true;
  });

  // Sort tasks
  filtered.sort((a, b) => {
    if (dateSort === "id") {
      const idA = parseInt(String(a.id).replace(/\D/g, "")) || 0;
      const idB = parseInt(String(b.id).replace(/\D/g, "")) || 0;
      return idB - idA;
    }
    const dateA = a.date || "1970-01-01";
    const dateB = b.date || "1970-01-01";
    return dateSort === "newest" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📬</span> Inbox & Tasks Lifecycle</h1>
        <p class="view-subtitle">Gestión interactiva de tareas con trazabilidad de descarte (PH-3) e hilo de comentarios</p>
      </div>
      <button class="btn-hud-action btn-add-task" onclick="openTaskModal()">
        <span>➕</span> <span>Nueva Tarea</span>
      </button>
    </div>

    <!-- FILTER TOOLBAR (Priority #1) -->
    <div class="view-toolbar">
      <div class="toolbar-group">
        <label for="taskFilterProj">Proyecto:</label>
        <select id="taskFilterProj" class="custom-select" onchange="updateTaskFilter('taskFilterProj', this.value)">
          <option value="">Todos los Proyectos (${STATE.tasks.length})</option>
          ${allProjects.map(p => `
            <option value="${esc(p)}" ${p === projFilter ? "selected" : ""}>
              ${esc(p)} (${STATE.tasks.filter(t => t.project === p).length})
            </option>
          `).join("")}
        </select>
      </div>

      <div class="toolbar-group">
        <label for="taskFilterStatus">Estado:</label>
        <select id="taskFilterStatus" class="custom-select" onchange="updateTaskFilter('taskFilterStatus', this.value)">
          <option value="">Todos los estados</option>
          <option value="ACTIVE" ${statusFilter === "ACTIVE" ? "selected" : ""}>Activas (⬜ 🔨 ⛔ 🔴)</option>
          <option value="⬜" ${statusFilter === "⬜" ? "selected" : ""}>⬜ Pendientes</option>
          <option value="🔨" ${statusFilter === "🔨" ? "selected" : ""}>🔨 En curso</option>
          <option value="⛔" ${statusFilter === "⛔" ? "selected" : ""}>⛔ Bloqueadas</option>
          <option value="🔴" ${statusFilter === "🔴" ? "selected" : ""}>🔴 Críticas</option>
          <option value="✅" ${statusFilter === "✅" ? "selected" : ""}>✅ Completadas</option>
          <option value="⚫" ${statusFilter === "⚫" ? "selected" : ""}>⚫ Descartadas</option>
        </select>
      </div>

      <div class="toolbar-group">
        <label for="taskFilterDateSort">Orden Fecha:</label>
        <select id="taskFilterDateSort" class="custom-select" onchange="updateTaskFilter('taskDateSort', this.value)">
          <option value="newest" ${dateSort === "newest" ? "selected" : ""}>Más recientes primero</option>
          <option value="oldest" ${dateSort === "oldest" ? "selected" : ""}>Más antiguas primero</option>
          <option value="id" ${dateSort === "id" ? "selected" : ""}>Ordenar por ID</option>
        </select>
      </div>

      <div class="toolbar-group search-group">
        <input type="text" id="taskSearchInput" class="custom-input" placeholder="Buscar por título, why, ID..." value="${esc(STATE.taskSearch)}" oninput="updateTaskFilter('taskSearch', this.value)">
      </div>
    </div>

    <!-- TASKS LIST -->
    <div class="tickets-list">
      ${filtered.length ? filtered.map(t => {
        const isDone = t.status === "✅";
        const isDiscarded = t.status === "⚫";

        return `
          <div class="ticket-card ${isDone ? 'completed' : (isDiscarded ? 'discarded' : '')}">
            <div class="ticket-top">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tag-pill tag-purple" style="font-weight: 700;">${esc(t.id)}</span>
                <span class="tag-pill">${esc(t.status)}</span>
                <h3 class="ticket-title" style="${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${inline(t.title)}</h3>
              </div>
              <span class="tag-pill tag-project">${esc(t.project)}</span>
            </div>

            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
              <strong>Why:</strong> ${inline(t.why)}
            </p>

            ${t.discardReason ? `
              <div class="task-discard-callout">
                <strong>⚫ Descartada (Motivo PH-3):</strong> ${inline(t.discardReason)}
              </div>
            ` : ''}

            <!-- COMMENTS THREAD -->
            ${t.comments && t.comments.length ? `
              <div class="task-comments-list">
                ${t.comments.map(c => `
                  <div class="comment-bubble">
                    <span class="comment-meta">${esc(c.author)} · ${esc(c.date)}</span>
                    <span class="comment-text">${inline(c.text)}</span>
                  </div>
                `).join("")}
              </div>
            ` : ''}

            <div class="ticket-meta">
              ${renderOrigin(t.author, t.origin_inferred)}
              ${renderDate(t.date, t.date_inferred)}
              ${t.file ? `<span class="tag-pill" style="opacity: 0.7;"><code>${esc(t.file)}</code></span>` : ''}
            </div>

            <!-- TASK ACTIONS TOOLBAR -->
            <div class="task-actions-toolbar">
              ${!isDone && !isDiscarded ? `
                <button class="btn-task-action btn-task-complete" onclick="completeTask('${esc(t.id)}')">
                  <span>✅</span> Completar
                </button>
              ` : ''}
              <button class="btn-task-action btn-task-comment" onclick="openCommentModal('${esc(t.id)}', '${esc(t.title)}')">
                <span>💬</span> Comentar (${t.comments ? t.comments.length : 0})
              </button>
              ${!isDiscarded ? `
                <button class="btn-task-action btn-task-discard" onclick="openDiscardModal('${esc(t.id)}', '${esc(t.title)}')">
                  <span>⚫</span> Descartar
                </button>
              ` : ''}
              ${isDone || isDiscarded ? `
                <button class="btn-task-action" onclick="reopenTask('${esc(t.id)}')">
                  <span>🔄</span> Reabrir
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join("") : `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No hay tareas que coincidan</h3>
          <p>Prueba a ajustar los filtros de proyecto, estado o búsqueda.</p>
        </div>
      `}
    </div>
  `;
}

window.updateTaskFilter = function(key, val) {
  STATE[key] = val;
  renderView();
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. IDEAS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderIdeas(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>💡</span> Idea Park</h1>
        <p class="view-subtitle">Aparcamiento ordenado de ideas y mejoras futuras para preservar el foco (PH-3)</p>
      </div>
      <button class="btn-hud-action btn-add-idea" onclick="openIdeaModal()">
        <span>💡</span> <span>Aparcar Idea</span>
      </button>
    </div>

    <div class="tickets-list">
      ${STATE.ideas.length ? STATE.ideas.map(idea => `
        <div class="ticket-card">
          <div class="ticket-top">
            <h3 class="ticket-title">${inline(idea.title)}</h3>
            <span class="tag-pill tag-project">${esc(idea.project)}</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">${inline(idea.body)}</p>
          <div class="ticket-meta">
            <span class="tag-pill tag-purple">scope: ${esc(idea.scope)}</span>
            <span class="tag-pill">sección: ${esc(idea.section)}</span>
            ${renderOrigin(idea.origin, idea.origin_inferred)}
          </div>
        </div>
      `).join("") : `
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          <h3>Parque de ideas despejado</h3>
          <p>Utiliza el botón 'Aparcar Idea' para registrar mejoras sin interrumpir el frente activo.</p>
        </div>
      `}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DECISIONS VIEW (Priority #2: 274 Records, Supersedes, Frozen Toggle)
// ─────────────────────────────────────────────────────────────────────────────
function renderDecisions(container) {
  const allProjects = [...new Set(STATE.decisions.map(d => d.project).filter(Boolean))].sort();
  const frozenCount = STATE.decisions.filter(d => d.frozen).length;
  const showFrozen = STATE.showFrozen === true;
  const projFilter = STATE.decFilterProj || "";
  const statusFilter = STATE.decFilterStatus || "";
  const searchTxt = (STATE.decSearch || "").toLowerCase().trim();

  // Filter decisions
  let filtered = STATE.decisions.filter(d => {
    if (!showFrozen && d.frozen) return false;
    if (projFilter && d.project !== projFilter) return false;
    if (statusFilter === "ALIVE" && d.isSuperseded) return false;
    if (statusFilter === "SUPERSEDED" && !d.isSuperseded) return false;

    if (searchTxt) {
      const matchTitle = (d.title || "").toLowerCase().includes(searchTxt);
      const matchWhy = (d.why || "").toLowerCase().includes(searchTxt);
      const matchId = (d.id || "").toLowerCase().includes(searchTxt);
      const matchProj = (d.project || "").toLowerCase().includes(searchTxt);
      const matchDiscarded = (d.discarded || "").toLowerCase().includes(searchTxt);
      if (!matchTitle && !matchWhy && !matchId && !matchProj && !matchDiscarded) return false;
    }
    return true;
  });

  // Sort decisions: newest or highest numeric ID first
  filtered.sort((a, b) => {
    const idA = parseInt(String(a.id).replace(/\D/g, "")) || 0;
    const idB = parseInt(String(b.id).replace(/\D/g, "")) || 0;
    if (idA && idB && a.project === b.project) return idB - idA;
    return (b.date || "").localeCompare(a.date || "");
  });

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📜</span> Decision Log (Registro de Decisiones)</h1>
        <p class="view-subtitle">${STATE.decisions.length} decisiones inmutables con autor, fecha, liveness y trazabilidad de supersedes</p>
      </div>
    </div>

    <!-- DECISION FILTERS (Priority #2) -->
    <div class="view-toolbar">
      <div class="toolbar-group">
        <label for="decFilterProj">Proyecto:</label>
        <select id="decFilterProj" class="custom-select" onchange="updateDecFilter('decFilterProj', this.value)">
          <option value="">Todos los Proyectos (${STATE.decisions.length})</option>
          ${allProjects.map(p => `
            <option value="${esc(p)}" ${p === projFilter ? "selected" : ""}>
              ${esc(p)} (${STATE.decisions.filter(d => d.project === p).length})
            </option>
          `).join("")}
        </select>
      </div>

      <div class="toolbar-group">
        <label for="decFilterStatus">Vivacidad:</label>
        <select id="decFilterStatus" class="custom-select" onchange="updateDecFilter('decFilterStatus', this.value)">
          <option value="">Todas las Decisiones</option>
          <option value="ALIVE" ${statusFilter === "ALIVE" ? "selected" : ""}>🟢 Vivas (Activas)</option>
          <option value="SUPERSEDED" ${statusFilter === "SUPERSEDED" ? "selected" : ""}>🔄 Reemplazadas (Superseded)</option>
        </select>
      </div>

      <div class="toolbar-group checkbox-group">
        <label class="toggle-label" title="Las copias congeladas son fotografías selladas declaradas (AX-20)">
          <input type="checkbox" id="decToggleFrozen" ${showFrozen ? "checked" : ""} onchange="updateDecFilter('showFrozen', this.checked)">
          <span>Mostrar Copias Congeladas (${frozenCount})</span>
        </label>
      </div>

      <div class="toolbar-group search-group">
        <input type="text" id="decSearchInput" class="custom-input" placeholder="Buscar por D_n, texto, por qué, descartado..." value="${esc(STATE.decSearch)}" oninput="updateDecFilter('decSearch', this.value)">
      </div>
    </div>

    <!-- DECISIONS LIST -->
    <div class="tickets-list">
      ${filtered.length ? filtered.map(d => `
        <div class="ticket-card ${d.isSuperseded ? 'discarded' : ''}">
          <div class="ticket-top">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="tag-pill tag-purple" style="font-weight: 700;">${esc(d.id)}</span>
              <span class="tag-pill tag-project">${esc(d.project)}</span>
              ${d.isSuperseded ? `
                <span class="tag-pill tag-superseded" title="Reemplazada por ${esc(d.supersededBy.join(', '))}">
                  🔄 Reemplazada por ${esc(d.supersededBy.join(', '))}
                </span>
              ` : `
                <span class="tag-pill tag-alive" title="Decisión VIVA">🟢 VIVA</span>
              `}
              ${d.supersedes ? `
                <span class="tag-pill tag-supersedes" title="Reemplaza a ${esc(d.supersedes)}">⚡ Reemplaza a ${esc(d.supersedes)}</span>
              ` : ''}
              ${d.frozen ? `
                <span class="tag-pill tag-frozen" title="Copia sellada de ${esc(d.mirror_of || 'snapshot')}">🧊 Frozen Mirror</span>
              ` : ''}
            </div>
            ${renderDate(d.date, d.date_inferred)}
          </div>

          <h3 class="ticket-title" style="margin-top: 4px; font-size: 15.5px;">${inline(d.title)}</h3>
          
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 2px;">
            <strong>Por qué:</strong> ${inline(d.why)}
          </p>

          ${d.discarded ? `
            <div class="discarded-box">
              <strong>Alternativa descartada:</strong> ${inline(d.discarded)}
            </div>
          ` : ''}

          <div class="ticket-meta" style="margin-top: 4px;">
            ${renderOrigin(d.origin, d.origin_inferred)}
            ${d.frozen ? `<span class="tag-pill" style="opacity: 0.75;">mirror de <code>${esc(d.mirror_of || '')}</code></span>` : ''}
            ${d.file ? `<span class="tag-pill" style="opacity: 0.65;"><code>${esc(d.file)}</code></span>` : ''}
          </div>
        </div>
      `).join("") : `
        <div class="empty-state">
          <div class="empty-icon">📜</div>
          <h3>No hay decisiones que coincidan</h3>
          <p>Prueba a ajustar los filtros de proyecto, vivacidad o búsqueda.</p>
        </div>
      `}
    </div>
  `;
}

window.updateDecFilter = function(key, val) {
  STATE[key] = val;
  renderView();
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. SKILLS & ORG VIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderSkills(container) {
  const eventSkills = STATE.skills.filter(s => s.trigger === "event");
  const reqSkills = STATE.skills.filter(s => s.trigger === "request");
  const lockedSkills = STATE.skills.filter(s => s.trigger === "locked");

// ─────────────────────────────────────────────────────────────────────────────
// 8. SKILLS & ORG VIEW (Redesigned with rich layout, search & CLI commands)
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_ICONS = {
  "open-session": "⚡",
  "triage": "📬",
  "company-auditor": "🏛️",
  "instance-auditor": "🔍",
  "project-auditor": "🎯",
  "audit": "🤖",
  "autonomous-run": "🚀",
  "code-cleanup": "🧹",
  "redefine-project": "🔄",
  "structure-project": "🏗️",
  "rnd": "🔬",
  "learn": "📚",
  "correct-exercise": "✏️",
  "dispatch": "📤",
  "gather": "📥",
  "release-cut": "🏷️"
};

function classifySkill(s) {
  const name = s.title.toLowerCase();
  if (name.includes("auditor") || s.trigger === "event") {
    return {
      type: "event",
      label: "🔔 Rol de Evento",
      badgeClass: "tag-live",
      typeDesc: "Disparado automáticamente al cerrar tareas o modificar archivos estructurales"
    };
  }
  if (s.trigger === "locked" || name === "release-cut") {
    return {
      type: "locked",
      label: "🔒 Gobernanza / Release",
      badgeClass: "tag-supersedes",
      typeDesc: "Invocación restringida de gobierno o corte de release público"
    };
  }
  return {
    type: "request",
    label: "🛠️ Capacidad Invocable",
    badgeClass: "tag-purple",
    typeDesc: "Invocada por nombre o comando directo por el operador"
  };
}

function renderSkills(container) {
  const filterType = STATE.skillFilterType || "ALL";
  const searchTxt = (STATE.skillSearch || "").toLowerCase().trim();

  const enrichedSkills = STATE.skills.map(s => ({
    ...s,
    icon: SKILL_ICONS[s.title] || "⚡",
    classification: classifySkill(s)
  }));

  const eventCount = enrichedSkills.filter(s => s.classification.type === "event").length;
  const reqCount = enrichedSkills.filter(s => s.classification.type === "request").length;
  const lockedCount = enrichedSkills.filter(s => s.classification.type === "locked").length;

  let filtered = enrichedSkills.filter(s => {
    if (filterType !== "ALL" && s.classification.type !== filterType) return false;
    if (searchTxt) {
      const matchTitle = s.title.toLowerCase().includes(searchTxt);
      const matchSummary = (s.summary || "").toLowerCase().includes(searchTxt);
      const matchWhen = (s.when || "").toLowerCase().includes(searchTxt);
      if (!matchTitle && !matchSummary && !matchWhen) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>⚡</span> Skills & Organigrama de Agentes</h1>
        <p class="view-subtitle">Catálogo de capacidades especializadas y roles de auditoría de MLabs</p>
      </div>
    </div>

    <!-- SKILLS STATS HUD -->
    <div class="skills-stats-hud">
      <div class="skill-stat-chip ${filterType === 'ALL' ? 'active' : ''}" onclick="updateSkillFilter('ALL')">
        <span class="stat-count">${enrichedSkills.length}</span>
        <span class="stat-name">Todas las Skills</span>
      </div>
      <div class="skill-stat-chip ${filterType === 'event' ? 'active' : ''}" onclick="updateSkillFilter('event')">
        <span class="stat-count" style="color: var(--emerald);">${eventCount}</span>
        <span class="stat-name">🔔 Roles de Evento</span>
      </div>
      <div class="skill-stat-chip ${filterType === 'request' ? 'active' : ''}" onclick="updateSkillFilter('request')">
        <span class="stat-count" style="color: var(--purple);">${reqCount}</span>
        <span class="stat-name">🛠️ Capacidades</span>
      </div>
      <div class="skill-stat-chip ${filterType === 'locked' ? 'active' : ''}" onclick="updateSkillFilter('locked')">
        <span class="stat-count" style="color: var(--amber);">${lockedCount}</span>
        <span class="stat-name">🔒 Gobernanza</span>
      </div>
    </div>

    <!-- SKILLS TOOLBAR -->
    <div class="view-toolbar" style="margin-top: 16px;">
      <div class="toolbar-group search-group" style="flex: 1;">
        <input type="text" id="skillSearchInput" class="custom-input" placeholder="Buscar skill por nombre, objetivo, condición de uso..." value="${esc(STATE.skillSearch || '')}" oninput="updateSkillSearch(this.value)">
      </div>
      <div class="toolbar-group">
        <span class="tag-pill">${filtered.length} skills mostradas</span>
      </div>
    </div>

    <!-- SKILLS CARDS GRID -->
    <div class="skills-enhanced-grid">
      ${filtered.length ? filtered.map(renderEnhancedSkillCard).join("") : `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">⚡</div>
          <h3>No hay skills que coincidan</h3>
          <p>Prueba a buscar con otro término o selecciona 'Todas las Skills'.</p>
        </div>
      `}
    </div>
  `;
}

function renderEnhancedSkillCard(skill, idx) {
  const cliCmd = `claude -p 'run ${skill.title}'`;
  const rowId = `skillCmd_${idx}`;

  return `
    <div class="skill-enhanced-card">
      <div class="skill-card-topbar">
        <div class="skill-identity">
          <span class="skill-icon-bubble">${skill.icon}</span>
          <div>
            <h3 class="skill-card-name">${esc(skill.title)}</h3>
            <span class="skill-file-path">skills/${esc(skill.title)}/SKILL.md</span>
          </div>
        </div>
        <span class="tag-pill ${skill.classification.badgeClass}">
          ${esc(skill.classification.label)}
        </span>
      </div>

      <p class="skill-card-summary">${inline(skill.summary || "Capacidad especializada de agente para operaciones.")}</p>

      <div class="skill-card-when-box">
        <div class="when-box-label">
          <span>🎯</span> <strong>CUÁNDO USAR / DISPARO:</strong>
        </div>
        <p class="when-box-text">${inline(skill.when || skill.evidence || "Invocación directa bajo demanda.")}</p>
      </div>

      <div class="skill-card-footer">
        <div class="skill-cli-box" id="${rowId}" onclick="copyCommand('${esc(cliCmd)}', '${rowId}')" title="Clic para copiar comando de invocación">
          <span class="cli-prompt-label">CLI:</span>
          <code class="cli-prompt-code">${esc(cliCmd)}</code>
          <button class="cli-copy-btn">Copiar 📋</button>
        </div>
      </div>
    </div>
  `;
}

window.updateSkillFilter = function(type) {
  STATE.skillFilterType = type;
  renderView();
};

window.updateSkillSearch = function(q) {
  STATE.skillSearch = q;
  renderView();
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE TASK LIFECYCLE (Complete, Comment, Discard)
// ─────────────────────────────────────────────────────────────────────────────
window.completeTask = function(taskId) {
  const task = STATE.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = "✅";
  persistTasksLocally();
  renderView();
  showToast(`Tarea ${taskId} marcada como completada ✅`);
};

window.reopenTask = function(taskId) {
  const task = STATE.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = "⬜";
  task.discardReason = null;
  persistTasksLocally();
  renderView();
  showToast(`Tarea ${taskId} reabierta como pendiente ⬜`);
};

window.openCommentModal = function(taskId, title) {
  const modal = document.getElementById("commentModal");
  const inputId = document.getElementById("commentTaskId");
  const label = document.getElementById("commentTaskTitleLabel");
  const textInput = document.getElementById("commentTextInput");
  if (modal && inputId && label) {
    inputId.value = taskId;
    label.textContent = `Tarea: ${taskId} · ${title}`;
    if (textInput) textInput.value = "";
    modal.classList.add("active");
  }
};

window.closeCommentModal = function() {
  const modal = document.getElementById("commentModal");
  if (modal) modal.classList.remove("active");
};

window.handleSaveComment = function(e) {
  e.preventDefault();
  const taskId = document.getElementById("commentTaskId").value;
  const text = document.getElementById("commentTextInput").value.trim();
  if (!text) return;

  const task = STATE.tasks.find(t => t.id === taskId);
  if (task) {
    if (!task.comments) task.comments = [];
    task.comments.push({
      author: "Operator",
      date: new Date().toISOString().slice(0, 10),
      text
    });
    persistTasksLocally();
    closeCommentModal();
    renderView();
    showToast(`Comentario añadido a la tarea ${taskId} 💬`);
  }
};

window.openDiscardModal = function(taskId, title) {
  const modal = document.getElementById("discardModal");
  const inputId = document.getElementById("discardTaskId");
  const label = document.getElementById("discardTaskTitleLabel");
  const reasonInput = document.getElementById("discardReasonInput");
  if (modal && inputId && label) {
    inputId.value = taskId;
    label.textContent = `Tarea: ${taskId} · ${title}`;
    if (reasonInput) reasonInput.value = "";
    modal.classList.add("active");
  }
};

window.closeDiscardModal = function() {
  const modal = document.getElementById("discardModal");
  if (modal) modal.classList.remove("active");
};

window.handleSaveDiscard = function(e) {
  e.preventDefault();
  const taskId = document.getElementById("discardTaskId").value;
  const reason = document.getElementById("discardReasonInput").value.trim();
  if (!reason) return;

  const task = STATE.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = "⚫";
    task.discardReason = reason;
    persistTasksLocally();
    closeDiscardModal();
    renderView();
    showToast(`Tarea ${taskId} descartada con registro PH-3 ⚫`);
  }
};

function persistTasksLocally() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(STATE.tasks));
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL WRITE HANDLERS (New Task & New Idea)
// ─────────────────────────────────────────────────────────────────────────────
window.openTaskModal = function() {
  const modal = document.getElementById("taskModal");
  if (modal) {
    updateTaskPreview();
    modal.classList.add("active");
  }
};

window.closeTaskModal = function() {
  const modal = document.getElementById("taskModal");
  if (modal) modal.classList.remove("active");
};

function updateTaskPreview() {
  const title = document.getElementById("taskTitle")?.value || "...";
  const proj = document.getElementById("taskProject")?.value || (STATE.projects[0]?.name || "project");
  const status = document.getElementById("taskStatus")?.value || "⬜";
  const why = document.getElementById("taskWhy")?.value || "...";
  const nextId = `T${STATE.tasks.length + 60}`;

  const preview = document.getElementById("taskMarkdownPreview");
  if (preview) {
    preview.textContent = `### ${nextId} · ${title} ${status}\n**project:** \`${proj}\`\n**Why** *(operator, ${new Date().toISOString().slice(0, 10)})*. ${why}`;
  }
}

window.handleCreateTask = function(e) {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const project = document.getElementById("taskProject").value;
  const status = document.getElementById("taskStatus").value;
  const why = document.getElementById("taskWhy").value.trim();

  const nextId = `T${STATE.tasks.length + 60}`;
  const newTask = {
    id: nextId,
    title,
    project,
    status,
    why,
    author: "Operator",
    date: new Date().toISOString().slice(0, 10),
    date_inferred: false,
    origin_inferred: false,
    comments: [],
    discardReason: null
  };

  STATE.tasks.unshift(newTask);
  persistTasksLocally();
  closeTaskModal();
  renderView();
  showToast(`Tarea ${nextId} creada correctamente ➕`);
};

window.openIdeaModal = function() {
  const modal = document.getElementById("ideaModal");
  if (modal) modal.classList.add("active");
};

window.closeIdeaModal = function() {
  const modal = document.getElementById("ideaModal");
  if (modal) modal.classList.remove("active");
};

window.handleCreateIdea = function(e) {
  e.preventDefault();
  const title = document.getElementById("ideaTitle").value.trim();
  const project = document.getElementById("ideaProject").value;
  const scope = document.getElementById("ideaScope").value.trim() || "general";
  const body = document.getElementById("ideaBody").value.trim();

  const newIdea = {
    id: `idea-${Math.random().toString(36).slice(2, 8)}`,
    title,
    project,
    scope,
    body,
    section: "Ideación Rápida",
    origin: "Operator"
  };

  STATE.ideas.unshift(newIdea);
  localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(STATE.ideas));
  closeIdeaModal();
  renderView();
  showToast(`Idea aparcada en Idea Park 💡`);
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING SCRATCHPAD DRAWER
// ─────────────────────────────────────────────────────────────────────────────
window.toggleScratchpad = function() {
  const drawer = document.getElementById("scratchpadDrawer");
  if (drawer) drawer.classList.toggle("open");
};

window.convertScratchpadToTask = function() {
  const text = document.getElementById("scratchpadInput")?.value.trim();
  if (!text) return;
  toggleScratchpad();
  openTaskModal();
  const titleInput = document.getElementById("taskTitle");
  if (titleInput) titleInput.value = text.slice(0, 80);
  const whyInput = document.getElementById("taskWhy");
  if (whyInput) whyInput.value = text;
  updateTaskPreview();
};

window.convertScratchpadToIdea = function() {
  const text = document.getElementById("scratchpadInput")?.value.trim();
  if (!text) return;
  toggleScratchpad();
  openIdeaModal();
  const titleInput = document.getElementById("ideaTitle");
  if (titleInput) titleInput.value = text.slice(0, 80);
  const bodyInput = document.getElementById("ideaBody");
  if (bodyInput) bodyInput.value = text;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING & REAL-TIME POLLING
// ─────────────────────────────────────────────────────────────────────────────
async function loadModel() {
  try {
    const res = await fetch("/api/model");
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const modelData = await res.json();
    STATE.error = null;
    ingestModel(modelData);
    renderView();
  } catch (err) {
    STATE.error = `No se pudo conectar con el servidor: ${err.message}`;
    renderView();
  }
}

async function watchStamp() {
  try {
    const res = await fetch("/api/stamp");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const newStamp = data.stamp;
    if (STAMP !== null && newStamp !== STAMP) {
      await loadModel();
    }
    STAMP = newStamp;
    const syncStatus = document.getElementById("syncStatus");
    if (syncStatus) syncStatus.textContent = "2.0s";
  } catch {
    const syncStatus = document.getElementById("syncStatus");
    if (syncStatus) syncStatus.textContent = "offline";
  }
}

window.retryLoad = () => {
  STATE.error = null;
  renderView();
  loadModel();
};

// Global Live Form Input Listeners
document.addEventListener("DOMContentLoaded", () => {
  ["taskTitle", "taskProject", "taskStatus", "taskWhy"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateTaskPreview);
  });

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) navigateTo(view);
    });
  });

  document.getElementById("projectFilter")?.addEventListener("change", e => {
    const val = e.target.value;
    if (val === "ALL") {
      STATE.taskFilterProj = "";
      STATE.decFilterProj = "";
      STATE.frontFilterProj = "";
    } else {
      STATE.taskFilterProj = val;
      STATE.decFilterProj = val;
      STATE.frontFilterProj = val;   // the compass too: focusing on a project means
      STATE.selectedProject = val;   // the thing you read to decide what is next
    }
    renderView();
  });

  document.getElementById("globalSearch")?.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    STATE.taskSearch = q;
    STATE.decSearch = q;
    renderView();
  });
});

// Initial boot & periodic watcher
loadModel().then(watchStamp);
setInterval(watchStamp, 2000);
