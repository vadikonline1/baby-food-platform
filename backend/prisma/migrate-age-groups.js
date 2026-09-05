// Migrare one-time: varsta retetei din coloana veche Recipe.ageGroupId
// in tabela noua RecipeAge (relatie multipla).
// Rulare in container, inainte/dupa `prisma db push --accept-data-loss`:
//   node prisma/migrate-age-groups.js dump     # citeste valorile vechi in /tmp
//   node prisma/migrate-age-groups.js restore  # le scrie in RecipeAge
// Idempotent: daca nu e nimic de migrat, iese silentios cu cod 0.
const fs = require('fs');
const os = require('os');
const path = require('path');

const OUT = process.env.AGE_MIGRATION_TMP || path.join(os.tmpdir(), 'age-migration.json');

function dbPath() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  const p = url.replace(/^file:/, '');
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function openDb(readonly) {
  const Database = require('better-sqlite3');
  return new Database(dbPath(), { readonly: !!readonly });
}

function main() {
  const mode = process.argv[2];
  const file = dbPath();
  if (!fs.existsSync(file)) {
    console.log('[migrate-ages] no db file yet, skip');
    return;
  }
  if (mode === 'dump') {
    const db = openDb(true);
    const cols = db.prepare("PRAGMA table_info('Recipe')").all();
    if (!cols.some(c => c.name === 'ageGroupId')) {
      console.log('[migrate-ages] no ageGroupId column, nothing to dump');
      return;
    }
    const rows = db.prepare('SELECT id, ageGroupId FROM Recipe WHERE ageGroupId IS NOT NULL').all();
    db.close();
    fs.writeFileSync(OUT, JSON.stringify(rows));
    console.log(`[migrate-ages] dumped ${rows.length} age tag(s)`);
  } else if (mode === 'restore') {
    if (!fs.existsSync(OUT)) {
      console.log('[migrate-ages] no dump file, skip');
      return;
    }
    const rows = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const db = openDb(false);
    const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='RecipeAge'").get();
    if (!hasTable) {
      console.log('[migrate-ages] RecipeAge table missing, skip');
      return;
    }
    const hasAge = (id) => db.prepare('SELECT id FROM AgeGroup WHERE id = ?').get(id);
    const ins = db.prepare('INSERT OR IGNORE INTO RecipeAge (recipeId, ageGroupId) VALUES (?, ?)');
    let n = 0;
    const tx = db.transaction((list) => {
      for (const r of list) {
        if (!r || !r.id || !r.ageGroupId || !hasAge(r.ageGroupId)) continue;
        const recipeOk = db.prepare('SELECT id FROM Recipe WHERE id = ?').get(r.id);
        if (!recipeOk) continue;
        ins.run(r.id, r.ageGroupId);
        n++;
      }
    });
    tx(rows);
    db.close();
    fs.unlinkSync(OUT);
    console.log(`[migrate-ages] restored ${n} age tag(s)`);
  } else {
    console.error('usage: node prisma/migrate-age-groups.js dump|restore');
    process.exit(1);
  }
}

main();
