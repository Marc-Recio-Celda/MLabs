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
  livePlanMeta: null,
  plans: [],
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

window.copyToClipboard = function(text, msg, evt) {
  if (!text) return;
  const target = evt?.currentTarget || (typeof event !== "undefined" ? event?.currentTarget : null);

  const fallbackCopy = (str) => {
    const textArea = document.createElement("textarea");
    textArea.value = str;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.warn('execCommand copy error', err);
    }
    document.body.removeChild(textArea);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }

  if (target) {
    target.classList.add("copied-pulse");
    setTimeout(() => target.classList.remove("copied-pulse"), 1200);
  }
  showToast(msg || `Copiado: ${text.slice(0, 45)}`);
};

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
          { label: "Open session", code: "claude -p 'open a session: read COMPASS.md, report the active front, and ask if we work it'", hint: "Prompt" },
          { label: "Close task cleanly", code: "claude -p 'close this task: strike each item in PLAN.md with its destination, update state, close the plan, and run company-auditor'", hint: "Prompt" },
          { label: "Audit working tree", code: "claude -p 'run the company-auditor over everything touched in this task'", hint: "Prompt" }
        ]
      },
      {
        title: "Quick Status & Verification",
        desc: "Verify workspace integrity and release allowlist in seconds.",
        cmds: [
          { label: "Check git status", code: "git status -s && git branch -vv", hint: "Shell" },
          { label: "Run the gate", code: "bash tools/gate.sh --denylist <the instance's denylist>", hint: "Shell*" },
          { label: "Axiom citations resolve", code: "bash tools/axiom-refs.sh AXIOMS.md MLabs $(git ls-files)", hint: "Shell" },
          { label: "Clause citations resolve", code: "bash tools/clause-refs.sh PHILOSOPHY.md $(git ls-files)", hint: "Shell" },
          { label: "Roles have log and criterion", code: "bash tools/roles-check.sh --skills skills --logs <the instance's logs dir>", hint: "Shell*" },
          { label: "Same prose in two files", code: "bash tools/dup-prose.sh PHILOSOPHY.md AXIOMS.md AGENTS.md METHOD.md FLOW.md", hint: "Shell" },
          { label: "Every check test", code: "bash tools/tests/run.sh", hint: "Shell" },
          { label: "Model parses, nothing dropped", code: "python3 interface/model/parse.py --adapter <the instance's adapter>", hint: "Shell*" }
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

// Helper to generate dynamic ramified project block workflows from real project state & decisions
function generateProjectRamifiedWorkflow(pName, decCount, pState, projectTasks = [], projectDecs = []) {
  const openTasks = projectTasks.filter(t => t.status !== "✅" && t.status !== "⚫");
  const closedTasks = projectTasks.filter(t => t.status === "✅");
  const decIds = (projectDecs || []).map(d => d.id);

  // If real blocks were parsed from state.md, use them!
  if (pState && Array.isArray(pState.blocks) && pState.blocks.length > 0) {
    return pState.blocks.map((b, bIdx) => {
      const status = b.status || "pending";
      const statusLabel = status === "completed" ? "✓ Listo" : (status === "active" ? "▶ En Curso" : "⏳ Pendiente");
      
      const subblocks = (b.subblocks || []).map(sub => {
        // Find tasks matching this subblock ID (e.g. "B8.2" or "A1.1")
        const matchingTasks = projectTasks.filter(t => t.title.includes(sub.id) || (t.why && t.why.includes(sub.id)));
        const subTasks = matchingTasks.length ? matchingTasks : (sub.status === "active" ? openTasks : []);
        
        return {
          id: sub.id,
          kind: sub.kind || "🔨",
          title: sub.title,
          desc: sub.desc || sub.title,
          status: sub.status || "pending",
          tasks: subTasks
        };
      });

      return {
        id: b.id,
        title: b.title,
        status,
        statusLabel,
        summary: b.summary || b.title,
        decisions: decIds.slice(bIdx * 2, (bIdx + 1) * 2),
        subblocks
      };
    });
  }

  // ⛔ Aquí había un fallback que INVENTABA cuatro bloques cuando el `state.md` no
  // declaraba ninguno: títulos escritos a mano, estados fijados a `completed`, y las
  // decisiones del proyecto repartidas entre ellos por `slice(bIdx*2, …)` — es decir,
  // atribuidas a bloques que no existen, por posición. Salía una hoja de ruta completa
  // con su barra de progreso, indistinguible de una leída del fichero.
  //
  // ⚠️ Y lo que un lector hace con eso es creérselo. Un vacío honesto se puede rellenar;
  // una ficción con aspecto de dato hay que descubrirla primero. Sin bloques declarados,
  // esto devuelve cero bloques y la vista dice por qué.
  return [];
}

// Ingest typed model from server
function ingestModel(model) {
  const entities = model.entities || [];
  STATE.problems = model.problems || [];
  
  // Fronts & Active Front
  STATE.fronts = entities.filter(e => e.kind === "front");
  STATE.activeFront = STATE.fronts.find(e => e.active) || (STATE.fronts[0] || null);

  // Live Plan items & metadata
  STATE.livePlan = entities.filter(e => e.kind === "plan-item").map(e => ({
    id: e.id,
    index: e.index,
    // ⛔ `line` is what lets the desk write an item BACK. Without it the office can only
    // read the plan, which is the whole of what was wrong with the old cockpit.
    line: e.line,
    text: e.text || "",
    struck: Boolean(e.struck),
    destination: e.destination || "",
    outcome: e.outcome || null,
    section: e.section || null,
    subsection: e.subsection || null,
    ordered: e.ordered !== false,
    author: e.author || null,
    date: e.date || null,
    project: e.project || "cross"
  }));
  STATE.planSections = entities.filter(e => e.kind === "plan-section").map(e => ({
    level: e.level, title: e.title, section: e.section, subsection: e.subsection, line: e.line
  }));
  STATE.livePlanMeta = entities.find(e => e.kind === "live-plan-meta") || null;

  // Persistent Plans (from data/plans/*.json)
  STATE.plans = entities.filter(e => e.kind === "plan").map(e => ({
    id: e._record_id || e.id || "",
    project: e.project || "nexus",
    title: e.title || e.task || "",
    task: e.task || e.title || "",
    block: e.block || "",
    sub_block: e.sub_block || "",
    status: e.status || "closed",
    date: e.date || "",
    closed_on: e.closed_on || e.closed_date || null,
    author: e.author || e.origin || "Operator",
    order_why: e.order_why || "",
    closing_note: e.closing_note || "",
    items: Array.isArray(e.items) ? e.items.map((it, idx) => ({
      index: it.n || it.index || idx + 1,
      text: it.text || "",
      status: (it.outcome === "done" || it.status === "done" || it.status === "closed" || Boolean(it.struck)) ? "done" : "open",
      destination: it.destination || it.outcome || (it.note ? it.note : (it.struck ? "✅ resolved" : "")),
      completed_at: it.completed_at || it.date || null
    })) : []
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
    // Los cuatro de `AX-46`. `prose` es lo que sobra del cuerpo una vez sacados.
    serves: e.serves || null,
    what: e.what || null,
    asks: e.asks || null,
    affects: e.affects || null,
    prose: e.prose || "",
    body: e.body || "",
    line: e.line,
    file: e.file || "",
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
  // ⛔ Aquí había un caso especial que forzaba `rnd` a `event` y, si su `when` no le
  // gustaba, **escribía uno inventado** que no aparece en ningún fichero. La descripción
  // de `rnd` dice literalmente «on request» y «Use when the operator is stuck…»: el parser
  // la lee bien y la vista la corregía hacia lo contrario, presentando texto fabricado con
  // el mismo aspecto que el leído del disco. Una excepción por nombre en la capa de
  // presentación es una segunda copia de un hecho, y ésta además era falsa.
  //
  // ⚠️ Un `trigger` que no viene se queda como `unclear`, no como `request`: el parser
  // distingue expresamente lo que pudo probar de lo que no, y ese matiz es el valor.
  STATE.skills = entities.filter(e => e.kind === "skill").map(e => ({
    id: e.id,
    title: e.title || "",
    trigger: e.trigger || "unclear",
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
    // Los cinco de `FLOW.md`, si la tarea los declara. `status` es el emoji del
    // vocabulario anterior y sigue conviviendo: ninguno se deriva del otro.
    state: e.state || null,
    plan: e.plan || null,
    block: e.block || null,
    sub_block: e.sub_block || null,
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
    ...projectStates.map(ps => ps.project).filter(p => p && !p.startsWith("_") && !p.toLowerCase().includes("template")),
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
    const pState = projectStates.find(ps => ps.project === name) ||
                   projectStates.find(ps => ps.project && ps.project.toLowerCase() === name.toLowerCase()) ||
                   projectStates.find(ps => ps.title && ps.title.toLowerCase().includes(name.toLowerCase()));
    const decCount = STATE.decisions.filter(d => d.project === name).length;
    const projectTasks = STATE.tasks.filter(t => t.project === name || t.project.startsWith(name));
    const projectDecs = STATE.decisions.filter(d => d.project === name);
    
    const workflow = generateProjectRamifiedWorkflow(name, decCount, pState, projectTasks, projectDecs);
    const completedBlocks = workflow.filter(b => b.status === "completed").length;
    const totalBlocks = workflow.length;
    // ⚠️ Era `: 75`. Un proyecto sin bloques declarados enseñaba un 75 % de avance que no
    // salía de ningún sitio. `null` es «no medido», y la vista lo pinta como tal.
    const progress = totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : null;

    let rawLastUpdated = pState?.last_updated || "";
    let integratedThrough = pState?.integrated_through || "";
    if (rawLastUpdated.includes("integrated through")) {
      const parts = rawLastUpdated.split(/·\s*\*\*integrated through\*\*\s*/i);
      rawLastUpdated = parts[0].trim();
      if (!integratedThrough && parts[1]) integratedThrough = parts[1].replace(/[`*]/g, "").trim();
    }

    const nextAction = pState?.next_action || pState?.resume_point || pState?.phase || "Progreso de las tareas prioritarias del roadmap";
    const definition = pState?.definition || "Plataforma soberana bajo metodología MLabs con ciclo de vida desacoplado y gobernanza inmutable.";
    const currentPhase = pState?.phase_summary || pState?.current_phase || pState?.phase || pState?.resume_point || "Fase de ejecución";
    const codeRepo = pState?.code_repo || "";
    const remoteUrl = pState?.remote_url || "";
    const gitBranch = pState?.git_branch || "";
    const gitCommit = pState?.git_commit || "";
    const gitCommitMsg = pState?.git_commit_msg || "";
    const gitCommitDate = pState?.git_commit_date || "";
    const readmeContent = pState?.readme_content || "";
    const readmePath = pState?.readme_path || "";

    return {
      name,
      rank: `#${idx + 1}`,
      status: "ACTIVE",
      readmeContent,
      readmePath,
      gitBranch,
      gitCommit,
      gitCommitMsg,
      gitCommitDate,
      progress,
      completedBlocks,
      totalBlocks,
      decisionsCount: decCount,
      nextAction,
      lastUpdated: rawLastUpdated || new Date().toISOString().slice(0, 10),
      integratedThrough: integratedThrough || `D${decCount || 1}`,
      currentPhase,
      definition,
      codeRepo,
      remoteUrl,
      file: pState ? pState.file : "",
      // ⛔ The fallback is the generic one `getProjectLab` already uses, and must stay
      // generic. A literal folder name from one operations centre hard-coded into the
      // public engine is the `interface:AX-1` breach this project exists to avoid — and
      // ⚠️ the release gate CANNOT see it unless that word is on the instance's denylist,
      // which is why the list is derived from disk (`tools/denylist-coverage.sh`) rather
      // than remembered.
      icon: pState?.icon || null,
      lab: pState?.lab || (pState ? getProjectLab(pState) : "Workspaces"),
      workflow
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
        <span class="front-title">Sin frente activo en COMPASS</span>
      `;
    }
  }

  // Update Sidebar Badges
  const badgeProjects = document.getElementById("badgeProjects");
  if (badgeProjects) badgeProjects.textContent = STATE.projects.length;

  const badgeMailbox = document.getElementById("badgeMailbox");
  if (badgeMailbox) {
    const open = (STATE.mailbox || []).filter(e => ["open", "pending"].includes(e.state)).length;
    badgeMailbox.textContent = open;
    badgeMailbox.classList.toggle("warn-badge", open > 0);
  }
  const badgeInbox = document.getElementById("badgeInbox");
  if (badgeInbox) {
    const activeTasks = STATE.tasks.filter(t => ["⬜", "🔨", "⛔", "🔴"].includes(t.status)).length;
    badgeInbox.textContent = activeTasks;
  }

  const badgeIdeas = document.getElementById("badgeIdeas");
  if (badgeIdeas) badgeIdeas.textContent = STATE.ideas.length;

  const badgeDecisions = document.getElementById("badgeDecisions");
  if (badgeDecisions) badgeDecisions.textContent = liveDecisions().length;

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
// VIEW ROUTER & PERSISTENCE (URL HASH + LOCAL STORAGE)
// ─────────────────────────────────────────────────────────────────────────────

function syncUrlHash() {
  if (!STATE.loaded) return;
  let hash = "";
  const view = STATE.currentView || "overview";

  if (view === "project-detail") {
    const proj = encodeURIComponent(STATE.selectedProject || "");
    const tab = encodeURIComponent(STATE.projectSubtab || "workflow");
    hash = `#/project/${proj}/${tab}`;
    const activeDoc = STATE.guideActiveDoc && STATE.selectedProject ? STATE.guideActiveDoc[STATE.selectedProject] : null;
    if (tab === "guide" && activeDoc) {
      hash += `?doc=${encodeURIComponent(activeDoc)}`;
    }
  } else if (view === "skill") {
    hash = `#/skill/${encodeURIComponent(STATE.skillOpen?.name || "")}`;
  } else if (view === "clause") {
    hash = `#/clause/${encodeURIComponent(STATE.clauseId || "")}`;
  } else if (view === "doc") {
    hash = `#/doc/${encodeURIComponent(STATE.docId || "")}`;
  } else if (view === "desk") {
    hash = `#/desk/${encodeURIComponent(STATE.deskCardId || "")}`;
  } else if (view === "cockpit") {
    // ⚠️ Guardaba `front=` y `filter=` del cockpit, que ya no lee nadie. Ahora guarda los
    // filtros que la Oficina usa de verdad, así que un recargado no te devuelve al mural
    // entero cuando estabas mirando un proyecto.
    hash = `#/cockpit`;
    const params = [];
    if (STATE.officeFilterProj && STATE.officeFilterProj !== "ALL") {
      params.push(`proyecto=${encodeURIComponent(STATE.officeFilterProj)}`);
    }
    if (STATE.officeFilterState && STATE.officeFilterState !== "ALL") {
      params.push(`estado=${encodeURIComponent(STATE.officeFilterState)}`);
    }
    if (params.length) hash += `?${params.join("&")}`;
  } else if (view === "cheatsheet") {
    hash = `#/cheatsheet`;
    if (STATE.activeCsTab && STATE.activeCsTab !== "session") {
      hash += `?tab=${encodeURIComponent(STATE.activeCsTab)}`;
    }
  } else if (view === "skills") {
    hash = `#/skills`;
    if (STATE.skillFilterType && STATE.skillFilterType !== "ALL") {
      hash += `?filter=${encodeURIComponent(STATE.skillFilterType)}`;
    }
  } else if (view === "decisions") {
    hash = `#/decisions`;
    if (STATE.decFilterProj) {
      hash += `?project=${encodeURIComponent(STATE.decFilterProj)}`;
    }
  } else if (view === "inbox") {
    hash = `#/inbox`;
    if (STATE.selectedTaskFilter && STATE.selectedTaskFilter !== "ALL") {
      hash += `?filter=${encodeURIComponent(STATE.selectedTaskFilter)}`;
    }
  } else {
    hash = `#/${view}`;
  }

  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
  try {
    localStorage.setItem("nexus_last_route", hash);
  } catch (e) {}
}

function restoreRouteFromUrl() {
  let hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") {
    try {
      const saved = localStorage.getItem("nexus_last_route");
      if (saved && saved.startsWith("#/")) {
        hash = saved;
      }
    } catch (e) {}
  }
  if (!hash || hash === "#" || hash === "#/") {
    hash = "#/overview";
  }

  const [pathPart, queryPart] = hash.replace(/^#\/?/, "").split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(queryPart || "");

  const mainView = segments[0] || "overview";

  if (mainView === "project" || mainView === "project-detail") {
    STATE.currentView = "project-detail";
    if (segments[1]) {
      STATE.selectedProject = decodeURIComponent(segments[1]);
    }
    if (segments[2]) {
      STATE.projectSubtab = decodeURIComponent(segments[2]);
    }
    if (params.has("doc") && STATE.selectedProject) {
      STATE.guideActiveDoc = STATE.guideActiveDoc || {};
      STATE.guideActiveDoc[STATE.selectedProject] = decodeURIComponent(params.get("doc"));
    }
  } else if (mainView === "skill" && segments[1]) {
    // ⚠️ Restaurar esta ruta no es sólo fijar la vista: su contenido se pide al servidor,
    // así que hay que relanzar la petición o la página queda en blanco tras una recarga.
    const n = decodeURIComponent(segments[1]);
    STATE.currentView = "skill";
    if (!STATE.skillOpen || STATE.skillOpen.name !== n) {
      STATE.skillOpen = { name: n, loading: true };
      setTimeout(() => window.openSkill(n), 0);
    }
  } else if (mainView === "clause") {
    STATE.currentView = "clause";
    if (segments[1]) STATE.clauseId = decodeURIComponent(segments[1]);
  } else if (mainView === "doc") {
    STATE.currentView = "doc";
    if (segments[1]) STATE.docId = decodeURIComponent(segments[1]);
  } else if (mainView === "desk") {
    STATE.currentView = "desk";
    if (segments[1]) STATE.deskCardId = decodeURIComponent(segments[1]);
  } else if (mainView === "cockpit") {
    STATE.currentView = "cockpit";
    if (params.has("proyecto")) STATE.officeFilterProj = decodeURIComponent(params.get("proyecto"));
    if (params.has("estado")) STATE.officeFilterState = decodeURIComponent(params.get("estado"));
  } else if (mainView === "cheatsheet") {
    STATE.currentView = "cheatsheet";
    if (params.has("tab")) {
      STATE.activeCsTab = decodeURIComponent(params.get("tab"));
    }
  } else if (mainView === "skills") {
    STATE.currentView = "skills";
    if (params.has("filter")) {
      STATE.skillFilterType = decodeURIComponent(params.get("filter"));
    }
  } else if (mainView === "decisions") {
    STATE.currentView = "decisions";
    if (params.has("project")) {
      STATE.decFilterProj = decodeURIComponent(params.get("project"));
    }
  } else if (mainView === "inbox") {
    STATE.currentView = "inbox";
    if (params.has("filter")) {
      STATE.selectedTaskFilter = decodeURIComponent(params.get("filter"));
    }
  } else if (["overview", "projects", "ideas"].includes(mainView)) {
    STATE.currentView = mainView;
  }

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === STATE.currentView);
  });
}

window.addEventListener("hashchange", () => {
  if (STATE.loaded) {
    restoreRouteFromUrl();
    renderView();
  }
});

window.addEventListener("popstate", () => {
  if (STATE.loaded) {
    restoreRouteFromUrl();
    renderView();
  }
});

window.navigateTo = function(viewName) {
  STATE.currentView = viewName;
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
  });
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
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

// ⚠️ `summarise` returns a pair, not a string — interpolating it gives `[object Object]`,
// which is what every card on the first office build showed. This is the string form, for
// the places that cannot open (a card whose whole surface is already a link).
function cut(text, max = 110) {
  const { head, rest } = summarise(text, max);
  return inline(head) + (rest ? "…" : "");
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


// Counts exclude the sealed mirror by field. A frozen copy is a declared photograph
// (AX-20), so it belongs behind a toggle in the list and in no headline — 274 against
// a real 172 is a 59% overstatement on the metric the page exists to show.
function liveDecisions() {
  return (STATE.decisions || []).filter(d => !d.frozen);
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
    const red = STATE.errorKind !== "vista";
    main.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>${red ? "No se pudo hablar con el servidor"
                  : `La vista <code>${esc(STATE.errorWhere || "")}</code> falló al pintarse`}</h3>
        <p>${esc(STATE.error)}</p>
        ${red ? `<p class="error-hint">El modelo no llegó. Comprueba que <code>server.py</code>
                   sigue en pie y que el adaptador apunta a donde crees.</p>`
              : `<p class="error-hint">El modelo llegó bien: el fallo es del código de la vista,
                   no de la red ni del adaptador.</p>
                 ${STATE.errorStack ? `<pre class="error-stack">${esc(STATE.errorStack)}</pre>` : ""}`}
        <button class="btn-retry" onclick="window.retryLoad()">Reintentar</button>
      </div>
    `;
    return;
  }

  switch (STATE.currentView) {
    case "overview": renderOverview(main); break;
    case "projects": renderProjectsHub(main); break;
    case "project-detail": renderProjectDetailPage(main); break;
    case "cockpit": renderOffice(main); break;
    case "desk": renderDesk(main); break;
    case "clause": renderClause(main); break;
    case "doc": renderDoc(main); break;
    case "dashboard": renderDashboard(main); break;
    case "skill": renderSkillPage(main); break;
    case "cheatsheet": renderCheatSheet(main); break;
    case "inbox": renderInbox(main); break;
    case "ideas": renderIdeas(main); break;
    case "decisions": renderDecisions(main); break;
    case "skills": renderSkills(main); break;
    default: renderOverview(main); break;
  }

  syncUrlHash();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW & ARCHITECTURE VIEW (Chuleta Garnatxa Editorial Design)
// ─────────────────────────────────────────────────────────────────────────────
function renderOverview(container) {
  const activeWf = STATE.selectedWorkflowTab || "project";
  const isCollapsed = (id) => Boolean(STATE.collapsedSections && STATE.collapsedSections[id]);
  const ax = D().axioms, cl = D().clauses;

  container.innerHTML = `
    <div class="overview-container">
      <!-- EL PROPILEO: la puerta -->
      <header class="propylaea">
        <div class="propylaea-fluting" aria-hidden="true"></div>
        <div class="propylaea-inner">
          <div class="kicker">ΜΗΧΑΝΗ · MLabs & NEXUS</div>
          <h1>MLabs <span class="accent">&amp; NEXUS</span></h1>
          <p class="header-lead">
            <strong>MLabs es la constitución. La centralita de operaciones es el país.</strong><br>
            Aquí están las reglas; el trabajo y su registro entero viven allí. Un agente que sólo
            haya leído MLabs conoce todas las reglas y nada de lo que ha pasado nunca.
          </p>
          <div class="specs">
            <span class="spec-pill" onclick="openClause('PH-0')"><strong>🏛️ Cláusulas:</strong> ${cl.length || "—"}</span>
            <span class="spec-pill" onclick="navigateTo('dashboard')"><strong>⚖️ Axiomas:</strong> ${ax.length || "—"}</span>
            <span class="spec-pill" onclick="navigateTo('skills')"><strong>🏺 Skills:</strong> ${STATE.skills.length}</span>
            <span class="spec-pill" onclick="navigateTo('projects')"><strong>🚀 Proyectos:</strong> ${STATE.projects.length}</span>
            <span class="spec-pill" onclick="navigateTo('inbox')"><strong>📬 Buzón:</strong> ${(STATE.mailbox || []).filter(e => ["open","pending"].includes(e.state)).length} sin cerrar</span>
            <span class="spec-pill active-pill" onclick="navigateTo('cockpit')"><strong>▶ Frente activo:</strong> ${STATE.activeFront ? esc(cutText(STATE.activeFront.name, 34)) : "ninguno"}</span>
          </div>
        </div>
      </header>

      <nav class="toc-bar">
        <button class="toc-pill" onclick="jumpToSection('sec-governance')"><span>🏛️</span> 01 · El templo</button>
        <button class="toc-pill" onclick="jumpToSection('sec-levels')"><span>🪜</span> 02 · Los tres niveles</button>
        <button class="toc-pill" onclick="jumpToSection('sec-structure')"><span>📜</span> 03 · Los ficheros troncales</button>
        <button class="toc-pill" onclick="jumpToSection('sec-routing')"><span>🧭</span> 04 · ¿Dónde va esto?</button>
        <button class="toc-pill" onclick="jumpToSection('sec-workflows')"><span>🔄</span> 05 · Los flujos</button>
        <button class="toc-pill" onclick="jumpToSection('sec-ecosystem')"><span>🗺️</span> 06 · El ecosistema</button>
      </nav>

      <!-- 01 · EL TEMPLO -->
      <section class="doc-section" id="sec-governance">
        <div class="section-head" onclick="toggleOverviewSection('sec-governance')">
          <h2><span class="num">01</span> <span class="sec-greek">ΝΑΟΣ</span> El templo — para qué existe la empresa</h2>
          <button class="section-toggle">${isCollapsed("sec-governance") ? "▶ Desplegar" : "▼ Plegar"}</button>
        </div>
        <div class="section-body ${isCollapsed("sec-governance") ? "collapsed" : ""}">
          <p class="section-lead">
            <code>PH-0</code> es el objetivo y sostiene el frontón; las seis columnas son las
            <strong>maneras concretas de perderlo</strong>, cada una cerrada por su cláusula.
            Pulsa una columna para leerla entera con los axiomas que la sirven.
            <strong>Todo esto se lee de <code>PHILOSOPHY.md</code> y <code>AXIOMS.md</code>; la
            página no guarda copia.</strong>
          </p>
          ${renderPediment()}
          ${renderRefusals()}
        </div>
      </section>

      <!-- 02 · LOS TRES NIVELES -->
      <section class="doc-section" id="sec-levels">
        <div class="section-head" onclick="toggleOverviewSection('sec-levels')">
          <h2><span class="num">02</span> <span class="sec-greek">ΒΑΘΜΟΙ</span> Los tres niveles, y nada puede difuminarlos</h2>
          <button class="section-toggle">${isCollapsed("sec-levels") ? "▶ Desplegar" : "▼ Plegar"}</button>
        </div>
        <div class="section-body ${isCollapsed("sec-levels") ? "collapsed" : ""}">
          ${renderEntablature()}
        </div>
      </section>

      <!-- 03 · LOS FICHEROS TRONCALES -->
      ${renderStructuralFiles(isCollapsed("sec-structure"))}

      <!-- 04 · LA TABLA DE ENRUTADO -->
      ${renderRouting(isCollapsed("sec-routing"))}

      <!-- 05 · LOS FLUJOS -->
      <section class="doc-section" id="sec-workflows">
        <div class="section-head" onclick="toggleOverviewSection('sec-workflows')">
          <h2><span class="num">05</span> <span class="sec-greek">ΕΡΓΑ</span> Los cinco flujos de trabajo</h2>
          <button class="section-toggle">${isCollapsed("sec-workflows") ? "▶ Desplegar" : "▼ Plegar"}</button>
        </div>
        <div class="section-body ${isCollapsed("sec-workflows") ? "collapsed" : ""}">
          <p class="section-lead">
            ⚠️ <strong>Esto es una lectura del método, no el método.</strong> A diferencia de todo
            lo anterior, estos cinco flujos no salen de ningún fichero: son una interpretación
            escrita a mano y pueden derivar. Lo que manda es
            <button class="inline-link" onclick="openDoc('METHOD')">METHOD.md</button>.
          </p>
          <div class="wf-tabs">
            <button class="wf-tab ${activeWf === 'project' ? 'active' : ''}" onclick="setWorkflowTab('project')">🚀 1. Trabajar en Proyecto</button>
            <button class="wf-tab ${activeWf === 'environment' ? 'active' : ''}" onclick="setWorkflowTab('environment')">🛠️ 2. Mejorar Entorno</button>
            <button class="wf-tab ${activeWf === 'knowledge' ? 'active' : ''}" onclick="setWorkflowTab('knowledge')">📚 3. Añadir Temario</button>
            <button class="wf-tab ${activeWf === 'cartridge' ? 'active' : ''}" onclick="setWorkflowTab('cartridge')">🏗️ 4. Crear / Redefinir</button>
            <button class="wf-tab ${activeWf === 'coursework' ? 'active' : ''}" onclick="setWorkflowTab('coursework')">🎓 5. Formación & Corrección</button>
          </div>
          ${renderWorkflowDetail(activeWf)}
        </div>
      </section>

      <!-- 06 · EL ECOSISTEMA -->
      <section class="doc-section" id="sec-ecosystem">
        <div class="section-head" onclick="toggleOverviewSection('sec-ecosystem')">
          <h2><span class="num">06</span> <span class="sec-greek">ΑΓΟΡΑ</span> El ecosistema — dónde se trabaja</h2>
          <button class="section-toggle">${isCollapsed("sec-ecosystem") ? "▶ Desplegar" : "▼ Plegar"}</button>
        </div>
        <div class="section-body ${isCollapsed("sec-ecosystem") ? "collapsed" : ""}">
          <div class="eco-grid">
            ${[
              ["cockpit", "🗂️", "Oficina", "El mural de todo lo que hay abierto. Una tarjeta por tarea; se clica y se entra en su despacho.", `${officeCards().length} tarjetas`],
              ["inbox", "📬", "Buzón & Tareas", "Las dos colas, corriendo en direcciones opuestas. Ninguna vacía la suya.", `${(STATE.mailbox||[]).length} cartas · ${STATE.tasks.length} tareas`],
              ["dashboard", "📐", "Dashboard", "Lo que se mide y lo que todavía no. Cada medida con su denominador y su fuente.", "PH-6"],
              ["skills", "🏺", "Ágora", "Las skills, agrupadas por cómo las alcanza el modelo.", `${STATE.skills.length} skills`],
              ["projects", "🚀", "Projects Hub", "Cada proyecto, un cartucho soberano con su propio ciclo de vida.", `${STATE.projects.length} proyectos`],
              ["decisions", "📜", "Decision Log", "El registro que sólo crece: quién, cuándo, por qué, y qué se descartó.", `${liveDecisions().length} vivas`],
              ["ideas", "💡", "Idea Park", "Lo interesante sin compromiso. Una línea mientras está fresca.", `${STATE.ideas.length} ideas`],
              ["cheatsheet", "📖", "CheatSheet", "Los comandos, listos para copiar.", "⭐"]
            ].map(([view, icon, title, desc, tag]) => `
              <div class="eco-card-doc" onclick="navigateTo('${view}')">
                <div class="eco-card-head"><span class="eco-icon">${icon}</span><h3>${title}</h3></div>
                <p>${desc}</p>
                <div class="eco-foot"><span class="eco-tag">${esc(tag)}</span><span class="eco-link">abrir →</span></div>
              </div>`).join("")}
          </div>
        </div>
      </section>
    </div>
  `;
}

// ── 02 · el entablamento: los tres niveles, uno encima de otro ───────────────
function renderEntablature() {
  const ax = D().axioms, cl = D().clauses;
  const runnable = ax.filter(a => a.check_state === "$").length;
  const levels = [
    { n: 1, greek: "ΛΟΓΟΣ", tone: "tone-gold", band: "cornisa",
      title: "Filosofía", file: "PHILOSOPHY.md",
      what: "Para qué existe la empresa y qué rechaza. <strong>Rompe todo empate</strong>: cuando dos axiomas chocan decide la cláusula que sirven, y cuando chocan dos cláusulas decide <code>PH-0</code>.",
      who: "Cambia casi nunca, y sólo el operador. Ningún rol puede enmendarla — la señal va al operador y muere ahí si no la recoge.",
      count: `${cl.length || "—"} cláusulas`,
      go: `openClause('PH-0')`, goLabel: "abrir el frontón →" },
    { n: 2, greek: "ΝΟΜΟΣ", tone: "tone-aegean", band: "friso",
      title: "Axiomas", file: "AXIOMS.md",
      what: "Las reglas que la implementan y no se violan nunca. Una fila es una regla completa en sí misma; si no cabe en dos frases, son dos axiomas o es una decisión.",
      who: "Los auditores comprueban, nunca editan. I+D propone. El operador decide.",
      count: `${ax.length || "—"} axiomas · ${runnable} con check que corre`,
      go: `navigateTo('dashboard')`, goLabel: "ver cuánto se hacen cumplir →" },
    { n: 3, greek: "ΠΡΑΞΙΣ", tone: "tone-grape", band: "arquitrabe",
      title: "Decisiones", file: "la centralita, nunca aquí",
      what: "Concretas, con autor, fecha y razonamiento — <strong>y con lo que se descartó</strong>, que es la parte que no deja rastro en ningún otro sitio si nadie la escribe.",
      who: "Se toman trabajando. Se escriben en el momento: una decisión sin escribir vuelve como debate abierto.",
      count: `${liveDecisions().length} vivas`,
      go: `navigateTo('decisions')`, goLabel: "abrir el registro →" }
  ];
  return `
    <p class="section-lead">
      Y <strong>los mismos tres se repiten un piso más abajo dentro de cada proyecto</strong>,
      con su propio auditor, sus propios axiomas y su propio log. Lo que separa los niveles no es
      la importancia sino <em>quién puede cambiarlos y con qué</em>.
    </p>
    <div class="entablature">
      ${levels.map(l => `
        <button class="entab-band ${l.tone}" onclick="${l.go}">
          <span class="entab-rank">
            <span class="entab-greek">${l.greek}</span>
            <span class="entab-n">${l.n}</span>
            <span class="entab-band-name">${l.band}</span>
          </span>
          <span class="entab-main">
            <span class="entab-title">${l.title}
              <code class="entab-file">${esc(l.file)}</code>
            </span>
            <span class="entab-what">${l.what}</span>
            <span class="entab-who">${l.who}</span>
          </span>
          <span class="entab-side">
            <span class="entab-count">${esc(l.count)}</span>
            <span class="entab-go">${l.goLabel}</span>
          </span>
        </button>`).join("")}
      <div class="entab-stylobate">
        <span>Y debajo de todo, el trabajo: proyectos, tareas y planes — que es lo que la
              centralita guarda y este repositorio nunca ve.</span>
      </div>
    </div>`;
}

// ── 04 · la tabla de enrutado, leída de METHOD.md §7 ─────────────────────────
function renderRouting(collapsed) {
  const sec = docSection("METHOD", "7. Routing table");
  const { header, rows } = mdTable(sec);
  // La coda del §7 es una regla, no un pie de tabla, y ocupa un párrafo entero: cogerla
  // línea a línea la cortaba a mitad de frase — «Redefine the» y ahí se acababa.
  let coda = "";
  const at = sec.findIndex(l => l.trim().startsWith("**If something fits nowhere"));
  if (at >= 0) {
    const out = [];
    for (let i = at; i < sec.length && sec[i].trim(); i++) out.push(sec[i].trim());
    coda = out.join(" ");
  }
  const q = (STATE.routingQuery || "").toLowerCase().trim();
  const shown = q ? rows.filter(r => r.join(" ").toLowerCase().includes(q)) : rows;

  return `
    <section class="doc-section" id="sec-routing">
      <div class="section-head" onclick="toggleOverviewSection('sec-routing')">
        <h2><span class="num">04</span> <span class="sec-greek">ΟΔΟΣ</span> Tengo esto, ¿dónde va?</h2>
        <button class="section-toggle">${collapsed ? "▶ Desplegar" : "▼ Plegar"}</button>
      </div>
      <div class="section-body ${collapsed ? "collapsed" : ""}">
        ${rows.length ? `
          <p class="section-lead">
            La tabla de enrutado del método, <strong>leída de <code>METHOD.md</code> §7 en vivo</strong>.
            Es la pregunta que más veces se hace al día, así que vive en la portada y no en un manual.
          </p>
          <div class="routing-search">
            <input type="text" class="custom-input" placeholder="Filtrar: decisión, hallazgo, regla, idea, tarea…"
                   value="${esc(STATE.routingQuery || "")}" oninput="setRoutingQuery(this.value)">
            <span class="routing-count">${shown.length} de ${rows.length}</span>
          </div>
          <div class="routing-table">
            <div class="routing-head">
              <span>${esc(header ? header[0] : "Lo que tienes")}</span>
              <span>${esc(header ? header[1] : "Dónde va")}</span>
            </div>
            ${shown.length ? shown.map(r => `
              <div class="routing-row">
                <span class="routing-have">${inline(r[0])}</span>
                <span class="routing-goes">${inline(r[1])}</span>
              </div>`).join("") : `
              <div class="routing-row routing-none">
                <span>Nada encaja con «${esc(STATE.routingQuery || "")}».</span>
                <span>Y si algo no encaja en ninguna fila, <strong>lo que está mal es la
                      estructura, no el elemento</strong>.</span>
              </div>`}
          </div>
          ${coda ? `<div class="callout callout-danger"><span class="callout-icon">⛔</span>
            <div class="callout-content">${inline(coda)}</div></div>` : ""}
        ` : `
          <div class="empty-state"><div class="empty-icon">🧭</div>
            <h3>La tabla de enrutado no ha cargado</h3>
            <p>Sale de <code>METHOD.md</code> §7. Si el fichero no está en la raíz del motor,
               esta sección se queda vacía en vez de inventarse una tabla.</p></div>`}
      </div>
    </section>`;
}

window.setRoutingQuery = function (v) {
  STATE.routingQuery = v;
  const box = document.querySelector("#sec-routing .routing-table");
  const cnt = document.querySelector("#sec-routing .routing-count");
  if (!box) return renderView();
  // ⚠️ Se repinta sólo la tabla: un `renderView()` completo por cada tecla pierde el foco
  // del campo y el cursor salta al principio, que es la manera clásica de hacer un
  // buscador inservible.
  const { rows } = mdTable(docSection("METHOD", "7. Routing table"));
  const q = v.toLowerCase().trim();
  const shown = q ? rows.filter(r => r.join(" ").toLowerCase().includes(q)) : rows;
  if (cnt) cnt.textContent = `${shown.length} de ${rows.length}`;
  box.querySelectorAll(".routing-row").forEach(el => el.remove());
  box.insertAdjacentHTML("beforeend", shown.length ? shown.map(r => `
    <div class="routing-row">
      <span class="routing-have">${inline(r[0])}</span>
      <span class="routing-goes">${inline(r[1])}</span>
    </div>`).join("") : `
    <div class="routing-row routing-none">
      <span>Nada encaja con «${esc(v)}».</span>
      <span>Y si algo no encaja en ninguna fila, <strong>lo que está mal es la estructura,
            no el elemento</strong>.</span>
    </div>`);
};

// WORKFLOW DETAILS RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function renderWorkflowDetail(type) {
  switch (type) {
    case "environment":
      return `
        <div class="workflow-detail-card">
          <p class="lead" style="margin-bottom: 14px;">
            <strong>Objetivo:</strong> Auditar, refinar y evolucionar la metodología y los axiomas de la empresa sin derivar en dogma ni degradar el contexto.
          </p>

          <div class="wf-stepper">
            <div class="wf-node">
              <span class="wf-node-step">1</span>
              <div class="wf-node-title">Detección de Tensión</div>
              <p class="wf-node-desc">Se detecta una contradicción en logs, desacoplamiento o residuo en MAILBOX.md.</p>
              <span class="card-badge" style="margin-top:auto; align-self:flex-start;">MAILBOX.md</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">2</span>
              <div class="wf-node-title">Pensamiento Lateral</div>
              <p class="wf-node-desc">Explora 3 a 5 ángulos no examinados y costea honestamente cada trade-off.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('rnd')">⚡ Skill: rnd</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">3</span>
              <div class="wf-node-title">Auditoría Estructural</div>
              <p class="wf-node-desc">Verifica que ningún axioma se viole y comprueba la alineación con la filosofía.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('company-auditor')">⚡ company-auditor</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">4</span>
              <div class="wf-node-title">Promoción Append-Only</div>
              <p class="wf-node-desc">Si se aprueba, se añade el nuevo axioma AX-x o se registra la decisión M-xxx.</p>
              <span class="card-badge badge-gold" style="margin-top:auto; align-self:flex-start;">AXIOMS.md</span>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> Un axioma retirado <strong>sale del fichero entero</strong> y el log
            registra a dónde fue: el hueco en la numeración es la traza (<code>AX-31</code>). Lo append-only
            son los <em>Records</em> — logs, ledger y decisiones —, no los documentos Standing, que se
            reescriben para seguir siendo verdad.
          </div>
        </div>
      `;

    case "knowledge":
      return `
        <div class="workflow-detail-card">
          <p class="lead" style="margin-bottom: 14px;">
            <strong>Objetivo:</strong> Ingerir y modularizar nueva teoría externa o <strong>destilar los aprendizajes técnicos generados en los propios proyectos</strong> hacia la base de conocimiento permanente.
          </p>

          <div class="wf-stepper">
            <div class="wf-node">
              <span class="wf-node-step">1</span>
              <div class="wf-node-title">Ingestión / Fuente</div>
              <p class="wf-node-desc">Documentación externa, paper o lecciones técnicas extraídas de un bloque de proyecto.</p>
              <span class="card-badge" style="margin-top:auto; align-self:flex-start;">Proyecto / Paper</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">2</span>
              <div class="wf-node-title">Estructuración Modular</div>
              <p class="wf-node-desc">Define el árbol temático y descompone el temario en módulos interconectados antes de redactar.</p>
              <span class="card-badge badge-grape" style="margin-top:auto; align-self:flex-start;">💡 estructurar-temario</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">3</span>
              <div class="wf-node-title">Creación Atómica</div>
              <p class="wf-node-desc">Redacta e inserta cada nota atómica sobre la estructura previa del árbol temático.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('create-note')">⚡ Skill: create-note</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">4</span>
              <div class="wf-node-title">Auditoría & Coherencia</div>
              <p class="wf-node-desc">Comprueba la integridad de wikilinks, actualiza los índices del dominio y verifica coherencia.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('instance-auditor')">⚡ instance-auditor</button>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> Estructurar primero, sobre fronteras dibujadas por dueño y no por temática
            (<code>PH-1</code>); y auditar coherencia y wikilinks antes de dar por cerrado, porque cada afirmación
            arrastra su evidencia (<code>PH-4</code>).
          </div>
        </div>
      `;

    case "cartridge":
      return `
        <div class="workflow-detail-card">
          <p class="lead" style="margin-bottom: 14px;">
            <strong>Objetivo:</strong> Inicializar un nuevo cartridge de proyecto soberano o redefinir su definición y estado cuando la realidad del trabajo haya variado.
          </p>

          <div class="wf-stepper">
            <div class="wf-node">
              <span class="wf-node-step">1</span>
              <div class="wf-node-title">Génesis del Cartridge</div>
              <p class="wf-node-desc">Crea definición, axiomas locales, log de decisiones, estado y fila en el compass.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('structure-project')">⚡ structure-project</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">2</span>
              <div class="wf-node-title">Detección de Deriva</div>
              <p class="wf-node-desc">El trabajo se anticipa al plan o los bloques ya no reflejan la realidad.</p>
              <span class="card-badge badge-rust" style="margin-top:auto; align-self:flex-start;">state.md desincronizado</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">3</span>
              <div class="wf-node-title">Redefinición Quirúrgica</div>
              <p class="wf-node-desc">Reescribe definition.md y state.md y añade una decisión sin tocar otros proyectos.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('redefine-project')">⚡ redefine-project</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">4</span>
              <div class="wf-node-title">Soberanía de Estado</div>
              <p class="wf-node-desc">El proyecto queda listo para ejecutar su siguiente bloque B_n en tiempo real.</p>
              <span class="card-badge badge-vine" style="margin-top:auto; align-self:flex-start;">state.md actualizado</span>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> Cada proyecto es un repositorio soberano; jamás se acoplan por temática (PH-1).
          </div>
        </div>
      `;

    case "coursework":
      return `
        <div class="workflow-detail-card">
          <p class="lead" style="margin-bottom: 14px;">
            <strong>Objetivo:</strong> Abordar problemas, asignaciones o coursework académico asegurando el entendimiento completo del operador (PH-2) antes de entregar.
          </p>

          <div class="wf-stepper">
            <div class="wf-node">
              <span class="wf-node-step">1</span>
              <div class="wf-node-title">Enunciado & Guía</div>
              <p class="wf-node-desc">Analiza el problema y genera una guía estructurada de resolución y razonamiento.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('learn')">⚡ Skill: learn</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">2</span>
              <div class="wf-node-title">Ejecución Consciente</div>
              <p class="wf-node-desc">Se implementa la solución paso a paso asegurando que el operador asimila cada concepto.</p>
              <span class="card-badge badge-grape" style="margin-top:auto; align-self:flex-start;">💡 crear-guia</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">3</span>
              <div class="wf-node-title">Corrección Multinivel</div>
              <p class="wf-node-desc">Revisión exhaustiva de rigor matemático, robustez de código y calidad técnica.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('correct-exercise')">⚡ correct-exercise</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">4</span>
              <div class="wf-node-title">Consolidación</div>
              <p class="wf-node-desc">Se archiva el deliverable en 97_COURSEWORK y se destila la teoría relevante.</p>
              <span class="card-badge badge-vine" style="margin-top:auto; align-self:flex-start;">97_COURSEWORK/</span>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> El entendimiento prevalece sobre la velocidad; cero soluciones no asimiladas (PH-2).
          </div>
        </div>
      `;

    case "project":
    default:
      return `
        <div class="workflow-detail-card">
          <p class="lead" style="margin-bottom: 14px;">
            <strong>Objetivo:</strong> Ejecutar trabajo real en cualquier cartridge de proyecto con preparación de tareas, brújula COMPASS, plan numérico en vuelo y auditoría de cierre.
          </p>

          <div class="wf-stepper">
            <div class="wf-node">
              <span class="wf-node-step">1</span>
              <div class="wf-node-title">Orientar (Compass)</div>
              <p class="wf-node-desc">Lee COMPASS.md y mailbox.md. Fija el único frente activo (▶).</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('open-session')">⚡ open-session</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">2</span>
              <div class="wf-node-title">Planificar en Vuelo</div>
              <p class="wf-node-desc">Construye el plan numérico del sub-bloque antes de tocar ningún archivo.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('current-plan')">⚡ current-plan</button>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">3</span>
              <div class="wf-node-title">Ejecutar Bloque B_n</div>
              <p class="wf-node-desc">Modifica código, datos y tests guiado por el hero de Next Action de state.md.</p>
              <span class="card-badge" style="margin-top:auto; align-self:flex-start;">state.md (B_n)</span>
            </div>
            <div class="wf-arrow">→</div>

            <div class="wf-node">
              <span class="wf-node-step">4</span>
              <div class="wf-node-title">Auditar & Cerrar</div>
              <p class="wf-node-desc">project-auditor valida el diff; se registran decisiones D_n y se actualiza state.md.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('project-auditor')">⚡ project-auditor</button>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> Toda tarea que cierra tacha su plan con destino obligatorio y audita antes de vaciar (METHOD §2).
          </div>
        </div>
      `;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW INTERACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
window.toggleOverviewSection = function(sectionId) {
  STATE.collapsedSections = STATE.collapsedSections || {};
  STATE.collapsedSections[sectionId] = !STATE.collapsedSections[sectionId];
  renderView();
};

window.setWorkflowTab = function(tabKey) {
  STATE.selectedWorkflowTab = tabKey;
  renderView();
};

window.jumpToSection = function(sectionId) {
  if (STATE.collapsedSections && STATE.collapsedSections[sectionId]) {
    STATE.collapsedSections[sectionId] = false;
    renderView();
  }
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// ⚠️ Buscaba `#skillSearchInput`, un id que el Ágora ya no tiene: el botón navegaba y
// luego no encontraba el campo, dejando la vista sin filtrar y sin decir nada. Un enlace a
// una skill concreta debe abrir esa skill, no dejar al lector buscándola en una lista.
window.openSkillInCatalog = function (skillName) {
  if ((STATE.skills || []).some(s => s.title === skillName)) return window.openSkill(skillName);
  // Si esa skill no está declarada por el adaptador, se va al Ágora con la búsqueda puesta
  // — que es lo más cerca que se puede llegar, y se ve por qué.
  STATE.skillSearch = skillName;
  navigateTo("skills");
};



// ─────────────────────────────────────────────────────────────────────────────
// 2. PROJECTS HUB & SOVEREIGN PROJECT DEDICATED WEBS
// ─────────────────────────────────────────────────────────────────────────────
function getProjectLab(p) {
  if (p.lab && p.lab !== "General") return p.lab;
  if (p.file) {
    const parts = p.file.replace(/\\/g, "/").split("/");
    const nIdx = parts.lastIndexOf("nexus");
    if (nIdx >= 2) {
      return parts[nIdx - 2];
    }
  }
  return "Workspaces";
}

function renderProjectsHub(container) {
  const selectedLab = STATE.selectedLabFilter || "ALL";

  const enrichedProjects = STATE.projects.map(p => ({
    ...p,
    lab: getProjectLab(p)
  }));

  const discoveredLabs = Array.from(new Set(enrichedProjects.map(p => p.lab).filter(Boolean))).sort();

  const filteredProjects = selectedLab === "ALL" 
    ? enrichedProjects 
    : enrichedProjects.filter(p => p.lab === selectedLab);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🚀</span> Projects Hub</h1>
        <p class="view-subtitle">Matriz de proyectos organizada por Laboratorios y Centros de Trabajo soberanos</p>
      </div>
    </div>

    <!-- LAB FILTER CHIPS -->
    <div class="skills-stats-hud" style="margin-bottom: 24px;">
      <div class="skill-stat-chip ${selectedLab === 'ALL' ? 'active' : ''}" onclick="updateLabFilter('ALL')">
        <span class="stat-count">${enrichedProjects.length}</span>
        <span class="stat-name">🏢 Todos los Laboratorios</span>
      </div>
      ${discoveredLabs.map(lab => {
        const labProjectsCount = enrichedProjects.filter(p => p.lab === lab).length;
        const icon = lab.toLowerCase().includes("proj") ? "💼" : "🔬";
        return `
          <div class="skill-stat-chip ${selectedLab === lab ? 'active' : ''}" onclick="updateLabFilter('${esc(lab)}')">
            <span class="stat-count">${labProjectsCount}</span>
            <span class="stat-name">${icon} ${esc(lab)}</span>
          </div>
        `;
      }).join("")}
    </div>

    <!-- LAB SECTIONS -->
    ${selectedLab === "ALL" ? discoveredLabs.map(lab => {
      const labProjects = enrichedProjects.filter(p => p.lab === lab);
      return renderLabSection(lab, labProjects);
    }).join("") : renderLabSection(selectedLab, filteredProjects)}
  `;
}

function renderLabSection(labName, projects) {
  // ⛔ Aquí se etiquetaba cada laboratorio con una de dos frases fijas, elegida según si su
  // nombre contenía «proj». Ninguna salía de ningún fichero: eran afirmaciones sobre el
  // dominio de trabajo de alguien, inventadas por la vista — y una de ellas nombraba una
  // disciplina científica concreta, incrustada en un motor que `interface:AX-1` obliga a ser
  // genérico. Una fuga que el gate sólo habría visto si esa palabra estuviera en la denylist
  // de la instancia, y las palabras que uno inventa no suelen estar en ella.
  //
  // Un laboratorio es una carpeta. Lo único que la vista sabe es su nombre, así que es lo
  // único que dice.
  const icon = "🏛️";
  const badgeLabel = "agrupación por carpeta";
  const badgeClass = "tag-pill";
  const totalDecs = projects.reduce((acc, p) => acc + (p.decisionsCount || 0), 0);

  return `
    <div class="lab-group-container">
      <div class="lab-group-header">
        <div class="lab-title-group">
          <span class="lab-icon-bubble">${icon}</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 class="lab-title">${esc(labName)}</h2>
              <span class="tag-pill ${badgeClass}">${esc(badgeLabel)}</span>
            </div>
            <p class="lab-subtitle">Los proyectos que viven bajo <code>${esc(labName)}</code>. El agrupamiento
            es el de las carpetas: la interfaz no sabe nada más sobre este laboratorio, y no lo inventa.</p>
          </div>
        </div>
        <div class="lab-stats-pills">
          <span class="tag-pill">${projects.length} proyectos</span>
          <span class="tag-pill">📜 ${totalDecs} decisiones</span>
        </div>
      </div>

      <div class="projects-matrix-grid">
        ${projects.map(p => `
          <div class="project-card" onclick="openProjectDetail('${esc(p.name)}')">
            <div class="card-top">
              <div class="project-name-group">
                <span class="project-rank">${esc(p.rank)}</span>
                <h3 class="project-name">${esc(p.name)}</h3>
              </div>
              <span class="status-chip ${p.status === 'ACTIVE' ? 'status-active' : 'status-paused'}">${esc(p.status)}</span>
            </div>

            <p class="project-card-def-snippet">
              ${inline(p.definition)}
            </p>

            ${p.progress === null ? `
              <div class="progress-section progress-none"
                   title="El state.md de este proyecto no declara bloques. Una barra aquí sería un número inventado.">
                <span>Bloques — <strong>sin declarar</strong> en su <code>state.md</code></span>
              </div>` : `
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Progreso de bloques</span>
                  <strong>${p.completedBlocks}/${p.totalBlocks} (${p.progress}%)</strong>
                </div>
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
                </div>
              </div>`}

            <div class="card-meta-row">
              <span class="meta-item">📜 ${p.decisionsCount} decisiones</span>
              <span class="meta-item">⚖️ Cartridge Soberano</span>
              <span class="card-footer-action-inline">Explorar →</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOVEREIGN PROJECT DEDICATED PAGE
// ─────────────────────────────────────────────────────────────────────────────

function getRemoteHttpUrl(remote) {
  if (!remote) return "";
  let url = String(remote).trim();
  if (url.startsWith("git@github.com:")) {
    url = "https://github.com/" + url.slice("git@github.com:".length);
  }
  if (url.endsWith(".git")) {
    url = url.slice(0, -4);
  }
  return url.startsWith("http") ? url : "";
}

window.toggleRepoDropdown = function(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const menu = document.getElementById("repoDropdownMenu");
  const btn = document.querySelector(".repo-dropdown-btn");
  if (!menu) return;
  const isShowing = menu.classList.contains("show");
  if (isShowing) {
    menu.classList.remove("show");
    btn?.classList.remove("active");
  } else {
    menu.classList.add("show");
    btn?.classList.add("active");
  }
};

document.addEventListener("click", (e) => {
  const wrapper = document.getElementById("repoDropdownWrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    const menu = document.getElementById("repoDropdownMenu");
    const btn = document.querySelector(".repo-dropdown-btn");
    menu?.classList.remove("show");
    btn?.classList.remove("active");
  }
});

function renderProjectDetailPage(container) {
  const projName = STATE.selectedProject || (STATE.projects[0] ? STATE.projects[0].name : "");
  const proj = STATE.projects.find(p => p.name === projName) || STATE.projects[0];

  if (!proj) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Proyecto no encontrado</h3>
        <p>Selecciona un proyecto desde el Projects Hub.</p>
        <button class="btn-hud-action" onclick="navigateTo('projects')">Volver a Projects Hub</button>
      </div>
    `;
    return;
  }

  const labName = getProjectLab(proj);
  const isPersonal = labName.toLowerCase().includes("proj");
  const icon = isPersonal ? "💼" : "🔬";
  const activeTab = STATE.projectSubtab || "workflow";

  const projectTasks = STATE.tasks.filter(t => t.project === proj.name || t.project.startsWith(proj.name));
  const activeTasks = projectTasks.filter(t => ["⬜", "🔨", "⛔", "🔴"].includes(t.status));
  const projectDecs = STATE.decisions.filter(d => d.project === proj.name);
  const liveDecs = projectDecs.filter(d => !d.isSuperseded);

  container.innerHTML = `
    <!-- BREADCRUMB & TOP NAV -->
    <div class="proj-page-breadcrumb-bar">
      <button class="btn-back-hub" onclick="navigateTo('projects')">
        <span>←</span> <span>Volver a Projects Hub</span>
      </button>
      <div class="proj-breadcrumb-path">
        <span>Projects Hub</span> / <span>${esc(labName)}</span> / <strong>${esc(proj.name)}</strong>
      </div>
      <div class="proj-quick-switch">
        <label for="quickProjSelect">Cambiar Proyecto:</label>
        <select id="quickProjSelect" class="search-input" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="openProjectDetail(this.value)">
          ${STATE.projects.map(p => `
            <option value="${esc(p.name)}" ${p.name === proj.name ? 'selected' : ''}>${esc(p.name)} (${getProjectLab(p)})</option>
          `).join("")}
        </select>
      </div>
    </div>

    <!-- SOVEREIGN PROJECT HERO HEADER WITH FULL DEFINITION & PHASE -->
    <header class="chuleta-header proj-sovereign-header">
      <div class="brand">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
          <div>
            <div class="kicker">${esc(labName)} · CARTRIDGE SOBERANO</div>
            <div style="display: flex; align-items: center; gap: 14px; margin-top: 4px; flex-wrap: wrap;">
              <span style="font-size: 32px;">${icon}</span>
              <h1 style="margin: 0; font-size: 28px;">${esc(proj.name)}</h1>
              <span class="card-badge badge-vine" style="font-size: 12px;">${esc(proj.status)}</span>
              <span class="card-badge badge-gold" style="font-size: 12px;">Sincronizado: ${esc(proj.integratedThrough)}</span>
            </div>
          </div>
          <div class="proj-phase-badge-box">
            <span class="proj-phase-tag">FASE TÉCNICA ACTUAL</span>
            <div class="proj-phase-text">${inline(proj.currentPhase)}</div>
          </div>
        </div>

        <!-- DEFINICIÓN INTEGRADA DEL PROYECTO (WHAT IT IS) -->
        <div class="proj-definition-hero-card">
          <div class="proj-def-label">DEFINICIÓN &amp; PROPÓSITO DEL PROYECTO</div>
          <p class="proj-def-text">${inline(proj.definition)}</p>
        </div>

        <!-- SPECS HUD (BLOQUES, DECISIONES, TAREAS, NEXT ACTION) -->
        <div class="specs" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.12);">
          <span class="spec-pill" onclick="setProjectSubtab('workflow')"><strong>🗺️ Bloques:</strong> ${
            proj.progress === null ? "sin declarar" : `${proj.completedBlocks}/${proj.totalBlocks} (${proj.progress}%)`}</span>
          <span class="spec-pill" onclick="setProjectSubtab('decisions')"><strong>📜 Decisiones:</strong> ${liveDecs.length} Vivas (${projectDecs.length} Totales)</span>
          <span class="spec-pill" onclick="setProjectSubtab('workflow')"><strong>📋 Tareas:</strong> ${projectTasks.length} (${activeTasks.length} Activas)</span>
          <span class="spec-pill active-pill" onclick="setProjectSubtab('state')"><strong>🎯 Next Action:</strong> ${inline(proj.nextAction.slice(0, 52))}...</span>
        </div>
      </div>
    </header>

    <!-- PROJECT INTERNAL TABS (TOC) -->
    <nav class="toc-bar" style="margin: 20px 0 24px;">
      <button class="toc-pill ${activeTab === 'workflow' ? 'active' : ''}" onclick="setProjectSubtab('workflow')"><span>🗺️</span> 1. Workflow Ramificado</button>
      <button class="toc-pill ${activeTab === 'state' ? 'active' : ''}" onclick="setProjectSubtab('state')"><span>🎯</span> 2. Estado Vivo &amp; Next Action</button>
      <button class="toc-pill ${activeTab === 'architecture' ? 'active' : ''}" onclick="setProjectSubtab('architecture')"><span>🏛️</span> 3. Arquitectura &amp; Definición</button>
      <button class="toc-pill ${activeTab === 'decisions' ? 'active' : ''}" onclick="setProjectSubtab('decisions')"><span>📜</span> 4. Decisiones (${projectDecs.length})</button>
      <button class="toc-pill ${activeTab === 'skills' ? 'active' : ''}" onclick="setProjectSubtab('skills')"><span>⚡</span> 5. Skills &amp; Operaciones</button>
      <button class="toc-pill ${activeTab === 'repos' ? 'active' : ''}" onclick="setProjectSubtab('repos')"><span>🐙</span> 6. Repos &amp; Git</button>
      <button class="toc-pill ${activeTab === 'guide' ? 'active' : ''}" onclick="setProjectSubtab('guide')"><span>📖</span> 7. Guía de Uso</button>
    </nav>

    <!-- TAB CONTENT RENDERER -->
    <div class="proj-tab-content-area">
      ${renderProjectSubtabContent(proj, activeTab, projectTasks, projectDecs)}
    </div>
  `;
}

function renderProjectSubtabContent(proj, tab, projectTasks, projectDecs) {
  switch (tab) {
    case "workflow": return renderProjectWorkflowTab(proj, projectTasks, projectDecs);
    case "state": return renderProjectStateTab(proj, projectTasks, projectDecs);
    case "architecture": return renderProjectArchitectureTab(proj);
    case "decisions": return renderProjectDecisionsTab(proj, projectDecs);
    case "skills": return renderProjectSkillsTab(proj);
    case "repos": return renderProjectReposTab(proj);
    case "guide": return renderProjectGuideTab(proj);
    default: return renderProjectWorkflowTab(proj, projectTasks, projectDecs);
  }
}

// ── TAB 1: WORKFLOW RAMIFICADO (Bloques, Subbloques y Log de Tareas) ──
function renderProjectWorkflowTab(proj, projectTasks, projectDecs) {
  const workflow = proj.workflow || [];

  // ⚠️ Sin bloques declarados esta pestaña enseñaba cuatro inventados. Ahora dice qué falta
  // y dónde se arregla, que es lo único que la interfaz sabe de verdad.
  if (!workflow.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🗺️</div>
        <h3>Este proyecto no declara bloques</h3>
        <p>Su <code>state.md</code> no lleva la lista de bloques, así que aquí no hay hoja de
           ruta que enseñar — y <strong>inventarla es peor que no tenerla</strong>, porque un
           lector no puede distinguir una hoja generada de una leída.</p>
        <p class="empty-hint">Se arregla escribiendo los bloques en el <code>state.md</code> del
           proyecto, o invocando <code>redefine-project</code>, que es la skill que existe para
           volver a alinear la definición con lo que el trabajo se ha convertido.</p>
        ${projectTasks.length ? `<p class="empty-hint">Mientras tanto, tiene
           <strong>${projectTasks.length}</strong> tarea${projectTasks.length === 1 ? "" : "s"}
           en la cola, que sí están declaradas.</p>` : ""}
      </div>`;
  }

  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">01</span> Mapa Ramificado de Fases, Bloques y Subbloques</h2>
        <button class="btn-hud-action" onclick="openTaskModalForProject('${esc(proj.name)}')">
          <span>➕</span> <span>Nueva Tarea para ${esc(proj.name)}</span>
        </button>
      </div>
      <p class="lead">
        Secuencia estructurada de ejecución. Cada bloque maestro engloba sus subbloques ramificados, verificaciones y tareas vivas.
      </p>

      <div class="ramified-workflow-container">
        ${workflow.map((block, bIdx) => `
          <div class="wf-master-block ${block.status}">
            <div class="wf-master-header">
              <div class="wf-master-title-row">
                <span class="wf-master-id">${esc(block.id)}</span>
                <div>
                  <h3 class="wf-master-title">${esc(block.title)}</h3>
                  <p class="wf-master-summary">${inline(block.summary)}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <span class="card-badge ${block.status === 'completed' ? 'badge-vine' : (block.status === 'active' ? 'badge-gold' : '')}">${esc(block.statusLabel)}</span>
                ${block.decisions && block.decisions.length ? `
                  <span class="card-badge badge-grape" title="Decisiones asociadas: ${block.decisions.join(', ')}">📜 ${block.decisions.length} Decs</span>
                ` : ''}
              </div>
            </div>

            <!-- SUBBLOCKS RAMIFICATION -->
            <div class="wf-subblocks-tree">
              ${block.subblocks && block.subblocks.length ? block.subblocks.map((sub, sIdx) => {
                const subTasks = sub.tasks || [];
                return `
                  <div class="wf-subblock-node ${sub.status}">
                    <div class="wf-subblock-connector"></div>
                    <div class="wf-subblock-card">
                      <div class="wf-subblock-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span class="wf-subblock-id">${esc(sub.id)}</span>
                          <h4 class="wf-subblock-title">${esc(sub.title)}</h4>
                        </div>
                        <span class="card-badge ${sub.status === 'completed' ? 'badge-vine' : (sub.status === 'active' ? 'badge-gold' : '')}">
                          ${sub.status === 'completed' ? '✓ Listo' : (sub.status === 'active' ? '▶ En Curso' : '⏳ Pendiente')}
                        </span>
                      </div>
                      <p class="wf-subblock-desc">${inline(sub.desc)}</p>

                      <!-- SUBBLOCK EMBEDDED TASKS -->
                      ${subTasks.length ? `
                        <div class="wf-subblock-tasks">
                          <div class="wf-tasks-title">📋 Tareas en este subbloque (${subTasks.length}):</div>
                          <div class="tickets-list" style="margin-top: 8px;">
                            ${subTasks.map(t => `
                              <div class="ticket-card ${t.status === '✅' ? 'completed' : (t.status === '⚫' ? 'discarded' : '')}" style="background: #ffffff; padding: 12px 14px;">
                                <div class="ticket-top">
                                  <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="tag-pill tag-purple">${esc(t.id)}</span>
                                    <span class="tag-pill">${esc(t.status)}</span>
                                    <strong style="font-size: 13px;">${inline(t.title)}</strong>
                                  </div>
                                  ${renderDate(t.date, t.date_inferred)}
                                </div>
                                <p style="font-size: 12px; color: var(--ink-soft); margin: 4px 0 0;"><strong>Why:</strong> ${inline(t.why)}</p>                              </div>
                            `).join("")}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join("") : `
                <div style="font-size: 12px; color: var(--ink-muted); padding: 8px 16px;">Sin subbloques detallados.</div>
              `}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- COMPLETE TASK LIST FOR THE PROJECT -->
      <div style="margin-top: 32px; border-top: 2px solid var(--line); padding-top: 24px;">
        <div class="section-subhead">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📋</span> <strong>Log Completo de Tareas de ${esc(proj.name)} (${projectTasks.length})</strong>
          </div>
        </div>

        ${projectTasks.length ? `
          <div class="tickets-list" style="margin-top: 14px;">
            ${projectTasks.map(t => `
              <div class="ticket-card ${t.status === '✅' ? 'completed' : (t.status === '⚫' ? 'discarded' : '')}">
                <div class="ticket-top">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="tag-pill tag-purple" style="font-weight: 700;">${esc(t.id)}</span>
                    <span class="tag-pill">${esc(t.status)}</span>
                    <h3 class="ticket-title" style="${t.status === '✅' ? 'opacity: 0.88;' : ''}">${inline(t.title)}</h3>
                  </div>
                  ${renderDate(t.date, t.date_inferred)}
                </div>
                <p style="font-size: 13px; color: var(--ink-soft); line-height: 1.5; margin-top: 4px;">
                  <strong>Why:</strong> ${inline(t.why)}
                </p>              </div>
            `).join("")}
          </div>
        ` : `
          <div class="empty-state" style="padding: 24px; margin-top: 12px;">
            <p>No hay tareas registradas para <strong>${esc(proj.name)}</strong>.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ── TAB 2: ESTADO VIVO (State Snapshot & Next Action) ──
function renderProjectStateTab(proj, projectTasks, projectDecs) {
  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">02</span> Estado Vivo del Cartridge (state.md)</h2>
      </div>
      <p class="lead">
        Instantánea en tiempo presente de la posición técnica verificada. <em>¿Seguiría siendo cierto si el trabajo se detuviera hoy?</em>
      </p>

      <!-- NEXT ACTION HERO BANNER -->
      <div class="next-action-hero-card" style="margin-bottom: 24px;">
        <span class="hero-icon">🎯</span>
        <div class="hero-content">
          <div class="hero-label">ACCIÓN SIGUIENTE INMEDIATA (NEXT ACTION)</div>
          <div class="hero-text">${inline(proj.nextAction)}</div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="gov-link-btn" onclick="copyToClipboard('claude -p \\'execute next action on ${esc(proj.name)}\\'', 'Comando de ejecución copiado')">
              ⚡ Ejecutar Acción con Agente
            </button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="gov-bottom-card">
          <div class="gov-bottom-card-head">
            <span class="gov-level-badge badge-vine">SYNCHRONIZATION &amp; REPO</span>
          </div>
          <h3>Topología y Sincronía</h3>
          <div style="font-size: 13px; color: var(--ink-soft); line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
            <div><strong>Laboratorio / Entorno:</strong> ${esc(proj.lab)}</div>
            <div><strong>Sincronizado hasta:</strong> <span class="card-badge badge-gold">${esc(proj.integratedThrough)}</span></div>
            <div><strong>Última verificación:</strong> ${esc(proj.lastUpdated)}</div>
            <div><strong>Archivo de Estado:</strong> <code>${esc(proj.file || "nexus/state.md")}</code></div>
          </div>
        </div>

        <div class="gov-bottom-card">
          <div class="gov-bottom-card-head">
            <span class="gov-level-badge badge-grape">HEALTH &amp; GOVERNANCE</span>
          </div>
          <h3>Salud del Cartridge</h3>
          <div class="gov-stat-grid" style="margin: 4px 0;">
            <div class="gov-stat-box">
              <span class="gov-stat-val">${proj.completedBlocks}/${proj.totalBlocks}</span>
              <span class="gov-stat-lbl">Bloques</span>
            </div>
            <div class="gov-stat-box">
              <span class="gov-stat-val">${proj.decisionsCount}</span>
              <span class="gov-stat-lbl">Decisiones</span>
            </div>
            <div class="gov-stat-box">
              <span class="gov-stat-val">${projectTasks.length}</span>
              <span class="gov-stat-lbl">Tareas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── TAB 3: ARQUITECTURA & DEFINICIÓN (Definition, MVP & Scope) ──
function renderProjectArchitectureTab(proj) {
  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">03</span> Arquitectura, Objetivos y Límites (definition.md)</h2>
      </div>
      <p class="lead">
        Definición inmutable de la iteración: qué es el proyecto, a quién pertenece, qué conforma el MVP y qué queda expresamente fuera de alcance.
      </p>

      <div class="gov-philosophy-panel" style="margin-bottom: 20px;">
        <div class="gov-panel-header">
          <div class="gov-panel-title">
            <span class="gov-level-badge badge-vine">PROPÓSITO &amp; MVP</span>
            <h3>Definición del Proyecto ${esc(proj.name)}</h3>
          </div>
        </div>
        <p style="font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 16px;">
          ${inline(proj.definition)}
        </p>

        <div class="callout tip" style="margin-top: 12px;">
          <div class="callout-title"><span>🎯</span> Criterio de Éxito del MVP</div>
          <p style="margin: 0; font-size: 13px;">El MVP se considera completo cuando el flujo principal puede ejecutarse de principio a fin de forma determinista y verificada contra sus gates de auditoría.</p>
        </div>
      </div>

      <div class="grid-2">
        <div class="gov-bottom-card">
          <div class="gov-bottom-card-head">
            <span class="gov-level-badge badge-gold">ENTREGABLES</span>
          </div>
          <h3>Entregables Principales</h3>
          <div style="font-size: 12.5px; color: var(--ink-soft); line-height: 1.6;">
            <div>• Código modular bajo ramas de trabajo independientes (ej. <code>feature/*</code> o rama activa).</div>
            <div>• Registro de decisiones con justificación y alternativas descartadas.</div>
            <div>• Documentación de arquitectura y contratos de agente verificables.</div>
          </div>
        </div>

        <div class="gov-bottom-card">
          <div class="gov-bottom-card-head">
            <span class="gov-level-badge badge-rust">FUERA DE ALCANCE (OUT OF SCOPE)</span>
          </div>
          <h3>Límites y Restricciones</h3>
          <div style="font-size: 12.5px; color: var(--ink-soft); line-height: 1.6;">
            <div>🚫 Nunca acoplar el backend a estados volátiles de la interfaz.</div>
            <div>🚫 No pusher a ramas productivas sin autorización explícita del operador.</div>
            <div>🚫 Evitar optimizaciones prematuras antes de verificar los invariantes clave.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── TAB 4: DECISIONES (D_n Log) ──
function renderProjectDecisionsTab(proj, projectDecs) {
  const liveDecs = projectDecs.filter(d => !d.isSuperseded);
  const supersededDecs = projectDecs.filter(d => d.isSuperseded);

  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">04</span> Registro de Decisiones de ${esc(proj.name)} (${projectDecs.length})</h2>
      </div>
      <p class="lead">
        Historial append-only de decisiones técnicas tomadas en este proyecto, con su razonamiento (Why), fecha, autor y estado de vivacidad.
      </p>

      <div class="gov-stat-grid" style="margin-bottom: 20px;">
        <div class="gov-stat-box">
          <span class="gov-stat-val">${liveDecs.length}</span>
          <span class="gov-stat-lbl">Decisiones Vivas</span>
        </div>
        <div class="gov-stat-box">
          <span class="gov-stat-val">${supersededDecs.length}</span>
          <span class="gov-stat-lbl">Reemplazadas</span>
        </div>
        <div class="gov-stat-box">
          <span class="gov-stat-val">${projectDecs.length}</span>
          <span class="gov-stat-lbl">Total Registrado</span>
        </div>
      </div>

      ${projectDecs.length ? `
        <div class="tickets-list">
          ${projectDecs.map(d => `
            <div class="ticket-card decision-card ${d.isSuperseded ? 'discarded' : ''}">
              <div class="ticket-top">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="tag-pill tag-purple" style="font-weight: 700;">${esc(d.id)}</span>
                  ${d.isSuperseded ? `
                    <span class="tag-pill tag-superseded">🔄 Reemplazada por ${esc(d.supersededBy.join(", "))}</span>
                  ` : `
                    <span class="tag-pill tag-alive">🟢 VIVA</span>
                  `}
                  <strong style="font-size: 14px;">${inline(d.title)}</strong>
                </div>
                ${renderDate(d.date, d.date_inferred)}
              </div>
              ${(d.why || d.discarded) ? `
                <details class="decision-details">
                  <summary>
                    <span class="toggle-icon">▶</span>
                    <span>Ver razonamiento (Why)${d.discarded ? ' y descartados' : ''}</span>
                  </summary>
                  <div class="decision-body-content">
                    ${d.why ? `
                      <div class="decision-why-text">
                        <strong>Por qué (Why):</strong> ${inline(d.why)}
                      </div>
                    ` : ''}
                    ${d.discarded ? `
                      <div class="task-discard-callout" style="margin-top: 4px;">
                        <strong>⚫ Alternativa descartada (PH-3):</strong> ${inline(d.discarded)}
                      </div>
                    ` : ''}
                  </div>
                </details>
              ` : ''}
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="empty-state">
          <p>No hay decisiones registradas aún para <strong>${esc(proj.name)}</strong>.</p>
        </div>
      `}
    </div>
  `;
}

// ── TAB 5: SKILLS & OPERACIONES ──
function renderProjectSkillsTab(proj) {
  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">05</span> Skills &amp; Operaciones sobre ${esc(proj.name)}</h2>
      </div>
      <p class="lead">
        Capacidades y roles especializados para auditar, evolucionar o corregir este proyecto de forma determinista.
      </p>

      <div class="grid-2">
        <div class="doc-card">
          <div class="doc-card-head">
            <span class="card-badge badge-vine">AUDITORÍA</span>
            <span class="card-badge">project-auditor</span>
          </div>
          <h3>Auditar Proyecto</h3>
          <p>Verifica los cambios y el diff del proyecto contra sus propios axiomas de proyecto y reglas de higiene.</p>
          <button class="gov-link-btn" style="margin-top: auto;" onclick="copyToClipboard('claude -p \\'run project-auditor on ${esc(proj.name)}\\'', 'Comando copiado')">
            📋 Copiar: claude -p 'run project-auditor on ${esc(proj.name)}'
          </button>
        </div>

        <div class="doc-card">
          <div class="doc-card-head">
            <span class="card-badge badge-gold">ESTADO &amp; DERIVA</span>
            <span class="card-badge">redefine-project</span>
          </div>
          <h3>Redefinir / Resincronizar</h3>
          <p>Reescribe definition.md y state.md cuando el proyecto ha derivado o avanzado varias decisiones sin actualizar.</p>
          <button class="gov-link-btn" style="margin-top: auto;" onclick="copyToClipboard('claude -p \\'run redefine-project on ${esc(proj.name)}\\'', 'Comando copiado')">
            📋 Copiar: claude -p 'run redefine-project on ${esc(proj.name)}'
          </button>
        </div>

        <div class="doc-card">
          <div class="doc-card-head">
            <span class="card-badge badge-grape">SESIÓN</span>
            <span class="card-badge">open-session</span>
          </div>
          <h3>Abrir Sesión en Proyecto</h3>
          <p>Fija el frente activo en este proyecto, prepara el plan numérico en vuelo y abre el ciclo de trabajo.</p>
          <button class="gov-link-btn" style="margin-top: auto;" onclick="copyToClipboard('claude -p \\'open-session on ${esc(proj.name)}\\'', 'Comando copiado')">
            📋 Copiar: claude -p 'open-session on ${esc(proj.name)}'
          </button>
        </div>

        <div class="doc-card">
          <div class="doc-card-head">
            <span class="card-badge badge-cyan">LIMPIEZA</span>
            <span class="card-badge">code-cleanup</span>
          </div>
          <h3>Limpieza Previa a Release</h3>
          <p>Elimina comentarios arqueológicos, vocabulario privado y wikilinks antes de compartir o proponer PR.</p>
          <button class="gov-link-btn" style="margin-top: auto;" onclick="copyToClipboard('claude -p \\'run code-cleanup on ${esc(proj.name)}\\'', 'Comando copiado')">
            📋 Copiar: claude -p 'run code-cleanup on ${esc(proj.name)}'
          </button>
        </div>
      </div>
    </div>
  `;
}

window.updateLabFilter = function(lab) {
  STATE.selectedLabFilter = lab;
  renderView();
};

window.openProjectDetail = function(name) {
  STATE.selectedProject = name;
  STATE.currentView = "project-detail";
  STATE.projectSubtab = "workflow";
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.setProjectSubtab = function(tabKey) {
  STATE.projectSubtab = tabKey;
  renderView();
};

window.openTaskModalForProject = function(projectName) {
  openTaskModal();
  const projSelect = document.getElementById("taskProject");
  if (projSelect) {
    projSelect.value = projectName;
    updateTaskPreview();
  }
};

window.selectProject = function(name) {
  openProjectDetail(name);
};


// ── TAB 6: REPOS & GIT DASHBOARD (CON GUÍA CHEATSHEET DESPLEGABLE) ──
function renderProjectReposTab(proj) {
  const remoteHttp = getRemoteHttpUrl(proj.remoteUrl);
  const activeBranch = proj.gitBranch || "dev";

  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">06</span> Repositorios, Workspace y Control de Versiones</h2>
        ${proj.gitBranch ? `<span class="tag-pill tag-live">🌿 Rama activa: ${esc(proj.gitBranch)}</span>` : '<span class="tag-pill tag-alive">🌿 Ramas estándar: master · ${esc(activeBranch)}</span>'}
      </div>
      <p class="lead">
        Ubicaciones soberanas de código fuente, repositorio remoto en GitHub, directorio de trabajo local y cartridge de gobernanza desacoplado en NEXUS.
      </p>

      <!-- REPOSITORIES & LOCATIONS GRID -->
      <div class="repo-cards-grid">
        <!-- 1. GITHUB REMOTE -->
        <div class="repo-loc-card">
          <div class="repo-loc-header">
            <div class="repo-loc-title-group">
              <span class="repo-loc-icon">🐙</span>
              <h3 class="repo-loc-title">Repositorio Remoto</h3>
            </div>
            <span class="card-badge ${proj.remoteUrl ? 'badge-vine' : ''}">${proj.remoteUrl ? 'GitHub Conectado' : 'Sin Remote'}</span>
          </div>

          <p style="font-size: 13px; color: var(--ink-soft); margin: 0; line-height: 1.5;">
            Repositorio en GitHub sincronizado con el ciclo de vida del proyecto.
          </p>

          <div class="repo-path-box">
            <code>${esc(proj.remoteUrl || 'No configurado en state.md')}</code>
          </div>

          ${proj.remoteUrl ? `
            <div class="repo-actions-row">
              <button class="btn-repo-action" onclick="copyToClipboard('${esc(proj.remoteUrl)}', 'URL de GitHub copiada', event)">
                <span>📋 Copiar URL</span>
              </button>
              ${remoteHttp ? `
                <a href="${esc(remoteHttp)}" target="_blank" rel="noopener noreferrer" class="btn-repo-action" style="color: var(--vine-deep); border-color: var(--vine-border);">
                  <span>↗️ Abrir en GitHub</span>
                </a>
              ` : ''}
              <button class="btn-repo-action" onclick="copyToClipboard('git clone ${esc(proj.remoteUrl)}', 'Comando git clone copiado', event)">
                <span>💻 Copiar git clone</span>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- 2. LOCAL WORKSPACE & COMMIT -->
        <div class="repo-loc-card">
          <div class="repo-loc-header">
            <div class="repo-loc-title-group">
              <span class="repo-loc-icon">💻</span>
              <h3 class="repo-loc-title">Workspace Local (Directorio de Código)</h3>
            </div>
            ${proj.gitBranch ? `<span class="tag-pill tag-purple" style="font-weight: 700;">${esc(proj.gitBranch)}</span>` : '<span class="card-badge">Local</span>'}
          </div>

          <p style="font-size: 13px; color: var(--ink-soft); margin: 0; line-height: 1.5;">
            Árbol de trabajo en la máquina local donde se ejecutan los scripts, tests y builds.
          </p>

          <div class="repo-path-box">
            <code>${esc(proj.codeRepo || '~/Documents/' + proj.name)}</code>
          </div>

          ${proj.gitCommit ? `
            <div class="repo-commit-box">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="tag-pill tag-purple" style="font-weight: 800; font-family: var(--font-mono);">${esc(proj.gitCommit)}</span>
                <strong style="font-size: 13px; color: var(--ink);">${inline(proj.gitCommitMsg || 'Commit activo')}</strong>
              </div>
              ${proj.gitCommitDate ? `<span style="font-size: 11.5px; color: var(--ink-muted); margin-top: 4px; display: block;">📅 Fecha del commit: ${esc(proj.gitCommitDate)}</span>` : ''}
            </div>
          ` : ''}

          <div class="repo-actions-row">
            <button class="btn-repo-action" onclick="copyToClipboard('${esc(proj.codeRepo)}', 'Ruta del workspace copiada', event)">
              <span>📋 Copiar Ruta</span>
            </button>
            <button class="btn-repo-action" onclick="copyToClipboard('cd ${esc(proj.codeRepo)}', 'Comando cd copiado', event)">
              <span>💻 Copiar cd</span>
            </button>
          </div>
        </div>

        <!-- 3. NEXUS CARTRIDGE -->
        <div class="repo-loc-card">
          <div class="repo-loc-header">
            <div class="repo-loc-title-group">
              <span class="repo-loc-icon">🏛️</span>
              <h3 class="repo-loc-title">Cartridge de Gobernanza (NEXUS)</h3>
            </div>
            <span class="card-badge badge-gold">Desacoplado</span>
          </div>

          <p style="font-size: 13px; color: var(--ink-soft); margin: 0; line-height: 1.5;">
            Estructura de metadatos, estado vivo, definición arquitectónica y log append-only de decisiones (PH-1).
          </p>

          <div class="repo-path-box">
            <code>${esc(proj.name)}/nexus/ (state.md · Decision_Log.md · definition.md)</code>
          </div>

          <div class="repo-actions-row">
            <button class="btn-repo-action" onclick="copyToClipboard('${esc(proj.name)}/nexus/state.md', 'Ruta state.md copiada', event)">
              <span>🎯 Copiar state.md</span>
            </button>
            <button class="btn-repo-action" onclick="copyToClipboard('${esc(proj.name)}/nexus/Decision_Log.md', 'Ruta Decision_Log.md copiada', event)">
              <span>📜 Copiar Decision_Log.md</span>
            </button>
          </div>
        </div>
      </div>

      <!-- GUÍA OPERATIVA & CHEATSHEET GITHUB (DESPLEGABLE) -->
      <div style="margin-top: 28px;">
        <div class="section-head" style="cursor: default; margin-bottom: 8px;">
          <h3><span>📖</span> Guía Operativa de Comandos Git &amp; GitHub (master ⇄ ${esc(activeBranch)})</h3>
          <span class="card-badge badge-vine">CheatSheet Integrada</span>
        </div>
        <p class="lead" style="font-size: 13px; margin-bottom: 16px;">
          Comandos esenciales de la chuleta de <code>GitHub Workflow Guide</code> contextualizados para <strong>${esc(proj.name)}</strong> con copiado rápido en 1 clic.
        </p>

        <div class="git-guide-container">
          <!-- SECCIÓN 1: FLUJO DIARIO EN RAMA ACTIVA -->
          <details class="git-guide-accordion" open>
            <summary>
              <div class="accordion-title">
                <span>🌿</span>
                <span>1. Flujo Diario de Trabajo en Rama Activa (<code>${esc(activeBranch)}</code>)</span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git switch ${esc(activeBranch)} && git pull origin ${esc(activeBranch)}', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Cambiar a rama de trabajo y actualizar</span>
                  <code class="git-cmd-code">cd ${esc(proj.codeRepo)} && git switch ${esc(activeBranch)} && git pull origin ${esc(activeBranch)}</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git status -s', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Revisar cambios en el árbol de trabajo</span>
                  <code class="git-cmd-code">git status -s</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git add -A && git commit -m \'feat(${esc(proj.name)}): avance en sub-bloque activo\'', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">3. Preparar commit estructurado</span>
                  <code class="git-cmd-code">git add -A && git commit -m "feat(${esc(proj.name)}): avance en sub-bloque activo"</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git push origin ${esc(activeBranch)}', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">4. Subir cambios a la rama de trabajo</span>
                  <code class="git-cmd-code">git push origin ${esc(activeBranch)}</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>

          <!-- SECCIÓN 2: MERGE SEGURO HACIA MASTER -->
          <details class="git-guide-accordion">
            <summary>
              <div class="accordion-title">
                <span>🔀</span>
                <span>2. Integración y Merge Seguro de <code>${esc(activeBranch)}</code> hacia <code>master</code></span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('git switch master && git pull origin master', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Cambiar a master y sincronizar con remoto</span>
                  <code class="git-cmd-code">git switch master && git pull origin master</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git merge --no-ff ${esc(activeBranch)} -m \'merge: integrate ${esc(activeBranch)} branch updates into master\'', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Merge explícito sin fast-forward (burbuja de commit)</span>
                  <code class="git-cmd-code">git merge --no-ff ${esc(activeBranch)} -m "merge: integrate ${esc(activeBranch)} branch updates into master"</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git push origin master && git switch ${esc(activeBranch)}', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">3. Pushear master limpio y volver a la rama de trabajo</span>
                  <code class="git-cmd-code">git push origin master && git switch ${esc(activeBranch)}</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>

          <!-- SECCIÓN 3: INICIALIZAR NUEVO REPO & PRIMER COMMIT -->
          <details class="git-guide-accordion">
            <summary>
              <div class="accordion-title">
                <span>🚀</span>
                <span>3. Inicialización de un Nuevo Repositorio &amp; Primer Commit</span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('git init && git branch -M main', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Inicializar repositorio y fijar rama principal</span>
                  <code class="git-cmd-code">git init && git branch -M main</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git add .gitignore && git commit -m \'chore: initial gitignore\'', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Commitear .gitignore antes que cualquier archivo ⭐</span>
                  <code class="git-cmd-code">git add .gitignore && git commit -m "chore: initial gitignore"</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git count-objects -vH', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">3. Comprobar peso del repositorio antes de subir</span>
                  <code class="git-cmd-code">git count-objects -vH</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git remote add origin ${esc(proj.remoteUrl || 'git@github.com:organization/' + proj.name + '.git')} && git push -u origin main', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">4. Vincular remoto en GitHub y subir upstream</span>
                  <code class="git-cmd-code">git remote add origin ${esc(proj.remoteUrl || 'git@github.com:organization/' + proj.name + '.git')} && git push -u origin main</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>

          <!-- SECCIÓN 4: WORKTREES & AISLAMIENTO DE AGENTES -->
          <details class="git-guide-accordion">
            <summary>
              <div class="accordion-title">
                <span>🌳</span>
                <span>4. Gestión de Worktrees (Aislamiento de Agentes)</span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('git worktree list', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Listar worktrees activos</span>
                  <code class="git-cmd-code">git worktree list</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git worktree add .claude/worktrees/task-1 -b task/${esc(proj.name)}-1', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Crear worktree aislado para tarea</span>
                  <code class="git-cmd-code">git worktree add .claude/worktrees/task-1 -b task/${esc(proj.name)}-1</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git worktree remove .claude/worktrees/task-1 && git worktree prune', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">3. Eliminar worktree y podar referencias</span>
                  <code class="git-cmd-code">git worktree remove .claude/worktrees/task-1 && git worktree prune</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>

          <!-- SECCIÓN 5: CUENTAS SSH MULTI-USUARIO -->
          <details class="git-guide-accordion">
            <summary>
              <div class="accordion-title">
                <span>🔑</span>
                <span>5. Diagnóstico de Cuentas SSH / GitHub en la Máquina</span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('ssh -T git@github.com', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Comprobar qué cuenta responde en GitHub</span>
                  <code class="git-cmd-code">ssh -T git@github.com</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('git clone git@github-work:${esc(proj.name)}.git', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Clonar usando alias SSH personal (~/.ssh/config)</span>
                  <code class="git-cmd-code">git clone git@github-work:${esc(proj.name)}.git</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>

          <!-- SECCIÓN 6: HOOKS & GATES -->
          <details class="git-guide-accordion">
            <summary>
              <div class="accordion-title">
                <span>🛠️</span>
                <span>6. Resolución de Bloqueos en Commits (Linters &amp; Gate)</span>
              </div>
              <span class="accordion-chevron">▼</span>
            </summary>
            <div class="git-guide-content">
              <div class="git-cmd-box" onclick="copyToClipboard('ruff check --fix .', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">1. Autocorregir formato y linting con ruff</span>
                  <code class="git-cmd-code">ruff check --fix .</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('pre-commit run --all-files', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">2. Probar hooks de pre-commit manualmente sin commit</span>
                  <code class="git-cmd-code">pre-commit run --all-files</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>

              <div class="git-cmd-box" onclick="copyToClipboard('tools/gate.sh', 'Comando copiado', event)">
                <div class="git-cmd-left">
                  <span class="git-cmd-label">3. Ejecutar gate de integridad de MLabs</span>
                  <code class="git-cmd-code">tools/gate.sh</code>
                </div>
                <span class="git-cmd-copy-hint">Copiar 📋</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  `;
}


// ⛔ Esto era un mapa de palabra-clave a icono, y entre sus palabras había términos que
// sólo pueden venir de mirar los nombres reales de los proyectos de una instancia. Eso es
// exactamente lo que `interface:AX-1` prohíbe: el motor es público y genérico, y no puede
// saber nada de la centralita de nadie. Además adivinaba mal la mayoría de las veces.
//
// ⚠️ Y el gate no lo habría visto: sólo mira nombres que estén en la denylist de la
// instancia, y una palabra que la propia interfaz inventa no está en ninguna lista.
//
// Un proyecto puede DECLARAR su icono en su `state.md`. Si no lo declara, lleva el neutro.
function getProjectIcon(nameOrState) {
  const declared = nameOrState && typeof nameOrState === "object" ? nameOrState.icon : null;
  return declared || "📦";
}

// ── TAB 7: GUÍA DE USO & README VISUAL ──
function renderProjectGuideTab(proj) {
  // Available documents for this project
  const docsList = [];

  // 1. Primary README or guide
  if (proj.readmeContent && proj.readmeContent.trim().length > 0) {
    let label = "📖 README.md";
    if (proj.readmeType === "guide") label = "📖 Guía de Uso";
    else if (proj.readmeType === "how-to-use") label = "📖 HOW-TO-USE.md";
    else if (proj.readmeType === "definition") label = "📋 Definición (definition.md)";

    docsList.push({
      id: "primary",
      label: label,
      path: proj.readmePath ? proj.readmePath.split("/").slice(-2).join("/") : "README.md",
      content: proj.readmeContent,
      type: proj.readmeType || "readme"
    });
  }

  // 2. Definition doc (if different from primary)
  if (proj.definitionContent && proj.definitionContent.trim().length > 0 && proj.readmeType !== "definition") {
    docsList.push({
      id: "definition",
      label: "📋 Especificación (definition.md)",
      path: "nexus/definition.md",
      content: proj.definitionContent,
      type: "definition"
    });
  }

  // 3. Architecture doc
  if (proj.architectureContent && proj.architectureContent.trim().length > 0) {
    docsList.push({
      id: "architecture",
      label: "🏛️ Arquitectura (architecture.md)",
      path: "nexus/architecture.md",
      content: proj.architectureContent,
      type: "architecture"
    });
  }

  // 4. Extra guides (e.g. audit_usage, shortcuts)
  if (proj.extraGuides && typeof proj.extraGuides === "object") {
    for (const [gKey, gContent] of Object.entries(proj.extraGuides)) {
      docsList.push({
        id: "guide_" + gKey,
        label: "🛠️ " + gKey.replace(/_/g, " ").toUpperCase(),
        path: "nexus/Guides/" + gKey + ".md",
        content: gContent,
        type: "guide"
      });
    }
  }

  // Default fallback if no docs exist
  if (docsList.length === 0) {
    docsList.push({
      id: "primary",
      label: "📄 Definición",
      path: "state.md",
      content: proj.definition || "Sin guía de uso disponible para este proyecto.",
      type: "definition"
    });
  }

  // Current active doc
  STATE.guideActiveDoc = STATE.guideActiveDoc || {};
  const activeDocId = STATE.guideActiveDoc[proj.name] || docsList[0].id;
  const currentDoc = docsList.find(d => d.id === activeDocId) || docsList[0];

  // Quickstart commands
  const quickInstallCmd = proj.quickInstall || `cd ${esc(proj.codeRepo || '~/Documents/' + proj.name)} && npm install`;
  const quickRunCmd = proj.quickRun || `cd ${esc(proj.codeRepo || '~/Documents/' + proj.name)} && npm run dev`;
  const quickTestCmd = proj.quickTest || `cd ${esc(proj.codeRepo || '~/Documents/' + proj.name)} && npm test`;

  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">07</span> Guía de Uso, Quickstart &amp; Documentación Visual</h2>
        <span class="tag-pill tag-live">📖 Visual README</span>
      </div>
      <p class="lead">
        Documentación técnica interactiva, especificaciones de arquitectura, quickstarts de instalación y manuales operativos renderizados visualmente en tiempo real.
      </p>

      <!-- HERO BANNER -->
      <div class="proj-guide-hero">
        <div class="guide-hero-top">
          <div class="guide-hero-title-group">
            <div class="guide-hero-icon">${getProjectIcon(proj)}</div>
            <div>
              <h3 class="guide-hero-title">${esc(proj.name)}</h3>
              <div style="font-size: 12px; color: var(--gold, #d8b26a); font-family: var(--font-mono); margin-top: 2px;">
                ${esc(currentDoc.path)}
              </div>
            </div>
          </div>
          <div class="guide-hero-badges">
            <span class="card-badge badge-vine">${esc(proj.techStack || 'MLabs Pipeline')}</span>
            <span class="tag-pill tag-purple">${esc(proj.currentPhase || 'Producción')}</span>
          </div>
        </div>

        <p class="guide-hero-desc">
          ${inline(proj.definition || 'Módulo y solución soberana de software diseñada bajo los principios y arquitectura de MLabs.')}
        </p>
      </div>

      <!-- QUICKSTART 3-STEP SEQUENCE -->
      <div class="quickstart-steps-container">
        <div class="quickstart-step-card">
          <div class="step-card-header">
            <span class="step-num-badge">1</span>
            <h4 class="step-card-title">Instalación / Entorno</h4>
          </div>
          <p style="font-size: 12px; color: var(--ink-soft); margin: 0;">Preparar dependencias y entorno de ejecución local.</p>
          <div class="repo-path-box" onclick="copyToClipboard('${quickInstallCmd.replace(/'/g, "\\'")}', 'Comando copiado', event)" style="cursor: pointer;" title="Clic para copiar">
            <code>${esc(quickInstallCmd)}</code>
          </div>
        </div>

        <div class="quickstart-step-card">
          <div class="step-card-header">
            <span class="step-num-badge">2</span>
            <h4 class="step-card-title">Ejecución / Dev Server</h4>
          </div>
          <p style="font-size: 12px; color: var(--ink-soft); margin: 0;">Lanzar el servicio, servidor o pipeline en desarrollo.</p>
          <div class="repo-path-box" onclick="copyToClipboard('${quickRunCmd.replace(/'/g, "\\'")}', 'Comando copiado', event)" style="cursor: pointer;" title="Clic para copiar">
            <code>${esc(quickRunCmd)}</code>
          </div>
        </div>

        <div class="quickstart-step-card">
          <div class="step-card-header">
            <span class="step-num-badge">3</span>
            <h4 class="step-card-title">Tests &amp; Verificación</h4>
          </div>
          <p style="font-size: 12px; color: var(--ink-soft); margin: 0;">Comprobar integridad antes de commitear cambios.</p>
          <div class="repo-path-box" onclick="copyToClipboard('${quickTestCmd.replace(/'/g, "\\'")}', 'Comando copiado', event)" style="cursor: pointer;" title="Clic para copiar">
            <code>${esc(quickTestCmd)}</code>
          </div>
        </div>
      </div>

      <!-- DOCUMENT SWITCHER (IF MULTIPLE DOCS EXIST) -->
      ${docsList.length > 1 ? `
        <div class="guide-doc-switcher">
          <span style="font-size: 12px; font-weight: 800; color: var(--ink-muted); margin-right: 6px; text-transform: uppercase;">Explorar Documentos:</span>
          ${docsList.map(d => `
            <button class="guide-doc-pill ${d.id === currentDoc.id ? 'active' : ''}" onclick="setGuideActiveDoc('${esc(proj.name)}', '${esc(d.id)}')">
              <span>${esc(d.label)}</span>
              <span class="guide-doc-badge">${esc(d.path.split('/').pop())}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- VISUAL README / DOCUMENTATION BODY -->
      <div class="readme-rendered-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <h3 style="margin: 0; font-size: 15px; display: flex; align-items: center; gap: 8px;">
            <span>📄</span> <span>${esc(currentDoc.label)}</span>
          </h3>
          <button class="btn-repo-action" onclick="copyToClipboard(decodeURIComponent('${encodeURIComponent(currentDoc.content)}'), 'Documento completo copiado', event)">
            <span>📋 Copiar Markdown Completo</span>
          </button>
        </div>

        <div class="readme-markdown-body">
          ${renderMarkdownBody(currentDoc.content)}
        </div>
      </div>
    </div>
  `;
}

window.setGuideActiveDoc = function(projName, docId) {
  STATE.guideActiveDoc = STATE.guideActiveDoc || {};
  STATE.guideActiveDoc[projName] = docId;
  renderView();
};

// Enhanced Markdown parser helper for README and Guide body
function renderMarkdownBody(text) {
  if (!text) return "<p>Sin contenido.</p>";

  const lines = text.split("\n");
  let html = "";
  let inCode = false;
  let codeBuffer = [];
  let codeLang = "";
  let inTable = false;
  let tableBuffer = [];
  let inList = false;
  let listType = "ul";
  let inBlockquote = false;
  let blockquoteBuffer = [];
  // ⛔ A paragraph is a RUN of non-blank lines, not one paragraph per line. Emitting a
  // `<p>` per source line turned every hard-wrapped paragraph into a stack of blocks with
  // gaps between them — which is what every mailbox entry looked like, because a mailbox
  // entry is prose wrapped at 100 columns like the rest of these files.
  let paraBuffer = [];
  function flushPara() {
    if (!paraBuffer.length) return;
    html += `<p>${inline(paraBuffer.join(" "))}</p>`;
    paraBuffer = [];
  }

  function flushBlockquote() {
    if (!inBlockquote) return;
    const bText = blockquoteBuffer.join(" ").trim();
    blockquoteBuffer = [];
    inBlockquote = false;

    // Detect Callout type
    if (bText.startsWith("⚠️") || bText.toLowerCase().startsWith("[!warning]")) {
      const cleanText = bText.replace(/^⚠️\s*|^\[!warning\]\s*/i, "");
      html += `<div class="callout callout-warning"><span class="callout-icon">⚠️</span><div class="callout-content">${inline(cleanText)}</div></div>`;
    } else if (bText.startsWith("🚀") || bText.toLowerCase().startsWith("[!tip]") || bText.startsWith("🎯")) {
      const cleanText = bText.replace(/^[🚀🎯]\s*|^\[!tip\]\s*/i, "");
      html += `<div class="callout callout-tip"><span class="callout-icon">🚀</span><div class="callout-content">${inline(cleanText)}</div></div>`;
    } else if (bText.startsWith("🧊") || bText.toLowerCase().startsWith("[!note]")) {
      const cleanText = bText.replace(/^🧊\s*|^\[!note\]\s*/i, "");
      html += `<div class="callout callout-note"><span class="callout-icon">🧊</span><div class="callout-content">${inline(cleanText)}</div></div>`;
    } else if (bText.startsWith("🚫") || bText.startsWith("⚫") || bText.toLowerCase().startsWith("[!caution]")) {
      const cleanText = bText.replace(/^[🚫⚫]\s*|^\[!caution\]\s*/i, "");
      html += `<div class="callout callout-danger"><span class="callout-icon">🚫</span><div class="callout-content">${inline(cleanText)}</div></div>`;
    } else {
      html += `<blockquote>${inline(bText)}</blockquote>`;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Anything that is not plain prose ends the paragraph that was accumulating. ⚠️ The
    // test lists what STARTS a block, so a construct added below without being added here
    // would swallow its own opening line into the previous paragraph.
    const isPlainText = trimmed.length > 0 && !inCode
      && !trimmed.startsWith("```") && !trimmed.startsWith("|") && !trimmed.startsWith("#")
      && !trimmed.startsWith(">") && !trimmed.startsWith("- ") && !trimmed.startsWith("* ")
      && !trimmed.startsWith("---") && !/^\d+\.\s+/.test(trimmed);
    if (!isPlainText) flushPara();

    // Code blocks (```lang ... ```)
    if (trimmed.startsWith("```")) {
      flushBlockquote();
      if (inCode) {
        const fullCode = codeBuffer.join("\n");
        html += `
          <div class="code-block-container">
            <div class="code-block-header">
              <span>${esc(codeLang || 'snippet')}</span>
              <button class="btn-code-copy" onclick="copyToClipboard(decodeURIComponent('${encodeURIComponent(fullCode)}'), 'Código copiado', event)">Copiar</button>
            </div>
            <pre><code>${esc(fullCode)}</code></pre>
          </div>
        `;
        codeBuffer = [];
        codeLang = "";
        inCode = false;
      } else {
        if (inList) { html += `</${listType}>`; inList = false; }
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Blockquotes & Callouts
    if (trimmed.startsWith(">")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      if (inTable) { html += renderMarkdownTable(tableBuffer); tableBuffer = []; inTable = false; }
      inBlockquote = true;
      blockquoteBuffer.push(trimmed.slice(1).trim());
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Markdown Tables
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        if (inList) { html += `</${listType}>`; inList = false; }
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      html += renderMarkdownTable(tableBuffer);
      tableBuffer = [];
      inTable = false;
    }

    // Checklist items: - [x] or - [ ]
    const chkMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (chkMatch) {
      if (!inList || listType !== "ul") {
        if (inList) html += `</${listType}>`;
        html += '<ul class="readme-checklist">';
        inList = true;
        listType = "ul";
      }
      const isDone = chkMatch[1].toLowerCase() === "x";
      const chkText = chkMatch[2];
      html += `
        <li class="checklist-item ${isDone ? 'done' : 'pending'}">
          <span class="chk-icon">${isDone ? '✅' : '⬜'}</span>
          <span>${inline(chkText)}</span>
        </li>
      `;
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h2>${inline(line.slice(2))}</h2>`;
    } else if (line.startsWith("## ")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h3>${inline(line.slice(3))}</h3>`;
    } else if (line.startsWith("### ")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h4>${inline(line.slice(4))}</h4>`;
    } else if (line.startsWith("#### ")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h5>${inline(line.slice(5))}</h5>`;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += `</${listType}>`;
        html += "<ul>";
        inList = true;
        listType = "ul";
      }
      html += `<li>${inline(trimmed.slice(2))}</li>`;
    } else if (trimmed.match(/^\d+\.\s+(.+)$/)) {
      const m = trimmed.match(/^\d+\.\s+(.+)$/);
      if (!inList || listType !== "ol") {
        if (inList) html += `</${listType}>`;
        html += "<ol>";
        inList = true;
        listType = "ol";
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if (trimmed.length === 0) {
      if (inList) { html += `</${listType}>`; inList = false; }
    } else if (trimmed.startsWith("---")) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += '<hr style="border: 0; border-top: 1px solid var(--line); margin: 20px 0;">';
    } else {
      if (inList) { html += `</${listType}>`; inList = false; }
      paraBuffer.push(trimmed);
    }
  }

  flushPara();
  flushBlockquote();
  if (inCode) html += `<pre><code>${esc(codeBuffer.join("\n"))}</code></pre>`;
  if (inTable) html += renderMarkdownTable(tableBuffer);
  if (inList) html += `</${listType}>`;

  return html;
}

function renderMarkdownTable(lines) {
  if (!lines || lines.length < 2) return "";

  let html = '<div style="overflow-x: auto; margin: 16px 0 20px;"><table class="doc-table">';
  let hasHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row.startsWith("|") || !row.endsWith("|")) continue;
    if (row.includes("---") && row.replace(/[|\s-:]/g, "").length === 0) {
      hasHeader = true;
      continue;
    }

    const cells = row.split("|").slice(1, -1).map(c => c.trim());
    if (i === 0 || !hasHeader) {
      html += "<thead><tr>";
      cells.forEach(c => { html += `<th>${inline(c)}</th>`; });
      html += "</tr></thead><tbody>";
      hasHeader = true;
    } else {
      html += "<tr>";
      cells.forEach(c => { html += `<td>${inline(c)}</td>`; });
      html += "</tr>";
    }
  }

  html += "</tbody></table></div>";
  return html;
}

function initAppListeners() {
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
    } else {
      STATE.taskFilterProj = val;
      STATE.decFilterProj = val;
      STATE.selectedProject = val;
    }
    renderView();
  });

  document.getElementById("globalSearch")?.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    STATE.taskSearch = q;
    STATE.decSearch = q;
    renderView();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppListeners);
} else {
  initAppListeners();
}

async function loadModel() {
  // ⛔ Fetch y render se atrapan POR SEPARADO. Juntos, un `ReferenceError` dentro de una
  // vista salía por pantalla como «No se pudo conectar con el servidor» — y con eso el
  // fallo real (`SKILL_ICONS is not defined`) mandaba a mirar la red, el adaptador y el
  // puerto, que estaban perfectos. Un diagnóstico que apunta al sitio equivocado cuesta
  // más que no dar ninguno.
  let modelData;
  try {
    const res = await fetch("/api/model");
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    modelData = await res.json();
  } catch (err) {
    STATE.error = `No se pudo conectar con el servidor: ${err.message}`;
    STATE.errorKind = "red";
    renderView();
    return;
  }
  try {
    STATE.error = null;
    STATE.errorKind = null;
    ingestModel(modelData);
    restoreRouteFromUrl();
    renderView();
  } catch (err) {
    STATE.error = err.message;
    STATE.errorKind = "vista";
    STATE.errorWhere = STATE.currentView;
    STATE.errorStack = String(err.stack || "").split("\n").slice(0, 4).join("\n");
    renderView();
    return;
  }
  if (STATE.trace === undefined) loadTrace();
  // ⚠️ La doctrina se carga una vez: son ficheros del propio motor, no estado vivo, y
  // volver a pedirlos en cada latido gastaría una petición por segundo para nada.
  if (STATE.doctrine === undefined) loadDoctrine();
  loadRecent();
}

function renderCheatSheet(container) {
  const curCat = STATE.activeCsTab || "session";
  const catData = CHEATSHEET_DATA.find(c => c.category === curCat) || CHEATSHEET_DATA[0];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📖</span> CheatSheet & Atajos Rápidos ⭐</h1>
        <p class="view-subtitle">
          Comandos para copiar de un clic. <span class="cs-key"><span class="cs-hint hint-Shell">Shell</span>
          va a la terminal</span> · <span class="cs-key"><span class="cs-hint hint-Prompt">Prompt</span>
          va a Claude</span> · <span class="cs-key"><span class="cs-hint hint-Shell2">Shell*</span>
          necesita una ruta que sólo tu instancia conoce — sustitúyela antes de ejecutar</span>
        </p>
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
        ${catData.groups.map((g, gIdx) => `
          <div class="cs-group-card">
            <div class="cs-group-header">
              <h3>${esc(g.title)}</h3>
              <p>${esc(g.desc)}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${g.cmds.map((cmd, cIdx) => {
                // ⚠️ El id llevaba sólo el índice DENTRO del grupo, así que dos grupos de la
                // misma pestaña generaban `cmdRow_session_0` dos veces — y el aviso de
                // «copiado» se encendía en la primera fila con ese id, no en la pulsada.
                const rowId = `cmdRow_${curCat}_${gIdx}_${cIdx}`;
                // ⛔ El `hint` existía en los datos y no se pintaba en ningún sitio, así que
                // no había manera de saber si un comando va a la terminal o a Claude. Un
                // prompt pegado en bash no hace nada y no dice por qué.
                const kind = cmd.hint === "Prompt" ? "Prompt" : cmd.hint === "Shell*" ? "Shell2" : "Shell";
                return `
                <div class="cs-cmd-row" id="${rowId}" data-code="${esc(cmd.code)}" onclick="copyRowCommand(this)">
                  <span class="cs-cmd-label">${esc(cmd.label)}</span>
                  <span class="cs-hint hint-${kind}">${esc(cmd.hint || "Shell")}</span>
                  <code class="cs-cmd-code">${esc(cmd.code)}</code>
                  <button class="cs-cmd-copy-btn">Copiar 📋</button>
                </div>`;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// Helper to find persistent plan associated with a compass front
function findPlanForFront(front) {
  if (!front || !STATE.plans || !STATE.plans.length) return null;
  const fName = (front.name || "").toLowerCase();
  const fDesc = (front.described_in || "").toLowerCase();
  const fMoves = (front.moves_when || "").toLowerCase();
  const fWaits = (front.waits_on || "").toLowerCase();
  const fText = `${fName} ${fDesc} ${fMoves} ${fWaits}`.toLowerCase();

  // 1. Exact plan ID in text (e.g. nexus-p2 in moves_when)
  for (const p of STATE.plans) {
    const pId = (p.id || "").toLowerCase();
    if (pId && (fMoves.includes(pId) || fDesc.includes(pId) || fName.includes(pId) || fWaits.includes(pId))) {
      return p;
    }
  }

  // 2. Exact sub-block (e.g. X1.7 or X7.2)
  for (const p of STATE.plans) {
    const pSub = (p.sub_block || "").toLowerCase();
    if (pSub && pSub.length >= 2 && new RegExp(`\\b${pSub}\\b`, "i").test(fText)) {
      return p;
    }
  }

  // 3. Exact board block in described_in (e.g. board X1)
  for (const p of STATE.plans) {
    const pBlock = (p.block || "").toLowerCase();
    if (pBlock && pBlock.length >= 2 && new RegExp(`\\bboard\\s+${pBlock}\\b`, "i").test(fDesc)) {
      return p;
    }
  }

  // 4. Title phrase match
  for (const p of STATE.plans) {
    const pTitle = (p.title || "").toLowerCase().split(" - ")[0].split(" — ")[0].trim();
    if (pTitle.length >= 5 && fName.includes(pTitle)) {
      return p;
    }
  }

  return null;
}

// ⛔ Aquí vivía `renderCockpit`, 335 líneas que ya no llamaba nadie desde que `cockpit`
// enruta a `renderOffice`. Se va entera: una copia muerta del render vivo es la que sigue
// contestando cuando alguien la resucita sin mirar, y mientras tanto la mantiene nadie.
// `findPlanForFront` NO se va — la usa `planForCard`, que es lo que devolvió al Despacho
// la capacidad de enseñar la hoja de una tarea en pausa.


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
        <p class="view-subtitle">${liveDecisions().length} decisiones inmutables con autor, fecha, liveness y trazabilidad de supersedes</p>
      </div>
    </div>

    <!-- DECISION FILTERS (Priority #2) -->
    <div class="view-toolbar">
      <div class="toolbar-group">
        <label for="decFilterProj">Proyecto:</label>
        <select id="decFilterProj" class="custom-select" onchange="updateDecFilter('decFilterProj', this.value)">
          <option value="">Todos los Proyectos (${liveDecisions().length})</option>
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
        <div class="ticket-card decision-card ${d.isSuperseded ? 'discarded' : ''}">
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

          <h3 class="ticket-title" style="margin-top: 4px; font-size: 15px;">${inline(d.title)}</h3>
          
          ${(d.why || d.discarded) ? `
            <details class="decision-details">
              <summary>
                <span class="toggle-icon">▶</span>
                <span>Ver razonamiento (Why)${d.discarded ? ' y descartados' : ''}</span>
              </summary>
              <div class="decision-body-content">
                ${d.why ? `
                  <div class="decision-why-text">
                    <strong>Por qué (Why):</strong> ${inline(d.why)}
                  </div>
                ` : ''}

                ${d.discarded ? `
                  <div class="discarded-box" style="margin-top: 4px;">
                    <strong>Alternativa descartada:</strong> ${inline(d.discarded)}
                  </div>
                ` : ''}

                <div class="ticket-meta" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--line);">
                  ${renderOrigin(d.origin, d.origin_inferred)}
                  ${d.frozen ? `<span class="tag-pill" style="opacity: 0.75;">mirror de <code>${esc(d.mirror_of || '')}</code></span>` : ''}
                  ${d.file ? `<span class="tag-pill" style="opacity: 0.65;"><code>${esc(d.file)}</code></span>` : ''}
                </div>
              </div>
            </details>
          ` : `
            <div class="ticket-meta" style="margin-top: 4px;">
              ${renderOrigin(d.origin, d.origin_inferred)}
              ${d.frozen ? `<span class="tag-pill" style="opacity: 0.75;">mirror de <code>${esc(d.mirror_of || '')}</code></span>` : ''}
              ${d.file ? `<span class="tag-pill" style="opacity: 0.65;"><code>${esc(d.file)}</code></span>` : ''}
            </div>
          `}
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

function renderIdeas(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>💡</span> Idea Park</h1>
        <p class="view-subtitle">Aparcamiento ordenado de ideas y mejoras futuras para preservar el foco (PH-3)</p>
      </div>
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
          <p>El parque se edita a mano, por decisión del operador: esta vista lo lee y no escribe
             en él. Una idea se aparca escribiendo una línea en <code>IDEAS.md</code> mientras está
             fresca — y se expande sólo si sobrevive a una segunda lectura.</p>
        </div>
      `}
    </div>
  `;
}

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
        <h1><span>📬</span> Las dos colas</h1>
        <p class="view-subtitle">Corren en direcciones opuestas y <strong>ninguna vacía la suya</strong>
          (<code>AX-15</code>): el <strong>buzón</strong> va de agente a operador, la
          <strong>lista de tareas</strong> de operador a agente.</p>
      </div>
      <button class="btn-hud-action btn-add-task" onclick="openTaskModal()">
        <span>➕</span> <span>Nueva Tarea</span>
      </button>
    </div>

    ${renderMailboxPanel()}

    <div class="queue-divider">
      <span class="qd-line"></span>
      <span class="qd-label">↓ operador → agente · la lista de tareas</span>
      <span class="qd-line"></span>
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
                <h3 class="ticket-title" style="${isDone ? 'opacity: 0.88;' : ''}">${inline(t.title)}</h3>
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
            </div>          </div>
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

// ═════════════════════════════════════════════════════════════════════════════
// EL ÁGORA — las skills, y los roles entre ellas
//
// ⛔ `SKILL_ICONS` se usaba aquí y no estaba definida en ninguna parte. Con la lista vacía
// el `.map` no llega a correr y la vista parece sana; en cuanto la instancia declara sus
// skills, la primera tarjeta lanza un `ReferenceError` y la vista entera desaparece. Por
// eso el icono de una skill se DERIVA de cómo el modelo la alcanza, que es un dato que sí
// existe, en vez de salir de una tabla escrita a mano que hay que mantener en paralelo.
//
// ⚠️ Y `unclear` ya no se convierte en `request`. El parser distingue expresamente lo que
// pudo probar de lo que no — su propio comentario dice que una clasificación segura y
// equivocada es peor que una que admite no saber — y la vista anterior tiraba esa
// distinción, presentando como capacidad invocable cualquier cosa que no supo leer.
// ═════════════════════════════════════════════════════════════════════════════

// Las tres maneras en que un modelo alcanza una skill, según `AGENTS.md` §4, más la
// cuarta que es no haberlo podido determinar.
const STOAS = {
  event: {
    greek: "ΚΑΙΡΟΣ", name: "La ocasión",
    glyph: "◷", tone: "tone-olive",
    rule: "Su descripción nombra <strong>un momento</strong>. El modelo lo reconoce y <strong>lo dice</strong>; el operador la invoca.",
    warn: "Una ocasión nombrada en prosa es una señal para hablar, no un permiso para actuar."
  },
  request: {
    greek: "ΚΛΗΣΙΣ", name: "La llamada",
    glyph: "✋", tone: "tone-aegean",
    rule: "Su descripción nombra <strong>una petición</strong>. El modelo la ofrece cuando lo que se pidió encaja con lo que hace.",
    warn: null
  },
  locked: {
    greek: "ΚΛΕΙΣ", name: "Bajo llave",
    glyph: "🔒", tone: "tone-gold",
    rule: "<code>disable-model-invocation: true</code>. El operador la llama por su nombre y nadie más.",
    warn: "Su descripción sale del contexto entera: es donde se guarda lo que sólo él debe poder alcanzar."
  },
  unclear: {
    greek: "ΑΔΗΛΟΝ", name: "Sin determinar",
    glyph: "?", tone: "tone-ink",
    rule: "El parser <strong>no pudo probar</strong> cómo se alcanza esta skill, y lo dice en vez de adivinarlo.",
    warn: "Cada una de éstas es una descripción que hay que reescribir, no un fallo del lector."
  }
};
const STOA_ORDER = ["event", "request", "locked", "unclear"];

// Los auditores comparten un contrato (`skills/audit/`), y saberlo cambia cómo se leen:
// no son cuatro roles sueltos sino uno con cuatro departamentos.
const IS_AUDITOR = n => /auditor$|^audit$/.test(n);

function renderSkills(container) {
  const q = (STATE.skillSearch || "").toLowerCase().trim();
  const all = (STATE.skills || []).map(s => ({
    ...s,
    stoa: STOAS[s.trigger] ? s.trigger : "unclear",
    auditor: IS_AUDITOR(s.title)
  }));
  const focus = STATE.skillFilterType && STATE.skillFilterType !== "ALL" ? STATE.skillFilterType : null;
  const match = s => !q || [s.title, s.summary, s.when, s.evidence]
    .some(v => (v || "").toLowerCase().includes(q));
  const inStoa = k => all.filter(s => s.stoa === k && match(s));

  if (!all.length) {
    container.innerHTML = `
      <div class="view-header"><div class="view-title-group">
        <h1><span>🏺</span> El Ágora</h1>
        <p class="view-subtitle">Las skills de la empresa, y los roles entre ellas.</p>
      </div></div>
      <div class="empty-state"><div class="empty-icon">🏺</div>
        <h3>El ágora está vacía</h3>
        <p>Ninguna fuente del adaptador declara <code>kind: "skills"</code>, así que no hay
           descripciones que leer. Es un adaptador sin esa fuente, no una empresa sin skills.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🏺</span> El Ágora</h1>
        <p class="view-subtitle">
          Las skills de la empresa, agrupadas por <strong>cómo las alcanza el modelo</strong> —
          que es lo que decide su forma, y es independiente de si son roles.
        </p>
      </div>
      <div class="header-stats-bar">
        <span class="spec-pill"><strong>${all.length}</strong> skills</span>
        <span class="spec-pill"><strong>${all.filter(s => s.auditor).length}</strong> auditores</span>
        ${inStoa("unclear").length ? `<span class="spec-pill tone-ink" style="border-color:var(--gold-border);color:var(--gold-deep);background:var(--gold-bg)">
          <strong>${all.filter(s => s.stoa === "unclear").length}</strong> sin determinar</span>` : ""}
      </div>
    </div>

    <!-- LOS DOS EJES, QUE NO SON EL MISMO -->
    <div class="agora-axes">
      <div class="axis-card">
        <span class="axis-greek">ΑΡΧΩΝ</span>
        <strong>Un rol es una skill con un log y un criterio de despido.</strong>
        <span>Eso es todo, y va de rendir cuentas. Su criterio y su vigencia viven en el
          registro de contratación de la centralita, fuera de la vista del propio rol.</span>
      </div>
      <div class="axis-arrow">⇄ independientes</div>
      <div class="axis-card">
        <span class="axis-greek">ΜΟΡΦΗ</span>
        <strong>La forma de una descripción decide otra cosa: cómo la alcanza el modelo.</strong>
        <span>Un rol puede nombrar una petición, y una skill sin log ni criterio puede nombrar
          una ocasión. Confundir los dos ejes es lo que llena la vista de roles inventados.</span>
      </div>
    </div>

    <div class="view-toolbar agora-toolbar">
      <div class="toolbar-group search-group" style="flex:1">
        <input type="text" class="custom-input" placeholder="Buscar por nombre, objetivo, condición o la frase que la clasificó…"
               value="${esc(STATE.skillSearch || "")}" oninput="updateSkillSearch(this.value)">
      </div>
      <div class="toolbar-group">
        <button class="chip-filter ${!focus ? "active" : ""}" onclick="updateSkillFilter('ALL')">todas</button>
        ${STOA_ORDER.filter(k => all.some(s => s.stoa === k)).map(k => `
          <button class="chip-filter ${focus === k ? "active" : ""} ${STOAS[k].tone}"
                  onclick="updateSkillFilter('${k}')">${STOAS[k].glyph} ${STOAS[k].name}</button>`).join("")}
      </div>
    </div>

    ${STOA_ORDER.filter(k => !focus || focus === k).map(k => {
      const list = inStoa(k);
      if (!list.length && (focus !== k)) return "";
      const st = STOAS[k];
      return `
        <section class="stoa ${st.tone}">
          <header class="stoa-head">
            <div class="stoa-columns" aria-hidden="true">
              ${"<span></span>".repeat(7)}
            </div>
            <div class="stoa-plate">
              <span class="stoa-greek">${st.greek}</span>
              <h2>${st.glyph} ${st.name}</h2>
              <span class="stoa-n">${list.length}</span>
            </div>
            <p class="stoa-rule">${st.rule}</p>
            ${st.warn ? `<p class="stoa-warn">⚠️ ${st.warn}</p>` : ""}
          </header>

          <div class="stoa-floor">
            ${list.length ? list.map(sk => `
              <article class="persona ${sk.auditor ? "persona-auditor" : ""}" onclick="openSkill('${esc(sk.title)}')">
                <header class="persona-top">
                  <span class="persona-glyph">${st.glyph}</span>
                  <h3>${esc(sk.title)}</h3>
                  ${sk.auditor ? `<span class="persona-tag" title="Los auditores comparten un contrato en skills/audit/">auditor</span>` : ""}
                </header>
                <p class="persona-sum">${inline(sk.summary || "")}</p>
                ${sk.when ? `<p class="persona-when">${inline(cut(sk.when, 190))}</p>` : ""}
                <footer class="persona-foot">
                  ${sk.evidence
                    ? `<span class="persona-ev" title="La frase de su propia descripción por la que quedó clasificada aquí. Se lee, no se adivina.">
                         “${esc(cutText(sk.evidence, 90))}”</span>`
                    : `<span class="persona-ev persona-ev-none">su descripción no dio ninguna frase que la clasificara</span>`}
                  <span class="persona-go">leer entera →</span>
                </footer>
              </article>`).join("") : `
              <div class="stoa-empty">Ninguna skill llega al modelo por esta vía${q ? " con esa búsqueda" : ""}.</div>`}
          </div>
        </section>`;
    }).join("")}`;
}

// Igual que `cut`, pero devuelve texto plano: va dentro de un atributo y de comillas.
function cutText(t, max) {
  const s = String(t || "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : s.slice(0, max).replace(/\s\S*$/, "") + "…";
}

// ═════════════════════════════════════════════════════════════════════════════
// LA MESA DE TRIAJE — sólo en una tarea que declara qué cola drena
//
// ⛔ Aparece únicamente si la tarea escribe `**Drains** mailbox`. Enseñar treinta entradas
// ajenas mientras arreglas un bug es la saturación que esta vista existe para evitar, y una
// tarea que no drena nada no tiene nada que hacer con el buzón.
//
// ⚠️ Verde es `resolved`/`archived` — el estado que el fichero declara, no lo que este
// navegador recuerda haber hecho. Una sesión que se recarga sigue viendo lo mismo, y lo que
// enrutó otro agente también cuenta. La marca de «tocada hoy» viene de git y es un extra:
// si el árbol no es un repo, simplemente no aparece.
// ═════════════════════════════════════════════════════════════════════════════

const MAIL_DONE = ["resolved", "archived"];

function renderTriageBench(card) {
  const drains = String(card.drains || "").toLowerCase();
  if (!drains.includes("mailbox") && !drains.includes("buzón") && !drains.includes("buzon")) return "";

  const all = STATE.mailbox || [];
  const scoped = all.filter(e =>
    card.project === "cross" || !card.project || e.project === card.project || e.project === "cross");
  const done = scoped.filter(e => MAIL_DONE.includes(e.state));
  const open = scoped.filter(e => !MAIL_DONE.includes(e.state));
  const pct = scoped.length ? Math.round(done.length / scoped.length * 100) : 0;
  const touched = STATE.recentLines || {};

  const entry = (e, resolved) => {
    const isNew = (touched[e.file] || []).some(([a, b]) => e.line >= a && e.line <= b);
    const miss = [["serves", "Serves"], ["what", "What"], ["asks", "Asks"], ["affects", "Affects"]]
      .filter(([k]) => !e[k]).map(([, n]) => n);
    return `
      <article class="tri ${resolved ? "tri-done" : "tri-open"}">
        <header class="tri-top">
          <span class="tri-mark">${resolved ? "✓" : "○"}</span>
          <h4>${inline(e.title)}</h4>
          ${isNew ? `<span class="tri-fresh" title="Su bloque cambió en el trabajo sin commitear o en los commits de hoy — leído de git, no recordado por el navegador.">tocada hoy</span>` : ""}
          <span class="tri-dest" title="Destino propuesto por quien la escribió">→ ${esc(e.destination)}</span>
        </header>

        ${e.serves ? `
          <div class="tri-serves">
            <span class="tri-k">sirve a</span>
            <span class="tri-v">${inline(e.serves)}</span>
          </div>` : ""}

        ${e.what ? `<p class="tri-what">${inline(cut(e.what, 260))}</p>`
                 : e.prose ? `<p class="tri-what tri-prose">${inline(cut(e.prose, 220))}</p>` : ""}

        ${!resolved && e.asks ? `
          <div class="tri-asks">
            <span class="tri-asks-k">te pide decidir</span>
            <span class="tri-asks-v">${inline(e.asks)}</span>
          </div>` : ""}

        <footer class="tri-foot">
          ${e.affects ? `<span class="tri-affects" title="Qué se mueve si se mueve">${inline(cut(e.affects, 90))}</span>` : ""}
          <span class="tri-src"><code>${esc(e.file || "")}${e.line ? `:${e.line}` : ""}</code></span>
          ${miss.length ? `
            <span class="tri-gap" title="AX-46 pide los cuatro campos y a ésta le faltan. Nombrados, no contados: se sabe cuáles.">
              faltan ${miss.join(" · ")}
            </span>` : ""}
        </footer>
      </article>`;
  };

  return `
    <section class="bench">
      <header class="bench-head">
        <div class="bench-title">
          <span class="bench-greek">ΔΙΑΛΟΓΗ</span>
          <h3>Mesa de triaje</h3>
          <span class="bench-scope">${esc(card.project || "cross")} · ${scoped.length} entrada${scoped.length === 1 ? "" : "s"}</span>
        </div>
        <div class="bench-meter" role="img" aria-label="${done.length} de ${scoped.length} enrutadas">
          <div class="bench-bar"><div class="bench-fill" style="width:${pct}%"></div></div>
          <span class="bench-n"><strong>${done.length}</strong> de ${scoped.length} enrutadas</span>
        </div>
      </header>

      <div class="bench-cols">
        <div class="bench-col bench-col-open">
          <div class="bench-col-head">
            <span class="bench-dot dot-open"></span>
            <strong>Por resolver</strong>
            <span class="bench-col-n">${open.length}</span>
          </div>
          ${open.length ? open.map(e => entry(e, false)).join("") : `
            <p class="bench-empty">Ninguna. Un buzón que entra lleno y sale lleno significa que la
               sesión no cerró nada — éste no es el caso.</p>`}
        </div>

        <div class="bench-col bench-col-done">
          <div class="bench-col-head">
            <span class="bench-dot dot-done"></span>
            <strong>Resueltas</strong>
            <span class="bench-col-n">${done.length}</span>
          </div>
          ${done.length ? done.map(e => entry(e, true)).join("") : `
            <p class="bench-empty">Todavía ninguna en este filtro.</p>`}
        </div>
      </div>

      <p class="bench-note">
        El verde sale del <strong>estado que la entrada declara</strong> en <code>MAILBOX.md</code>,
        no de lo que este navegador recuerde: sobrevive a un recargado y cuenta también lo que
        enrutó otro agente. <strong>Nadie vacía la cola que llena</strong> — el destino que trae
        cada entrada es una propuesta, y confirmarla es tuyo.
      </p>
    </section>`;
}

// ── una skill, entera ────────────────────────────────────────────────────────
window.openSkill = async function (name) {
  STATE.skillOpen = { name, loading: true };
  STATE.currentView = "skill";
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
  try {
    const d = await api("GET", `/api/skill?name=${encodeURIComponent(name)}`);
    STATE.skillOpen = { name, ...d, loading: false };
  } catch (e) {
    STATE.skillOpen = { name, error: e.message, loading: false };
  }
  if (STATE.currentView === "skill") renderView();
};

function renderSkillPage(container) {
  const o = STATE.skillOpen || {};
  const meta = (STATE.skills || []).find(s => s.title === o.name);
  const st = STOAS[meta && STOAS[meta.trigger] ? meta.trigger : "unclear"];
  container.innerHTML = `
    <div class="desk-plate clause-plate ${st.tone}">
      <button class="crumb-link" onclick="navigateTo('skills')">🏺 Ágora</button>
      <span class="crumb-sep">›</span>
      <span class="crumb-here">${esc(o.name || "")}</span>
      ${o.file ? `<span class="clause-file"><code>${esc(o.file)}</code></span>` : ""}
    </div>

    <header class="clause-hero ${st.tone}">
      <div class="clause-hero-mark">
        <span class="clause-greek">${st.greek}</span>
        <span class="clause-id">${st.glyph}</span>
      </div>
      <div class="clause-hero-main">
        <h1>${esc(o.name || "")}</h1>
        ${meta ? `<blockquote class="clause-epigraph">${inline(meta.summary || "")}</blockquote>` : ""}
        <p class="clause-objective-note">
          <strong>${st.name}.</strong> ${st.rule}
          ${meta && meta.evidence
            ? ` Clasificada por esta frase de su propia descripción: <em>“${esc(meta.evidence)}”</em>.`
            : " Ninguna frase de su descripción permitió clasificarla."}
        </p>
      </div>
    </header>

    <div class="clause-grid">
      <section class="doc-reader">
        ${o.loading ? `<div class="loading-state"><div class="spinner"></div><p>Leyendo <code>${esc(o.name)}</code>…</p></div>`
          : o.error ? `<div class="empty-state"><div class="empty-icon">🏺</div>
              <h3>No se pudo leer</h3><p>${esc(o.error)}</p></div>`
          : renderMarkdownBody(o.body || "")}
      </section>
      <aside class="clause-rail">
        ${o.siblings && o.siblings.length ? `
          <div class="rail-panel">
            <div class="rail-head"><strong>Ficheros que la acompañan</strong></div>
            <p class="rail-note" style="margin-top:0">Una skill que trae más que su
               <code>SKILL.md</code> guarda ahí lo que no cabe en una descripción.</p>
            ${o.siblings.map(f => `
              <button class="clause-jump ${st.tone}" onclick="toggleSibling('${esc(f.name)}')">
                <span class="cj-id">📄</span><span class="cj-title">${esc(f.name)}</span>
                <span class="cj-n">${Math.round(f.body.length / 1024)} KB</span>
              </button>
              <div class="sibling-body" id="sib-${esc(f.name.replace(/\W/g, "_"))}" hidden>
                ${renderMarkdownBody(f.body)}
              </div>`).join("")}
          </div>` : ""}
        <div class="rail-panel">
          <div class="rail-head"><strong>Las otras de esta estoa</strong></div>
          ${(STATE.skills || []).filter(s => s.title !== o.name &&
              (STOAS[s.trigger] ? s.trigger : "unclear") === (meta && STOAS[meta.trigger] ? meta.trigger : "unclear"))
            .map(s => `
              <button class="clause-jump ${st.tone}" onclick="openSkill('${esc(s.title)}')">
                <span class="cj-id">${st.glyph}</span><span class="cj-title">${esc(s.title)}</span>
              </button>`).join("") || `<p class="rail-note" style="margin-top:0">Es la única.</p>`}
        </div>
      </aside>
    </div>`;
}

window.toggleSibling = function (name) {
  const el = document.getElementById("sib-" + name.replace(/\W/g, "_"));
  if (el) el.hidden = !el.hidden;
};


function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }
}

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

function autoScrollPlanContainer(smooth = true) {
  requestAnimationFrame(() => {
    const container = document.querySelector(".plan-items-container");
    if (!container) return;

    const completedItems = container.querySelectorAll(".plan-item-row.completed");
    if (completedItems.length > 0) {
      const lastCompleted = completedItems[completedItems.length - 1];
      const targetTop = lastCompleted.offsetTop;
      if (smooth) {
        container.scrollTo({
          top: Math.max(0, targetTop - 4),
          behavior: "smooth"
        });
      } else {
        container.scrollTop = Math.max(0, targetTop - 4);
      }
    } else {
      container.scrollTop = 0;
    }
  });
}

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

window.copyRowCommand = function(el) {
  const code = el.getAttribute("data-code") || el.querySelector("code")?.textContent || "";
  if (!code) return;
  copyCommand(code, el.id);
};

// ⚠️ The two project selects were `<!-- populated dynamically -->` and nothing populated
// them, so both modals submitted an empty `project` — the one field `AX-24` and every
// filter in this interface depend on, and the one nothing else can infer.
function fillProjectSelect(id) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const names = [...new Set([
    ...STATE.projects.map(p => p.name),
    ...STATE.tasks.map(t => t.project),
    ...STATE.fronts.map(f => f.project),
    ...STATE.ideas.map(i => i.project)
  ].filter(Boolean))].sort();
  const keep = sel.value;
  sel.innerHTML = names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")
    + `<option value="cross">cross — vale para varios proyectos</option>`;
  if (keep && names.includes(keep)) sel.value = keep;
  else if (STATE.deskCardId) {
    const c = officeCards().find(c => c.id === STATE.deskCardId);
    if (c && names.includes(c.project)) sel.value = c.project;
  }
}

window.openTaskModal = function() {
  const modal = document.getElementById("taskModal");
  fillProjectSelect("taskProject");
  if (modal) {
    updateTaskPreview();
    modal.classList.add("active");
  }
};

window.selectCsTab = function(cat) {
  STATE.activeCsTab = cat;
  renderView();
};

window.updateDecFilter = function(key, val) {
  STATE[key] = val;
  renderView();
};

window.updateSkillFilter = function(type) {
  STATE.skillFilterType = type;
  renderView();
};

window.updateSkillSearch = function(q) {
  STATE.skillSearch = q;
  renderView();
};

window.updateTaskFilter = function(key, val) {
  STATE[key] = val;
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
  }).catch(() => {
    showToast(`Comando copiado: ${text.slice(0, 40)}...`);
  });
};

window.retryLoad = () => {
  STATE.error = null;
  renderView();
  loadModel();
};

let isPolling = false;

async function watchStamp() {
  if (isPolling) return;
  isPolling = true;
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
  } finally {
    isPolling = false;
  }
}

// Initial boot & periodic watcher
loadModel().then(watchStamp);
setInterval(watchStamp, 2000);


// ═════════════════════════════════════════════════════════════════════════════
// OFICINA (el mural) y DESPACHO (la mesa de una tarea)
//
// ⛔ Everything below WRITES. The rest of this file reads a model and paints it; these
// functions change files on disk through `/api`, and every one of them confirms from the
// server's answer rather than from having sent the request. A view that says *saved*
// because it called `fetch` is the failure this section replaces: the previous write layer
// answered `ok` and touched nothing, so the interface built to uphold `PH-3` was the thing
// breaking it.
// ═════════════════════════════════════════════════════════════════════════════

// `FLOW.md`'s four, in one place. ⚠️ The view paints by outcome and the writer spells the
// destination; if these two lists ever disagree, an item is written with a destination no
// view can colour — so the vocabulary is defined once and both sides import it.
const OUTCOMES = {
  done:      { label: "hecho",      icon: "✅", cls: "out-done",      hint: "resuelto aquí y ahora" },
  mailbox:   { label: "al buzón",   icon: "📬", cls: "out-mailbox",   hint: "hay que debatirlo" },
  ideas:     { label: "a ideas",    icon: "💡", cls: "out-ideas",     hint: "interesante, no ahora" },
  discarded: { label: "descartado", icon: "⚫", cls: "out-discarded", hint: "con su motivo" }
};

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch (_) { /* a body that is not JSON is still a status */ }
  if (!res.ok) {
    const err = new Error(data.msg || `${res.status} ${res.statusText}`);
    err.stale = res.status === 409;
    err.status = res.status;
    throw err;
  }
  return data;
}

// One place that reports a write, so a confirmation always says WHERE it landed. ⚠️ "Idea
// guardada" is not traceability; "IDEAS.md línea 14" is, because it can be checked.
function confirmWrite(data, what) {
  const where = data.file ? ` · <code>${esc(data.file)}</code>${data.line ? ` línea ${data.line}` : ""}` : "";
  showToast(`${what}${where.replace(/<[^>]+>/g, "")}`);
  STATE.lastWrite = { what, ...data, at: new Date().toISOString() };
  loadModel();
  loadTrace();
}

function reportWriteError(e) {
  if (e.stale) {
    showToast("El plan cambió en disco. Recargando para que veas el estado real.");
    loadModel();
  } else {
    showToast(`No se pudo escribir: ${e.message}`);
  }
}

async function loadTrace() {
  try {
    const d = await api("GET", "/api/trace");
    STATE.trace = (d.events || []).slice().reverse();
    const rail = document.getElementById("traceRail");
    if (rail) rail.innerHTML = renderTraceList();
  } catch (_) { STATE.trace = STATE.trace || []; }
}

// ───────────────────────────────────────────────── the unified card
//
// ⛔ A compass row and a task list entry are the SAME THING under `FLOW.md`: every
// sub-block is a task. They arrive from two files because two files is how the instance
// keeps them, and the board that shows them twice is showing one piece of work as two.
// The merge is by title, which is what the operator wrote in both places.
function normaliseTitle(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[`*_~]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Parecido por raíces: se cortan las palabras a cinco letras para que «migrar» y
// «migración» cuenten como la misma, y se ignoran las cortas, que son partículas. Es
// deliberadamente tosco: sólo tiene que ser bastante bueno para levantar una bandera.
function titleRoots(t) {
  return new Set(normaliseTitle(t).split(" ").filter(w => w.length >= 4).map(w => w.slice(0, 5)));
}
function similarTitles(a, b) {
  const A = titleRoots(a), B = titleRoots(b);
  if (A.size < 2 || B.size < 2) return false;
  const shared = [...A].filter(w => B.has(w)).length;
  return shared / Math.min(A.size, B.size) >= 0.8;
}

function officeCards() {
  const cards = new Map();
  const key = t => normaliseTitle(t);

  // The summary table is the ranked queue and is the spine of the board. Board rows are
  // detail about the same fronts (`row: "board"`), so they enrich and never add.
  for (const f of STATE.fronts.filter(f => f.row !== "board")) {
    cards.set(key(f.name), {
      id: f.id || f.name, title: f.name, project: f.project || "cross",
      marker: f.marker, active: Boolean(f.active),
      moves_when: f.moves_when || "", described_in: f.described_in || "",
      // Los cuatro de `AX-46` sobre la tarea, que es lo que hace que la tarjeta se lea sin
      // la conversación que la produjo: a qué sirve, qué pasa, y qué se mueve.
      declared: f.state || null, serves: f.serves || null, affects: f.affects || null,
      drains: f.drains || null, planId: f.sheet || null,
      why: f.why || "", taskId: null, status: null, sources: ["compass"], line: f.line
    });
  }
  for (const f of STATE.fronts.filter(f => f.row === "board")) {
    const c = cards.get(key(f.name)) || [...cards.values()].find(
      c => key(c.title).includes(key(f.name)) || key(f.name).includes(key(c.title)));
    if (c) {
      c.waits_on = f.waits_on || c.waits_on || "";
      c.note = f.note || c.note || "";
      c.serves = c.serves || f.serves || null;
      c.affects = c.affects || f.affects || null;
      c.drains = c.drains || f.drains || null;
      c.why = c.why || f.why || "";
      if (!c.sources.includes("board")) c.sources.push("board");
    } else {
      cards.set(key(f.name), {
        id: f.id || f.name, title: f.name, project: f.project || "cross",
        marker: null, active: false, moves_when: f.moves_when || "",
        waits_on: f.waits_on || "", note: f.note || "", described_in: f.described_in || "",
        why: "", taskId: null, status: null, sources: ["board"], line: f.line
      });
    }
  }
  for (const t of STATE.tasks) {
    // ⚠️ Aquí se descartaba por EMOJI (`✅`/`⚫`) antes de que el estado declarado pudiera
    // opinar, así que una tarea `done` no llegaba nunca a la papelera — se evaporaba. Y el
    // emoji `⚫` ni siquiera está en el juego que el parser reconoce, con lo que una
    // cancelada entraba como pendiente. Dos sitios decidiendo lo mismo y discrepando.
    // Ahora la terminalidad la decide `cardState` y sólo `cardState`, y el reparto entre
    // muro y papelera lo hace quien pinta.
    const k = key(t.title);
    const hit = cards.get(k) || [...cards.values()].find(
      c => key(c.title).includes(k) || k.includes(key(c.title)));
    if (hit) {
      hit.taskId = t.id; hit.why = t.why || hit.why; hit.status = t.status;
      hit.declared = t.state || hit.declared; hit.planId = t.plan || hit.planId;
      hit.block = t.block || hit.block; hit.subBlock = t.sub_block || hit.subBlock;
      if (!hit.sources.includes("tasks")) hit.sources.push("tasks");
    } else {
      cards.set(k, {
        id: t.id, title: t.title, project: t.project || "cross", marker: null,
        active: false, moves_when: "", described_in: t.file || "", why: t.why || "",
        taskId: t.id, status: t.status, declared: t.state || null, planId: t.plan || null,
        block: t.block || null, subBlock: t.sub_block || null,
        sources: ["tasks"], line: t.line
      });
    }
  }

  // ⚠️ `FLOW.md`: las terminales «dejan el muro **para la papelera**, marcadas como cuál».
  // Marcadas, no borradas: `done` y `cancelled` son resultados distintos y un tablero que
  // los funde en «ya no está» pierde el único dato que tienen.

  // ⚠️ Dos nombres para el mismo trabajo dan dos tarjetas, y la fusión por título sólo
  // acierta cuando uno contiene al otro: «Migración del parser a records» y «Migrar el
  // parser a records» no se tocan. Lo que NO se hace es fusionarlas por parecido — una
  // fusión equivocada **esconde una tarea**, y un tablero al que le falta trabajo es peor
  // que uno que enseña dos veces el mismo. Se marcan, y el operador decide.
  // ⚠️ La primera versión cortaba en cuanto una tarjeta ya tenía gemela, así que con tres
  // nombres del mismo trabajo la tercera se quedaba fuera — y una bandera que no aparece
  // sobre el caso peor es la que menos sirve. Una tarjeta puede parecerse a varias.
  const list = [...cards.values()];
  for (const a of list) {
    a.twins = list.filter(b => b !== a && similarTitles(a.title, b.title)).map(b => b.title);
  }

  const rank = c => c.active ? 0 : c.marker === "⏸" ? 3 : /^\d+$/.test(c.marker || "") ? 1 : 2;
  return [...cards.values()].sort((a, b) =>
    rank(a) - rank(b) ||
    (parseInt(a.marker) || 99) - (parseInt(b.marker) || 99) ||
    a.title.localeCompare(b.title));
}

// The five states of `FLOW.md`, derived rather than stored — ⚠️ a second place holding
// "what is happening now" is the thing that rule exists to prevent.
function cardState(c) {
  // ⛔ El estado lo declara la TAREA (`FLOW.md`: «las cinco viven en la tarea»). El marcador
  // del compás es una vista sobre eso, no la fuente — y sólo se usa cuando la tarea no lo
  // dice, que es el caso de una instancia que aún no ha migrado el vocabulario.
  if (c.declared) return c.declared;
  if (c.active) return "active";
  if (c.marker === "⏸") return "paused";
  // El respaldo para una instancia que aún no declara estados: el emoji del vocabulario
  // anterior. ⚠️ Sólo se traducen los dos terminales, que son los únicos donde el emoji
  // dice inequívocamente cuál es — un ⬜ puede ser `pending` o `paused` y no se adivina.
  if (c.status === "✅") return "done";
  if (c.status === "⚫") return "cancelled";
  return "pending";
}

// ⛔ Toda tarea lleva su hoja desde que existe. La activa la tiene en el `PLAN.md` en vivo;
// las demás, en su registro de plan — y una `paused` la tiene **llena y con items
// tachados**, que es lo que `FLOW.md` llama «lo que hace barato cambiar de tarea: la hoja
// se conserva y se ve, así que reanudar cuesta leer y no reconstruir».
//
// ⚠️ El Despacho dejó de buscarla cuando sustituyó al cockpit, así que toda tarea que no
// fuera la del `▶` salía vacía aunque su plan estuviera en disco — cobrando exactamente la
// reconstrucción que esa regla existe para evitar.
function planForCard(c) {
  if (!c) return null;
  if (c.active) {
    return { live: true, items: STATE.livePlan || [], sections: STATE.planSections || [],
             meta: STATE.livePlanMeta || null, id: STATE.livePlanMeta?.plan_id || null };
  }
  const byId = c.planId && (STATE.plans || []).find(p =>
    String(p.id).toLowerCase() === String(c.planId).toLowerCase());
  const rec = byId || findPlanForFront({
    name: c.title, described_in: c.described_in, moves_when: c.moves_when, waits_on: c.waits_on
  });
  if (!rec) return null;
  return {
    live: false, id: rec.id, meta: rec, sections: [],
    // El registro de plan trae otra forma; se normaliza a la del plan en vivo para que la
    // misma función pinte las dos. Dos renderizadores para dos formas del mismo item es
    // como uno de los dos se queda atrás.
    items: (rec.items || []).map(it => ({
      index: it.index, line: null, text: it.text || "",
      struck: it.status === "done" || Boolean(it.destination),
      destination: it.destination || "",
      outcome: outcomeOfDestination(it.destination),
      section: null, subsection: null, ordered: true,
      author: null, date: it.completed_at || null
    }))
  };
}

// La misma clasificación que hace el parser, para los destinos que llegan de un registro.
function outcomeOfDestination(d) {
  if (!d) return null;
  const t = String(d).toLowerCase();
  if (t.includes("discard") || t.includes("⚫")) return "discarded";
  if (t.includes("mailbox") || t.includes("integrated") || t.includes("task")) return "mailbox";
  if (t.includes("idea") || t.includes("park")) return "ideas";
  return "done";
}
// Los cinco de `FLOW.md`, y son cinco. ⚠️ `cancelled` y `done` son terminales y no salen
// al mural — pero existen aquí porque una tarjeta puede llegar con uno de ellos y pintarla
// como «en cola» sería decir que sigue abierta.
const STATE_META = {
  active:    { label: "activa",     icon: "▶", cls: "st-active",
               hint: "es la del ▶. Su hoja es el PLAN.md en vivo" },
  paused:    { label: "en pausa",   icon: "⏸", cls: "st-paused",
               hint: "ha estado activa: su hoja está llena y se conserva, por eso reanudarla cuesta leer" },
  pending:   { label: "en cola",    icon: "○", cls: "st-pending",
               hint: "abierta y nunca activa todavía. Su hoja existe y puede estar vacía" },
  paused_r:  { label: "en pausa",   icon: "⏸", cls: "st-paused", hint: "" },
  cancelled: { label: "cancelada",  icon: "✕", cls: "st-terminal",
               hint: "terminal: sale de la cola" },
  done:      { label: "hecha",      icon: "✓", cls: "st-done",
               hint: "terminal: sale de la cola" }
};
delete STATE_META.paused_r;

// ───────────────────────────────────────────────── the plan, in sections
//
// Items keep the order the file gives them; sections group them, and an UNORDERED section
// carries no sequence at all. ⚠️ Numbering an unordered group is how a plan reads as a
// chain of dependencies that were never there — and then it gets worked in that order.
function planTree(items, sections) {
  const groups = [];
  const at = (sec, sub) => {
    const k = `${sec || ""}⇢${sub || ""}`;
    let g = groups.find(g => g.key === k);
    if (!g) {
      g = { key: k, section: sec, subsection: sub, items: [], ordered: true };
      groups.push(g);
    }
    return g;
  };
  for (const s of sections || []) at(s.section, s.level === 3 ? s.subsection : null);
  for (const it of items) {
    const g = at(it.section, it.subsection);
    g.items.push(it);
    if (it.ordered === false) g.ordered = false;
  }
  return groups.filter(g => g.items.length);
}

function renderPlanItem(item, editable) {
  const meta = item.outcome ? OUTCOMES[item.outcome] : null;
  const routed = Boolean(item.struck || meta);
  const marker = item.ordered === false ? "•" : (item.index ?? "·");
  return `
    <div class="pi ${routed ? "pi-routed" : "pi-open"} ${meta ? meta.cls : ""}">
      <div class="pi-marker">${routed ? (meta ? meta.icon : "✓") : esc(String(marker))}</div>
      <div class="pi-main">
        <div class="pi-text">${inline(item.text)}</div>
        <div class="pi-meta">
          ${meta ? `<span class="pi-outcome ${meta.cls}">${meta.icon} ${meta.label}</span>` : ""}
          ${item.author ? `<span class="pi-author">✍ ${esc(item.author)}${item.date ? ` · ${esc(item.date)}` : ""}</span>` : ""}
          ${item.line ? `<span class="pi-line" title="Línea en PLAN.md">L${item.line}</span>` : ""}
        </div>
      </div>
      ${!routed && editable && item.line ? `
        <div class="pi-route" title="Dale su destino — los cuatro de FLOW.md">
          ${Object.entries(OUTCOMES).map(([k, o]) => `
            <button class="pi-route-btn ${o.cls}" title="${o.label} — ${o.hint}"
                    onclick="routePlanItem(${item.line}, ${JSON.stringify(item.text.slice(0, 40)).replace(/"/g, "&quot;")}, '${k}')">
              ${o.icon}
            </button>`).join("")}
        </div>` : ""}
    </div>`;
}

function renderTraceList() {
  const ev = STATE.trace || [];
  if (!ev.length) {
    return `<div class="trace-empty">Nada escrito todavía en esta sesión.<br>
            <span>Cada nota, idea o entrada al buzón aparecerá aquí con su fichero y su línea.</span></div>`;
  }
  const KIND = {
    "mailbox":    { icon: "📬", label: "al buzón" },
    "idea":       { icon: "💡", label: "a ideas" },
    "task":       { icon: "➕", label: "tarea creada" },
    "plan-item":  { icon: "📝", label: "item al plan" },
    "plan-route": { icon: "🎯", label: "item enrutado" }
  };
  return ev.map(e => {
    const k = KIND[e.kind] || { icon: "•", label: e.kind };
    return `
      <div class="trace-row">
        <span class="trace-icon">${k.icon}</span>
        <div class="trace-body">
          <div class="trace-head"><strong>${k.label}</strong>
            <span class="trace-where"><code>${esc(e.file || "")}</code>${e.line ? ` L${e.line}` : ""}</span>
          </div>
          <div class="trace-text">${esc(String(e.wrote || "").slice(0, 160))}</div>
          <div class="trace-at">${esc(String(e.at || "").replace("T", " "))}</div>
        </div>
      </div>`;
  }).join("");
}

// ───────────────────────────────────────────────── OFICINA — the board
const TERMINAL = ["done", "cancelled"];

function renderOffice(container) {
  const all = officeCards();
  // El muro y la papelera son dos conjuntos. `FLOW.md`: las terminales «dejan el muro para
  // la papelera, MARCADAS como cuál» — así que se apartan, no se borran, y `done` y
  // `cancelled` siguen siendo distinguibles allí.
  const cards = all.filter(c => !TERMINAL.includes(cardState(c)));
  const bin = all.filter(c => TERMINAL.includes(cardState(c)));
  const projects = [...new Set(all.map(c => c.project).filter(Boolean))].sort();
  const fp = STATE.officeFilterProj || "ALL";
  const fs = STATE.officeFilterState || "ALL";
  const pool = fs === "bin" ? bin : cards;
  const shown = pool.filter(c =>
    (fp === "ALL" || (c.project || "").toLowerCase() === fp.toLowerCase()) &&
    (["ALL", "bin"].includes(fs) || cardState(c) === fs));
  const count = st => cards.filter(c => cardState(c) === st).length;
  const mailboxOpen = (STATE.mailbox || []).filter(e => ["open", "pending"].includes(e.state)).length;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🗂️</span> Oficina</h1>
        <p class="view-subtitle">El muro: una tarjeta por <strong>tarea</strong>, y una tarea es
          <strong>un compromiso</strong>. Un sub-bloque es una pieza de un plan y <em>no</em> es
          una tarea hasta que alguien decide que es su momento y lo promueve — confundir los dos
          es lo que dio dos respuestas correctas a una pregunta: preguntado qué había pendiente,
          un agente contestó 4 y otro ~50.</p>
      </div>
      <!-- La cuenta de activas es la cabecera y no una pildora mas. FLOW.md no pone techo
           al numero de tareas activas a proposito, y dice en su lugar que lo acota: lo que
           acota el trabajo en curso es la VISIBILIDAD, el muro declara su cuenta de activas
           y se lee en cada apertura. Es un trabajo que la regla le da a esta vista. -->
      <div class="wip-declaration ${count("active") === 0 ? "wip-floor" : ""}">
        <span class="wip-n">${count("active")}</span>
        <div class="wip-txt">
          <strong>${count("active") === 1 ? "tarea activa" : "tareas activas"} ahora mismo</strong>
          <span>Sin techo, a propósito: cada tarea tiene su propia hoja, así que nada se disputa.
            Lo que acota el trabajo en curso es <em>este número, leído en cada apertura</em>.
            Si empieza a subir, eso es evidencia para una regla — no motivo para adivinarla.</span>
        </div>
        <div class="wip-side">
          <span class="wip-chip st-paused">⏸ ${count("paused")} en pausa</span>
          <span class="wip-chip st-pending">○ ${count("pending")} en cola</span>
          ${bin.length ? `<button class="wip-chip wip-bin" onclick="setOfficeFilter('state','bin')">🗑 ${bin.length} en la papelera</button>` : ""}
        </div>
      </div>
    </div>

    <!-- El unico aviso es el SUELO. El techo no existe: avisar de hay mas de una activa era
         la regla anterior, y mantenerlo habria contradicho al fichero que gobierna. -->
    ${count("active") === 0 ? `
      <div class="office-warning">
        <strong>⚠️ Ninguna tarea está <code>active</code>.</strong>
        <span>
          <code>FLOW.md</code> pone un suelo: <strong>si hay trabajo en marcha, al menos una tarea
          está activa</strong> — y si ninguna lo está, el agente lo dice y se asigna una, con su
          proyecto, su plan y sus objetivos. Es lo que acota la promoción: un sub-bloque listo que
          nadie promueve <strong>es invisible desde el muro</strong>.
        </span>
      </div>` : ""}
    ${mailboxOpen ? `
      <div class="office-note">
        <strong>📬 ${mailboxOpen} entrada${mailboxOpen === 1 ? "" : "s"} sin cerrar en el buzón.</strong>
        <span>Una tarea de drenaje está <code>active</code> mientras su cola no está vacía, y
          <code>paused</code> sólo cuando lo está — <strong>el estado de un drenaje se deriva de la
          cuenta, no se elige</strong>. «En pausa con cosas dentro» no es un estado: es una
          contradicción, y es justo así como una cola deja de verse.
          <button class="inline-link" onclick="navigateTo('inbox')">ir al buzón →</button></span>
      </div>` : ""}

    <div class="office-filters">
      <div class="filter-row">
        <span class="filter-label">Estado</span>
        <button class="chip-filter ${fs === "ALL" ? "active" : ""}" onclick="setOfficeFilter('state','ALL')">Todas (${cards.length})</button>
        ${["active", "paused", "pending"].map(k => {
          const m = STATE_META[k];
          return `
          <button class="chip-filter ${fs === k ? "active" : ""} ${m.cls}" onclick="setOfficeFilter('state','${k}')"
                  title="${m.hint}">
            ${m.icon} ${m.label} (${count(k)})
          </button>`;
        }).join("")}
        <button class="chip-filter ${fs === "bin" ? "active" : ""}" onclick="setOfficeFilter('state','bin')"
                title="FLOW.md: las terminales dejan el muro para la papelera, marcadas como cuál.">
          🗑 papelera (${bin.length})
        </button>
      </div>
      <div class="filter-row">
        <span class="filter-label">Proyecto</span>
        <button class="chip-filter ${fp === "ALL" ? "active" : ""}" onclick="setOfficeFilter('proj','ALL')">Todos</button>
        ${projects.map(p => `
          <button class="chip-filter ${fp.toLowerCase() === p.toLowerCase() ? "active" : ""}" onclick="setOfficeFilter('proj','${esc(p)}')">
            ${esc(p)} (${cards.filter(c => c.project === p).length})
          </button>`).join("")}
      </div>
    </div>

    <div class="office-mural">
      ${shown.length ? shown.map(c => {
        const st = cardState(c);
        const m = STATE_META[st];
        // ⛔ Antes era `c.active ? STATE.livePlan : []`, así que toda tarjeta que no fuera
        // la del ▶ decía «sin plan abierto todavía» aunque su hoja estuviera en disco.
        const sheet = planForCard(c);
        // The plan belongs to the task. Only the active one has the live sheet; the rest
        // show what their sheet holds when the instance keeps one per task.
        const items = sheet ? sheet.items : [];
        const routed = items.filter(i => i.struck || i.outcome).length;
        const pct = items.length ? Math.round(routed / items.length * 100) : null;
        return `
          <article class="mural-card ${m.cls} ${c.active ? "mural-active" : ""}"
                   onclick="openDesk('${esc(c.id)}')" title="Abrir el despacho de esta tarea">
            <header class="mural-top">
              <span class="mural-marker ${m.cls}">${c.active ? "▶" : (c.marker || m.icon)}</span>
              <span class="mural-state ${m.cls}">${m.label}</span>
              ${st === "pending" ? `
                <span class="plan-flag ${sheet && sheet.items.length ? "planned" : "unplanned"}"
                      title="${sheet && sheet.items.length
                        ? "FLOW.md: pending es «planificada» cuando su hoja existe."
                        : "FLOW.md: pending es «sin planificar» cuando su hoja no existe. Se planifica con current-plan."}">
                  ${sheet && sheet.items.length ? "planificada" : "sin planificar"}
                </span>` : ""}
              ${c.project ? `<span class="tag-pill tag-project">${esc(c.project)}</span>` : ""}
            </header>
            <h3 class="mural-title">${inline(c.title)}</h3>

            <!-- El objetivo NO se esconde. AX-46 pide que el artefacto se lea sin la
                 conversacion que lo produjo, y una tarjeta que hay que sobrevolar para saber a
                 que sirve no cumple eso: cuesta un gesto mas, que es la version pequena de
                 costar una re-explicacion. -->
            ${c.serves ? `
              <div class="mural-serves" title="AX-46 · el objetivo al que sirve esta tarea">
                <span class="serves-k">sirve a</span>
                <span class="serves-v">${cut(c.serves, 130)}</span>
              </div>`
            : `<div class="mural-serves serves-missing" title="AX-46 pide los cuatro campos, y este falta. Se escribe en el muro como **Serves**.">
                <span class="serves-k">sirve a</span>
                <span class="serves-v">— sin declarar —</span>
              </div>`}

            <!-- La descripcion y el alcance sí se abren al pasar por encima: son el detalle,
                 y el detalle de nueve tarjetas a la vez es la saturacion que hay que evitar. -->
            ${(c.why || c.affects || c.moves_when || c.waits_on) ? `
              <div class="mural-extra">
                ${c.why ? `<p class="mural-why">${cut(c.why, 300)}</p>` : ""}
                ${c.affects ? `
                  <div class="mural-cond">
                    <span class="cond-k">toca</span>
                    <span class="cond-v">${cut(c.affects, 190)}</span>
                  </div>` : ""}
                ${(c.moves_when || c.waits_on) ? `
                  <div class="mural-cond">
                    <span class="cond-k">${c.waits_on ? "espera" : "avanza cuando"}</span>
                    <span class="cond-v">${cut(c.moves_when || c.waits_on, 190)}</span>
                  </div>` : ""}
              </div>
              <div class="mural-peek">pasa el ratón para el detalle</div>` : ""}
            ${pct !== null ? `
              <div class="mural-progress" title="${sheet.live ? "PLAN.md en vivo" : `plan ${esc(sheet.id || "")}`}">
                <div class="mural-bar"><div class="mural-fill" style="width:${pct}%"></div></div>
                <span class="mural-pct">${routed}/${items.length}${sheet.live ? " · en vivo" : ""}</span>
              </div>` : `
              <div class="mural-noplan" title="Toda tarea lleva su hoja desde que existe; ésta está vacía o no se ha encontrado su registro.">
                hoja vacía
              </div>`}
            <footer class="mural-foot">
              ${c.taskId ? `<span class="tag-pill tag-purple">${esc(c.taskId)}</span>` : ""}
              ${c.twins && c.twins.length ? `
                <span class="twin-flag" title="Se parece${c.twins.length > 1 ? "n" : ""} mucho a ésta: ${c.twins.map(t => `«${esc(t)}»`).join(" · ")}. Si son el mismo trabajo, unifica el título o declara **plan:** con el mismo id. La interfaz no las fusiona sola porque una fusión equivocada esconde una tarea, y a un tablero al que le falta trabajo no se le nota.">
                  ⧉ ${c.twins.length === 1 ? "posible duplicada" : `${c.twins.length} posibles duplicadas`}
                </span>` : ""}
              ${c.sources.map(s => `<span class="src-chip src-${s}">${s}</span>`).join("")}
              <span class="mural-go">abrir despacho →</span>
            </footer>
          </article>`;
      }).join("") : `
        <div class="empty-state">
          <div class="empty-icon">🗂️</div><h3>Nada que mostrar con este filtro</h3>
          <p>Cambia el estado o el proyecto para ver el resto del mural.</p>
        </div>`}
    </div>`;
}

// ───────────────────────────────────────────────── DESPACHO — one task's desk
function renderDesk(container) {
  const cards = officeCards();
  const card = cards.find(c => c.id === STATE.deskCardId)
            || cards.find(c => normaliseTitle(c.title) === normaliseTitle(STATE.deskCardId))
            || cards.find(c => c.active) || cards[0];
  if (!card) { STATE.currentView = "cockpit"; return renderOffice(container); }

  const st = cardState(card);
  const m = STATE_META[st];
  // ⛔ Aquí estaba la regresión. Era `isLive ? STATE.livePlan : []`, y `findPlanForFront`
  // —que ya existía y el cockpit anterior sí llamaba— dejó de usarse: toda tarea que no
  // fuera la del ▶ enseñaba un cartel de «en pausa» y ninguna hoja, aunque su plan
  // estuviera en disco. Reanudarla costaba reconstruirla, que es justo lo que el estado
  // `paused` existe para evitar.
  const sheet = planForCard(card);
  const isLive = Boolean(sheet && sheet.live);
  const items = sheet ? sheet.items : [];
  const sections = sheet ? (sheet.sections || []) : [];
  const groups = planTree(items, sections);
  const routed = items.filter(i => i.struck || i.outcome).length;
  const pct = items.length ? Math.round(routed / items.length * 100) : 0;
  const byOutcome = k => items.filter(i => i.outcome === k).length;
  const secNames = [...new Set(groups.map(g => g.section).filter(Boolean))];

  container.innerHTML = `
    <div class="desk-surface">
    <div class="desk-plate">
      <button class="crumb-link" onclick="navigateTo('cockpit')">🗂️ Oficina</button>
      <span class="crumb-sep">›</span>
      <span class="crumb-here">${inline(card.title)}</span>
      <span class="mural-state ${m.cls}">${m.icon} ${m.label}</span>
    </div>
    <svg class="desk-lamp" width="118" height="92" viewBox="0 0 118 92" aria-hidden="true">
      <!-- El flexo. Adorno: la luz que echa vive en el gradiente de la mesa, no aquí —
           ⚠️ si el dibujo desaparece, el despacho sigue leyéndose igual de bien. -->
      <defs>
        <linearGradient id="lampMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#55514a"/><stop offset="1" stop-color="#2a2825"/>
        </linearGradient>
        <linearGradient id="lampShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5d584f"/><stop offset="1" stop-color="#332f2a"/>
        </linearGradient>
        <radialGradient id="lampGlow" cx=".5" cy=".2" r=".9">
          <stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/>
          <stop offset="1" stop-color="#f4cf78" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- el cono de luz, hacia la mesa -->
      <path d="M60 40 L104 88 L30 88 Z" fill="url(#lampGlow)" opacity=".55"/>
      <!-- peana -->
      <ellipse cx="24" cy="85" rx="19" ry="5" fill="rgba(30,16,6,.45)"/>
      <path d="M8 84 h32 a3 3 0 0 1 0 5 h-32 a3 3 0 0 1 0-5z" fill="url(#lampMetal)"/>
      <!-- columna y brazo articulado -->
      <path d="M24 84 L24 52" stroke="url(#lampMetal)" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M24 52 L58 30" stroke="url(#lampMetal)" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="24" cy="52" r="4" fill="#4a463f"/>
      <circle cx="58" cy="30" r="3.6" fill="#4a463f"/>
      <!-- pantalla, mirando abajo -->
      <path d="M50 18 L78 12 L70 38 L47 30 Z" fill="url(#lampShade)"/>
      <ellipse cx="58.5" cy="34" rx="12" ry="4.6" transform="rotate(-14 58.5 34)" fill="#ffeeb8"/>
    </svg>
    <div class="desk-hero ${m.cls}">
      <div class="desk-hero-main">
        <h1 class="desk-title">${inline(card.title)}</h1>
        <div class="desk-hero-tags">
          ${card.project ? `<span class="tag-pill tag-project-hero">${esc(card.project)}</span>` : ""}
          ${card.taskId ? `<span class="tag-pill tag-purple">${esc(card.taskId)}</span>` : ""}
          ${card.described_in ? `<span class="tag-pill"><code>${esc(card.described_in)}</code></span>` : ""}
        </div>

        <!-- Los cuatro campos de AX-46, en la cabecera y en este orden: a que sirve, que pasa,
             que toca. Es lo primero que se lee al entrar, porque es lo que responde a "que
             estoy haciendo aqui" sin abrir nada mas. Un campo que falta se nombra en su sitio
             en vez de desaparecer: un hueco declarado se rellena, uno callado no. -->
        <dl class="ax46">
          <div class="ax46-row ${card.serves ? "" : "ax46-missing"}">
            <dt>Sirve a</dt>
            <dd>${card.serves ? inline(card.serves)
              : `<span class="ax46-gap">sin declarar — se escribe en el muro como <code>**Serves**</code></span>`}</dd>
          </div>
          <div class="ax46-row ${card.why ? "" : "ax46-missing"}">
            <dt>Qué pasa</dt>
            <dd>${card.why ? expandable(card.why)
              : `<span class="ax46-gap">sin declarar — <code>**Why it is committed**</code></span>`}</dd>
          </div>
          <div class="ax46-row ${card.affects ? "" : "ax46-missing"}">
            <dt>Qué toca</dt>
            <dd>${card.affects ? inline(card.affects)
              : `<span class="ax46-gap">sin declarar — <code>**What it affects**</code></span>`}</dd>
          </div>
          ${(card.moves_when || card.waits_on) ? `
            <div class="ax46-row">
              <dt>${card.waits_on ? "Espera a" : "Avanza cuando"}</dt>
              <dd>${inline(card.moves_when || card.waits_on)}</dd>
            </div>` : ""}
        </dl>
      </div>
      ${isLive ? `
        ${items.length ? `
          <div class="tally">
            <!-- ⚠️ Etiquetado. En una tarea de triaje esta cuenta convive con la de la mesa, y
                 miden cosas distintas: aquí items del plan, allí entradas del buzón. Dos
                 números grandes sin decir de qué son es la manera de leer el equivocado. -->
            <span class="tally-what">items de esta hoja</span>
            <div class="tally-pair">
              <span class="tally-done">
                <span class="tally-n">${routed}</span>
                <span class="tally-l">hechos</span>
              </span>
              <span class="tally-sep"></span>
              <span class="tally-open">
                <span class="tally-n">${items.length - routed}</span>
                <span class="tally-l">${items.length - routed === 1 ? "abierto" : "abiertos"}</span>
              </span>
            </div>
            <div class="tally-bar"><div class="tally-fill" style="width:${pct}%"></div></div>
            <div class="tally-out">
              ${Object.entries(OUTCOMES).filter(([k]) => byOutcome(k)).map(([k, o]) =>
                `<span class="oc ${o.cls}" title="${o.hint}">${o.icon} ${byOutcome(k)}</span>`).join("")}
            </div>
          </div>` : ""}` : ""}
    </div>

    <div class="desk-grid">
      <section class="desk-work">
      ${renderTriageBench(card)}
      <div class="sheet">
        ${sheet ? `
          ${!isLive ? `
            <div class="sheet-banner ${m.cls}">
              <span class="sheet-banner-icon">${m.icon}</span>
              <div>
                <strong>Hoja conservada${sheet.id ? ` · <code>${esc(sheet.id)}</code>` : ""}</strong>
                <span>${st === "paused"
                  ? "Esta tarea ha estado activa y su hoja se guarda tal cual la dejaste — con sus items tachados y sus destinos. Reanudarla cuesta leer, no reconstruir."
                  : "Se lee de su registro de plan. Sólo la tarea del <code>▶</code> escribe en el <code>PLAN.md</code> en vivo, así que aquí no hay botones de enrutado."}</span>
              </div>
              ${STATE.activeFront ? `<button class="btn-quick out-done" onclick="navigateTo('cockpit')">ver la activa →</button>` : ""}
            </div>` : ""}
          ${sheet.meta?.order_why ? `
            <div class="order-why-card">
              <div class="order-why-header"><span class="order-why-icon">🧠</span>
                <strong>El orden, y por qué este orden</strong>
                ${!isLive && sheet.id ? `<span class="order-why-badge">${esc(sheet.id)}</span>` : ""}</div>
              <div class="order-why-body">${inline(sheet.meta.order_why)}</div>
            </div>` : ""}

          ${groups.length ? groups.map(g => {
            const gr = g.items.filter(i => i.struck || i.outcome).length;
            return `
            <div class="plan-section">
              <div class="plan-section-head">
                <h3>${g.subsection ? `<span class="sec-parent">${esc(g.section || "")} ›</span> ` : ""}${esc(g.subsection || g.section || "Plan")}</h3>
                <span class="sec-kind" title="${g.ordered ? "los items van uno detrás de otro" : "sin orden: se pueden hacer en cualquier secuencia"}">
                  ${g.ordered ? "↓ en orden" : "⇄ sin orden"}
                </span>
                <span class="sec-count ${gr === g.items.length ? "sec-all" : ""}"
                      title="${gr} de ${g.items.length} con destino">${gr}/${g.items.length}</span>
              </div>
              <div class="plan-section-items">
                ${g.items.map(i => renderPlanItem(i, isLive)).join("")}
              </div>
            </div>`;
          }).join("") : `
            <div class="empty-state"><div class="empty-icon">📋</div>
              <h3>El plan está vacío</h3>
              <p>Esta tarea tiene su hoja desde que existe (<code>FLOW.md</code>), pero nadie la ha
                 planificado todavía. ${isLive
                   ? "Escribe abajo el primer item, o invoca <code>current-plan</code>."
                   : "Se planifica con <code>current-plan</code>."}</p>
            </div>`}

          ${isLive ? `
          <!-- CAPTURA EN VIVO -->
          <div class="capture-box">
            <div class="capture-head">
              <strong>📝 Anota sin salir de aquí</strong>
              <span>Entra al plan <em>sin destino</em>. Lo leo del disco y decidimos juntos a dónde va.</span>
            </div>
            <div class="capture-row">
              <textarea id="captureInput" rows="2" placeholder="Una idea, una observación, algo que acaba de surgir… (Ctrl+Enter para añadir)"
                        onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter')addPlanNote()"></textarea>
            </div>
            <div class="capture-actions">
              ${secNames.length > 1 ? `
                <select id="captureSection" class="custom-select capture-sel">
                  ${secNames.map(s => `<option value="${esc(s)}">en «${esc(s)}»</option>`).join("")}
                </select>` : `<input type="hidden" id="captureSection" value="${esc(secNames[0] || "")}">`}
              <label class="capture-ord">
                <input type="checkbox" id="captureOrdered" checked> lleva número
              </label>
              <button class="btn-submit" onclick="addPlanNote()">＋ Añadir al plan</button>
            </div>
          </div>` : ""}
        ` : `
          <div class="front-state-card ${st === "paused" ? "paused-state-card" : "queued-state-card"}">
            <div class="state-card-icon">${m.icon}</div>
            <h3>Sin hoja que enseñar</h3>
            <p class="state-card-desc">
              Toda tarea lleva una desde que existe (<code>FLOW.md</code>), así que esto significa
              una de dos: <strong>está vacía porque nadie la ha planificado</strong>, o
              <strong>su registro de plan no se ha encontrado</strong> — y la interfaz no puede
              distinguirlo desde fuera.
            </p>
            <div class="state-detail-box">
              <strong>${card.waits_on ? "Espera a" : "Condición de avance"}:</strong>
              <p>${inline(card.moves_when || card.waits_on || "Secuenciada en el orden de trabajo.")}</p>
            </div>
            <div class="state-guidance-box">
              <span>💡 Se planifica con <code>current-plan</code>. Si crees que su plan existe,
                    comprueba que la tarea declare <code>**plan:**</code> con su id — es lo que
                    la ata a su registro sin depender de que los títulos se parezcan.</span>
            </div>
          </div>`}
      </div></section>

      <aside class="desk-rail">
        <div class="rail-panel">
          <div class="rail-head"><strong>🧾 Traza de la sesión</strong>
            <button class="rail-refresh" onclick="loadTrace()" title="Releer el diario">⟳</button></div>
          <div id="traceRail" class="trace-list">${renderTraceList()}</div>
        </div>
        <div class="rail-panel rail-legend">
          <div class="rail-head"><strong>Los cuatro destinos</strong></div>
          ${Object.entries(OUTCOMES).map(([k, o]) => `
            <div class="legend-row ${o.cls}"><span>${o.icon}</span>
              <div><strong>${o.label}</strong><em>${o.hint}</em></div></div>`).join("")}
          <p class="rail-note">Un item tachado sin destino es un <strong>cierre fallido</strong>
             — el parser lo reporta y aquí no puede ocurrir: los cuatro botones son los únicos
             caminos de salida.</p>
        </div>
      </aside>
    </div>
    </div>`;
}

// ───────────────────────────────────────────────── acciones de la oficina
window.setOfficeFilter = function (which, val) {
  if (which === "proj") STATE.officeFilterProj = val; else STATE.officeFilterState = val;
  renderView();
};

window.openDesk = function (cardId) {
  STATE.deskCardId = cardId;
  STATE.currentView = "desk";
  renderView();
  loadTrace();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.addPlanNote = async function () {
  const ta = document.getElementById("captureInput");
  const text = (ta?.value || "").trim();
  if (!text) return;
  const section = document.getElementById("captureSection")?.value || "";
  const ordered = document.getElementById("captureOrdered")?.checked !== false;
  try {
    const d = await api("POST", "/api/plan/item", { text, section, ordered });
    ta.value = "";
    confirmWrite(d, "Anotado en el plan, sin destino");
  } catch (e) { reportWriteError(e); }
};

window.routePlanItem = async function (line, expect, outcome) {
  try {
    const d = await api("PATCH", "/api/plan/item", { line, expect, outcome });
    confirmWrite(d, `Item enrutado: ${OUTCOMES[outcome].label}`);
  } catch (e) { reportWriteError(e); }
};

// ───────────────────────────────────────────────── los handlers que faltaban
//
// ⛔ `index.html` called all of these and none of them existed. The modals opened and
// could not close; submitting a form threw and reloaded the page, so the entry was lost
// *and* the view was reset. Every one of them now writes through the API and reports what
// the server actually did.
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}
window.closeTaskModal    = () => closeModal("taskModal");

window.toggleScratchpad = function () {
  const d = document.getElementById("scratchpadDrawer");
  if (!d) return;
  d.classList.toggle("open");
  if (d.classList.contains("open")) {
    const ta = document.getElementById("scratchpadInput");
    if (ta) {
      // ⚠️ Restored from storage, never blanked. A scratchpad that empties on close is a
      // scratchpad that eats what was written in it, which is `PH-3` broken by a widget.
      ta.value = localStorage.getItem(STORAGE_KEYS.SCRATCHPAD) || "";
      ta.oninput = () => localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, ta.value);
      ta.focus();
    }
  }
};

window.handleCreateTask = async function (ev) {
  ev.preventDefault();
  const title = document.getElementById("taskTitle")?.value.trim();
  const project = document.getElementById("taskProject")?.value;
  const status = document.getElementById("taskStatus")?.value || "⬜";
  const why = document.getElementById("taskWhy")?.value.trim();
  try {
    const d = await api("POST", "/api/task", { title, project, status, why });
    closeModal("taskModal");
    document.getElementById("taskForm")?.reset();
    confirmWrite(d, `Tarea ${d.id || ""} creada`);
  } catch (e) { reportWriteError(e); }
  return false;
};

window.convertScratchpadToTask = function () {
  const t = (document.getElementById("scratchpadInput")?.value || "").trim();
  if (!t) { showToast("El bloc está vacío."); return; }
  openTaskModal();
  const title = document.getElementById("taskTitle");
  const why = document.getElementById("taskWhy");
  if (title) title.value = t.split("\n")[0].slice(0, 120);
  if (why) why.value = t;
  updateTaskPreview();
};

// ───────────────────────────────────────────────── EL BUZÓN — agente → operador
//
// ⛔ It was parsed into `STATE.mailbox` and read by no view. The queue that carries what an
// agent found, proposed or crossed simply did not appear in the interface, and `METHOD.md`
// §4 is two queues running in opposite directions — with one of them invisible, the loop
// the operator is supposed to close had no surface at all.
const MAILBOX_STATE = {
  open:     { icon: "🟢", label: "abierta",  cls: "mb-open" },
  pending:  { icon: "🟡", label: "pendiente", cls: "mb-pending" },
  resolved: { icon: "✅", label: "resuelta",  cls: "mb-resolved" },
  archived: { icon: "📦", label: "archivada", cls: "mb-archived" }
};

function renderMailboxPanel() {
  const all = STATE.mailbox || [];
  const fState = STATE.mailboxFilter || "abiertas";
  const fDest = STATE.mailboxDest || "TODOS";

  // Los casilleros son los destinos que la propia centralita ha escrito. ⚠️ No una lista
  // fija: un destino nuevo en el vocabulario aparece aquí solo, y uno que deja de usarse
  // desaparece — que es lo que separa un casillero de una etiqueta inventada por la vista.
  const dests = [...new Set(all.map(e => e.destination).filter(Boolean))].sort();
  const inState = e => fState === "todas" || ["open", "pending"].includes(e.state);
  const shown = all.filter(e => inState(e) && (fDest === "TODOS" || e.destination === fDest));
  const nOpen = all.filter(e => ["open", "pending"].includes(e.state)).length;

  return `
    <div class="post-office">
      <!-- LA VENTANILLA -->
      <div class="po-counter">
        <div class="po-counter-sign">
          <span class="po-sign-icon">✉</span>
          <div>
            <h2>Buzón</h2>
            <span class="po-sign-sub">agente → operador</span>
          </div>
        </div>
        <p class="po-blurb">
          Lo que un agente encontró, propuso o cruzó y todavía no está integrado.
          <strong>Nadie vacía la cola que llena</strong> (<code>AX-15</code>): estas entradas
          las enrutas tú, y por eso llegan con un destino <em>propuesto</em>, no decidido.
        </p>
        <div class="po-tally">
          <span class="po-tally-n">${nOpen}</span>
          <span class="po-tally-l">sin cerrar<br>de ${all.length}</span>
        </div>
      </div>

      <!-- LOS CASILLEROS -->
      <div class="pigeonholes">
        <button class="hole ${fDest === "TODOS" ? "hole-on" : ""}" onclick="setMailboxDest('TODOS')">
          <span class="hole-slot"><span class="hole-stack" style="--n:${Math.min(all.filter(inState).length, 5)}"></span></span>
          <span class="hole-label">todo</span>
          <span class="hole-n">${all.filter(inState).length}</span>
        </button>
        ${dests.map(d => {
          const n = all.filter(e => inState(e) && e.destination === d).length;
          return `
            <button class="hole ${fDest === d ? "hole-on" : ""} ${n ? "" : "hole-empty"}"
                    onclick="setMailboxDest('${esc(d)}')" title="Destino propuesto: ${esc(d)}">
              <span class="hole-slot"><span class="hole-stack" style="--n:${Math.min(n, 5)}"></span></span>
              <span class="hole-label">${esc(d)}</span>
              <span class="hole-n">${n}</span>
            </button>`;
        }).join("")}
        <div class="hole-sep"></div>
        <button class="chip-filter ${fState === "abiertas" ? "active" : ""}" onclick="setMailboxFilter('abiertas')">
          sin cerrar
        </button>
        <button class="chip-filter ${fState === "todas" ? "active" : ""}" onclick="setMailboxFilter('todas')">
          incluir cerradas (${all.length})
        </button>
      </div>

      <!-- EL CORREO -->
      <div class="po-mail">
        ${shown.length ? shown.map(e => {
          const s = MAILBOX_STATE[e.state] || MAILBOX_STATE.open;
          const [y, mo, d] = String(e.date || "").split("-");
          return `
            <article class="letter ${s.cls} ${["open","pending"].includes(e.state) ? "letter-airmail" : ""}">
              <div class="letter-franking">
                <!-- EL SELLO. Su dibujo es el destino propuesto. -->
                <div class="stamp" title="Destino propuesto: ${esc(e.destination)}">
                  <span class="stamp-dest">${esc(e.destination)}</span>
                  <span class="stamp-value">${esc(e.project)}</span>
                </div>
                <!-- EL MATASELLOS. Lleva la fecha, que es lo que un matasellos lleva. -->
                <div class="postmark" aria-hidden="true">
                  <span class="pm-ring"></span>
                  <span class="pm-day">${esc(d || "··")}</span>
                  <span class="pm-mon">${esc(mo || "··")}</span>
                  <span class="pm-year">${esc(y || "····")}</span>
                </div>
              </div>

              <div class="letter-body">
                <div class="letter-from">
                  <span class="lf-k">De</span>
                  <span class="lf-v">${esc(e.author)}</span>
                  ${e.origin_inferred ? `<span class="lf-inf" title="Inferido, no escrito en el fichero">inferido</span>` : ""}
                  <span class="lf-sep">·</span>
                  <span class="lf-k">Para</span>
                  <span class="lf-v">operador</span>
                </div>

                <h3 class="letter-subject">${inline(e.title)}</h3>

                ${e.body ? `<div class="letter-text">${renderMarkdownBody(e.body)}</div>`
                         : `<p class="letter-empty">— la carta llegó sin cuerpo: sólo la cabecera —</p>`}

                <div class="letter-foot">
                  <span class="letter-ref" title="Dónde está exactamente"><code>${esc(e.file || "")}${e.line ? `:${e.line}` : ""}</code></span>
                  <span class="cuno cuno-${e.state}">${s.label}</span>
                </div>
              </div>
            </article>`;
        }).join("") : `
          <div class="po-empty">
            <div class="po-empty-mark">✉</div>
            <h3>${fDest === "TODOS" ? "No hay correo sin cerrar" : `El casillero «${esc(fDest)}» está vacío`}</h3>
            <p>Un buzón que entra lleno y sale lleno significa que la sesión no cerró nada
               (<code>METHOD.md</code> §4).</p>
          </div>`}
      </div>
    </div>`;
}

window.setMailboxDest = function (d) { STATE.mailboxDest = d; renderView(); };

window.setMailboxFilter = function (v) { STATE.mailboxFilter = v; renderView(); };


// ═════════════════════════════════════════════════════════════════════════════
// DOCTRINA — la filosofía, los axiomas y los ficheros estructurales
//
// ⛔ Nothing here is transcribed. `/api/doctrine` parses MLabs' own files and this layer
// paints what comes back, so the page cannot state a clause the file does not. The build
// before this one hard-coded six clauses: it named `PH-0` as something it had stopped
// being, described `PH-1` as a clause that was never written, omitted `PH-6` entirely, and
// printed "30 axiomas activos" against a real 34. Every one of those looked authoritative.
// `AX-20` names the duplicate and `AX-36` names the hand-typed count.
// ═════════════════════════════════════════════════════════════════════════════

// Qué se ha tocado hoy, de git. ⚠️ Falla en silencio a propósito: es una marca de ayuda
// sobre un dato que ya está completo sin ella, así que un árbol que no es repositorio da una
// vista igual de correcta, sólo sin la marca.
async function loadRecent() {
  try {
    const d = await api("GET", "/api/recent");
    STATE.recentLines = d.lines || {};
  } catch (_) { STATE.recentLines = {}; }
}

async function loadDoctrine() {
  try {
    const d = await api("GET", "/api/doctrine");
    const of = k => (d.entities || []).filter(e => e.kind === k);
    STATE.doctrine = {
      clauses:  of("clause"),
      axioms:   of("axiom"),
      coverage: of("coverage"),
      refusals: of("refusal"),
      docs:     of("doc"),
      problems: d.problems || [],
      root: d.root
    };
  } catch (e) {
    // ⚠️ A doctrine that will not load says so. The alternative is a page that quietly
    // falls back to a copy, which is the failure this whole layer exists to remove.
    STATE.doctrine = { error: e.message, clauses: [], axioms: [], coverage: [],
                       refusals: [], docs: [], problems: [] };
  }
  if (["overview", "clause", "doc", "dashboard"].includes(STATE.currentView)) renderView();
}

const D = () => STATE.doctrine || { clauses: [], axioms: [], coverage: [], refusals: [], docs: [] };
const clauseOf = id => D().clauses.find(c => c.id === id) || null;
const axiomsOf = id => D().axioms.filter(a => (a.serves || []).includes(id));
const coverageOf = id => D().coverage.find(c => c.id === id) || null;

// Los estados del check, que `AXIOMS.md` prohíbe expresamente sumar como uno solo.
const CHECKS = {
  "$":    { icon: "▶", label: "ejecutable", cls: "chk-run",
            hint: "un comando que corre hoy y devuelve un veredicto — y puede bajar" },
  owed:   { icon: "⊘", label: "en deuda", cls: "chk-owed",
            hint: "hay check nombrado y no corre: AX-7 roto, declarado" },
  none:   { icon: "·", label: "sin check", cls: "chk-none",
            hint: "el vacío honesto" }
};

// Una cláusula, un color. ⚠️ Es vocabulario, no adorno: el mismo color identifica la
// cláusula en el frontón, en su columna, en su página y en el dashboard.
const CLAUSE_TONE = {
  "PH-0": "tone-gold", "PH-1": "tone-aegean", "PH-2": "tone-olive",
  "PH-3": "tone-terracotta", "PH-4": "tone-grape", "PH-5": "tone-ink",
  "PH-6": "tone-cyan"
};

// El título griego de cada cláusula. ⚠️ Es decoración tipográfica y NO una traducción:
// el nombre que manda es el del fichero, que se pinta al lado en todas partes.
const CLAUSE_GREEK = {
  "PH-0": "ΔΙΑΜΟΝΗ", "PH-1": "ΑΥΞΗΣΙΣ", "PH-2": "ΑΝΤΟΧΗ", "PH-3": "ΜΝΗΜΗ",
  "PH-4": "ΑΡΧΗ", "PH-5": "ΠΡΟΣΟΧΗ", "PH-6": "ΜΕΤΡΟΝ"
};

// El cuerpo de una cláusula lleva marcadores que son estructura, no énfasis: `⛔` es un
// límite y `⚠️` una trampa. Se separan para que la página los pueda tratar distinto.
function clauseParts(body) {
  const out = { lead: [], stops: [], warns: [] };
  for (const para of String(body || "").split(/\n\s*\n/)) {
    const t = para.trim();
    if (!t) continue;
    if (t.startsWith("⛔")) out.stops.push(t);
    else if (t.startsWith("⚠️")) out.warns.push(t);
    else out.lead.push(t);
  }
  return out;
}

// ───────────────────────────────────────────────── el frontón y las columnas
function renderPediment() {
  const ph0 = clauseOf("PH-0");
  if (!ph0) {
    return `<div class="empty-state"><div class="empty-icon">🏛️</div>
      <h3>La doctrina no ha cargado</h3>
      <p>${esc(D().error || "PHILOSOPHY.md no está en la raíz del motor.")}
         Esta página se lee de los ficheros; no lleva copia.</p></div>`;
  }
  const cls = D().clauses.filter(c => !c.objective);
  return `
    <section class="temple">
      <svg class="pediment" viewBox="0 0 1000 132" preserveAspectRatio="none" aria-hidden="true">
        <!-- ⚠️ El frontón es adorno y nada más: quítalo y la portada sigue diciendo lo
             mismo, porque todo el texto vive en las columnas y en la placa. -->
        <defs>
          <linearGradient id="marble" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fbf8ef"/><stop offset="1" stop-color="#e9e2d1"/>
          </linearGradient>
        </defs>
        <polygon points="500,4 998,116 2,116" fill="url(#marble)" stroke="#c2b79c" stroke-width="2"/>
        <rect x="0" y="116" width="1000" height="16" fill="#efe9da" stroke="#cfc4a8" stroke-width="1.5"/>
        <polygon points="500,26 946,112 54,112" fill="none" stroke="#d5cab0" stroke-width="1.4"/>
        <circle cx="500" cy="80" r="13" fill="none" stroke="#c8bda2" stroke-width="1.8"/>
        <circle cx="500" cy="80" r="5" fill="#dfd6bf"/>
      </svg>

      <div class="architrave">
        <div class="ph0-plate tone-gold">
          <span class="ph0-greek">${CLAUSE_GREEK["PH-0"]}</span>
          <span class="ph0-id">PH-0 · ${esc(ph0.title)}</span>
          <blockquote class="ph0-slogan">${inline(ph0.epigraph || "")}</blockquote>
          <p class="ph0-gloss">
            Esto es <strong>para lo que existe la empresa</strong>. Ningún axioma la sirve
            directamente: la sirven las cláusulas, y cada una cierra una manera concreta de
            perderla.
          </p>
        </div>
      </div>

      <div class="colonnade">
        ${cls.map(c => {
          const cov = coverageOf(c.id);
          const ax = axiomsOf(c.id);
          const runnable = ax.filter(a => a.check_state === "$").length;
          return `
            <button class="column ${CLAUSE_TONE[c.id] || ""}" onclick="openClause('${c.id}')"
                    title="${esc(c.epigraph || c.title)}">
              <span class="capital"></span>
              <span class="shaft">
                <span class="col-greek">${CLAUSE_GREEK[c.id] || ""}</span>
                <span class="col-id">${c.id}</span>
                <span class="col-title">${esc(c.title)}</span>
                ${c.epigraph ? `<span class="col-epigraph">${esc(c.epigraph)}</span>` : ""}
              </span>
              <span class="base">
                <span class="base-n">${cov ? esc(cov.count) : ax.length}</span>
                <span class="base-l">axioma${ax.length === 1 ? "" : "s"}${runnable ? ` · ${runnable} con check` : ""}</span>
              </span>
            </button>`;
        }).join("")}
      </div>
      <div class="stylobate"></div>
    </section>`;
}

// ───────────────────────────────────────────────── una cláusula, entera
function renderClause(container) {
  const c = clauseOf(STATE.clauseId);
  if (!c) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏛️</div>
      <h3>Cláusula no encontrada</h3>
      <p>${esc(STATE.clauseId || "")} no está en <code>PHILOSOPHY.md</code>.</p>
      <button class="btn-retry" onclick="navigateTo('overview')">Volver a la portada</button></div>`;
    return;
  }
  const tone = CLAUSE_TONE[c.id] || "";
  const parts = clauseParts(c.body);
  const ax = axiomsOf(c.id);
  const cov = coverageOf(c.id);
  const byCheck = s => ax.filter(a => a.check_state === s);
  const others = D().clauses.filter(x => !x.objective && x.id !== c.id);

  container.innerHTML = `
    <div class="desk-plate clause-plate ${tone}">
      <button class="crumb-link" onclick="navigateTo('overview')">🏛️ Portada</button>
      <span class="crumb-sep">›</span>
      <span class="crumb-here">${c.id} · ${esc(c.title)}</span>
      <span class="clause-file"><code>PHILOSOPHY.md:${c.line}</code></span>
    </div>

    <header class="clause-hero ${tone}">
      <div class="clause-hero-mark">
        <span class="clause-greek">${CLAUSE_GREEK[c.id] || ""}</span>
        <span class="clause-id">${c.id}</span>
      </div>
      <div class="clause-hero-main">
        <h1>${esc(c.title)}</h1>
        ${c.epigraph ? `<blockquote class="clause-epigraph">${inline(c.epigraph)}</blockquote>` : ""}
        ${c.objective ? `<p class="clause-objective-note">
            Ésta no es una cláusula: es <strong>el objetivo</strong>. Las demás existen para
            protegerla, y por eso ningún axioma la sirve directamente.</p>` : ""}
      </div>
    </header>

    <div class="clause-grid">
      <section class="clause-body">
        ${parts.lead.map(t => `<div class="clause-para">${renderMarkdownBody(t)}</div>`).join("")}
        ${parts.warns.map(t => `
          <div class="callout callout-warning"><span class="callout-icon">⚠️</span>
            <div class="callout-content">${inline(t.replace(/^⚠️\s*/, ""))}</div></div>`).join("")}
        ${parts.stops.map(t => `
          <div class="callout callout-danger"><span class="callout-icon">⛔</span>
            <div class="callout-content">${inline(t.replace(/^⛔\s*/, ""))}</div></div>`).join("")}

        <div class="clause-axioms">
          <div class="clause-axioms-head">
            <h2>Axiomas que la sirven</h2>
            <span class="tag-pill tag-live">${ax.length}</span>
            ${cov && cov.count !== String(ax.length) ? `
              <span class="cov-mismatch" title="La tabla de cobertura de AXIOMS.md y las filas leídas no dan el mismo número">
                ⚠️ la tabla de cobertura dice ${esc(cov.count)}
              </span>` : ""}
          </div>
          ${ax.length ? `
            <div class="check-summary">
              ${Object.entries(CHECKS).map(([k, m]) => `
                <span class="chk-pill ${m.cls}" title="${m.hint}">
                  ${m.icon} ${byCheck(k).length} ${m.label}
                </span>`).join("")}
            </div>
            <div class="axiom-list">
              ${ax.map(a => renderAxiomRow(a, c.id)).join("")}
            </div>` : `
            <p class="clause-zero">
              ${c.objective
                ? "Cero, por diseño. <code>PH-0</code> la sirven las cláusulas, no los axiomas — y una tabla de cobertura que esperase una regla aquí reportaría un hueco que no existe."
                : "Ninguno. Una cláusula sin axioma detrás es un valor sin dientes."}
            </p>`}
        </div>
      </section>

      <aside class="clause-rail">
        <div class="rail-panel">
          <div class="rail-head"><strong>Las otras cláusulas</strong></div>
          ${others.map(o => `
            <button class="clause-jump ${CLAUSE_TONE[o.id] || ""}" onclick="openClause('${o.id}')">
              <span class="cj-id">${o.id}</span>
              <span class="cj-title">${esc(o.title)}</span>
              <span class="cj-n">${axiomsOf(o.id).length}</span>
            </button>`).join("")}
        </div>
        <div class="rail-panel">
          <div class="rail-head"><strong>Los tres niveles</strong></div>
          <ol class="levels-list">
            <li><strong>Filosofía</strong><em>para qué existe · rompe todo empate</em></li>
            <li><strong>Axiomas</strong><em>las reglas que la implementan · nunca se violan</em></li>
            <li><strong>Decisiones</strong><em>con autor, fecha y razón · viven en la centralita</em></li>
          </ol>
          <p class="rail-note">Los mismos tres niveles se repiten un piso más abajo dentro de
             cada proyecto, con su propio auditor.</p>
        </div>
      </aside>
    </div>`;
}

function renderAxiomRow(a, highlightClause) {
  const m = CHECKS[a.check_state] || CHECKS.none;
  return `
    <article class="axiom-row ${m.cls}">
      <div class="axiom-row-head">
        <span class="axiom-id">${esc(a.id)}</span>
        <span class="axiom-status ${a.status === "in-force" ? "st-force" : "st-proposed"}">
          ${a.status === "in-force" ? "🟢 en vigor" : "🟡 propuesto"}
        </span>
        <span class="chk-pill ${m.cls}" title="${m.hint}">${m.icon} ${m.label}</span>
        <span class="axiom-serves">
          ${(a.serves || []).map(s => `
            <button class="serves-chip ${s === highlightClause ? "is-here" : ""} ${CLAUSE_TONE[s] || ""}"
                    onclick="event.stopPropagation(); openClause('${s}')">${s}</button>`).join("")}
        </span>
      </div>
      <div class="axiom-text">${inline(a.text)}</div>
      ${a.check && a.check !== "—" ? `<div class="axiom-check">${inline(a.check)}</div>` : ""}
    </article>`;
}

// ───────────────────────────────────────────────── los ficheros estructurales
const DOC_META = {
  PHILOSOPHY: { icon: "🏛️", greek: "ΛΟΓΟΣ", tone: "tone-gold",
    q: "¿Para qué existe esta empresa y qué rechaza?",
    role: "Nivel 1. Rompe todo empate. Cambia casi nunca, y sólo el operador." },
  AXIOMS: { icon: "⚖️", greek: "ΝΟΜΟΣ", tone: "tone-aegean",
    q: "¿Qué reglas no se violan nunca?",
    role: "Nivel 2. Una regla por fila, con la cláusula que sirve y su check." },
  AGENTS: { icon: "🗺️", greek: "ΤΑΞΙΣ", tone: "tone-olive",
    q: "¿Quién hace qué, y en qué ocasión?",
    role: "La orquestación: los roles, los invariantes y la regla de contratar y despedir." },
  METHOD: { icon: "🔁", greek: "ΟΔΟΣ", tone: "tone-terracotta",
    q: "¿Cómo fluye el trabajo, de verdad, cada día?",
    role: "El bucle, las dos colas y la tabla de enrutado. Es el que se usa a diario." },
  FLOW: { icon: "🧬", greek: "ΜΟΡΦΗ", tone: "tone-grape",
    q: "¿Qué forma tiene el trabajo?",
    role: "El anidamiento y los estados. Es el fichero a cambiar para otro flujo de trabajo." },
  README: { icon: "🚪", greek: "ΠΥΛΗ", tone: "tone-cyan",
    q: "¿Por dónde entra alguien que llega de cero?",
    role: "La puerta de entrada pública del repositorio." }
};
// El orden de lectura que `AGENTS.md` §1 declara, y que no es el alfabético.
const DOC_ORDER = ["PHILOSOPHY", "AXIOMS", "AGENTS", "METHOD", "FLOW", "README"];

function renderStructuralFiles(collapsed) {
  const docs = D().docs;
  const have = id => docs.find(d => d.id === id);
  const rows = DOC_ORDER.map(id => {
    const d = have(id);
    const meta = DOC_META[id] || {};
    const own = id === "PHILOSOPHY" || id === "AXIOMS";
    const inner = id === "PHILOSOPHY" ? `${D().clauses.length} cláusulas`
                : id === "AXIOMS" ? `${D().axioms.length} axiomas`
                : d ? `${d.outline.length} secciones` : "—";
    const words = d ? `${d.words.toLocaleString("es")} palabras` : own ? "" : "no encontrado";
    const go = id === "PHILOSOPHY" ? `openClause('PH-0')`
             : id === "AXIOMS" ? `navigateTo('dashboard')` : `openDoc('${id}')`;
    const goLabel = id === "PHILOSOPHY" ? "abrir el frontón →"
                  : id === "AXIOMS" ? "ver los checks →" : "leer entero →";
    return `
      <button class="stele ${meta.tone || ""}" onclick="${go}" ${!d && !own ? "disabled" : ""}>
        <span class="stele-top">
          <span class="stele-icon">${meta.icon || "📄"}</span>
          <span class="stele-greek">${meta.greek || ""}</span>
        </span>
        <span class="stele-name">${id}.md</span>
        <span class="stele-q">${esc(meta.q || "")}</span>
        <span class="stele-role">${esc(meta.role || "")}</span>
        <span class="stele-foot">
          <span class="stele-n">${inner}</span>
          ${words ? `<span class="stele-w">${words}</span>` : ""}
          <span class="stele-go">${goLabel}</span>
        </span>
      </button>`;
  }).join("");

  return `
    <section class="doc-section" id="sec-structure">
      <div class="section-head" onclick="toggleOverviewSection('sec-structure')">
        <h2><span class="num">03</span> <span class="sec-greek">ΣΤΗΛΑΙ</span> Los ficheros troncales</h2>
        <button class="section-toggle">${collapsed ? "▶ Desplegar" : "▼ Plegar"}</button>
      </div>
      <div class="section-body ${collapsed ? "collapsed" : ""}">
        <p class="section-lead">
          Se leen en este orden: <strong>filosofía</strong>, para qué → <strong>axiomas</strong>,
          las reglas que se derivan → <strong>este mapa</strong>, quién hace qué →
          <strong>el método</strong>, que es el que se usa todos los días → <strong>la forma</strong>
          que toma el trabajo. Cada uno abre su página entera con índice.
        </p>
        <div class="stelae">${rows}</div>

        ${renderNesting()}
        ${renderCloseLadder()}

        ${D().problems && D().problems.length ? `
          <div class="callout callout-warning"><span class="callout-icon">⚠️</span>
            <div class="callout-content"><strong>La doctrina cargó con incidencias.</strong>
            ${D().problems.map(x => `<div><code>${esc(x.file || "")}</code> — ${esc(x.why || "")}</div>`).join("")}</div>
          </div>` : ""}
      </div>
    </section>`;
}

// El anidamiento que declara `FLOW.md`. ⚠️ Los cinco niveles y sus glosas se escriben aquí
// porque `FLOW.md` los dibuja en un bloque de código ASCII, que no es una estructura que se
// pueda leer sin adivinar. Es la única transcripción que queda en esta página, y va marcada.
const NESTING = [
  ["project",   "proyecto",  "un repositorio soberano, con su propio ciclo de vida"],
  ["block",     "bloque",    "propuesto por adelantado — la forma del trabajo"],
  ["sub-block", "sub-bloque","definido al llegar, no antes. Una <em>pieza del plan</em>, todavía no un compromiso"],
  ["↓ promoción","promoción", "<strong>alguien decide que es su momento</strong>, y sólo entonces sale al muro"],
  ["task",      "tarea",     "en el muro, con su propia hoja. <strong>Una tarea es un compromiso</strong>"],
  ["item",      "item",      "y los items engendran items, que se escriben en el acto"]
];

function renderNesting() {
  const flow = D().docs.find(d => d.id === "FLOW");
  return `
    <div class="sub-block-pair">
      <div class="sub-panel">
        <div class="sub-panel-head">
          <span class="sub-greek">ΜΟΡΦΗ</span>
          <h3>La forma que toma el trabajo</h3>
          ${flow ? `<button class="inline-link" onclick="openDoc('FLOW')">FLOW.md →</button>` : ""}
        </div>
        <div class="nesting">
          ${NESTING.map(([en, es, gloss], i) => `
            <div class="nest-row" style="--depth:${i}">
              <span class="nest-rail" aria-hidden="true"></span>
              <span class="nest-name">${es}<code>${en}</code></span>
              <span class="nest-gloss">${gloss}</span>
            </div>`).join("")}
        </div>
        <p class="sub-note">
          <strong>Un sub-bloque no es una tarea hasta que alguien lo dice.</strong> Es una pieza
          de un plan; una tarea es un compromiso. Al promoverlo <em>no cambia nada más de él</em>:
          conserva su dirección en el plan, y la tarea nombra esa dirección. Una tarea que llegó
          entera no tiene bloque encima y escribe <code>block</code> vacío, porque un campo
          ausente no puede decir eso.
        </p>
        <p class="sub-note sub-note-warn">
          ⚠️ Este esquema es la única transcripción que queda en la portada: <code>FLOW.md</code>
          lo dibuja en un bloque ASCII y eso no se puede leer sin adivinar. Si cambias el
          anidamiento, esta caja hay que cambiarla a mano.
        </p>
      </div>

      <div class="sub-panel">
        <div class="sub-panel-head">
          <span class="sub-greek">ΤΕΛΟΣ</span>
          <h3>Los cuatro destinos de un item</h3>
        </div>
        <div class="dest-grid">
          ${Object.entries(OUTCOMES).map(([k, o]) => `
            <div class="dest-cell ${o.cls}">
              <span class="dest-icon">${o.icon}</span>
              <strong>${o.label}</strong>
              <span>${o.hint}</span>
            </div>`).join("")}
        </div>
        <p class="sub-note">
          Un item, al llegarle su turno, se va por una de esas cuatro y <strong>ninguna otra</strong>.
          Un tachado sin destino es un <em>cierre fallido</em>, y el parser lo reporta como tal.
        </p>
        <p class="sub-note">
          <strong>Un estado no es un destino</strong>, y los dos conjuntos tienen tamaños
          distintos: una <em>tarea</em> lleva uno de cinco estados
          (<code>pending · active · paused · cancelled · done</code>); un <em>item</em> se va con
          uno de estos cuatro.
        </p>
      </div>
    </div>`;
}

// El orden del cierre, leído de `METHOD.md` §2. El orden ES el contenido: el paso 3
// (la auditoría) tiene que ir antes del 4 (cerrar el plan), o el auditor lee un fichero
// vacío creyendo que ha leído el razonamiento.
function renderCloseLadder() {
  const sec = docSection("METHOD", "2. The loop");
  const steps = [];
  for (let i = 0; i < sec.length; i++) {
    const m = sec[i].match(/^(\d+b?)\.\s+(.*)$/);
    if (!m) continue;
    let body = m[2];
    for (let j = i + 1; j < sec.length && /^\s{2,}\S/.test(sec[j]); j++) body += " " + sec[j].trim();
    steps.push({ n: m[1], text: body });
  }
  if (!steps.length) return "";
  return `
    <div class="sub-panel close-panel">
      <div class="sub-panel-head">
        <span class="sub-greek">ΚΛΕΙΣΙΣ</span>
        <h3>Cerrar una tarea — y el orden es el contenido</h3>
        <button class="inline-link" onclick="openDoc('METHOD')">METHOD.md §2 →</button>
      </div>
      <ol class="close-ladder">
        ${steps.map(st => `
          <li class="close-step">
            <span class="close-n">${esc(st.n)}</span>
            <div class="close-text">${expandable(st.text)}</div>
          </li>`).join("")}
      </ol>
      <p class="sub-note">
        Leído de <code>METHOD.md</code> §2 en vivo: ${steps.length} pasos. La auditoría va
        <strong>antes</strong> de cerrar el plan, siempre — al revés, el auditor lee un fichero en
        blanco creyendo que ha leído el razonamiento de la ronda.
      </p>
    </div>`;
}

function renderRefusals() {
  const r = D().refusals;
  if (!r.length) return "";
  return `
    <section class="frieze">
      <div class="frieze-head">
        <span class="frieze-greek">ΟΥΚ</span>
        <h2>Lo que esta empresa rechaza</h2>
      </div>
      <div class="frieze-rows">
        ${r.map(x => `
          <div class="frieze-row">
            <span class="frieze-mark">✕</span>
            <div><strong>${esc(x.title)}</strong><span>${inline(x.body)}</span></div>
          </div>`).join("")}
      </div>
    </section>`;
}

// ───────────────────────────────────────────────── el lector de documentos
function renderDoc(container) {
  const d = D().docs.find(x => x.id === STATE.docId);
  if (!d) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div>
      <h3>Documento no cargado</h3>
      <p>${esc(STATE.docId || "")} no está en la raíz del motor.</p>
      <button class="btn-retry" onclick="navigateTo('overview')">Volver a la portada</button></div>`;
    return;
  }
  const meta = DOC_META[d.id] || {};
  container.innerHTML = `
    <div class="desk-plate clause-plate ${meta.tone || ""}">
      <button class="crumb-link" onclick="navigateTo('overview')">🏛️ Portada</button>
      <span class="crumb-sep">›</span>
      <span class="crumb-here">${esc(d.id)}.md</span>
      <span class="clause-file"><code>${d.lines} líneas · ${d.words.toLocaleString("es")} palabras</code></span>
    </div>

    <header class="clause-hero ${meta.tone || ""}">
      <div class="clause-hero-mark">
        <span class="clause-greek">${meta.greek || ""}</span>
        <span class="clause-id">${meta.icon || "📄"}</span>
      </div>
      <div class="clause-hero-main">
        <h1>${esc(d.title)}</h1>
        <blockquote class="clause-epigraph">${esc(meta.q || "")}</blockquote>
        <p class="clause-objective-note">${esc(meta.role || "")}</p>
      </div>
    </header>

    <div class="clause-grid">
      <section class="doc-reader">${renderMarkdownBody(d.body)}</section>
      <aside class="clause-rail">
        <div class="rail-panel">
          <div class="rail-head"><strong>En este documento</strong></div>
          <nav class="doc-toc">
            ${d.outline.map((o, i) => `
              <button class="toc-item toc-l${o.level}" onclick="scrollToHeading(${i})">
                ${esc(o.title)}
              </button>`).join("")}
          </nav>
        </div>
        <div class="rail-panel">
          <div class="rail-head"><strong>Los otros</strong></div>
          ${DOC_ORDER.filter(x => x !== d.id && D().docs.find(y => y.id === x)).map(x => `
            <button class="clause-jump ${DOC_META[x]?.tone || ""}" onclick="openDoc('${x}')">
              <span class="cj-id">${DOC_META[x]?.icon || "📄"}</span>
              <span class="cj-title">${x}.md</span>
            </button>`).join("")}
        </div>
      </aside>
    </div>`;
}

window.scrollToHeading = function (i) {
  const reader = document.querySelector(".doc-reader");
  if (!reader) return;
  const hs = reader.querySelectorAll("h1, h2, h3");
  if (hs[i]) hs[i].scrollIntoView({ behavior: "smooth", block: "start" });
};

window.openClause = function (id) {
  STATE.clauseId = id;
  STATE.currentView = "clause";
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.openDoc = function (id) {
  STATE.docId = id;
  STATE.currentView = "doc";
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD — PH-6
//
// ⛔ Every tile here declares which of `PH-6`'s two purposes it serves — **steer**, a
// decision changes when it moves, or **prove**, evidence for someone with no reason to
// believe us. A number that serves neither is a dashboard, and a dashboard is
// accumulation wearing a chart. That sentence is the clause's, and it is the standard this
// page is held to rather than a decoration on it.
//
// ⚠️ Encoding note. The three check states are NOT three identities — they are one ordinal
// scale of *how enforced a rule is*: it runs (`$`) → it is named and does not run (`⊘`) →
// there is none (`—`). Painted as a categorical trio, good-vs-serious measured ΔE 5.6 under
// protanopia and good-vs-critical ΔE 4.1 under deuteranopia: the classic red/green pair,
// unreadable for the readers who most need the signal. One hue, light→dark, validated
// against this page's own surface (`#f2efe6`), and every segment carries its icon and its
// number as well as its colour.
// ═════════════════════════════════════════════════════════════════════════════

const ENFORCE = {
  "$":  { step: "#2c4527", label: "corre",     icon: "▶", ink: "#fbfaf5",
          hint: "un comando que se ejecuta hoy y devuelve un veredicto — y puede bajar" },
  owed: { step: "#66875c", label: "en deuda",  icon: "⊘", ink: "#fbfaf5",
          hint: "hay check nombrado y no corre: AX-7 roto, y declarado" },
  none: { step: "#94ab8a", label: "sin check", icon: "·", ink: "#14231b",
          hint: "no hay check — el vacío honesto, ni bueno ni malo por sí solo" }
};
const ENFORCE_ORDER = ["$", "owed", "none"];

// Un dato es una medida cuando lleva su denominador y de dónde se leyó (`AX-36`).
function metric({ id, purpose, title, n, of, unit, source, bad, note, tone }) {
  const pct = of ? Math.round(n / of * 100) : null;
  return `
    <article class="metric ${tone || ""}">
      <header class="metric-head">
        <span class="metric-purpose purpose-${purpose}" title="${
          purpose === "steer" ? "Para gobernar: cuando se mueve, cambia una decisión"
                              : "Para probar: es evidencia para quien no tiene motivos para creernos"}">
          ${purpose === "steer" ? "gobernar" : "probar"}
        </span>
        <h3>${esc(title)}</h3>
      </header>
      <div class="metric-figure">
        <span class="metric-n">${n}</span>
        ${of ? `<span class="metric-of">de ${of}</span>` : ""}
        ${unit ? `<span class="metric-unit">${esc(unit)}</span>` : ""}
        ${pct !== null ? `<span class="metric-pct">${pct}%</span>` : ""}
      </div>
      ${of ? `<div class="metric-bar" role="img" aria-label="${n} de ${of}">
                <div class="metric-bar-fill" style="width:${pct}%"></div>
              </div>` : ""}
      ${note ? `<p class="metric-note">${inline(note)}</p>` : ""}
      <footer class="metric-foot">
        <span class="metric-bad" title="La dirección mala. Una medida que no puede moverse hacia ella es un marcador, no una medida.">↓ mal: ${esc(bad)}</span>
        <span class="metric-src" title="Medido del registro, nunca recordado">${esc(source)}</span>
      </footer>
    </article>`;
}

function renderDashboard(container) {
  const ax = D().axioms;
  const clauses = D().clauses.filter(c => !c.objective);
  const total = ax.length;
  const by = s => ax.filter(a => a.check_state === s).length;
  const runnable = by("$"), owed = by("owed"), none = by("none");

  // Filas del gráfico: una por cláusula, segmentadas por cuánto se hace cumplir.
  const rows = clauses.map(c => {
    const mine = axiomsOf(c.id);
    const seg = ENFORCE_ORDER.map(k => ({ k, n: mine.filter(a => a.check_state === k).length }));
    return { id: c.id, title: c.title, total: mine.length, seg,
             cov: coverageOf(c.id), enforced: seg[0].n };
  });
  const widest = Math.max(1, ...rows.map(r => r.total));

  // ⚠️ Los axiomas que sirven a dos cláusulas cuentan en las dos, así que las filas suman
  // más que el total. Decirlo es parte de la medida; callarlo la invalida.
  const rowSum = rows.reduce((s, r) => s + r.total, 0);

  // Lo que el registro vivo puede responder hoy, sin instrumentar nada más.
  const mbAll = STATE.mailbox || [];
  const mbOpen = mbAll.filter(e => ["open", "pending"].includes(e.state)).length;
  const plan = STATE.livePlan || [];
  const planRouted = plan.filter(i => i.struck || i.outcome).length;
  const planDiscarded = plan.filter(i => i.outcome === "discarded").length;
  const tasks = STATE.tasks || [];
  const tasksWithProject = tasks.filter(t => t.project && t.project !== "cross").length;
  const probs = (STATE.problems || []).length;
  const covMismatch = rows.filter(r => r.cov && r.cov.count !== String(r.total));

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>📐</span> Dashboard <span class="clause-chip tone-cyan" onclick="openClause('PH-6')">PH-6 · Measurement</span></h1>
        <p class="view-subtitle">
          Cada medida declara <strong>a cuál de los dos propósitos sirve</strong> —
          <em>gobernar</em>, si al moverse cambia una decisión, o <em>probar</em>, si es evidencia
          para quien no tiene motivos para creernos. Todo lo de aquí se lee del registro; nada se
          recuerda.
        </p>
      </div>
    </div>

    <section class="dash-block">
      <div class="dash-block-head">
        <h2>Hasta dónde se hacen cumplir las reglas</h2>
        <p>Un axioma sin check es una regla que nadie comprueba. Ésta es la medida que más
           fácilmente se disfraza: la exactitud de un check puede mantenerse perfecta mientras su
           cobertura se hunde, y sólo el denominador lo enseña.</p>
      </div>

      <div class="metric-row">
        ${metric({ purpose: "prove", title: "Axiomas con check que se ejecuta",
                   n: runnable, of: total, source: "AXIOMS.md · columna Check",
                   bad: "baja al añadir axiomas sin check",
                   note: "La única de las tres que **puede bajar**, y por eso es la que se mira." })}
        ${metric({ purpose: "steer", title: "Checks en deuda", n: owed, of: total,
                   source: "AXIOMS.md · marca `⊘`", tone: "metric-warn",
                   bad: "sube",
                   note: "`AX-7` roto **y declarado**. Cada uno es una deuda con dirección." })}
        ${metric({ purpose: "prove", title: "Axiomas sin check ninguno", n: none, of: total,
                   source: "AXIOMS.md · marca `—`",
                   bad: "sube",
                   note: "El vacío honesto. No es un fallo por sí solo — es el techo de lo que hoy se puede verificar." })}
      </div>

      <figure class="chart">
        <figcaption class="chart-title">Axiomas por cláusula, según cuánto se hacen cumplir</figcaption>
        <div class="chart-legend">
          ${ENFORCE_ORDER.map(k => `
            <span class="lg-item" title="${ENFORCE[k].hint}">
              <span class="lg-swatch" style="background:${ENFORCE[k].step}"></span>
              <span class="lg-icon">${ENFORCE[k].icon}</span> ${ENFORCE[k].label}
            </span>`).join("")}
        </div>
        <div class="chart-rows">
          ${rows.map(r => `
            <div class="chart-row">
              <button class="cr-label ${CLAUSE_TONE[r.id] || ""}" onclick="openClause('${r.id}')"
                      title="Abrir ${r.id} · ${esc(r.title)}">
                <span class="cr-id">${r.id}</span>
                <span class="cr-title">${esc(r.title)}</span>
              </button>
              <div class="cr-track">
                ${r.seg.filter(s => s.n).map(s => `
                  <span class="cr-seg" style="width:${s.n / widest * 100}%; background:${ENFORCE[s.k].step}; color:${ENFORCE[s.k].ink}"
                        title="${r.id} · ${s.n} ${ENFORCE[s.k].label} — ${ENFORCE[s.k].hint}">
                    ${s.n >= 2 ? `<span class="cr-seg-n">${ENFORCE[s.k].icon} ${s.n}</span>` : ""}
                  </span>`).join("")}
              </div>
              <span class="cr-total">${r.total}</span>
            </div>`).join("")}
        </div>
        <figcaption class="chart-note">
          Las filas suman <strong>${rowSum}</strong> y los axiomas son <strong>${total}</strong>:
          uno que sirve a dos cláusulas cuenta en las dos. Leído de
          <code>AXIOMS.md</code> fila a fila, no de la tabla de cobertura.
          ${covMismatch.length ? `
            <span class="chart-flag">⚠️ ${covMismatch.length} cláusula${covMismatch.length > 1 ? "s no cuadran" : " no cuadra"}
              con la tabla de cobertura: ${covMismatch.map(r => `${r.id} (tabla ${esc(r.cov.count)}, filas ${r.total})`).join(" · ")}.
              La tabla se regenera, nunca se transcribe (<code>AX-2</code>).</span>`
            : `<span class="chart-ok">✓ Cuadra con la tabla de cobertura de <code>AXIOMS.md</code> en las ${rows.length} cláusulas.</span>`}
        </figcaption>
      </figure>
    </section>

    <section class="dash-block">
      <div class="dash-block-head">
        <h2>El registro vivo</h2>
        <p>Lo que la centralita conectada puede responder ahora mismo. Si no hay adaptador, estas
           medidas salen a cero — y un cero aquí significa <em>no medido</em>, no <em>bien</em>.</p>
      </div>
      <div class="metric-row">
        ${metric({ purpose: "steer", title: "Buzón sin cerrar", n: mbOpen, of: mbAll.length || 0,
                   source: "MAILBOX.md", bad: "sube y se queda",
                   tone: mbOpen > 0 ? "metric-warn" : "",
                   note: "Un buzón que entra lleno y sale lleno significa que la sesión no cerró nada." })}
        ${metric({ purpose: "steer", title: "Items del plan enrutados", n: planRouted, of: plan.length,
                   source: "PLAN.md", bad: "se estanca con el plan abierto",
                   note: "Un item tachado sin destino es un cierre fallido y el parser lo reporta." })}
        ${metric({ purpose: "prove", title: "Items descartados **con su motivo**",
                   n: planDiscarded, of: plan.length, source: "PLAN.md · destino `discarded`",
                   bad: "cae a cero — un registro sin descartes es un registro sin auditar",
                   note: "La cuenta poco favorecedora es **parte** de la medida, no un apéndice." })}
        ${metric({ purpose: "prove", title: "Tareas con `project:` propio",
                   n: tasksWithProject, of: tasks.length, source: "TASKS.md",
                   bad: "baja", note: "El campo del que dependen todos los filtros y que nada más puede inferir." })}
        ${metric({ purpose: "steer", title: "Entradas que el parser no supo colocar", n: probs,
                   source: "/api/model · problems", bad: "sube", tone: probs ? "metric-warn" : "",
                   note: "Un parser que descarta lo que no entiende convierte un registro sin pérdidas en uno con ellas, sin decirlo." })}
      </div>
    </section>

    <section class="dash-block">
      <div class="dash-block-head">
        <h2>Lo que todavía no se mide</h2>
        <p>Nombrado aquí en lugar de omitido. <strong>Un hueco declarado es una deuda con
           dirección; un hueco callado es una métrica que nadie echa de menos.</strong></p>
      </div>
      <div class="gap-list">
        ${[
          ["Hallazgos de auditoría aceptados sobre propuestos",
           "Necesita que cada auditoría escriba su resultado como registro, no como prosa en el informe de sesión."],
          ["Coste de atención por tarea",
           "`PH-5` dice que se mide, no que se sienta. Falta el dato: qué se cargó para hacer lo siguiente."],
          ["Decisiones retomadas",
           "Una decisión que vuelve como debate abierta es la señal de que su porqué no se escribió."],
          ["Vida media de una entrada de buzón",
           "Cuánto tarda en enrutarse. Necesita fecha de entrada y de salida; hoy sólo hay la de entrada."],
          ["Qué medida no ha cambiado nunca una decisión",
           "`PH-6` retira medidas con la misma facilidad con la que las añade, y ésta es la pregunta que lo hace."]
        ].map(([t, why]) => `
          <div class="gap-row">
            <span class="gap-mark">○</span>
            <div><strong>${esc(t)}</strong><span>${inline(why)}</span></div>
          </div>`).join("")}
      </div>
      <div class="callout callout-note">
        <span class="callout-icon">🧊</span>
        <div class="callout-content">
          <strong>Este panel está a medias a propósito.</strong> Sólo se pinta lo que sale del
          registro tal como está hoy. Cuando una medida nueva tenga su dato escrito en el momento
          en que ocurre — que es lo que <code>PH-6</code> exige y <code>PH-3</code> paga —
          entra aquí; hasta entonces vive en la lista de arriba.
        </div>
      </div>
    </section>`;
}


// ═════════════════════════════════════════════════════════════════════════════
// LEER UNA SECCIÓN CONCRETA DE UN FICHERO TRONCAL
//
// ⛔ La portada enseña la tabla de enrutado y el orden del cierre. Ninguna de las dos se
// teclea aquí: se sacan de `METHOD.md` por su encabezado, así que cambiar el método cambia
// la portada. Copiarlas sería exactamente lo que le pasó a la filosofía — una segunda copia
// con aspecto de autoridad que deriva sin que nada lo diga (`AX-20`).
// ═════════════════════════════════════════════════════════════════════════════

function docBody(id) {
  return (D().docs.find(d => d.id === id) || {}).body || "";
}

// Las líneas bajo un encabezado, hasta el siguiente del mismo nivel o superior.
function docSection(id, headingPrefix) {
  const lines = docBody(id).split("\n");
  const norm = s => s.toLowerCase().replace(/[`*]/g, "").trim();
  const want = norm(headingPrefix);
  let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (!m) continue;
    if (start === -1 && norm(m[2]).startsWith(want)) { start = i + 1; level = m[1].length; continue; }
    if (start !== -1 && m[1].length <= level) return lines.slice(start, i);
  }
  return start === -1 ? [] : lines.slice(start);
}

// La primera tabla markdown de un bloque de líneas, como filas de celdas.
// ⚠️ Devuelve la cabecera aparte: leer por posición es lo que hace que una columna
// insertada mueva todos los campos en silencio, y aquí la cabecera es el contrato.
function mdTable(lines) {
  const rows = [];
  let header = null;
  for (const ln of lines) {
    const t = ln.trim();
    if (!t.startsWith("|")) { if (rows.length) break; else continue; }
    if (/^\|[\s:|-]+\|$/.test(t)) continue;
    const cells = t.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (!header) header = cells; else rows.push(cells);
  }
  return { header, rows };
}
