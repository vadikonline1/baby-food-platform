import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';

type Lang = 'ro' | 'ru' | 'en';
type IngRow = { key: number; ingredientId: string; quantity: string; unit: string; noteRo: string };

let rowKey = 1;

export default function RecipeForm() {
  const { id } = useParams();
  const editMode = Boolean(id);
  const { user } = useAuth();
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const uilang = i18n.language;

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
  const [rejections, setRejections] = useState<any[]>([]);

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
        setRejections(r.rejections || []);
      }).catch(() => setMsg(t('form.loadErr')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) return <p>{t('form.forbidden')}</p>;

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
    try {
      const { data } = await api.post('/upload', fd);
      setImageUrl(data.url);
    } catch {
      setMsg(t('form.coverUploadErr'));
    }
  };

  const setStep = (l: Lang, i: number, v: string) =>
    setSteps({ ...steps, [l]: steps[l].map((s, j) => (j === i ? v : s)) });

  const totalTime = (Number(prep) || 0) + (Number(cook) || 0);

  const submit = async (e: any, asPublish = false) => {
    e.preventDefault();
    setMsg('');
    // Publica: doar admin la editare; la adaugare decide backend-ul dupa rol.
    // Daca e incompleta pentru publicare -> se salveaza ca draft.
    const wantPublish = asPublish && (!editMode || user?.role === 'ADMIN');
    let status: string | undefined;
    let fellBack = '';
    if (wantPublish) {
      const missing: string[] = [];
      if (!title.ro.trim()) missing.push(t('form.reqTitle'));
      if (!steps.ro.map(s => s.trim()).filter(Boolean).length) missing.push(t('form.reqSteps'));
      if (!rows.filter(r => r.ingredientId).length) missing.push(t('form.reqIngredient'));
      if (!ageIds.length) missing.push(t('form.reqAge'));
      if (!catIds.length) missing.push(t('form.reqCategory'));
      if (!imageUrl) missing.push(t('form.reqCover'));
      if (!missing.length) status = 'PUBLISHED';
      else { fellBack = t('form.incompletePublish', { items: missing.join(', ') }); status = editMode ? undefined : 'DRAFT'; }
    } else if (!editMode) status = 'DRAFT';
    if (!title.ro.trim()) { setMsg(t('form.titleRequired')); return; }
    const stepsRo = steps.ro.map(s => s.trim()).filter(Boolean);
    if (!stepsRo.length) { setMsg(t('form.stepsRequired')); return; }
    const validRows = rows.filter(r => r.ingredientId);
    if (!validRows.length) { setMsg(t('form.ingRequired')); return; }
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
      imageUrl: imageUrl ? imageUrl : null,
      ...(status ? { status } : {})
    };
    try {
      if (editMode) {
        const { data } = await api.put(`/recipes/${id}`, payload);
        if (fellBack) setMsg(fellBack);
        else if (status === 'PUBLISHED' && data.status === 'PUBLISHED') setMsg(t('form.published'));
        else setMsg(t('form.updated'));
      } else {
        const { data } = await api.post('/recipes', payload);
        if (fellBack) setMsg(fellBack);
        else setMsg(data.status === 'DRAFT' ? t('form.sentForReview') : t('form.published'));
        if (!fellBack) setTimeout(() => nav('/admin'), 1200);
      }
    } catch (err: any) {
      setMsg('Eroare: ' + (err.response?.data?.message || err.response?.data?.error || t('form.saveFailed')));
    }
  };

  return (
    <>
      <p><Link to="/admin">{t('form.backToPanel')}</Link></p>
      <h1>{editMode ? t('form.editRecipe') : t('form.addRecipe')}</h1>
      {!!rejections.length && (
        <div className="notice" style={{ borderColor: '#f0c9c9', background: '#fef2f2', marginBottom: 16 }}>
          <strong>{t('form.rejectedNotice')}</strong>
          <ul className="dash-list" style={{ marginTop: 8 }}>
            {rejections.map((x: any) => (
              <li key={x.id}>{t('form.rejectedReason')}: {x.reason} <span className="meta">· {new Date(x.createdAt).toLocaleString()}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="langtabs">
        {(['ro', 'ru', 'en'] as Lang[]).map(l => (
          <button key={l} type="button" className={langTab === l ? 'on' : ''} onClick={() => setLangTab(l)}>
            {l.toUpperCase()}{l === 'ro' ? ` ${t('form.defaultLang')}` : ''}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => submit(e, false)}>
        <div className="form-grid">
          {/* ===== coloana principala: ce se traduce ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <section className="panel">
              <h3>{t('form.title')} · {langTab.toUpperCase()}</h3>
              <input placeholder={langTab === 'ro' ? t('form.titleRoPh') : t('form.titleOpt', { lng: langTab.toUpperCase() })}
                value={title[langTab]} onChange={e => setTitle({ ...title, [langTab]: e.target.value })} />
              <h4>{t('form.shortDesc')} · {langTab.toUpperCase()}</h4>
              <textarea rows={2} value={summary[langTab]} onChange={e => setSummary({ ...summary, [langTab]: e.target.value })} />
            </section>

            <section className="panel">
              <h3>{t('form.ingredients')}</h3>
              <div className="ing-head">
                <span>{t('form.product')}</span><span>{t('form.qty')}</span><span>{t('form.unit')}</span><span>{t('form.notesOpt')}</span><span></span>
              </div>
              {rows.map(r => (
                <div className="ing-row" key={r.key}>
                  <select value={r.ingredientId} onChange={e => updRow(r.key, { ingredientId: e.target.value })}>
                    <option value="">{t('form.chooseProduct')}</option>
                    {catalog.map(c => <option key={c.id} value={c.id}>{localized(c, 'name', uilang)}</option>)}
                  </select>
                  <input placeholder="2 / 100" value={r.quantity} onChange={e => updRow(r.key, { quantity: e.target.value })} />
                  <select value={r.unit} onChange={e => updRow(r.key, { unit: e.target.value })}>
                    <option value="">—</option>
                    {units.map(u => <option key={u.id} value={u.nameRo}>{localized(u, 'name', uilang)}</option>)}
                  </select>
                  <input placeholder={t('form.notePh')} value={r.noteRo} onChange={e => updRow(r.key, { noteRo: e.target.value })} />
                  <button type="button" className="btn danger small" onClick={() => setRows(rows.filter(x => x.key !== r.key))}>✕</button>
                </div>
              ))}
              <button type="button" className="btn secondary small" onClick={() => setRows([...rows, { key: rowKey++, ingredientId: '', quantity: '', unit: '', noteRo: '' }])}>
                {t('form.addIngredient')}
              </button>
              <h4>{t('form.newProduct')}</h4>
              <div className="ing-new">
                <input placeholder={t('form.nameRoPh')} value={newProd.ro} onChange={e => setNewProd({ ...newProd, ro: e.target.value })} />
                <input placeholder="RU" value={newProd.ru} onChange={e => setNewProd({ ...newProd, ru: e.target.value })} />
                <input placeholder="EN" value={newProd.en} onChange={e => setNewProd({ ...newProd, en: e.target.value })} />
                <button type="button" className="btn secondary small" onClick={addProduct}>{t('form.saveProduct')}</button>
              </div>
            </section>

            <section className="panel">
              <h3>{t('form.steps')} · {langTab.toUpperCase()}</h3>
              {steps[langTab].map((s, i) => (
                <div key={i} className="step-row">
                  <span className="badge">{i + 1}</span>
                  <input placeholder={`${t('form.stepPh', { n: i + 1 })}${i === 0 ? t('form.stepPh1') : ''}${i === 1 ? t('form.stepPh2') : ''}`}
                    value={s} onChange={e => setStep(langTab, i, e.target.value)} />
                  {steps[langTab].length > 1 && (
                    <button type="button" className="btn danger small" onClick={() => setSteps({ ...steps, [langTab]: steps[langTab].filter((_, j) => j !== i) })}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn secondary small" onClick={() => setSteps({ ...steps, [langTab]: [...steps[langTab], ''] })}>{t('form.addStep')}</button>
            </section>
          </div>

          {/* ===== sidebar: comun tuturor limbilor ===== */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <section className="panel">
              <h3>{t('form.cover')}</h3>
              {imageUrl && (
                <>
                  <img src={imgUrl(imageUrl)} alt="" className="cover-preview" />
                  <button type="button" className="btn danger small" onClick={() => setImageUrl('')}>{t('form.removeCover')}</button>
                </>
              )}
              <input type="file" accept="image/*" onChange={e => uploadCover(e.target.files?.[0])} />
            </section>

            <section className="panel">
              <h3>{t('form.prepTime')}</h3>
              <div className="side-3">
                <label>{t('form.prepMin')}<input value={prep} onChange={e => setPrep(e.target.value)} inputMode="numeric" /></label>
                <label>{t('form.cookMin')}<input value={cook} onChange={e => setCook(e.target.value)} inputMode="numeric" /></label>
                <label>{t('form.servings')}<input value={servings} onChange={e => setServings(e.target.value)} inputMode="numeric" /></label>
              </div>
              <p className="meta">{t('form.total')}: <strong>{totalTime} min</strong></p>
              <h4>{t('form.ageFrom')}</h4>
              <p className="meta">{t('form.ageHint')}</p>
              <div className="check-list">
                {ages.map(a => (
                  <label key={a.id} className="fcheck">
                    <input type="checkbox" checked={ageIds.includes(a.id)} onChange={() => toggleCheck(ageIds, a.id, setAgeIds)} />
                    <span>{localized(a, 'label', uilang)}</span>
                  </label>
                ))}
              </div>
              <h4>{t('form.mealType')}</h4>
              <select value={feedId} onChange={e => setFeedId(e.target.value)}>
                <option value="">—</option>
                {feeds.map(f => <option key={f.id} value={f.id}>{localized(f, 'name', uilang)}</option>)}
              </select>
            </section>

            <section className="panel">
              <h3>{t('form.classification')}</h3>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '6px 0' }}>
                  {t('form.menuCats')} ({catIds.length})
                </summary>
                <div className="check-list">
                  {cats.map(c => (
                    <label key={c.id} className="fcheck">
                      <input type="checkbox" checked={catIds.includes(c.id)} onChange={() => toggleCheck(catIds, c.id, setCatIds)} />
                      <span>{c.icon} {localized(c, 'name', uilang)}</span>
                    </label>
                  ))}
                </div>
              </details>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '6px 0' }}>
                  {t('form.restrictions')} ({restrIds.length})
                </summary>
                <div className="check-list">
                  {restrs.map(c => (
                    <label key={c.id} className="fcheck">
                      <input type="checkbox" checked={restrIds.includes(c.id)} onChange={() => toggleCheck(restrIds, c.id, setRestrIds)} />
                      <span>{localized(c, 'name', uilang)}</span>
                    </label>
                  ))}
                </div>
              </details>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '6px 0' }}>
                  {t('form.characteristics')} ({charIds.length})
                </summary>
                <div className="check-list">
                  {chars.map(c => (
                    <label key={c.id} className="fcheck">
                      <input type="checkbox" checked={charIds.includes(c.id)} onChange={() => toggleCheck(charIds, c.id, setCharIds)} />
                      <span>{localized(c, 'name', uilang)}</span>
                  </label>
                ))}
              </div>
              </details>
            </section>
          </aside>
        </div>

        {msg && <p className="notice" style={{ marginTop: 16 }}>{msg}</p>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary">{editMode ? t('form.saveChanges') : t('form.saveAsDraft')}</button>
          {(!editMode || user?.role === 'ADMIN') && (
            <button type="button" className="btn" onClick={(e) => submit(e, true)}>{t('form.publish')}</button>
          )}
        </div>
      </form>
    </>
  );
}
