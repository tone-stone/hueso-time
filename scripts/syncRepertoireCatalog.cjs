// Snapshot the bundled Excel repertoire for the independently runnable backend.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'data/seedBarraLibre.ts'), 'utf8');
const match = source.match(/const ROWS: SeedRow\[\] = (\[[\s\S]*?\n\]);/);
if (!match) throw new Error('No se encontró el catálogo original.');
const rows = vm.runInNewContext(match[1], {}, { timeout: 1000 });
const data = {
  songs: rows.map((row, index) => ({
    ...row, id: `excel_catalog_${index}`, createdAt: '', updatedAt: '',
  })),
  setlists: [],
  settings: { language: 'es', defaultSetMinutes: 45, defaultSetCount: 3 },
};
fs.writeFileSync(path.join(root, 'backend/src/preloadedRepertoire.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`Catálogo sincronizado: ${data.songs.length} canciones.`);
