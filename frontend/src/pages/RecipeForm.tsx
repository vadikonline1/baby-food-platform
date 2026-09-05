import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, imgUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';

type Lang = 'ro' | 'ru' | 'en';
type IngRow = { key: number; ingredientId: string; quantity: string; unit: string; noteRo: string };

let rowKey = 1;

export default function RecipeForm() {
  const { id } = useParams();
  const editMode = Boolean(id);
  const { user } = useAuth();
  const nav = useNavigate();

  const [langTab, setLangTab] = useState<Lang>('ro');
  const [title, setTitle] = useState({ ro: '', ru: '', en: '' });
  const [summary, setSummary] = useState({ ro: '', ru: '', en: '' });
  const [steps, setSteps] = useState<Record<Lang, string[]>>({ ro: [''], ru: [''], en: [''] });

  const [catalog, setCatalog] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [rows, setRows] = useState<IngRow[]>([]);
  const [newProd, setNewProd] = useState({ ro: '', ru: '', en: '' });

  const [ages, setAges] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [restrs, setRestrs] = useState<any[]>([]);
  const [chars, setChars] = useState<any[]>([]);

  const [ageIds, setAgeIds] = useState<number[]>([]);
  const [feedId, setFeedId] = useState('');
  const [catIds, setCatIds] = useState<number[]>([]);
  const [restrIds, setRestrIds] = useState<number[]>([]);
  const [charIds, setCharIds] = useState<number[]>([]);
  const [prep, setPrep] = useState('10');
  const [cook, setCook] = useState('15');
  const [servings, setServings] = useState('2');
  const [imageUrl, setImageUrl] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/taxonomies/ages').then(r => setAges(r.data)).catch(() => {});
    api.get('/taxonomies/feeding-types').then(r => setFeeds(r.data)).catch(() => {});
    api.get('/taxonomies/categories').then(r => setCats(r.data)).catch(() => {});
    api.get('/taxonomies/restrictions').then(r => setRestrs(r.data)).catch(() => {});
    api.get('/taxonomies/characteristics').then(r => setChars(r.data)).catch(() => {});
    api.get('/taxonomies/units').then(r => setUnits(r.data)).catch(() => {});
    api.get('/ingredients', { params: { limit: 300 } }).then(r => setCatalog(r.data)).catch(() => {});
    if (editMode) {
      api.get(`/recipes/by-id/${id}`).then(({ data: r }) => {
        setTitle({ ro: r.titleRo || '', ru: r.titleRu || '', en: r.titleEn || '' });
        setSummary({ ro: r.summaryRo || '', ru: r.summaryRu || '', en: r.summaryEn || '' });
        const split = (s: string) => (s ? s.split('\n').map((x: string) => x.trim()).filter(Boolean) : ['']);
        setSteps({ ro: split(r.stepsRo), ru: split(r.stepsRu), en: split(r.stepsEn) });
        setRows((r.ingredientsDetailed || []).map((d: any) => ({
          key: rowKey++, ingredientId: String(d.ingredientId),
          quantity: d.quantity ?? '', unit: d.unit || '', noteRo: d.noteRo || ''
        })));
        setAgeIds((r.ageGroups || []).map((a: any) => a.ageGroupId));
        setFeedId(r.feedingTypeId ? String(r.feedingTypeId) : '');
        setCatIds((r.categories || []).map((c: any) => c.categoryId ?? c.category?.id));
        setRestrIds((r.restrictions || []).map((c: any) => c.restrictionId ?? c.restriction?.id));
        setCharIds((r.characteristics || []).map((c: any) => c.characteristicId ?? c.characteristic?.id));
        setPrep(String(r.prepMinutes)); setCook(String(r.cookMinutes)); setServings(String(r.servings));
        setImageUrl(r.imageUrl || '');
      }).catch(() => setMsg('Rețeta nu a putut fi încărcată.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) return <p>Acces interzis — doar Moderator/Admin.</p>;

  const toggleCheck = (arr: number[], v: number, set: (x: number[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const updRow = (key: number, patch: Partial<IngRow>) =>
    setRows(rows.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const addProduct = async () => {
    if (!newProd.ro.trim()) return;
    const { data } = await api.post('/ingredients', { nameRo: newProd.ro.trim(), nameRu: newProd.ru.trim() || undefined, nameEn: newProd.en.trim() || undefined });
    setCatalog([...catalog, data]);
    setRows([...rows, { key: rowKey++, ingredientId: String(data.id), quantity: '', unit: '', noteRo: '' }]);
    setNewProd({ ro: '', ru: '', en: '' });
  };

  const uploadCover = async (f: File | undefined) => {
    if (!f) return;
    const fd = new FormData();
    fd.append('image', f);
    const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setImageUrl(data.url);
  };

  const setStep = (l: Lang, i: number, v: string) =>
    setSteps({ ...steps, [l]: steps[l].map((s, j) => (j === i ? v : s)) });

  const totalTime = (Number(prep) || 0) + (Number(cook) || 0);

  const submit = async (e: any) => {
    e.preventDefault();
    setMsg('');
    if (!title.ro.trim()) { setMsg('Titlul în română este obligatoriu.'); return; }
    const stepsRo = steps.ro.map(s => s.trim()).filter(Boolean);
    if (!stepsRo.length) { setMsg('Adaugă cel puțin un pas de preparare (RO).'); return; }
    const validRows = rows.filter(r => r.ingredientId);
    if (!validRows.length) { setMsg('Adaugă cel puțin un ingredient (selectează produsul).'); return; }
    const payload: any = {
      titleRo: title.ro.trim(), titleRu: title.ru.trim() || undefined, titleEn: title.en.trim() || undefined,
      summaryRo: summary.ro.trim() || undefined, summaryRu: summary.ru.trim() || undefined, summaryEn: summary.en.trim() || undefined,
      stepsRo, stepsRu: steps.ru.map(s => s.trim()).filter(Boolean),
      stepsEn: steps.en.map(s => s.trim()).filter(Boolean),
      items: validRows.map(r => ({
        ingredientId: Number(r.ingredientId),
        quantity: r.quantity === '' ? null : Number(r.quantity),
        unit: r.unit || undefined, noteRo: r.noteRo || undefined
      })),
      ageGroupIds: ageIds, feedingTypeId: feedId || undefined,
      categoryIds: catIds, restrictionIds: restrIds, characteristicIds: charIds,
      prepMinutes: Number(prep) || 10, cookMinutes: Number(cook) || 15, servings: Number(servings) || 2,
      imageUrl: imageUrl || undefined
    };
    try {
      if (editMode) {
        await api.put(`/recipes/${id}`, payload);
        setMsg('Rețeta a fost actualizată.');
      } else {
        const { data } = await api.post('/recipes', payload);
        setMsg(data.status === 'DRAFT'
          ? 'Rețeta a fost trimisă spre validare către administrator.'
          : 'Rețeta a fost publicată.');
        setTimeout(() => nav('/admin'), 1200);
      }
    } catch (err: any) {
      setMsg('Eroare: ' + (err.response?.data?.message || err.response?.data?.error || 'salvare eșuată'));
    }
  };

  return (
    <>
      <p><Link to="/admin">← Înapoi la panou</Link></p>
      <h1>{editMode ? 'Editează rețeta' : 'Adaugă rețetă'}</h1>

      <div className="langtabs">
        {(['ro', 'ru', 'en'] as Lang[]).map(l => (
          <button key={l} type="button" className={langTab === l ? 'on' : ''} onClick={() => setLangTab(l)}>
            {l.toUpperCase()}{l === 'ro' ? ' · implicit' : ''}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div className="form-grid">
          {/* ===== coloana principala: ce se traduce ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <section className="panel">
              <h3>Titlu · {langTab.toUpperCase()}</h3>
              <input placeholder={langTab === 'ro' ? 'Titlu RO *' : `Titlu ${langTab.toUpperCase()} (opțional)`}
                value={title[langTab]} onChange={e => setTitle({ ...title, [langTab]: e.target.value })} />
              <h4>Descriere scurtă · {langTab.toUpperCase()}</h4>
              <textarea rows={2} value={summary[langTab]} onChange={e => setSummary({ ...summary, [langTab]: e.target.value })} />
            </section>

            <section className="panel">
              <h3>Ingrediente</h3>
              <div className="ing-head">
                <span>Produs *</span><span>Cant.</span><span>Unitate</span><span>Notițe (opțional)</span><span></span>
              </div>
              {rows.map(r => (
                <div className="ing-row" key={r.key}>
                  <select value={r.ingredientId} onChange={e => updRow(r.key, { ingredientId: e.target.value })}>
                    <option value="">— alege produsul —</option>
                    {catalog.map(c => <option key={c.id} value={c.id}>{c.nameRo}</option>)}
                  </select>
                  <input placeholder="2 / 100" value={r.quantity} onChange={e => updRow(r.key, { quantity: e.target.value })} />
                  <select value={r.unit} onChange={e => updRow(r.key, { unit: e.target.value })}>
                    <option value="">—</option>
                    {units.map(u => <option key={u.id} value={u.nameRo}>{u.nameRo}</option>)}
                  </select>
                  <input placeholder="ex: fiartă" value={r.noteRo} onChange={e => updRow(r.key, { noteRo: e.target.value })} />
                  <button type="button" className="btn danger small" onClick={() => setRows(rows.filter(x => x.key !== r.key))}>✕</button>
                </div>
              ))}
              <button type="button" className="btn secondary small" onClick={() => setRows([...rows, { key: rowKey++, ingredientId: '', quantity: '', unit: '', noteRo: '' }])}>
                + Adaugă ingredient
              </button>
              <h4>Produs nou în catalog</h4>
              <div className="ing-new">
                <input placeholder="Nume RO *" value={newProd.ro} onChange={e => setNewProd({ ...newProd, ro: e.target.value })} />
                <input placeholder="RU" value={newProd.ru} onChange={e => setNewProd({ ...newProd, ru: e.target.value })} />
                <input placeholder="EN" value={newProd.en} onChange={e => setNewProd({ ...newProd, en: e.target.value })} />
                <button type="button" className="btn secondary small" onClick={addProduct}>+ Salvează produs</button>
              </div>
            </section>

            <section className="panel">
              <h3>Pași de preparare · {langTab.toUpperCase()}</h3>
              {steps[langTab].map((s, i) => (
                <div key={i} className="step-row">
                  <span className="badge">{i + 1}</span>
                  <input placeholder={`Pasul ${i + 1}${i === 0 ? ' — ex: Fierbem apa' : ''}${i === 1 ? ' — ex: Curățăm morcovul' : ''}`}
                    value={s} onChange={e => setStep(langTab, i, e.target.value)} />
                  {steps[langTab].length > 1 && (
                    <button type="button" className="btn danger small" onClick={() => setSteps({ ...steps, [langTab]: steps[langTab].filter((_, j) => j !== i) })}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn secondary small" onClick={() => setSteps({ ...steps, [langTab]: [...steps[langTab], ''] })}>+ Adaugă pas</button>
            </section>
          </div>

          {/* ===== sidebar: comun tuturor limbilor ===== */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <section className="panel">
              <h3>Poză de copertă</h3>
              {imageUrl && <img src={imgUrl(imageUrl)} alt="copertă" className="cover-preview" />}
              <input type="file" accept="image/*" onChange={e => uploadCover(e.target.files?.[0])} />
            </section>

            <section className="panel">
              <h3>Timp preparare</h3>
              <div className="side-3">
                <label>Pregătire (min)<input value={prep} onChange={e => setPrep(e.target.value)} inputMode="numeric" /></label>
                <label>Gătire (min)<input value={cook} onChange={e => setCook(e.target.value)} inputMode="numeric" /></label>
                <label>Porții<input value={servings} onChange={e => setServings(e.target.value)} inputMode="numeric" /></label>
              </div>
              <p className="meta">Total: <strong>{totalTime} min</strong></p>
              <h4>Vârsta (bifează)</h4>
              <div className="check-list">
                {ages.map(a => (
                  <label key={a.id} className="fcheck">
                    <input type="checkbox" checked={ageIds.includes(a.id)} onChange={() => toggleCheck(ageIds, a.id, setAgeIds)} />
                    <span>{a.labelRo}</span>
                  </label>
                ))}
              </div>
              <h4>Tip alimentare</h4>
              <select value={feedId} onChange={e => setFeedId(e.target.value)}>
                <option value="">—</option>
                {feeds.map(f => <option key={f.id} value={f.id}>{f.nameRo}</option>)}
              </select>
            </section>

            <section className="panel">
              <h3>Încadrare</h3>
              <h4>Categorii meniu</h4>
              <div className="check-list">
                {cats.map(c => (
                  <label key={c.id} className="fcheck">
                    <input type="checkbox" checked={catIds.includes(c.id)} onChange={() => toggleCheck(catIds, c.id, setCatIds)} />
                    <span>{c.icon} {c.nameRo}</span>
                  </label>
                ))}
              </div>
              <h4>Restricții</h4>
              <div className="check-list">
                {restrs.map(c => (
                  <label key={c.id} className="fcheck">
                    <input type="checkbox" checked={restrIds.includes(c.id)} onChange={() => toggleCheck(restrIds, c.id, setRestrIds)} />
                    <span>{c.nameRo}</span>
                  </label>
                ))}
              </div>
              <h4>Caracteristici</h4>
              <div className="check-list">
                {chars.map(c => (
                  <label key={c.id} className="fcheck">
                    <input type="checkbox" checked={charIds.includes(c.id)} onChange={() => toggleCheck(charIds, c.id, setCharIds)} />
                    <span>{c.nameRo}</span>
                  </label>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {msg && <p className="notice" style={{ marginTop: 16 }}>{msg}</p>}
        <div style={{ marginTop: 16 }}>
          <button className="btn">{editMode ? 'Salvează modificările' : 'Adaugă rețeta'}</button>
        </div>
      </form>
    </>
  );
}
