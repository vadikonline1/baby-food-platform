import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useTranslation } from 'react-i18next';

const PAGE_LIMIT = 10;

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  return (
    <div className="toolbar">
      <button className="btn secondary small" disabled={page <= 1} onClick={() => onPage(page - 1)}>←</button>
      <span className="meta">Pagina {page} din {pages} ({total} total)</span>
      <button className="btn secondary small" disabled={page >= pages} onClick={() => onPage(page + 1)}>→</button>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'dash' | 'recipes' | 'tax' | 'users' | 'settings'>('dash');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [rTotal, setRTotal] = useState(0);
  const [rPage, setRPage] = useState(1);
  const [rStatus, setRStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    api.get('/users/stats/overview').then(r => setStats(r.data)).catch(() => {});
    if (user.role === 'ADMIN') api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, [user]);

  const loadRecipes = (page = rPage, status = rStatus) => {
    api.get('/recipes', { params: { status, page, limit: PAGE_LIMIT, ...(user?.role === 'MODERATOR' ? { mine: '1' } : {}) } })
      .then(r => { setRecipes(r.data.items); setRTotal(r.data.total); setRPage(r.data.page); }).catch(() => {});
  };
  useEffect(() => { if (user && tab === 'recipes') loadRecipes(); /* eslint-disable-next-line */ }, [tab, user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) return <p>Acces interzis — doar Moderator/Admin.</p>;

  const setRole = async (id: number, role: string) => {
    await api.patch(`/users/${id}/role`, { role });
    setUsers(users.map(u => (u.id === id ? { ...u, role } : u)));
  };

  const delUser = async (id: number, name: string) => {
    if (!confirm(`Ștergi contul lui ${name}?`)) return;
    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u.id !== id));
  };

  const resendLink = async (email: string) => {
    try {
      await api.post('/auth/resend', { email });
      alert(`✓ Link de confirmare trimis către ${email}.`);
    } catch {
      alert('Eroare la trimitere.');
    }
  };

  const approve = async (id: number) => {
    await api.patch(`/recipes/${id}/status`, { status: 'PUBLISHED' });
    setRecipes(recipes.map(r => (r.id === id ? { ...r, status: 'PUBLISHED' } : r)));
    api.get('/users/stats/overview').then(r => setStats(r.data)).catch(() => {});
  };
  const delRecipe = async (id: number) => {
    if (!confirm('Ștergi rețeta?')) return;
    await api.delete(`/recipes/${id}`);
    loadRecipes();
  };
  const sendTelegram = async (id: number) => {
    try {
      await api.post(`/recipes/${id}/telegram`);
      alert('✓ Publicat pe Telegram.');
    } catch (e: any) {
      alert(e.response?.data?.error === 'telegram_not_configured'
        ? 'Botul Telegram nu e configurat (.env: TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID).'
        : 'Eroare la publicare.');
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>{t('admin.title')}</h1>
        {(tab === 'recipes' || tab === 'dash') && (
          <Link className="btn small" to="/admin/retete/noua">+ Adaugă rețetă</Link>
        )}
      </div>
      <div className="tabs">
        <button className={tab === 'dash' ? 'on' : ''} onClick={() => setTab('dash')}>{t('admin.dashboard')}</button>
        <button className={tab === 'recipes' ? 'on' : ''} onClick={() => setTab('recipes')}>{t('admin.recipes')}{user.role === 'ADMIN' && stats?.drafts ? ` (${stats.drafts} de validat)` : ''}</button>
        {user.role === 'ADMIN' && <button className={tab === 'tax' ? 'on' : ''} onClick={() => setTab('tax')}>Taxonomii</button>}
        {user.role === 'ADMIN' && <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>Setări aplicație</button>}
        {user.role === 'ADMIN' && <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>{t('admin.users')}</button>}
      </div>

      {tab === 'dash' && stats && (
        <>
          <div className="stat-grid">
            {user.role === 'ADMIN' && <div className="stat"><span className="stat-n">{stats.users}</span><span className="stat-l">Utilizatori</span></div>}
            <div className="stat"><span className="stat-n">{stats.published}</span><span className="stat-l">Rețete publicate</span></div>
            <div className="stat alert"><span className="stat-n">{stats.drafts}</span><span className="stat-l">În așteptare</span></div>
            <div className="stat"><span className="stat-n">{stats.ratings}</span><span className="stat-l">Voturi</span></div>
            {(stats.byRole || []).map((g: any) => (
              <div className="stat" key={g.role}><span className="stat-n">{g._count.role}</span><span className="stat-l">{g.role}</span></div>
            ))}
          </div>
          <div className="dash-cols">
            <div className="panel">
              <h3>Top rețete (după voturi)</h3>
              <ul className="dash-list">
                {(stats.topRecipes || []).map((r: any) => (
                  <li key={r.id}><Link to={recipeUrl(r)}>⭐ {Number(r.avgRating).toFixed(1)} ({r.ratingsCount}) — {r.titleRo}</Link></li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h3>Recent adăugate</h3>
              <ul className="dash-list">
                {(stats.recent || []).map((r: any) => (
                  <li key={r.id}>
                    <span className={`pill ${r.status === 'DRAFT' ? 'warn' : 'ok'}`}>{r.status}</span>{' '}
                    <Link to={`/admin/retete/${r.id}/editeaza`}>{r.titleRo}</Link>
                    <span className="meta"> · {r.author?.name} · {new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!!(stats.pendingList || []).length && user.role === 'ADMIN' && (
            <div className="panel" style={{ marginTop: 16 }}>
              <h3>De validat acum</h3>
              <ul className="dash-list">
                {stats.pendingList.map((r: any) => (
                  <li key={r.id}>
                    {r.titleRo} <span className="meta">· {r.author?.name}</span>{' '}
                    <button className="btn small" onClick={() => approve(r.id)}>Aprobă</button>{' '}
                    <Link className="btn secondary small" to={`/admin/retete/${r.id}/editeaza`}>Vezi</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {tab === 'recipes' && (
        <>
          <div className="sub-tabs">
            {[['all', 'Toate'], ['PUBLISHED', 'Publicate'], ['DRAFT', `În așteptare${stats?.drafts ? ` (${stats.drafts})` : ''}`]].map(([v, l]) => (
              <button key={v} className={rStatus === v ? 'on' : ''} onClick={() => { setRStatus(v); setRPage(1); loadRecipes(1, v); }}>{l}</button>
            ))}
          </div>
          <Pager page={rPage} total={rTotal} onPage={p => loadRecipes(p)} />
          <table className="admin"><thead><tr><th>Titlu</th><th>Status</th><th>⭐</th><th></th></tr></thead>
            <tbody>{recipes.map(r => (
              <tr key={r.id}>
                <td>{r.titleRo}<br /><span className="meta">{r.author?.name}</span></td>
                <td><span className={`pill ${r.status === 'DRAFT' ? 'warn' : 'ok'}`}>{r.status}</span></td>
                <td>{Number(r.avgRating).toFixed(1)} ({r.ratingsCount})</td>
                <td><div className="row-btns">
                  <Link className="btn secondary small" to={`/admin/retete/${r.id}/editeaza`}>{t('common.edit')}</Link>
                  {user.role === 'ADMIN' && r.status === 'DRAFT' && <button className="btn small" onClick={() => approve(r.id)}>Aprobă</button>}
                  {r.status === 'PUBLISHED' && <button className="btn secondary small" onClick={() => sendTelegram(r.id)}>✈ Telegram</button>}
                  {user.role === 'ADMIN' && <button className="btn danger small" onClick={() => delRecipe(r.id)}>{t('common.delete')}</button>}
                </div></td></tr>
            ))}</tbody></table>
        </>
      )}

      {tab === 'users' && user.role === 'ADMIN' && (
        <table className="admin"><thead><tr><th>Nume</th><th>Email</th><th>Status cont</th><th>{t('admin.role')}</th><th></th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td>
              <td>{u.emailVerified ? <span className="pill ok">ACTIV</span> : <span className="pill warn">NECONFIRMAT</span>}</td>
              <td><select value={u.role} onChange={e => setRole(u.id, e.target.value)} style={{ width: 'auto' }}>
                <option>USER</option><option>MODERATOR</option><option>ADMIN</option></select></td>
              <td><div className="row-btns">
                {!u.emailVerified && <button className="btn secondary small" onClick={() => resendLink(u.email)}>✉️ Retrimite link</button>}
                {u.id !== user.id && <button className="btn danger small" onClick={() => delUser(u.id, u.name)}>Șterge</button>}
              </div></td></tr>
          ))}</tbody></table>
      )}

      {tab === 'tax' && <TaxManager isAdmin={user.role === 'ADMIN'} />}

      {tab === 'settings' && user.role === 'ADMIN' && <AppSettings />}
    </>
  );
}

function AppSettings() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api.get('/settings').then(r => {
      const o: Record<string, string> = {};
      r.data.forEach((s: any) => { o[s.key] = s.value; });
      setVals(o);
    }).catch(() => {});
  }, []);
  const set = (k: string, v: string) => setVals({ ...vals, [k]: v });
  const save = async () => {
    setMsg('');
    await api.put('/settings', vals);
    setMsg('✓ Setările au fost salvate. Aplicațiile mobile le preiau automat (remote config).');
  };
  const field = (k: string, label: string, ph = '') => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '13.5px' }}>
      {label}
      <input value={vals[k] || ''} placeholder={ph} onChange={e => set(k, e.target.value)} />
    </label>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <section className="panel">
        <h3>AdMob — Android</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {field('admob_android_banner', 'Banner ID (final rețetă)', 'ca-app-pub-...')}
          {field('admob_android_rewarded_interstitial', 'Intercalat cu recompensă (buton Susține)', 'ca-app-pub-...')}
          {field('admob_android_rewarded', 'Cu recompensă (buton Susține)', 'ca-app-pub-...')}
        </div>
      </section>
      <section className="panel">
        <h3>AdMob — iOS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {field('admob_ios_banner', 'Banner ID (final rețetă)', 'ca-app-pub-...')}
          {field('admob_ios_rewarded_interstitial', 'Intercalat cu recompensă (buton Susține)', 'ca-app-pub-...')}
          {field('admob_ios_rewarded', 'Cu recompensă (buton Susține)', 'ca-app-pub-...')}
        </div>
      </section>
      <section className="panel">
        <h3>Susține proiectul (buton în aplicații)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: '13.5px' }}>
            <input type="checkbox" style={{ width: 17 }} checked={(vals.support_enabled || 'true') === 'true'}
              onChange={e => set('support_enabled', e.target.checked ? 'true' : 'false')} /> Buton activ
          </label>
          {field('support_title_ro', 'Titlu RO', 'Susține proiectul GustBebe')}
          {field('support_title_ru', 'Titlu RU')}
          {field('support_title_en', 'Titlu EN')}
          {field('support_text_ro', 'Text RO')}
          {field('support_text_ru', 'Text RU')}
          {field('support_text_en', 'Text EN')}
        </div>
      </section>
      {msg && <p className="notice">{msg}</p>}
      <div><button className="btn" onClick={save}>Salvează setările</button></div>
    </div>
  );
}

const TAXES = [
  { key: 'categories', label: 'Categorii meniu' },
  { key: 'restrictions', label: 'Restricții alimentare' },
  { key: 'characteristics', label: 'Caracteristici' },
  { key: 'ages', label: 'Vârste' },
  { key: 'feeding-types', label: 'Tipuri alimentare' },
  { key: 'units', label: 'Unități măsură' }
];

function TaxManager({ isAdmin }: { isAdmin: boolean }) {
  const [res, setRes] = useState('categories');
  const [items, setItems] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);

  const load = () => api.get(`/taxonomies/${res}`).then(r => setItems(r.data));
  useEffect(() => { load(); setModal(null); /* eslint-disable-next-line */ }, [res]);

  const openAdd = () => {
    const base: any = res === 'ages'
      ? { minMonths: 6, maxMonths: 12, labelRo: '', labelRu: '', labelEn: '' }
      : { nameRo: '', nameRu: '', nameEn: '', icon: '' };
    setModal({ mode: 'add', data: base });
  };
  const openEdit = (it: any) => setModal({ mode: 'edit', data: { ...it } });

  const save = async () => {
    const d = { ...modal.data };
    if (res === 'ages') {
      d.minMonths = Number(d.minMonths) || 0; d.maxMonths = Number(d.maxMonths) || 0;
      if (!d.labelRo) return alert('Completează eticheta RO.');
      if (!d.labelRu) d.labelRu = d.labelRo;
      if (!d.labelEn) d.labelEn = d.labelRo;
    } else {
      if (!d.nameRo) return alert('Completează numele RO.');
      if (modal.mode === 'add') {
        d.slug = (d.slug && d.slug.trim()) || (d.nameRo.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36));
      }
      if (!d.nameRu) d.nameRu = d.nameRo;
      if (!d.nameEn) d.nameEn = d.nameRo;
    }
    if (modal.mode === 'add') await api.post(`/taxonomies/${res}`, d);
    else await api.put(`/taxonomies/${res}/${d.id}`, d);
    setModal(null); load();
  };

  const del = async (id: number) => {
    if (!confirm('Ștergi elementul?')) return;
    try { await api.delete(`/taxonomies/${res}/${id}`); load(); }
    catch { alert('Nu poate fi șters (este folosit în rețete).'); }
  };

  const cell = (it: any) => res === 'ages' ? `${it.labelRo} (${it.minMonths}–${it.maxMonths} luni)` : (it.nameRo + (it.slug ? ` — ${it.slug}` : ''));

  return (
    <div>
      <div className="sub-tabs">
        {TAXES.map(t => <button key={t.key} className={res === t.key ? 'on' : ''} onClick={() => setRes(t.key)}>{t.label}</button>)}
      </div>
      <button className="btn small" onClick={openAdd}>+ Adaugă</button>
      <table className="admin" style={{ marginTop: 12 }}>
        <thead><tr><th>Denumire</th><th>RU / EN</th><th style={{ width: 190 }}></th></tr></thead>
        <tbody>{items.map(it => (
          <tr key={it.id}>
            <td>{cell(it)} {it.icon ? <span>{it.icon}</span> : null}</td>
            <td className="meta">{it.nameRu || it.labelRu} / {it.nameEn || it.labelEn}</td>
            <td><div className="row-btns">
              <button className="btn secondary small" onClick={() => openEdit(it)}>Editează</button>
              {isAdmin && <button className="btn danger small" onClick={() => del(it.id)}>Șterge</button>}
            </div></td>
          </tr>
        ))}</tbody>
      </table>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.mode === 'add' ? 'Adaugă' : 'Editează'} — {TAXES.find(t => t.key === res)?.label}</h3>
            {res === 'ages' ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Min luni" value={modal.data.minMonths} onChange={e => setModal({ ...modal, data: { ...modal.data, minMonths: e.target.value } })} />
                  <input placeholder="Max luni" value={modal.data.maxMonths} onChange={e => setModal({ ...modal, data: { ...modal.data, maxMonths: e.target.value } })} />
                </div>
                <input placeholder="Etichetă RO — ex: 6–8 luni" value={modal.data.labelRo} onChange={e => setModal({ ...modal, data: { ...modal.data, labelRo: e.target.value } })} />
                <input placeholder="Etichetă RU" value={modal.data.labelRu || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, labelRu: e.target.value } })} />
                <input placeholder="Etichetă EN" value={modal.data.labelEn || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, labelEn: e.target.value } })} />
              </>
            ) : (
              <>
                <input placeholder="Nume RO *" value={modal.data.nameRo || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, nameRo: e.target.value } })} />
                <input placeholder="Nume RU" value={modal.data.nameRu || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, nameRu: e.target.value } })} />
                <input placeholder="Nume EN" value={modal.data.nameEn || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, nameEn: e.target.value } })} />
                {res === 'categories' && <input placeholder="Icon (emoji)" value={modal.data.icon || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, icon: e.target.value } })} />}
                {modal.mode === 'add' && res !== 'ages' && <input placeholder="Slug (auto dacă e gol)" value={modal.data.slug || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, slug: e.target.value } })} />}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={save}>Salvează</button>
              <button className="btn secondary" onClick={() => setModal(null)}>Anulează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
