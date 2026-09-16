// CSV pentru Export/Import meniu (doar RO) — usor de editat in Excel:
// delimitator `;` (standard RO), ghilimele duble, BOM UTF-8 pentru diacritice/chirlice.
// La import delimitatorul se detecteaza automat (; sau , sau tab), iar headerele
// accepta si denumiri RO (titlu, pasi, ...), ca sa fie usor de completat manual.
const DELIMS = [';', ',', '\t'];

function escCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function stringify(rows, headers) {
  const lines = [headers.map(escCell).join(DELIM)];
  for (const r of rows) {
    lines.push(headers.map((h) => escCell(r[h])).join(DELIM));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

const BOM = '\uFEFF';
function parse(text, delim) {
  const src = String(text || '').replace(new RegExp('^' + BOM), '');
  const firstLine = src.split(/\r?\n/)[0] || '';
  const d = delim || detectDelim(firstLine);
  const rows = [];
  let row = [], cur = '', inQ = false;
  const pushCell = () => { row.push(cur); cur = ''; };
  const pushRow = () => {
    // sare peste randurile complet goale
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === d) pushCell();
    else if (ch === '\r') { /* asteapta \n */ }
    else if (ch === '\n') { pushCell(); pushRow(); }
    else cur += ch;
  }
  pushCell(); pushRow();
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return { headers, rows: rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, k) => { o[h] = r[k] !== undefined ? r[k] : ''; });
    return o;
  }) };
}

// detecteaza delimitatorul din prima linie (ignora ce e intre ghilimele)
function detectDelim(line) {
  const bare = String(line || '').replace(/"[^"]*"/g, '');
  let best = ';', bestN = -1;
  for (const d of DELIMS) {
    const n = bare.split(d).length - 1;
    if (n > bestN) { bestN = n; best = d; }
  }
  return bestN > 0 ? best : ';';
}

// normalizeaza headerele: lowercase + aliasuri RO -> chei canonice
const HEADER_ALIASES = {
  slug: ['slug'],
  titleRo: ['titlero', 'titlu', 'titlul', 'denumire', 'nume', 'name', 'reteta', 'rețeta'],
  summaryRo: ['summaryro', 'descriere', 'rezumat', 'sumar'],
  ingredientsRo: ['ingredientsro', 'ingrediente', 'ingrediente_text'],
  items: ['items', 'ingrediente_structurate', 'produse', 'lista_ingrediente'],
  stepsRo: ['stepsro', 'pasi', 'pași', 'preparare', 'mod_preparare', 'instructiuni', 'instrucțiuni'],
  prepMinutes: ['prepminutes', 'pregatire', 'prep', 'timp_pregatire'],
  cookMinutes: ['cookminutes', 'gatire', 'gătire', 'cook', 'timp_gatire'],
  servings: ['servings', 'portii', 'porții', 'portie'],
  difficulty: ['difficulty', 'dificultate', 'greutate'],
  imageUrl: ['imageurl', 'poza', 'imagine', 'cover', 'foto'],
  status: ['status', 'stare'],
  ageMin: ['agemin', 'varsta', 'vârsta', 'age', 'luni'],
  feedingType: ['feedingtype', 'tip_masa', 'masa', 'tip'],
  categories: ['categories', 'categorii', 'categorie'],
  restrictions: ['restrictions', 'restrictii', 'restricții'],
  characteristics: ['characteristics', 'caracteristici', 'trasaturi', 'trasături']
};

function normalizeRows(parsed) {
  const canonByNorm = {};
  for (const [canon, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const a of aliases) canonByNorm[a] = canon;
  }
  const norm = (h) => String(h || '').trim().toLowerCase().replace(/[\s_]+/g, '');
  return parsed.rows.map((r) => {
    const o = {};
    for (const h of parsed.headers) {
      const c = canonByNorm[norm(h)];
      if (c && o[c] === undefined) o[c] = r[h];
    }
    return o;
  });
}

// liste in celula, separate prin `|`: "a|b|c"
function splitList(s) {
  return String(s || '').split('|').map((x) => x.trim()).filter(Boolean);
}

// ingrediente structurate: cate un rand "produs | cantitate | unitate | notita"
function parseItems(s) {
  return String(s || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [product = '', quantity = '', unit = '', note = ''] = l.split('|').map((x) => x.trim());
    return { product, quantity, unit, note };
  }).filter((it) => it.product);
}

function itemsCell(items) {
  return (items || []).map((it) => {
    const p = it.product || it.nameRo || '';
    if (!p) return '';
    return [p, it.quantity ?? '', it.unit || '', it.note || it.noteRo || ''].join(' | ');
  }).filter(Boolean).join('\n');
}

module.exports = { stringify, parse, detectDelim, normalizeRows, splitList, parseItems, itemsCell };
