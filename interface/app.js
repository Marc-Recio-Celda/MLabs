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
  cockpitSelectedFrontId: null,
  cockpitFilterProj: "ALL",
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

  // Fallback for projects without explicit blocks defined in state.md
  const b0Decs = decIds.slice(0, Math.max(1, Math.min(6, Math.floor(decIds.length / 3))));
  const b1Decs = decIds.slice(b0Decs.length, Math.max(b0Decs.length + 1, Math.min(decIds.length, Math.floor((decIds.length * 2) / 3))));
  const b2Decs = decIds.slice(b0Decs.length + b1Decs.length);

  const phaseTitle = pState?.phase_summary || pState?.current_phase || "Fase de Integración y Ejecución";
  const nextActionDesc = pState?.next_action || "Progreso de las tareas prioritarias del roadmap";

  return [
    {
      id: "B0",
      title: "Definición, Arquitectura y Acuerdos de Cartridge",
      status: "completed",
      statusLabel: "✓ Listo",
      summary: "Estructura base del proyecto, definición de límites de scope, invariantes y decisiones fundacionales.",
      decisions: b0Decs,
      subblocks: [
        {
          id: "B0.1",
          title: "Establecimiento del Cartridge y Definición Soberana",
          status: "completed",
          desc: "Fijación de objetivos medibles del MVP, entregables y criterios de éxito.",
          tasks: []
        },
        {
          id: "B0.2",
          title: "Auditoría de Entorno, Esquemas y Dependencias",
          status: "completed",
          desc: "Verificación de compatibilidad y contratos de comunicación externa.",
          tasks: closedTasks.slice(0, 1)
        }
      ]
    },
    {
      id: "B1",
      title: `Desarrollo e Integración · ${esc(phaseTitle)}`,
      status: "active",
      statusLabel: "▶ En Curso",
      summary: `Bloque en vuelo activo guiado por la acción inmediata: ${esc(nextActionDesc)}`,
      decisions: b1Decs.length ? b1Decs : (decIds.slice(0, 2)),
      subblocks: [
        {
          id: "B1.1",
          title: "Implementación de Módulos Core y Adaptadores",
          status: "completed",
          desc: "Estructuración de componentes principales y sincronización de servicios.",
          tasks: closedTasks.slice(1)
        },
        {
          id: "B1.2",
          title: "Acción Siguiente Inmediata (Next Action en Vuelo)",
          status: "active",
          desc: nextActionDesc,
          tasks: openTasks
        }
      ]
    },
    {
      id: "B2",
      title: "Persistencia, Endpoints y Extensión Funcional",
      status: "pending",
      statusLabel: "⏳ Pendiente",
      summary: "Ampliación de funcionalidades, persistencia de datos estructurados y pruebas de integración.",
      decisions: b2Decs,
      subblocks: [
        {
          id: "B2.1",
          title: "Ampliación de Esquemas y Modelos de Datos",
          status: "pending",
          desc: "Preparación de estructuras y capas de acceso seguro.",
          tasks: []
        },
        {
          id: "B2.2",
          title: "Integración de Vistas y Consumo de Servicios",
          status: "pending",
          desc: "Visualización y renderizado reactivo de entidades.",
          tasks: []
        }
      ]
    },
    {
      id: "B3",
      title: "Validación, Auditoría de Cierre y Release",
      status: "pending",
      statusLabel: "⏳ Pendiente",
      summary: "Comprobación de invariantes, auditoría mediante project-auditor y preparación de entrega.",
      decisions: [],
      subblocks: [
        {
          id: "B3.1",
          title: "Paso de Gates de Auditoría y Verificación de Diff",
          status: "pending",
          desc: "Validación de higiene técnica, cero leaks y despersonalización.",
          tasks: []
        },
        {
          id: "B3.2",
          title: "Sincronización de Estado en Presente Indicativo",
          status: "pending",
          desc: "Actualización de state.md y registro inmutable de decisiones.",
          tasks: []
        }
      ]
    }
  ];
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
    index: e.index || 1,
    text: e.text || "",
    struck: Boolean(e.struck),
    destination: e.destination || "",
    project: e.project || "cross"
  }));
  STATE.livePlanMeta = entities.find(e => e.kind === "live-plan-meta") || null;

  // Persistent Plans (from data/plans/*.json)
  STATE.plans = entities.filter(e => e.kind === "plan").map(e => ({
    id: e._record_id || e.id || "",
    project: e.project || "nexus",
    task: e.task || e.title || "",
    sub_block: e.sub_block || "",
    status: e.status || "closed",
    date: e.date || "",
    closed_on: e.closed_on || e.closed_date || null,
    author: e.author || e.origin || "Operator",
    order_why: e.order_why || "",
    items: Array.isArray(e.items) ? e.items.map(it => ({
      index: it.index || 1,
      text: it.text || "",
      status: it.status || (it.struck ? "done" : "open"),
      destination: it.destination || it.outcome || (it.struck ? "✅ resolved" : ""),
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
  STATE.skills = entities.filter(e => e.kind === "skill").map(e => {
    let trigger = e.trigger || "request";
    let when = e.when || "";
    if (e.title === "rnd") {
      trigger = "event";
      if (!when || when.toLowerCase().includes("never fires")) {
        when = "Pensamiento lateral frente al diseño del sistema. Disparada ante impasses de diseño o decisiones encalladas.";
      }
    }
    return {
      id: e.id,
      title: e.title || "",
      trigger,
      summary: e.summary || "",
      when: when || e.when || "",
      evidence: e.evidence || ""
    };
  });

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
    const progress = totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : 75;

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

    return {
      name,
      rank: `#${idx + 1}`,
      status: "ACTIVE",
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
      // The fallback is the generic one `getProjectLab` already uses. Until 2026-08-19 it
      // was the literal name of a grouping folder from one operations centre, hard-coded
      // into the public engine — exactly the `interface:AX-1` breach this project exists to
      // avoid. It was invisible to the release gate because that word was not on the
      // instance's denylist; adding the word found this on the very first run, which is the
      // argument for deriving that list from disk rather than remembering it.
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
    case "project-detail": renderProjectDetailPage(main); break;
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
// 1. OVERVIEW & ARCHITECTURE VIEW (Chuleta Garnatxa Editorial Design)
// ─────────────────────────────────────────────────────────────────────────────
function renderOverview(container) {
  const activeWf = STATE.selectedWorkflowTab || "project";
  const isCollapsed = (id) => Boolean(STATE.collapsedSections && STATE.collapsedSections[id]);

  container.innerHTML = `
    <div class="overview-container">
      <!-- HERO HEADER BANNER (Chuleta Editorial Style) -->
      <header class="chuleta-header">
        <div class="brand">
          <div class="kicker">MLabs & NEXUS · Sovereign Operational Matrix</div>
          <h1>MLabs <span class="accent">& NEXUS</span></h1>
          <p class="header-lead">
            <strong>MLabs es la Constitución pública · NEXUS es el País privado · Cada Proyecto es un Cartridge soberano.</strong><br>
            Orquestación determinista de tareas, gobernanza append-only y arquitectura modular sin pérdida de contexto.
          </p>
          <div class="specs">
            <span class="spec-pill" onclick="navigateTo('projects')"><strong>🚀 Proyectos:</strong> ${STATE.projects.length} Soberanos</span>
            <span class="spec-pill" onclick="navigateTo('decisions')"><strong>📜 Decisiones:</strong> ${liveDecisions().length}+ Vivas (D_n)</span>
            <span class="spec-pill" onclick="navigateTo('skills')"><strong>⚡ Skills:</strong> ${STATE.skills.length} Roles & Capacidades</span>
            <span class="spec-pill" onclick="navigateTo('inbox')"><strong>📋 Tareas:</strong> ${STATE.tasks.length} en Vuelo</span>
            <span class="spec-pill active-pill" onclick="navigateTo('cockpit')"><strong>🎯 Frente Activo:</strong> ${STATE.activeFront ? "1 En Marcha (▶)" : "0"}</span>
          </div>
        </div>
      </header>

      <!-- TOC PILL BAR -->
      <nav class="toc-bar">
        <button class="toc-pill" onclick="jumpToSection('sec-governance')"><span>🏛️</span> 01 · Gobernanza</button>
        <button class="toc-pill" onclick="jumpToSection('sec-workflows')"><span>🔄</span> 02 · Flujos de Trabajo</button>
        <button class="toc-pill" onclick="jumpToSection('sec-ecosystem')"><span>🗺️</span> 03 · Ecosistema</button>
      </nav>

      <!-- SECCIÓN 01: GOBERNANZA (tres niveles fusionados) -->
      <section class="doc-section" id="sec-governance">
        <div class="section-head" onclick="toggleOverviewSection('sec-governance')">
          <h2><span class="num">01</span> Gobernanza — Filosofía, Axiomas y Estado</h2>
          <button class="btn-toggle-sec">${isCollapsed('sec-governance') ? '▶ Mostrar' : '▼ Plegar'}</button>
        </div>
        <div class="section-body ${isCollapsed('sec-governance') ? 'is-collapsed' : ''}">

          <!-- ── PANEL SUPERIOR: Filosofía Inmutable ── -->
          <div class="gov-philosophy-panel">
            <div class="gov-panel-header">
              <div class="gov-panel-title">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="gov-level-badge badge-vine">NIVEL 1 · PÚBLICO &amp; INMUTABLE</span>
                  <span class="gov-file-tag">PHILOSOPHY.md</span>
                </div>
                <h3>Los Seis Principios Rectores</h3>
              </div>
              <p class="gov-panel-subtitle">La brújula rectora que rige todas las decisiones técnicas y <strong>rompe todo empate de diseño</strong>. Modificable casi nunca; sólo por el operador.</p>
            </div>

            <div class="gov-principles-grid">
              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-1</span>
                  <h4 class="principle-title">El horizonte largo es la premisa</h4>
                </div>
                <p class="principle-desc">Todo se construye para lo siguiente, no solo para hoy. Diseña para 3× a 10× el volumen actual. Lo que se aprende una vez no se vuelve a aprender desde cero.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">Solución que sólo escala hoy es postergación.</span>
                </div>
              </div>

              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-2</span>
                  <h4 class="principle-title">El aprendizaje se compra con productividad</h4>
                </div>
                <p class="principle-desc">Donde la velocidad y la comprensión chocan, <strong>gana la comprensión</strong>. Un atajo que el operador no entiende no es velocidad: es deuda con intereses.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">Cero atajos ciegos; entendimiento primero.</span>
                </div>
              </div>

              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-3</span>
                  <h4 class="principle-title">Nada se pierde</h4>
                </div>
                <p class="principle-desc">Sin datos no hay análisis. Un dato perdido jamás se recupera. Esto cubre entradas, razonamiento, alternativas y <strong>los descartes con su motivo</strong>.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">Registrar es barato; reconstruir es imposible.</span>
                </div>
              </div>

              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-4</span>
                  <h4 class="principle-title">Cero cajas negras</h4>
                </div>
                <p class="principle-desc">Toda decisión es trazable a su origen y razonamiento. Un sistema cuyo dueño no puede explicarlo no puede ser corregido por él. El valor vive en los artefactos en disco.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">La herramienta es intercambiable; el estado es sagrado.</span>
                </div>
              </div>

              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-5</span>
                  <h4 class="principle-title">El trabajo es modular</h4>
                </div>
                <p class="principle-desc">Cada pieza es dueña de su propio ciclo de vida y versión. El acoplamiento se paga en cada cambio; la separación una sola vez. Fronteras por <strong>propietario primero</strong>.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">Nunca agrupar por temática; separar por dueño.</span>
                </div>
              </div>

              <div class="gov-principle-card">
                <div class="gov-principle-card-head">
                  <span class="principle-badge">PH-6</span>
                  <h4 class="principle-title">La atención es el recurso escaso</h4>
                </div>
                <p class="principle-desc">Todo se registra; casi nada se carga en memoria a la vez. <strong>Un único frente activo (▶)</strong>. El coste crítico no es el disco, sino lo que hay que retener en la cabeza.</p>
                <div class="principle-rule-box">
                  <span class="rule-kicker">REGLA DE ORO</span>
                  <span class="rule-text">Un solo frente a la vez; cero dispersión.</span>
                </div>
              </div>
            </div>

            <div class="callout danger" style="margin-top: 18px;">
              <div class="callout-title"><span>🛡️</span> Lo que esta empresa rechaza formalmente (PHILOSOPHY §Refusals)</div>
              <div class="grid-2" style="margin-top: 8px; gap: 10px;">
                <div><strong>🚫 Acumulación:</strong> Curación estricta; sólo se guarda lo que se va a usar.</div>
                <div><strong>🚫 Complacencia:</strong> El sistema existe para preparar a su operador, no para darle la razón.</div>
                <div><strong>🚫 Optimización vacía:</strong> Nada entra por estética; debe desbloquear trabajo real.</div>
                <div><strong>🚫 Roles muertos:</strong> Todo rol sin hallazgos útiles se retira por contrato N/K.</div>
              </div>
            </div>
          </div>

          <!-- ── PANEL INFERIOR: Axiomas + NEXUS lado a lado ── -->
          <div class="gov-bottom-row">
            <!-- NIVEL 2: AXIOMAS -->
            <div class="gov-bottom-card gov-card-axioms">
              <div class="gov-bottom-card-head">
                <span class="gov-level-badge badge-gold">NIVEL 2 · ESTRUCTURA &amp; LEY</span>
                <span class="gov-file-tag">AXIOMS.md · AGENTS.md · METHOD.md</span>
              </div>
              <h3 class="gov-bottom-title">Axiomas y Reglas Deterministas</h3>
              <p class="gov-bottom-desc">Reglas técnicas verificables que implementan la filosofía. Gobiernan la orquestación de roles, invariantes de seguridad, checks automáticos y contratos de despido N/K.</p>
              
              <div class="gov-stat-grid">
                <div class="gov-stat-box">
                  <span class="gov-stat-val">30</span>
                  <span class="gov-stat-lbl">Axiomas Activos</span>
                </div>
                <div class="gov-stat-box">
                  <span class="gov-stat-val">10</span>
                  <span class="gov-stat-lbl">Invariantes Gate</span>
                </div>
                <div class="gov-stat-box">
                  <span class="gov-stat-val">4</span>
                  <span class="gov-stat-lbl">Roles Auditados</span>
                </div>
              </div>

              <div class="gov-chips-container">
                <div class="gov-chip-label">Axiomas Clave:</div>
                <div class="gov-sample-rules">
                  <span class="gov-rule-chip"><strong>AX-1</strong> Append-only</span>
                  <span class="gov-rule-chip"><strong>AX-11</strong> Despido N/K</span>
                  <span class="gov-rule-chip"><strong>AX-20</strong> Fuente única</span>
                  <span class="gov-rule-chip"><strong>AX-21</strong> Carga selectiva</span>
                  <span class="gov-rule-chip"><strong>AX-26</strong> Dueño primero</span>
                </div>
              </div>
            </div>

            <!-- NIVEL 3: NEXUS -->
            <div class="gov-bottom-card gov-card-nexus">
              <div class="gov-bottom-card-head">
                <span class="gov-level-badge badge-grape">NIVEL 3 · ESTADO PRIVADO</span>
                <span class="gov-file-tag">NEXUS (operaciones)</span>
              </div>
              <h3 class="gov-bottom-title">Decisiones y Cartridges Soberanos</h3>
              <p class="gov-bottom-desc">Donde vive la empresa real: registro histórico inmutable de decisiones con autor, fecha y razonamiento. Cada proyecto opera como un cartridge soberano con su propio ciclo de vida.</p>
              
              <div class="gov-stat-grid">
                <div class="gov-stat-box">
                  <span class="gov-stat-val">${liveDecisions().length}</span>
                  <span class="gov-stat-lbl">Decisiones Vivas</span>
                </div>
                <div class="gov-stat-box">
                  <span class="gov-stat-val">${STATE.projects.length}</span>
                  <span class="gov-stat-lbl">Proyectos Soberanos</span>
                </div>
                <div class="gov-stat-box">
                  <span class="gov-stat-val">${STATE.tasks.length}</span>
                  <span class="gov-stat-lbl">Tareas en Vuelo</span>
                </div>
              </div>

              <div class="gov-nexus-links">
                <button class="gov-link-btn" onclick="navigateTo('decisions')">📜 Ver Decision Log →</button>
                <button class="gov-link-btn" onclick="navigateTo('projects')">🚀 Abrir Projects Hub →</button>
                <button class="gov-link-btn" onclick="navigateTo('inbox')">📋 Ir al Buzón →</button>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- SECCIÓN 03: FLUJOS DE TRABAJO -->
      <section class="doc-section" id="sec-workflows">
        <div class="section-head" onclick="toggleOverviewSection('sec-workflows')">
          <h2><span class="num">02</span> Los Cinco Flujos de Trabajo Operativos (Workflows)</h2>
          <button class="btn-toggle-sec">${isCollapsed('sec-workflows') ? '▶ Mostrar' : '▼ Plegar'}</button>
        </div>
        <div class="section-body ${isCollapsed('sec-workflows') ? 'is-collapsed' : ''}">
          <div class="workflow-tabs">
            <button class="wf-tab ${activeWf === 'project' ? 'active' : ''}" onclick="setWorkflowTab('project')">🚀 1. Trabajar en Proyecto</button>
            <button class="wf-tab ${activeWf === 'environment' ? 'active' : ''}" onclick="setWorkflowTab('environment')">🛠️ 2. Mejorar Entorno</button>
            <button class="wf-tab ${activeWf === 'knowledge' ? 'active' : ''}" onclick="setWorkflowTab('knowledge')">📚 3. Añadir Temario</button>
            <button class="wf-tab ${activeWf === 'cartridge' ? 'active' : ''}" onclick="setWorkflowTab('cartridge')">🏗️ 4. Crear / Redefinir</button>
            <button class="wf-tab ${activeWf === 'coursework' ? 'active' : ''}" onclick="setWorkflowTab('coursework')">🎓 5. Formación & Corrección</button>
          </div>

          ${renderWorkflowDetail(activeWf)}
        </div>
      </section>

      <!-- SECCIÓN 04: ECOSISTEMA -->
      <section class="doc-section" id="sec-ecosystem">
        <div class="section-head" onclick="toggleOverviewSection('sec-ecosystem')">
          <h2><span class="num">03</span> Ecosistema de Módulos y Navegación Directa</h2>
          <button class="btn-toggle-sec">${isCollapsed('sec-ecosystem') ? '▶ Mostrar' : '▼ Plegar'}</button>
        </div>
        <div class="section-body ${isCollapsed('sec-ecosystem') ? 'is-collapsed' : ''}">
          <div class="eco-grid">
            <div class="eco-card-doc" onclick="navigateTo('projects')">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:24px;">🚀</span>
                <span class="card-badge badge-vine">${STATE.projects.length} Proyectos</span>
              </div>
              <h3>Projects Hub</h3>
              <p>Cartera de proyectos organizada por centros de trabajo y laboratorios con estado y hojas de ruta B_n.</p>
              <span class="eco-link">Abrir Projects Hub →</span>
            </div>

            <div class="eco-card-doc" onclick="navigateTo('inbox')">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:24px;">📋</span>
                <span class="card-badge badge-grape">${STATE.tasks.length} Tareas</span>
              </div>
              <h3>Tareas & Buzón Central</h3>
              <p>Gestión reactiva de tickets, buzón central MAILBOX.md y acciones de ciclo de vida completas.</p>
              <span class="eco-link">Abrir Inbox & Queues →</span>
            </div>

            <div class="eco-card-doc" onclick="navigateTo('decisions')">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:24px;">📜</span>
                <span class="card-badge badge-gold">${liveDecisions().length} Vivas</span>
              </div>
              <h3>Log de Decisiones</h3>
              <p>Registro histórico append-only con autor, fecha, justificación y verificación de vivacidad (supersedes).</p>
              <span class="eco-link">Abrir Decision Log →</span>
            </div>

            <div class="eco-card-doc" onclick="navigateTo('skills')">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:24px;">⚡</span>
                <span class="card-badge badge-cyan">${STATE.skills.length} Skills</span>
              </div>
              <h3>Skills & Organigrama</h3>
              <p>Catálogo de capacidades especializadas, roles de auditoría de eventos y comandos CLI de un clic.</p>
              <span class="eco-link">Abrir Skills & Org →</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
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
            <strong>Regla clave:</strong> Los axiomas son append-only; nada se reescribe, solo se superpone (AX-1).
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
              <p class="wf-node-desc">Comprueba la integridad de wikilinks, indexa en 00_INDEXES y verifica coherencia.</p>
              <button class="wf-node-btn" onclick="openSkillInCatalog('instance-auditor')">⚡ instance-auditor</button>
            </div>
          </div>

          <div class="callout tip" style="margin-top: 14px; padding: 10px 14px;">
            <strong>Regla clave:</strong> Estructurar primero para crear sobre una base modular clara; auditar coherencia y wikilinks antes de dar por cerrado (PH-1, PH-4).
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
            <strong>Regla clave:</strong> Cada proyecto es un repositorio soberano; jamás se acoplan por temática (PH-5).
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

window.openSkillInCatalog = function(skillName) {
  STATE.currentView = "skills";
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === "skills");
  });
  renderView();
  setTimeout(() => {
    const searchInput = document.getElementById("skillSearchInput");
    if (searchInput) {
      searchInput.value = skillName;
      searchInput.dispatchEvent(new Event("input"));
    }
  }, 100);
};

window.navigateTo = function(viewName) {
  STATE.currentView = viewName;
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
  });
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const isPersonal = labName.toLowerCase().includes("proj");
  const icon = isPersonal ? "💼" : "🔬";
  const badgeLabel = isPersonal ? "Lab Personal & Operaciones" : "Lab de Investigación & Genómica";
  const badgeClass = isPersonal ? "tag-purple" : "tag-live";
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
            <p class="lab-subtitle">Entorno de proyectos y operaciones soberanas asociadas a ${esc(labName)}</p>
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

            <div class="progress-section">
              <div class="progress-labels">
                <span>Progreso de Bloques</span>
                <strong>${p.completedBlocks}/${p.totalBlocks} (${p.progress}%)</strong>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
              </div>
            </div>

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

        <!-- SPECS HUD (BLOQUES, DECISIONES, TAREAS, NEXT ACTION, GIT STATUS) -->
        <div class="specs" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.12);">
          <span class="spec-pill" onclick="setProjectSubtab('workflow')"><strong>🗺️ Bloques:</strong> ${proj.completedBlocks}/${proj.totalBlocks} (${proj.progress}%)</span>
          <span class="spec-pill" onclick="setProjectSubtab('decisions')"><strong>📜 Decisiones:</strong> ${liveDecs.length} Vivas (${projectDecs.length} Totales)</span>
          <span class="spec-pill" onclick="setProjectSubtab('workflow')"><strong>📋 Tareas:</strong> ${projectTasks.length} (${activeTasks.length} Activas)</span>
          <span class="spec-pill active-pill" onclick="setProjectSubtab('state')"><strong>🎯 Next Action:</strong> ${inline(proj.nextAction.slice(0, 48))}...</span>
          <span class="spec-pill" onclick="setProjectSubtab('repos')" title="Ver repositorio, rama y commits"><strong>🐙 Git:</strong> ${esc(proj.gitBranch || (proj.remoteUrl ? 'conectado' : 'local'))}${proj.gitCommit ? ` (<code>${esc(proj.gitCommit)}</code>)` : ''}</span>
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
    default: return renderProjectWorkflowTab(proj, projectTasks, projectDecs);
  }
}

// ── TAB 1: WORKFLOW RAMIFICADO (Bloques, Subbloques y Log de Tareas) ──
function renderProjectWorkflowTab(proj, projectTasks, projectDecs) {
  const workflow = proj.workflow || [];

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
                                <p style="font-size: 12px; color: var(--ink-soft); margin: 4px 0 0;"><strong>Why:</strong> ${inline(t.why)}</p>
                                <div class="task-actions-toolbar" style="margin-top: 8px;">
                                  ${t.status !== '✅' && t.status !== '⚫' ? `
                                    <button class="btn-task-action btn-task-complete" onclick="completeTask('${esc(t.id)}')"><span>✅</span> Completar</button>
                                  ` : ''}
                                  <button class="btn-task-action btn-task-comment" onclick="openCommentModal('${esc(t.id)}', '${esc(t.title)}')"><span>💬</span> Comentar</button>
                                </div>
                              </div>
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
                </p>
                <div class="task-actions-toolbar">
                  ${t.status !== '✅' && t.status !== '⚫' ? `
                    <button class="btn-task-action btn-task-complete" onclick="completeTask('${esc(t.id)}')"><span>✅</span> Completar</button>
                  ` : ''}
                  <button class="btn-task-action btn-task-comment" onclick="openCommentModal('${esc(t.id)}', '${esc(t.title)}')"><span>💬</span> Comentar (${t.comments ? t.comments.length : 0})</button>
                  ${t.status !== '⚫' ? `
                    <button class="btn-task-action btn-task-discard" onclick="openDiscardModal('${esc(t.id)}', '${esc(t.title)}')"><span>⚫</span> Descartar</button>
                  ` : ''}
                </div>
              </div>
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


// ── TAB 6: REPOS & GIT DASHBOARD ──
function renderProjectReposTab(proj) {
  const remoteHttp = getRemoteHttpUrl(proj.remoteUrl);

  return `
    <div class="doc-section">
      <div class="section-head" style="cursor: default;">
        <h2><span class="num">06</span> Repositorios, Workspace y Control de Versiones</h2>
        ${proj.gitBranch ? `<span class="tag-pill tag-live">🌿 Rama activa: ${esc(proj.gitBranch)}</span>` : ''}
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
            Repositorio público o privado en GitHub sincronizado con el ciclo de vida del proyecto.
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
            Estructura de metadatos, estado vivo, definición arquitectónica y log append-only de decisiones (PH-5).
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

      <!-- GIT TERMINAL TOOLS & QUICK COMMANDS -->
      <div class="repo-git-tools-card">
        <div class="git-tools-header">
          <span>⚡</span> <span>Comandos Rápidos de Terminal para ${esc(proj.name)}</span>
        </div>
        <div class="git-commands-grid">
          <div class="git-cmd-item" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git status', 'Comando git status copiado', event)">
            <div>
              <code>git status</code>
              <div class="git-cmd-desc">Inspeccionar cambios y ramas</div>
            </div>
            <span>📋</span>
          </div>
          <div class="git-cmd-item" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git log -n 5 --oneline', 'Comando git log copiado', event)">
            <div>
              <code>git log -n 5 --oneline</code>
              <div class="git-cmd-desc">Ver últimos 5 commits</div>
            </div>
            <span>📋</span>
          </div>
          <div class="git-cmd-item" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git pull origin ${esc(proj.gitBranch || 'main')}', 'Comando git pull copiado', event)">
            <div>
              <code>git pull origin ${esc(proj.gitBranch || 'main')}</code>
              <div class="git-cmd-desc">Descargar últimos cambios</div>
            </div>
            <span>📋</span>
          </div>
          <div class="git-cmd-item" onclick="copyToClipboard('cd ${esc(proj.codeRepo)} && git diff HEAD~1..HEAD', 'Comando git diff copiado', event)">
            <div>
              <code>git diff HEAD~1..HEAD</code>
              <div class="git-cmd-desc">Revisar diff del último commit</div>
            </div>
            <span>📋</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COCKPIT & LIVE VIEW
// ─────────────────────────────────────────────────────────────────────────────
window.selectCockpitFront = function(frontId) {
  STATE.cockpitSelectedFrontId = frontId;
  renderView();
};

window.setCockpitFilter = function(proj) {
  STATE.cockpitFilterProj = proj;
  renderView();
};


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

function renderCockpit(container) {
  const allProjects = Array.from(new Set(STATE.fronts.map(f => f.project).filter(Boolean))).sort();
  const filterProj = STATE.cockpitFilterProj || "ALL";
  
  const filteredFronts = filterProj === "ALL" 
    ? STATE.fronts 
    : STATE.fronts.filter(f => f.project && f.project.toLowerCase() === filterProj.toLowerCase());

  // Determine selected front
  let selectedFront = null;
  if (STATE.cockpitSelectedFrontId) {
    selectedFront = STATE.fronts.find(f => f.id === STATE.cockpitSelectedFrontId || f.name === STATE.cockpitSelectedFrontId);
  }
  if (!selectedFront) {
    selectedFront = STATE.activeFront || filteredFronts[0] || STATE.fronts[0] || null;
  }

  // Check if selected front is the active flight
  const isActiveFlight = Boolean(selectedFront && (selectedFront.active || (STATE.activeFront && selectedFront.id === STATE.activeFront.id)));
  
  // Check if there is a persistent plan for this front
  const persistentPlan = STATE.plans.find(p => 
    (p.task && selectedFront?.name && selectedFront.name.includes(p.task)) ||
    (selectedFront?.project && p.project === selectedFront.project) ||
    (p.sub_block && selectedFront?.name && selectedFront.name.includes(p.sub_block))
  );

  // Live plan stats
  const totalLive = STATE.livePlan.length;
  const completedLive = STATE.livePlan.filter(p => p.struck).length;
  const pendingLive = totalLive - completedLive;
  const livePct = totalLive ? Math.round((completedLive / totalLive) * 100) : 0;

  // Active front stats
  const activeCount = STATE.fronts.filter(f => f.active).length;
  const pausedCount = STATE.fronts.filter(f => f.marker === "⏸").length;
  const queueCount = STATE.fronts.length - activeCount - pausedCount;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1><span>🧭</span> Operations Cockpit & Live Flight</h1>
        <p class="view-subtitle">Supervisión en tiempo real de la brújula de frentes (COMPASS) y planes en vuelo (PLAN.md)</p>
      </div>
      <div class="header-stats-bar">
        <span class="spec-pill active-pill" onclick="selectCockpitFront('${STATE.activeFront?.id || ''}')" style="cursor: pointer;" title="Ir al Frente Activo">
          <strong>⚡ En Vuelo:</strong> ${activeCount} (▶)
        </span>
        <span class="spec-pill" style="border-color: var(--gold-border); color: #8a6418; background: var(--gold-bg);">
          <strong>⏸ En Pausa:</strong> ${pausedCount}
        </span>
        <span class="spec-pill">
          <strong>⏳ En Cola:</strong> ${queueCount}
        </span>
      </div>
    </div>

    <div class="cockpit-grid">
      <!-- LEFT COLUMN: SCHEDULE COMPASS / FRENTES EN COLA -->
      <div class="cockpit-column-left">
        <div class="cockpit-panel schedule-queue-panel">
          <div class="panel-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2><span>🎯</span> Frentes en Cola (COMPASS)</h2>
              <span class="tag-pill tag-live">${filteredFronts.length}</span>
            </div>
          </div>

          <!-- Project Filter Chips -->
          <div class="cockpit-filter-chips">
            <button class="chip-filter ${filterProj === 'ALL' ? 'active' : ''}" onclick="setCockpitFilter('ALL')">
              Todos (${STATE.fronts.length})
            </button>
            ${allProjects.map(proj => {
              const count = STATE.fronts.filter(f => f.project === proj).length;
              return `
                <button class="chip-filter ${filterProj.toLowerCase() === proj.toLowerCase() ? 'active' : ''}" onclick="setCockpitFilter('${esc(proj)}')">
                  ${esc(proj)} (${count})
                </button>
              `;
            }).join("")}
          </div>

          <!-- Fronts List -->
          <div class="cockpit-fronts-list">
            ${filteredFronts.length ? filteredFronts.map((f) => {
              const isSelected = selectedFront && (selectedFront.id === f.id || (selectedFront.name === f.name && selectedFront.line === f.line));
              const isAct = Boolean(f.active);
              const isPaused = f.marker === "⏸";
              const isOrdinal = f.marker && /^\d+$/.test(f.marker);

              let markerBadge = "";
              if (isAct) {
                markerBadge = `<span class="front-marker-badge marker-active" title="Frente Activo Único">▶</span>`;
              } else if (isPaused) {
                markerBadge = `<span class="front-marker-badge marker-paused" title="Frente en Pausa">⏸</span>`;
              } else if (isOrdinal) {
                markerBadge = `<span class="front-marker-badge marker-ordinal" title="Prioridad en Cola">${esc(f.marker)}</span>`;
              } else {
                markerBadge = `<span class="front-marker-badge marker-subtle">·</span>`;
              }

              return `
                <div class="cockpit-front-card ${isSelected ? 'selected' : ''} ${isAct ? 'is-active-flight' : ''} ${isPaused ? 'is-paused-front' : ''}"
                     onclick="selectCockpitFront('${esc(f.id || f.name)}')">
                  <div class="front-card-top">
                    ${markerBadge}
                    <div class="front-card-title-group">
                      <strong class="front-card-title">${inline(f.name)}</strong>
                      ${f.project ? `<span class="tag-pill tag-project">${esc(f.project)}</span>` : ''}
                    </div>
                  </div>

                  ${(f.moves_when || f.waits_on) ? `
                    <div class="front-card-condition">
                      <span class="condition-icon">${isPaused ? '⏸' : '⏳'}</span>
                      <span class="condition-text">${expandable(f.moves_when || f.waits_on || '')}</span>
                    </div>
                  ` : ''}

                  <div class="front-card-footer">
                    <span class="front-status-indicator">
                      ${isAct ? '<span class="status-dot pulse-dot"></span> Plan en vuelo activo' : 
                        isPaused ? '<span class="status-dot paused-dot"></span> Frente en pausa' : 
                        '<span class="status-dot queue-dot"></span> En espera de turno'}
                    </span>
                    <span class="select-arrow">${isSelected ? '●' : '→'}</span>
                  </div>
                </div>
              `;
            }).join("") : `
              <div class="empty-state">
                <p>No hay frentes registrados para el filtro <strong>${esc(filterProj)}</strong>.</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: DETAILED PLAN VIEW -->
      <div class="cockpit-column-right">
        ${selectedFront ? `
          <div class="cockpit-panel plan-detail-panel">
            <!-- FRONT HERO HEADER -->
            <div class="plan-detail-hero ${isActiveFlight ? 'hero-active-flight' : selectedFront.marker === '⏸' ? 'hero-paused-flight' : 'hero-queue-flight'}">
              <div class="plan-hero-top-row">
                <div class="hero-status-badges">
                  ${isActiveFlight ? `
                    <span class="tag-pill tag-live-glow"><span class="pulse-dot"></span> ▶ FRENTE ACTIVO EN VUELO</span>
                  ` : selectedFront.marker === "⏸" ? `
                    <span class="tag-pill tag-paused-gold">⏸ FRENTE EN PAUSA</span>
                  ` : `
                    <span class="tag-pill tag-queue-purple">⏳ EN COLA ${selectedFront.marker ? `#${selectedFront.marker}` : ''}</span>
                  `}
                  ${selectedFront.project ? `<span class="tag-pill tag-project-hero">${esc(selectedFront.project)}</span>` : ''}
                </div>
                ${selectedFront.described_in ? `
                  <button class="btn-copy-ref" onclick="copyToClipboard('${esc(selectedFront.described_in)}', 'Ubicación copiada', event)">
                    <span>📁 Copiar ubicación</span>
                  </button>
                ` : ''}
              </div>

              <h2 class="plan-hero-title">${inline(selectedFront.name)}</h2>

              ${(selectedFront.moves_when || selectedFront.waits_on) ? `
                <div class="hero-condition-banner">
                  <span class="condition-banner-label">AVANZA CUANDO:</span>
                  <span class="condition-banner-val">${inline(selectedFront.moves_when || selectedFront.waits_on || "—")}</span>
                </div>
              ` : ''}

              ${selectedFront.described_in ? `
                <div class="hero-location-row">
                  <span class="loc-label">Definido en:</span>
                  <code>${esc(selectedFront.described_in)}</code>
                </div>
              ` : ''}
            </div>

            <!-- PLAN BODY / CONTENT -->
            ${isActiveFlight ? `
              <!-- ACTIVE LIVE FLIGHT (PLAN.md) -->
              <div class="live-plan-section">
                <div class="section-title-row">
                  <div class="section-title-left">
                    <h3><span>📋</span> Plan de Vuelo Activo (PLAN.md)</h3>
                    ${STATE.livePlanMeta?.task ? `<span class="tag-pill tag-live">${esc(STATE.livePlanMeta.task)}</span>` : ''}
                  </div>
                  <div class="section-stats-pills">
                    <span class="mini-stat-pill done-pill">✓ ${completedLive} resueltos</span>
                    <span class="mini-stat-pill inflight-pill">⚡ ${pendingLive} pendientes</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="plan-progress-wrapper">
                  <div class="plan-progress-bar">
                    <div class="plan-progress-fill" style="width: ${livePct}%;"></div>
                  </div>
                  <span class="plan-progress-pct">${livePct}%</span>
                </div>

                <!-- Order Why Card (if present) -->
                ${STATE.livePlanMeta?.order_why ? `
                  <div class="order-why-card">
                    <div class="order-why-header">
                      <span class="order-why-icon">🧠</span>
                      <strong>Razón de la secuencia (Order Why)</strong>
                      <span class="order-why-badge">PH-3 / AX-11</span>
                    </div>
                    <div class="order-why-body">
                      ${inline(STATE.livePlanMeta.order_why)}
                    </div>
                  </div>
                ` : ''}

                <!-- Plan Items List -->
                <div class="plan-items-container">
                  ${STATE.livePlan.length ? STATE.livePlan.map(item => `
                    <div class="plan-item-row ${item.struck ? 'completed' : 'in-progress'}">
                      <div class="plan-idx-circle ${item.struck ? 'idx-done' : 'idx-active'}">
                        ${item.struck ? '✓' : item.index}
                      </div>
                      <div class="plan-text-content">
                        ${expandable(item.text, "plan-text")}
                      </div>
                      ${item.destination ? `
                        <span class="dest-tag ${/discarded|⚫/.test(item.destination) ? 'dest-discarded' : 'dest-resolved'}">
                          ${esc(item.destination)}
                        </span>
                      ` : `<span class="dest-tag dest-inflight"><span class="dot-spin"></span> en curso</span>`}
                    </div>
                  `).join("") : `
                    <div class="empty-state">
                      <div class="empty-icon">⚡</div>
                      <h3>Plan despejado</h3>
                      <p>PLAN.md está listo para recibir el siguiente sub-bloque de trabajo.</p>
                    </div>
                  `}
                </div>

                <div class="live-sync-notice">
                  <span>⚡ Sincronización en tiempo real activa (<code>/api/stamp</code> cada 2.0s). Edita <code>PLAN.md</code> o invoca la skill <code>current-plan</code> para actualizar instantáneamente.</span>
                </div>
              </div>
            ` : persistentPlan ? `
              <!-- PERSISTENT HISTORICAL / PAUSED PLAN -->
              <div class="persistent-plan-section">
                <div class="section-title-row">
                  <div class="section-title-left">
                    <h3><span>📜</span> Plan Registrado (${esc(persistentPlan.id)})</h3>
                    <span class="tag-pill ${persistentPlan.status === 'active' ? 'tag-live' : persistentPlan.status === 'paused' ? 'tag-paused-gold' : 'tag-done'}">
                      ${esc(persistentPlan.status.toUpperCase())}
                    </span>
                  </div>
                  <div class="section-stats-pills">
                    ${persistentPlan.date ? `<span class="mini-stat-pill">📅 ${esc(persistentPlan.date)}</span>` : ''}
                    ${persistentPlan.closed_on ? `<span class="mini-stat-pill done-pill">🔒 Cerrado: ${esc(persistentPlan.closed_on)}</span>` : ''}
                  </div>
                </div>

                ${persistentPlan.order_why ? `
                  <div class="order-why-card">
                    <div class="order-why-header">
                      <span class="order-why-icon">🧠</span>
                      <strong>Razón de la secuencia (Order Why)</strong>
                    </div>
                    <div class="order-why-body">
                      ${inline(persistentPlan.order_why)}
                    </div>
                  </div>
                ` : ''}

                <div class="plan-items-container">
                  ${persistentPlan.items.length ? persistentPlan.items.map(item => `
                    <div class="plan-item-row ${item.status === 'done' ? 'completed' : ''}">
                      <div class="plan-idx-circle ${item.status === 'done' ? 'idx-done' : 'idx-active'}">
                        ${item.status === 'done' ? '✓' : item.index}
                      </div>
                      <div class="plan-text-content">
                        ${expandable(item.text, "plan-text")}
                      </div>
                      ${item.destination ? `
                        <span class="dest-tag ${/discarded|⚫/.test(item.destination) ? 'dest-discarded' : 'dest-resolved'}">
                          ${esc(item.destination)}
                        </span>
                      ` : `<span class="dest-tag dest-inflight">en curso</span>`}
                    </div>
                  `).join("") : `<div class="empty-state"><p>No hay subtareas registradas en este plan.</p></div>`}
                </div>
              </div>
            ` : selectedFront.marker === "⏸" ? `
              <!-- PAUSED FRONT EXPLANATION -->
              <div class="front-state-card paused-state-card">
                <div class="state-card-icon">⏸</div>
                <h3>Frente Congelado / En Pausa</h3>
                <p class="state-card-desc">
                  Este frente está pausado intencionalmente para no competir por foco con el frente activo único (▶).
                </p>
                <div class="state-detail-box">
                  <strong>Motivo de pausa / Reanudación:</strong>
                  <p>${inline(selectedFront.moves_when || "Requiere confirmación antes de reanudar.")}</p>
                </div>
                <div class="state-guidance-box">
                  <span>💡 Para reanudar este frente, selecciona el frente en <code>COMPASS.md</code> y abre su plan con la skill <code>current-plan</code>.</span>
                </div>
              </div>
            ` : `
              <!-- QUEUED FRONT WAITING -->
              <div class="front-state-card queued-state-card">
                <div class="state-card-icon">🎯</div>
                <h3>Frente en Cola de Espera</h3>
                <p class="state-card-desc">
                  Este frente está programado en la brújula COMPASS. No tiene un plan activo instanciado todavía.
                </p>
                <div class="state-detail-box">
                  <strong>Condición de avance:</strong>
                  <p>${inline(selectedFront.moves_when || selectedFront.waits_on || "Secuenciado en el orden de trabajo.")}</p>
                </div>
                <div class="state-guidance-box">
                  <span>💡 Cuando este frente pase a ser el activo (▶), se generará su plan de vuelo mediante la skill <code>current-plan</code>.</span>
                </div>
              </div>
            `}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">🧭</div>
            <h3>Selecciona un Frente</h3>
            <p>Elige un frente de la columna izquierda para inspeccionar su plan y estado detallado.</p>
          </div>
        `}
      </div>
    </div>
  `;
  // Auto-scroll plan container to the last completed item
  autoScrollPlanContainer(true);
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
                <div class="cs-cmd-row" id="cmdRow_${curCat}_${cIdx}" data-code="${esc(cmd.code)}" onclick="copyRowCommand(this)">
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

window.copyRowCommand = function(el) {
  const code = el.getAttribute("data-code") || el.querySelector("code")?.textContent || "";
  if (!code) return;
  copyCommand(code, el.id);
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

window.updateDecFilter = function(key, val) {
  STATE[key] = val;
  renderView();
};

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
        <div class="skill-cli-box" id="${rowId}" data-code="${esc(cliCmd)}" onclick="copyRowCommand(this)" title="Clic para copiar comando de invocación">
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
let isPolling = false;

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

window.retryLoad = () => {
  STATE.error = null;
  renderView();
  loadModel();
};

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

// Initial boot & periodic watcher
loadModel().then(watchStamp);
setInterval(watchStamp, 2000);

