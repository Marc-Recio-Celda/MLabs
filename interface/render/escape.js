// El único sitio donde esta interfaz escapa texto.
//
// Todo lo que se pinta aquí sale de un fichero: el buzón, la libreta, el muro, los axiomas,
// la filosofía, y el `README.md` de cada repositorio de proyecto — que lo escribió quien
// escribiera ese repo, no el operador. Por eso el escape no es una cortesía de formato: es
// el borde entre «contenido» y «código», y vive en un fichero propio para que haya un solo
// sitio que auditar y un solo sitio que probar (`interface/tests/escape.mjs`).
//
// ⛔ La versión anterior de `inline` empezaba así:
//
//     if (/<[a-z][\s\S]*>/i.test(t)) return t;   // «si ya trae HTML, no lo toques»
//
// y devolvía la entrada SIN ESCAPAR. Cualquier texto con una etiqueta salía al DOM
// verbatim. Además rompía la doctrina en pantalla: diecisiete filas de `AXIOMS.md`,
// `AGENTS.md`, `METHOD.md` y `GRAMMAR.md` llevan marcadores como `<the instance's>` o
// `<plan id>`, así que esquivaban el escape entero — sus negritas y sus backticks salían
// como caracteres literales y el navegador se tragaba el marcador como una etiqueta
// desconocida. La política es la contraria y no tiene excepciones: **escapar siempre**.
// El markdown se sigue interpretando; una etiqueta cruda se lee como texto.

// Texto plano hacia HTML. La comilla simple entra en la lista porque `esc` se usa también
// dentro de atributos, y allí `"` no es la única forma de salirse.
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Markdown de una línea. ⚠️ El orden importa: se escapa PRIMERO y se marca después, de
// modo que las únicas etiquetas de la salida son las que pone esta función.
function inline(s) {
  if (s == null) return "";
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (_, a) => `<code>${a}</code>`);
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, (_, a) => `<strong>${a}</strong>`);
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, (_, a, b) => `${a}<em>${b}</em>`);
  t = t.replace(/~~([^~]+)~~/g, (_, a) => `<del>${a}</del>`);
  return t;
}

// Un literal de cadena JS, con sus comillas, seguro dentro de un atributo `onclick`.
//
//     <button onclick="abrir(${jsq(nombre)})">
//
// ⚠️ `esc` NO vale para esto. El navegador decodifica las entidades del atributo *antes* de
// parsear el JS, así que `&#39;` vuelve a ser `'` y se sale de la cadena igual. Hay que
// escapar en el orden inverso al de lectura: primero JS, después HTML.
function jsq(s) {
  return esc(JSON.stringify(String(s ?? "")));
}

// El navegador lo carga como script clásico y se queda con los globales; node lo requiere
// como módulo. La cola existe para que la prueba con planta pueda cargar estas tres
// funciones sin evaluar las cinco mil líneas de `app.js`.
if (typeof module !== "undefined" && module.exports) module.exports = { esc, inline, jsq };
