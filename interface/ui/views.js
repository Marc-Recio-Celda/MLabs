// interface/ui/views.js
// One view per kind. Pure rendering from typed model entities.
// Conforms to data store schema contract.

export const esc = s => String(s ?? "").replace(/[&<>"]/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function inline(s) {
  if (s == null) return "";
  let t = String(s);
  // If string already contains HTML tags (e.g. <span, <code>, <div>), do not double escape
  if (/<[a-z][\s\S]*>/i.test(t)) {
    return t;
  }
  t = esc(t);
  t = t.replace(/`([^`]+)`/g, (_, a) => `<code>${a}</code>`);
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, (_, a) => `<strong>${a}</strong>`);
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, (_, a, b) => `${a}<em>${b}</em>`);
  t = t.replace(/~~([^~]+)~~/g, (_, a) => `<del>${a}</del>`);
  return t;
}

export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export const tag = (text, cls = "", title = "") => 
  text ? `<span class="tag ${cls}" ${title ? `title="${esc(title)}"` : ""}>${esc(text)}</span>` : "";

/** Formats date with inferred visual indicator */
export function renderDate(dateStr, isInferred = false) {
  if (!dateStr) return "";
  if (isInferred) {
    return `<span class="tag tag-inferred" title="Fecha imputada del contexto, no leída explícitamente (date_inferred: true)">📅 ${esc(dateStr)} <em class="inferred-marker">~inferred</em></span>`;
  }
  return `<span class="tag tag-date">📅 ${esc(dateStr)}</span>`;
}

/** Formats origin/author with inferred visual indicator */
export function renderOrigin(originStr, isInferred = false) {
  if (!originStr) return "";
  if (isInferred) {
    return `<span class="tag tag-inferred" title="Origen/autor imputado, no leído explícitamente (origin_inferred: true)">👤 ${esc(originStr)} <em class="inferred-marker">~inferred</em></span>`;
  }
  return `<span class="tag tag-author">👤 ${esc(originStr)}</span>`;
}

/** An expandable row */
export function row(e, { title, subs = [], detail = [], cls = "", lead = "" }) {
  const d = el("details", `row ${cls}`);
  d.id = e.id || e.uid || `row-${Math.random().toString(36).slice(2, 9)}`;
  d.innerHTML =
    `<summary>${lead}<span class="t">${inline(title)}</span>` +
    subs.filter(Boolean).join("") + `</summary>` +
    `<div class="detail"><dl>` +
    detail.filter(([, v]) => v != null && v !== "").map(([k, v]) =>
      `<dt>${esc(k)}</dt><dd>${inline(v)}</dd>`).join("") +
    `</dl></div>`;
  return d;
}

export const VIEWS = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. TASKS VIEW (Priority #1: Project, Status & Date Filters)
  // ───────────────────────────────────────────────────────────────────────────
  task: {
    label: "Tasks",
    kind: "task",
    render(list, model, filters = {}) {
      const wrap = el("div", "view-container");

      const allProjects = [...new Set(list.map(t => t.project).filter(Boolean))].sort();
      
      const projFilter = filters.taskProject || "";
      const statusFilter = filters.taskStatus || "";
      const dateSort = filters.taskDateSort || "newest";
      const searchTxt = (filters.taskSearch || "").toLowerCase().trim();

      const toolbar = el("div", "view-toolbar");
      toolbar.innerHTML = `
        <div class="toolbar-group">
          <label for="taskFilterProj">Project:</label>
          <select id="taskFilterProj" class="custom-select">
            <option value="">All Projects (${list.length})</option>
            ${allProjects.map(p => `
              <option value="${esc(p)}" ${p === projFilter ? "selected" : ""}>
                ${esc(p)} (${list.filter(t => t.project === p).length})
              </option>
            `).join("")}
          </select>
        </div>

        <div class="toolbar-group">
          <label for="taskFilterStatus">Status:</label>
          <select id="taskFilterStatus" class="custom-select">
            <option value="">All Statuses</option>
            <option value="ACTIVE" ${statusFilter === "ACTIVE" ? "selected" : ""}>Active (⬜ 🔨 ⛔ 🔴)</option>
            <option value="⬜" ${statusFilter === "⬜" ? "selected" : ""}>⬜ Pending</option>
            <option value="🔨" ${statusFilter === "🔨" ? "selected" : ""}>🔨 In Flight</option>
            <option value="⛔" ${statusFilter === "⛔" ? "selected" : ""}>⛔ Blocked</option>
            <option value="🔴" ${statusFilter === "🔴" ? "selected" : ""}>🔴 Critical</option>
            <option value="✅" ${statusFilter === "✅" ? "selected" : ""}>✅ Completed</option>
            <option value="⚫" ${statusFilter === "⚫" ? "selected" : ""}>⚫ Discarded</option>
          </select>
        </div>

        <div class="toolbar-group">
          <label for="taskFilterDateSort">Sort Date:</label>
          <select id="taskFilterDateSort" class="custom-select">
            <option value="newest" ${dateSort === "newest" ? "selected" : ""}>Newest first</option>
            <option value="oldest" ${dateSort === "oldest" ? "selected" : ""}>Oldest first</option>
            <option value="id" ${dateSort === "id" ? "selected" : ""}>Sort by ID</option>
          </select>
        </div>

        <div class="toolbar-group search-group">
          <input type="text" id="taskSearchInput" class="custom-input" placeholder="Search tasks by title, why, ID..." value="${esc(filters.taskSearch || "")}">
        </div>
      `;

      wrap.append(toolbar);

      // Filter tasks
      let filtered = list.filter(t => {
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
          const matchId = (t.id_raw || t.id || "").toLowerCase().includes(searchTxt);
          const matchProj = (t.project || "").toLowerCase().includes(searchTxt);
          if (!matchTitle && !matchWhy && !matchId && !matchProj) return false;
        }
        return true;
      });

      // Sort tasks
      filtered.sort((a, b) => {
        if (dateSort === "id") {
          const idA = parseInt(String(a.id_raw || a.id).replace(/\D/g, "")) || 0;
          const idB = parseInt(String(b.id_raw || b.id).replace(/\D/g, "")) || 0;
          return idB - idA;
        }
        const dateA = a.date || "1970-01-01";
        const dateB = b.date || "1970-01-01";
        return dateSort === "newest" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });

      if (!filtered.length) {
        wrap.append(el("div", "empty-state", `
          <div class="empty-icon">📋</div>
          <h3>No tasks found</h3>
          <p>No tasks match the selected filters.</p>
        `));
        return wrap;
      }

      const listContainer = el("div", "tasks-list");
      for (const e of filtered) {
        const isDone = e.status === "✅";
        const isDiscarded = e.status === "⚫";
        const statusCls = isDone ? "task-done" : (isDiscarded ? "task-discarded" : (e.status === "🔨" ? "task-inflight" : ""));

        const dateBadge = renderDate(e.date, e.date_inferred);
        const originBadge = renderOrigin(e.origin || e.author, e.origin_inferred);
        const statusBadge = `<span class="tag tag-status ${statusCls}">${esc(e.status || "⬜")}</span>`;

        listContainer.append(row(e, {
          title: e.title,
          lead: `<span class="tag tag-id">${esc(e.id_raw || e.id || "T")}</span>`,
          cls: statusCls,
          subs: [
            tag(e.project, "tag-project"),
            statusBadge,
            dateBadge,
            originBadge
          ],
          detail: [
            ["Why / Purpose", e.why || "—"],
            ["Project", e.project],
            ["Status", `${esc(e.status || "⬜")} ${isDone ? "(Completed)" : (isDiscarded ? "(Discarded)" : "")}`],
            ["Origin / Author", originBadge || esc(e.origin || e.author || "—")],
            ["Date", dateBadge || esc(e.date || "—")],
            ["Source File", e.file ? `<code>${esc(e.file)}</code>` : "—"]
          ],
        }));
      }

      wrap.append(listContainer);
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DECISIONS VIEW (Priority #2: 274 Records, Project-Scoped Supersedes, Frozen Toggle)
  // ───────────────────────────────────────────────────────────────────────────
  decision: {
    label: "Decisions",
    kind: "decision",
    render(list, model, filters = {}) {
      const wrap = el("div", "view-container");

      const allModelDecisions = (model.entities || []).filter(e => e.kind === "decision" || e.kind === "method-decision");
      const workingList = allModelDecisions.length ? allModelDecisions : list;

      // Project-scoped supersedes map: Map of `${project}:${id}` -> [newer decision ids]
      const supersededByMap = new Map();

      for (const d of workingList) {
        const proj = String(d.project || "nexus").trim();
        const thisId = String(d._record_id || d.id || "").trim();
        const target = String(d.supersedes || "").trim();
        if (target) {
          const targetKey = `${proj}:${target}`;
          if (!supersededByMap.has(targetKey)) supersededByMap.set(targetKey, []);
          supersededByMap.get(targetKey).push(thisId);
        }
      }

      const frozenCount = workingList.filter(d => d.frozen).length;
      const showFrozen = filters.showFrozen === true;
      const projFilter = filters.decisionProject || "";
      const statusFilter = filters.decisionStatus || "";
      const searchTxt = (filters.decisionSearch || "").toLowerCase().trim();

      const allProjects = [...new Set(workingList.map(d => d.project).filter(Boolean))].sort();

      const toolbar = el("div", "view-toolbar");
      toolbar.innerHTML = `
        <div class="toolbar-group">
          <label for="decFilterProj">Project:</label>
          <select id="decFilterProj" class="custom-select">
            <option value="">All Projects (${workingList.length})</option>
            ${allProjects.map(p => `
              <option value="${esc(p)}" ${p === projFilter ? "selected" : ""}>
                ${esc(p)} (${workingList.filter(d => d.project === p).length})
              </option>
            `).join("")}
          </select>
        </div>

        <div class="toolbar-group">
          <label for="decFilterStatus">Liveness:</label>
          <select id="decFilterStatus" class="custom-select">
            <option value="">All Decisions</option>
            <option value="ALIVE" ${statusFilter === "ALIVE" ? "selected" : ""}>🟢 Alive (Active)</option>
            <option value="SUPERSEDED" ${statusFilter === "SUPERSEDED" ? "selected" : ""}>🔄 Superseded (Replaced)</option>
          </select>
        </div>

        <div class="toolbar-group checkbox-group">
          <label class="toggle-label" title="Frozen copies are declared snapshot mirrors (e.g. thesis snapshots)">
            <input type="checkbox" id="decToggleFrozen" ${showFrozen ? "checked" : ""}>
            <span>Show Frozen Mirrors (${frozenCount})</span>
          </label>
        </div>

        <div class="toolbar-group search-group">
          <input type="text" id="decSearchInput" class="custom-input" placeholder="Search decisions, why, discarded..." value="${esc(filters.decisionSearch || "")}">
        </div>
      `;

      wrap.append(toolbar);

      // Filtering decisions
      let filtered = workingList.filter(d => {
        if (!showFrozen && d.frozen) return false;
        if (projFilter && d.project !== projFilter) return false;

        const proj = String(d.project || "nexus").trim();
        const thisId = String(d._record_id || d.id || "").trim();
        const thisKey = `${proj}:${thisId}`;
        const isSuperseded = supersededByMap.has(thisKey) || (d.supersedes && d.status === "superseded");

        if (statusFilter === "ALIVE" && isSuperseded) return false;
        if (statusFilter === "SUPERSEDED" && !isSuperseded) return false;

        if (searchTxt) {
          const matchText = (d.decision || d.title || "").toLowerCase().includes(searchTxt);
          const matchWhy = (d.why || "").toLowerCase().includes(searchTxt);
          const matchDiscarded = (d.discarded || "").toLowerCase().includes(searchTxt);
          const matchId = thisId.toLowerCase().includes(searchTxt);
          const matchProj = proj.toLowerCase().includes(searchTxt);
          if (!matchText && !matchWhy && !matchDiscarded && !matchId && !matchProj) return false;
        }
        return true;
      });

      // Sort decisions: newest date or highest numeric ID first
      filtered.sort((a, b) => {
        const idA = parseInt(String(a._record_id || a.id).replace(/\D/g, "")) || 0;
        const idB = parseInt(String(b._record_id || b.id).replace(/\D/g, "")) || 0;
        if (idA && idB && a.project === b.project) return idB - idA;
        return (b.date || "").localeCompare(a.date || "");
      });

      if (!filtered.length) {
        wrap.append(el("div", "empty-state", `
          <div class="empty-icon">📜</div>
          <h3>No decisions found</h3>
          <p>No decision records match your current filters.</p>
        `));
        return wrap;
      }

      const listContainer = el("div", "decisions-list");
      for (const d of filtered) {
        const proj = String(d.project || "nexus").trim();
        const thisId = String(d._record_id || d.id || "D");
        const thisKey = `${proj}:${thisId}`;
        const newerReplacements = supersededByMap.get(thisKey);
        const isSuperseded = Boolean(newerReplacements && newerReplacements.length);
        const supersedesOld = d.supersedes;

        const subs = [
          tag(d.project, "tag-project"),
          isSuperseded 
            ? `<span class="tag tag-superseded" title="Esta decisión fue reemplazada por ${esc(newerReplacements.join(", "))} en este proyecto">🔄 Superseded by ${esc(newerReplacements.join(", "))}</span>`
            : `<span class="tag tag-alive" title="Decisión VIVA — ninguna decisión posterior en ${esc(proj)} la ha supersede">🟢 Alive</span>`,
          supersedesOld ? `<span class="tag tag-supersedes" title="Reemplaza a ${esc(supersedesOld)}">⚡ Supersedes ${esc(supersedesOld)}</span>` : "",
          d.frozen ? `<span class="tag tag-frozen" title="Copia sellada/fotografía de ${esc(d.mirror_of || 'snapshot')}">🧊 Frozen Mirror</span>` : "",
          renderDate(d.date, d.date_inferred),
          renderOrigin(d.origin || d.author, d.origin_inferred)
        ];

        const details = [
          ["Decision", d.decision || d.title || "—"],
          ["Why / Rationale", d.why || "—"],
          d.discarded ? ["Discarded Alternative", `<div class="discarded-box"><strong>Descartado:</strong> ${inline(d.discarded)}</div>`] : null,
          ["Project", d.project],
          ["Liveness", isSuperseded ? `Reemplazada por ${newerReplacements.join(", ")}` : "VIVA (Activa)"],
          supersedesOld ? ["Supersedes", esc(supersedesOld)] : null,
          d.frozen ? ["Mirror Status", `Declared frozen mirror of ${esc(d.mirror_of || 'project')}`] : null,
          ["Date", renderDate(d.date, d.date_inferred) || esc(d.date || "—")],
          ["Origin", renderOrigin(d.origin || d.author, d.origin_inferred) || esc(d.origin || "—")],
          d.file ? ["Source File", `<code>${esc(d.file)}</code>`] : null
        ];

        listContainer.append(row(d, {
          title: d.decision || d.title || "Untitled decision",
          lead: `<span class="tag tag-id">${esc(thisId)}</span>`,
          cls: isSuperseded ? "decision-superseded" : "decision-alive",
          subs,
          detail: details.filter(Boolean)
        }));
      }

      wrap.append(listContainer);
      return wrap;
    }
  },

  "method-decision": {
    label: "Method Decisions",
    kind: "method-decision",
    render(list, model, filters) {
      return VIEWS.decision.render(list, model, filters);
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. FRONTS (Schedule Compass)
  // ───────────────────────────────────────────────────────────────────────────
  front: {
    label: "Fronts",
    kind: "front",
    render(list) {
      const wrap = el("div", "view-container");
      const active = list.filter(e => e.active);
      const rest = list.filter(e => !e.active);

      if (!list.length) {
        wrap.append(el("div", "empty-state", `<p>No active or queued fronts found.</p>`));
        return wrap;
      }

      for (const e of [...active, ...rest]) {
        wrap.append(row(e, {
          title: e.name,
          cls: e.active ? "active-front-card" : "",
          lead: `<span class="tag ${e.active ? "tag-live" : "tag-id"}">${e.active ? "▶ ACTIVE" : esc(e.marker || "#")}</span>`,
          subs: [
            tag(e.project, "tag-project"),
            e.marker === "⏸" ? tag("paused", "tag-paused") : "",
            e.marker === "?" ? tag("no state", "warn") : ""
          ],
          detail: [
            ["described in", e.described_in],
            ["moves when", e.moves_when],
            ["waits on", e.waits_on],
            ["note", e.note]
          ],
        }));
      }
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PLAN ITEMS
  // ───────────────────────────────────────────────────────────────────────────
  "plan-item": {
    label: "Plan",
    kind: "plan-item",
    render(list, model) {
      const wrap = el("div", "view-container");
      const front = (model.entities || []).find(e => e.kind === "front" && e.active);

      if (front) {
        wrap.append(el("div", "active-front-banner", `
          <div class="banner-header">
            <span class="front-marker">▶ ACTIVE FRONT</span>
            <span class="front-title">${inline(front.name)}</span>
          </div>
          <div class="banner-meta"><strong>Moves when:</strong> ${inline(front.moves_when || "—")}</div>
        `));
      }

      if (!list.length) {
        wrap.append(el("div", "empty-state", `
          <div class="empty-icon">⚡</div>
          <h3>No tasks in flight</h3>
          <p>PLAN.md is clean. Ready to orient from compass.</p>
        `));
        return wrap;
      }

      for (const e of list) {
        const done = e.struck && e.destination;
        wrap.append(row(e, {
          title: e.text,
          cls: e.struck ? "struck" : "in-flight-item",
          lead: `<span class="tag tag-id">${e.index}</span>`,
          subs: [
            e.destination
              ? `<span class="tag dest-tag ${/discarded|⚫/.test(e.destination) ? "tag-discarded" : "dest-resolved"}">${esc(e.destination)}</span>`
              : (e.struck ? `<span class="tag warn-badge">no destination — failed close</span>` : ""),
            done ? "" : tag("in flight", "tag-live")
          ],
          detail: [
            ["Destination", e.destination || "— (In flight)"],
            ["Project", e.project || "—"],
            ["Status", e.struck ? "Struck / Closed" : "Active in flight"]
          ],
        }));
      }
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 5. MAILBOX ENTRIES
  // ───────────────────────────────────────────────────────────────────────────
  "mailbox-entry": {
    label: "Mailbox",
    kind: "mailbox-entry",
    render(list) {
      const wrap = el("div", "view-container");
      if (!list.length) {
        wrap.append(el("div", "empty-state", `<div class="empty-icon">📬</div><h3>Mailbox is empty</h3>`));
        return wrap;
      }

      for (const e of list) {
        const isOpen = e.state === "open";
        wrap.append(row(e, {
          title: e.title,
          lead: `<span class="tag ${isOpen ? "warn-badge" : "dest-resolved"}">[${esc(e.state || "open")}]</span>`,
          subs: [
            tag(e.project, "tag-project"),
            tag(e.destination, "tag-purple"),
            renderDate(e.date, e.date_inferred),
            renderOrigin(e.author || e.origin, e.origin_inferred)
          ],
          detail: [
            ["Destination", e.destination || "—"],
            ["State", e.state || "open"],
            ["Raised by", renderOrigin(e.author || e.origin, e.origin_inferred) || esc(e.author || "—")],
            ["Date", renderDate(e.date, e.date_inferred) || esc(e.date || "—")]
          ],
        }));
      }
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 6. IDEAS
  // ───────────────────────────────────────────────────────────────────────────
  idea: {
    label: "Ideas",
    kind: "idea",
    render(list) {
      const wrap = el("div", "view-container");
      if (!list.length) {
        wrap.append(el("div", "empty-state", `<div class="empty-icon">💡</div><h3>Idea park is empty</h3>`));
        return wrap;
      }

      for (const e of list) {
        wrap.append(row(e, {
          title: e.title,
          subs: [
            tag(e.project, "tag-project"),
            tag(e.scope ? `scope: ${e.scope}` : "", "tag-purple"),
            renderOrigin(e.origin, e.origin_inferred)
          ],
          detail: [
            ["Body", e.body || "—"],
            ["Section", e.section || "General"],
            ["Project", e.project || "nexus"],
            ["Scope", e.scope || "—"]
          ],
        }));
      }
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 7. PROJECT STATES
  // ───────────────────────────────────────────────────────────────────────────
  "project-state": {
    label: "Projects",
    kind: "project-state",
    render(list) {
      const wrap = el("div", "projects-matrix-grid");
      if (!list.length) {
        wrap.append(el("div", "empty-state", `<h3>No project states recorded</h3>`));
        return wrap;
      }

      for (const e of list) {
        const card = el("div", "project-card");
        const fields = Object.entries(e).filter(([k]) =>
          !["kind", "line", "title", "project", "id", "source", "file"].includes(k));

        card.innerHTML = `
          <div class="card-top">
            <div class="project-name-group">
              <h3 class="project-name">${esc(e.project || e.title)}</h3>
            </div>
            <span class="status-chip status-active">ACTIVE</span>
          </div>

          ${e.next_action ? `
            <div class="next-action-preview">
              <strong>Next action:</strong> ${inline(e.next_action)}
            </div>
          ` : ""}

          <div class="project-kv-fields">
            <dl class="kv-dl">
              ${fields.map(([k, v]) => `
                <dt>${esc(k.replace(/_/g, " "))}</dt>
                <dd>${inline(v)}</dd>
              `).join("")}
            </dl>
          </div>

          <div class="card-meta-row">
            <span>Last updated: <strong>${esc(e.last_updated || "—")}</strong></span>
            <span>${esc(e.integrated_through || "")}</span>
          </div>
        `;
        wrap.append(card);
      }
      return wrap;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 8. SKILLS
  // ───────────────────────────────────────────────────────────────────────────
  skill: {
    label: "Skills",
    kind: "skill",
    render(list) {
      const wrap = el("div", "view-container");
      const note = {
        event: "Fires on its own when the event happens (Roles). You do not call these manually.",
        request: "Capabilities you invoke by name when you want what they do.",
        locked: "Only callable by name, and invisible to the model otherwise (disable-model-invocation: true).",
        unclear: "Condition not fully settled from description.",
      };
      const head = { event: "🔔 Event Roles", locked: "🔒 Locked", request: "🛠️ Capabilities", unclear: "❓ Unclassified" };

      for (const t of ["event", "locked", "request", "unclear"]) {
        const group = list.filter(e => e.trigger === t);
        if (!group.length) continue;

        const h = el("div", "skill-group-box", `
          <div class="skill-group-head">
            <h3>${esc(head[t])} <span class="tag count-badge">${group.length}</span></h3>
            <p class="skill-group-note">${esc(note[t])}</p>
          </div>
        `);
        wrap.append(h);

        for (const e of group.sort((a, b) => a.title.localeCompare(b.title))) {
          wrap.append(row(e, {
            title: e.title,
            lead: `<span class="tag tag-purple">skill</span>`,
            subs: [tag(t, t === "event" ? "tag-live" : "")],
            detail: [
              ["What it is for", e.summary || "—"],
              ["When to use it", e.when || "—"],
              ["Classification evidence", e.evidence || "Direct trigger definition"]
            ],
          }));
        }
      }
      return wrap;
    }
  }
};
