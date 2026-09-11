// Run from the repository root: node interface/tests/mailbox.mjs
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../render/mailbox.js');
const source = 'Intro.\n\n**Description.** Whole context.\n\n**Why it needs the operator.** First paragraph.\n\nSecond paragraph with **emphasis**.\n\n**What it affects.** A source file.\n';
const entries = [
  {id:'a', title:'Same title', project:'alpha', state:'open', body:source},
  {id:'b', title:'Same title', project:'beta', state:'resolved', body:'Needle in archive'},
  {id:'c', title:'Café', project:'beta', state:'pending', body:'Needle'},
  {id:'d', title:'Closed', project:'alpha', state:'archived', body:'Old'},
  {id:'e', title:'Unknown state', project:'alpha', state:'new-status', body:'Keep visible'}
];
assert.deepEqual(M.filter(entries,{}).map(e=>e.id), ['a','c','e']);
assert.deepEqual(M.filter(entries,{view:'archive'}).map(e=>e.id), ['b','d']);
assert.equal(new Set([...M.filter(entries,{}), ...M.filter(entries,{view:'archive'})]).size, entries.length);
assert.deepEqual(M.filter(entries,{project:'beta',q:'cafe'}).map(e=>e.id), ['c']);
assert.deepEqual(M.filter(entries,{q:'needle'}).map(e=>e.id), ['c']);
assert.deepEqual(M.filter(entries,{view:'archive',q:'needle'}).map(e=>e.id), ['b']);
assert.equal(M.select(entries,'b').entry,entries[1]);
assert.equal(M.select(entries,'absent').kind,'missing');
assert.equal(M.select([...entries,{...entries[0]}],'a').kind,'ambiguous');
assert.equal(M.state(entries[4]).label,'Estado sin clasificar');
const request = M.request(source);
assert.equal(request.text,'First paragraph.\n\nSecond paragraph with **emphasis**.');
assert.match(request.remainder,/Intro/);
assert.match(request.remainder,/Whole context/);
assert.match(request.remainder,/A source file/);
assert.doesNotMatch(request.remainder,/First paragraph/);
assert.equal(source.slice(request.start,request.end),request.original, 'The lifted passage is an exact source slice');
assert.equal(M.request('No structured fields.'),null);
assert.equal(M.request('```md\n**Asks** Do not extract code.\n```'),null);
assert.equal(M.request('**Asks** One\n**Asks** Two'),null,'Ambiguous fields stay in their original order');
assert.equal(M.request('**Asks** Choose.\n**Affects** One file.').text,'Choose.');
const loc={view:'archive',project:'A & %B',q:'árbol %26',id:'id/with & symbols'};
assert.deepEqual(M.location(new URLSearchParams(M.route(loc).split('?')[1])),loc);
assert.deepEqual(M.location(new URLSearchParams('filter=old')), {view:'pending',project:'',q:'',id:''});
console.log('Mailbox state boundary, identity, search, exact request and route checks passed.');
