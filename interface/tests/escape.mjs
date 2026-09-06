// La prueba con planta de `render/escape.js`.
//
//   node interface/tests/escape.mjs          desde la raíz del repositorio
//
// `AX-7`: una comprobación no está adoptada hasta que se la ha visto fallar con una falta
// plantada — y la planta se hace contra el FORMATO, no contra un ejemplo de juguete. De ahí
// los tres casos, que son los mismos que usa `tools/tests/`:
//
//   1. planta obvia    — debe disparar
//   2. planta sutil    — la misma falta escrita como se escribe el fichero real. Es la que
//                        importa: reproduce el punto ciego del propio fichero.
//   3. control negativo — debe QUEDARSE CALLADO. Sin él, una función que escapara todo y no
//                        renderizara nada pasaría los dos primeros y parecería perfecta.
//
// Sale 0 si los tres pasan · 1 si alguno falla · 2 si no ha podido correr, que NO es pasar.

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOD = path.join(HERE, "..", "render", "escape.js");

let esc, inline, jsq;
try {
  ({ esc, inline, jsq } = createRequire(import.meta.url)(MOD));
} catch (e) {
  console.error(`  escape: no he podido cargar ${MOD} — ${e.message}`);
  process.exit(2);
}
if ([esc, inline, jsq].some(f => typeof f !== "function")) {
  console.error("  escape: el módulo no exporta esc/inline/jsq");
  process.exit(2);
}

let fails = 0;
const ok = (name, cond, detail = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) fails++;
};

// Las cinco únicas etiquetas que `inline` tiene permitido emitir. Todo lo demás que
// aparezca como `<` en la salida es una fuga.
const ALLOWED = /<\/?(code|strong|em|del)>/g;
const leaks = out => out.replace(ALLOWED, "").includes("<");

// ── 1 · planta obvia ─────────────────────────────────────────────────────────────────
console.log("\n1 · planta obvia — el HTML crudo debe salir como texto");
for (const payload of [
  `<img src=x onerror=alert(1)>`,
  `<script>alert(1)</script>`,
  `<a href="javascript:alert(1)">pincha</a>`,
  `<div onclick="alert(1)">x</div>`,
  `<svg/onload=alert(1)>`
]) {
  const out = inline(payload);
  ok(payload.slice(0, 34), !leaks(out) && out.includes("&lt;"), `salió: ${out}`);
}
{
  // El mismo sumidero en contexto de atributo: `jsq` tiene que cerrar la cadena JS Y el
  // atributo HTML. Ninguna comilla puede sobrevivir sin escapar.
  const out = jsq(`O'Brien");alert(1);//`);
  ok("jsq cierra la cadena y el atributo",
     !/['"]/.test(out) && out.includes("&quot;") && out.includes("&#39;"), `salió: ${out}`);
}

// ── 2 · planta sutil, escrita como se escribe el fichero ─────────────────────────────
// La fila real de `AX-1` en `AXIOMS.md`. Lleva un marcador `<the instance's>` entre
// backticks, que es exactamente lo que hacía que la versión anterior se saltara el escape
// entero: la fila salía sin negrita, sin código, y el navegador se comía el marcador.
console.log("\n2 · planta sutil — una fila de AXIOMS.md, con marcador y markdown");
{
  const fila = "**Structure is public and depersonalised; state is private.** " +
               "`$` `bash tools/gate.sh --denylist <the instance's>` — el árbol seguido, nunca la historia";
  const out = inline(fila);
  ok("el marcador se ve como texto", out.includes("&lt;the instance&#39;s&gt;"), `salió: ${out}`);
  ok("la negrita se renderiza", out.includes("<strong>Structure is public"), `salió: ${out}`);
  ok("el código se renderiza", out.includes("<code>bash tools/gate.sh"), `salió: ${out}`);
  ok("y no se escapa nada más", !leaks(out), `salió: ${out}`);
}
{
  // La misma trampa una capa más abajo: contenido de fichero dentro de un atributo.
  const out = `<button onclick="openClause(${jsq("PH-0\") || alert(1) || (\"")})">`;
  ok("un id de cláusula no se sale del onclick",
     !/onclick="[^"]*"[^>]*alert/.test(out) && out.split('"').length === 3,
     `salió: ${out}`);
}

// ── 3 · control negativo ─────────────────────────────────────────────────────────────
console.log("\n3 · control negativo — la prosa de siempre sale como siempre");
{
  const casos = [
    ["prosa llana sin marcas", "prosa llana sin marcas"],
    ["con **negrita** dentro", "con <strong>negrita</strong> dentro"],
    ["con `código` dentro", "con <code>código</code> dentro"],
    ["con ~~tachado~~ dentro", "con <del>tachado</del> dentro"],
    ["con *cursiva* dentro", "con <em>cursiva</em> dentro"],
    ["", ""]
  ];
  for (const [entrada, esperada] of casos) {
    const out = inline(entrada);
    ok(`«${entrada || "(vacío)"}»`, out === esperada, `esperaba: ${esperada}\n      salió:    ${out}`);
  }
  ok("null y undefined salen vacíos", inline(null) === "" && inline(undefined) === "");
  ok("esc deja la prosa intacta", esc("una frase normal, sin nada") === "una frase normal, sin nada");
}

console.log(fails === 0
  ? "\n  escape: los tres casos pasan.\n"
  : `\n  escape: ${fails} comprobacion${fails === 1 ? "" : "es"} fallida${fails === 1 ? "" : "s"}.\n`);
process.exit(fails === 0 ? 0 : 1);
