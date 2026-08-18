// One view per kind. Each returns a DOM node and knows nothing about routing,
// polling or the server — which is what lets a view be rewritten without touching
// what an entity *is*.

export const esc = s => String(s ?? "").replace(/[&<>"]/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Inline markdown only: these are one-line fields, never documents. A wall of
// rendered markdown is the shape this interface exists to replace.
export function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (_, a) => `<code>${a}</code>`);
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, (_, a) => `<strong>${a}</strong>`);
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, (_, a, b) => `${a}<em>${b}</em>`);
  t = t.replace(/~~([^~]+)~~/g, (_, a) => `<del>${a}</del>`);
  return t;
}

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const tag = (text, cls = "") => text ? `<span class="tag ${cls}">${esc(text)}</span>` : "";

/** A row that expands. The unit of every view except project states. */
function row(e, { title, subs = [], detail = [], cls = "", lead = "" }) {
  const d = el("details", `row ${cls}`);
  d.id = e.id;
  d.innerHTML =
    `<summary>${lead}<span class="t">${inline(title)}</span>` +
    subs.filter(Boolean).join("") + `</summary>` +
    `<div class="detail"><dl>` +
    detail.filter(([, v]) => v).map(([k, v]) =>
      `<dt>${esc(k)}</dt><dd>${inline(v)}</dd>`).join("") +
    `</dl></div>`;
  return d;
}

export const VIEWS = {
  front: {
    label: "Fronts", kind: "front",
    render(list) {
      const wrap = el("div");
      const active = list.filter(e => e.active);
      const rest = list.filter(e => !e.active);
      for (const e of [...active, ...rest]) {
        wrap.append(row(e, {
          title: e.name,
          cls: e.active ? "active" : "",
          subs: [tag(e.project, "p"), e.marker === "⏸" ? tag("paused") : "",
                 e.marker === "?" ? tag("no state", "warn") : ""],
          detail: [["described in", e.described_in], ["moves when", e.moves_when],
                   ["waits on", e.waits_on], ["note", e.note]],
        }));
      }
      return wrap;
    },
  },

  task: {
    label: "Tasks", kind: "task",
    render(list) {
      const wrap = el("div");
      for (const e of list) {
        wrap.append(row(e, {
          title: e.title,
          lead: `<span class="tag">${esc(e.id_raw || "")}</span>`,
          subs: [tag(e.project, "p"), tag(e.status || "")],
          detail: [["why", e.why], ["author", e.author], ["date", e.date],
                   ["file", e.file]],
        }));
      }
      return wrap;
    },
  },

  "mailbox-entry": {
    label: "Mailbox", kind: "mailbox-entry",
    render(list) {
      const wrap = el("div");
      for (const e of list) {
        wrap.append(row(e, {
          title: e.title,
          subs: [tag(e.project, "p"), tag(e.destination, "dest"),
                 tag(e.state, e.state === "resolved" ? "" : "warn")],
          detail: [["destination", e.destination], ["state", e.state],
                   ["raised by", `${e.author || "?"} · ${e.date || ""}`]],
        }));
      }
      return wrap;
    },
  },

  idea: {
    label: "Ideas", kind: "idea",
    render(list) {
      const wrap = el("div");
      for (const e of list) {
        wrap.append(row(e, {
          title: e.title,
          subs: [tag(e.project, "p"), tag(e.scope)],
          detail: [["", e.body], ["section", e.section]],
        }));
      }
      return wrap;
    },
  },

  "plan-item": {
    label: "Plan", kind: "plan-item",
    render(list, model) {
      const wrap = el("div");
      const front = (model.entities || []).find(e => e.kind === "front" && e.active);
      if (front) {
        wrap.append(el("div", "problems",
          `<h3>Active front</h3><div>${inline(front.name)}</div>`));
        wrap.lastChild.style.borderColor = "var(--live)";
        wrap.lastChild.querySelector("h3").style.color = "var(--live)";
      }
      if (!list.length) {
        wrap.append(el("div", "empty", "No task in flight."));
        return wrap;
      }
      for (const e of list) {
        const done = e.struck && e.destination;
        wrap.append(row(e, {
          title: e.text,
          cls: e.struck ? "struck" : "",
          lead: `<span class="tag">${e.index}</span>`,
          subs: [e.destination
            ? `<span class="dest ${/discarded|⚫/.test(e.destination) ? "gone" : ""}">${esc(e.destination)}</span>`
            : (e.struck ? `<span class="dest warn">no destination — failed close</span>` : ""),
            done ? "" : tag("in flight", "live")],
          detail: [["destination", e.destination || "—"], ["project", e.project]],
        }));
      }
      return wrap;
    },
  },

  "project-state": {
    label: "Projects", kind: "project-state",
    render(list) {
      const wrap = el("div", "cards");
      for (const e of list) {
        const fields = Object.entries(e).filter(([k]) =>
          !["kind", "line", "title", "project", "id", "source", "file"].includes(k));
        wrap.append(el("div", "card",
          `<h3>${esc(e.project || e.title)}</h3><dl>` +
          fields.map(([k, v]) =>
            `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${inline(v)}</dd>`).join("") +
          `</dl>`));
      }
      return wrap;
    },
  },

  skill: {
    label: "Skills", kind: "skill",
    render(list) {
      const wrap = el("div");
      const note = {
        event: "Fires on its own when the event happens. You do not call these — "
             + "if one needs calling, something upstream did not fire.",
        request: "You call these by name, when you want what they do.",
        locked: "Only callable by name, and invisible to the model otherwise.",
        unclear: "Nothing here guessed. Each row below says what its description does "
               + "and does not settle — usually it names a condition without saying who "
               + "acts on it. The guide is generated from these descriptions, so a "
               + "description that cannot be read is a row that cannot be right.",
      };
      const head = { event: "Fires by itself", locked: "Locked",
                     request: "You invoke it", unclear: "Cannot be told from its description" };
      for (const t of ["event", "locked", "request", "unclear"]) {
        const group = list.filter(e => e.trigger === t);
        if (!group.length) continue;
        const h = el("div", "problems",
          `<h3>${esc(head[t])} <span class="tag">${group.length}</span></h3>`
          + `<div>${esc(note[t])}</div>`);
        if (t !== "unclear") {
          h.style.borderColor = "var(--line)";
          h.querySelector("h3").style.color = "var(--ink)";
        }
        wrap.append(h);
        for (const e of group.sort((a, b) => a.title.localeCompare(b.title))) {
          wrap.append(row(e, {
            title: e.title,
            subs: [tag(t, t === "event" ? "event" : "")],
            detail: [["what it is for", e.summary], ["when to use it", e.when],
                     ["how this was classified", e.evidence || "nothing in the description says"]],
          }));
        }
      }
      return wrap;
    },
  },
};
