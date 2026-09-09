// Run from the repository root: node interface/tests/projects.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('function projectViewModel('), source.indexOf('// Ingest typed model'));
const context = vm.createContext({});
vm.runInContext(code, context);
const projects = context.projectViewModel([
  { kind: 'project-state', project: 'sample', blocks: [], documents: [] },
  { kind: 'project-state', project: 'sample-extra', blocks: [], last_updated: '2026-09-01', integrated_through: 'D12' },
  { kind: 'project-state', project: 'nexus', blocks: [], documents: [] },
  { kind: 'decision', project: 'ghost', id: 'D999' }
], [{project: 'sample-extra', active: true}, {project: 'sample', active: true, in_bin: true}]);
assert.equal(projects.length, 3, 'Only declared projects, including the system project');
const sample = projects.find(p => p.name === 'sample');
assert.equal(sample.activeTasks.length, 0, 'No prefix matching or history promoted as live work');
assert.equal(sample.status, null);
assert.equal(sample.lastUpdated, null);
assert.equal(sample.integratedThrough, null);
assert.equal(sample.nextAction, null);
assert.equal(sample.definition, '');
assert.equal(sample.progress, null);
assert.equal(projects.find(p => p.name === 'sample-extra').integratedThrough, 'D12');
console.log('Project identity and absent metadata stay faithful to their sources.');
