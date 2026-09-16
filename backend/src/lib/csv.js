// CSV pentru Export/Import meniu (doar RO) — usor de editat in Excel:
// delimitator `;` (standard RO), ghilimele duble, BOM UTF-8 pentru diacritice/chirlice.
const DELIM = ';';

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
function parse(text) {
  const src = String(text || '').replace(new RegExp('^' + BOM), '');
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
    else if (ch === DELIM) pushCell();
    else if (ch === '\r') { /* asteapta \n */ }
    else if (ch === '\n') { pushCell(); pushRow(); }
    else cur += ch;
  }
  pushCell(); pushRow();
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, k) => { o[h] = r[k] !== undefined ? r[k] : ''; });
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

module.exports = { stringify, parse, splitList, parseItems, itemsCell };
