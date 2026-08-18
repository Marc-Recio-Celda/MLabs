// The shell: fetch the model, route between views, poll for change.
// It knows the *kinds* a view can exist for and no instance whatsoever.

import { VIEWS, esc } from "./views.js";

const $ = s => document.querySelector(s);
let MODEL = { entities: [], problems: [] };
let stamp = null;

const order = ["front", "plan-item", "task", "mailbox-entry", "idea",
               "project-state", "skill"];

function current() {
  const h = location.hash.replace(/^#\/?/, "").split("?")[0];
  return VIEWS[h] ? h : order[0];
}

function projects() {
  return [...new Set(MODEL.entities.map(e => e.project).filter(Boolean))].sort();
}

function draw() {
  const kind = current();
  const filter = $("#filter").value;

  $("#tabs").innerHTML = order.filter(k => VIEWS[k]).map(k => {
    const n = MODEL.entities.filter(e =>
      e.kind === k && (!filter || !e.project || e.project === filter)).length;
    return `<a href="#/${k}" class="${k === kind ? "on" : ""}">${esc(VIEWS[k].label)}`
         + `<span class="n">${n}</span></a>`;
  }).join("");

  const list = MODEL.entities.filter(e =>
    e.kind === kind && (!filter || !e.project || e.project === filter));

  const main = $("#main");
  const open = new Set([...main.querySelectorAll("details[open]")].map(d => d.id));
  main.innerHTML = "";

  if (MODEL.problems.length) {
    main.insertAdjacentHTML("beforeend",
      `<div class="problems"><h3>${MODEL.problems.length} entries could not be placed`
      + ` — reported, never skipped</h3><ul>`
      + MODEL.problems.map(p =>
          `<li>${esc(p.path.split("/").slice(-3).join("/"))}${p.line ? ":" + p.line : ""}`
          + ` — ${esc(p.why)}</li>`).join("")
      + `</ul></div>`);
  }

  main.append(list.length
    ? VIEWS[kind].render(list, MODEL)
    : Object.assign(document.createElement("div"),
        { className: "empty", textContent: "Nothing here." }));

  // Reopening what the reader had open is the difference between a live page and
  // one that punishes you for editing the file you are reading (AX-8).
  for (const id of open) {
    const d = main.querySelector(`#${CSS.escape(id)}`);
    if (d) d.open = true;
  }
}

async function load() {
  const r = await fetch("/api/model");
  MODEL = await r.json();
  $("#title").textContent = MODEL.title || "Operations centre";
  document.title = MODEL.title || "Operations centre";

  const sel = $("#filter"), keep = sel.value;
  sel.innerHTML = `<option value="">all projects</option>`
    + projects().map(p => `<option${p === keep ? " selected" : ""}>${esc(p)}</option>`).join("");

  $("#count").textContent =
    `${MODEL.entities.length} entities · ${new Date().toLocaleTimeString()}`;
  draw();
}

// Polling, not a socket: every push mechanism needs a build step, and the axiom
// that forbids one outranks the nicer mechanism (AX-7).
async function watch() {
  try {
    const s = (await (await fetch("/api/stamp")).json()).stamp;
    if (stamp !== null && s !== stamp) await load();
    stamp = s;
  } catch {
    $("#count").textContent = "server stopped";
  }
}

addEventListener("hashchange", draw);
$("#filter").addEventListener("change", draw);
load().then(watch);
setInterval(watch, 2000);
