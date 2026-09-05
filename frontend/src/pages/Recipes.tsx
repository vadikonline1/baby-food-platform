import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';

export default function Recipes() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const [ages, setAges] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [restrs, setRestrs] = useState<any[]>([]);

  const [selAges, setSelAges] = useState<number[]>([]);
  const [selFeeds, setSelFeeds] = useState<number[]>([]);
  const [selCats, setSelCats] = useState<string[]>(params.get('categorie') ? [params.get('categorie')!] : []);
  const [selRestrs, setSelRestrs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/taxonomies/ages').then(r => setAges(r.data)).catch(() => {});
    api.get('/taxonomies/feeding-types').then(r => setFeeds(r.data)).catch(() => {});
    api.get('/taxonomies/categories').then(r => setCats(r.data)).catch(() => {});
    api.get('/taxonomies/restrictions').then(r => setRestrs(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = (over?: any) => {
    const a = over?.ages ?? selAges, f = over?.feeds ?? selFeeds;
    const c = over?.cats ?? selCats, r = over?.restrs ?? selRestrs;
    const qq = over?.q !== undefined ? over.q : q;
    api.get('/recipes', {
      params: {
        q: qq || undefined,
        age: a.length ? a.join(',') : undefined,
        feeding: f.length ? f.join(',') : undefined,
        category: c.length ? c.join(',') : undefined,
        restriction: r.length ? r.join(',') : undefined,
        limit: 24
      }
    }).then(res => { setItems(res.data.items); setTotal(res.data.total); });
  };
  useEffect(() => { load({ cats: selCats }); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setParams(selCats.length ? { categorie: selCats.join(',') } : {}); /* eslint-disable-next-line */ }, [selCats]);

  const toggle = (arr: any[], v: any, set: (x: any[]) => void, extra?: any) => {
    const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    set(next); load({ ...extra, [extraKey(set)]: next });
  };
  const extraKey = (set: any) =>
    set === setSelAges ? 'ages' : set === setSelFeeds ? 'feeds' : set === setSelCats ? 'cats' : 'restrs';

  const reset = () => {
    setQ(''); setSelAges([]); setSelFeeds([]); setSelCats([]); setSelRestrs([]);
    setParams({}); load({ q: '', ages: [], feeds: [], cats: [], restrs: [] });
  };

  const check = (label: string, list: any[], sel: any[], set: any, getKey: (x: any) => any, getName: (x: any) => string) => (
    <div className="fgroup">
      <h4>{label}</h4>
      {list.map(x => (
        <label key={getKey(x)} className="fcheck">
          <input type="checkbox" checked={sel.includes(getKey(x))} onChange={() => toggle(sel, getKey(x), set)} />
          <span>{getName(x)}</span>
        </label>
      ))}
    </div>
  );

  return (
    <>
      <h1>{t('recipes.title')}</h1>
      <button className="btn secondary small filters-toggle" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? t('filters.hide') : t('filters.show')}
      </button>
      <div className="shop-layout">
        <aside className={`sidebar ${showFilters ? 'open' : ''}`}>
          <div className="sidebar-head">
            <strong>{t('filters.title')}</strong>
            <button className="btn-reset" onClick={reset}>✕ {t('filters.reset')}</button>
          </div>
          <input placeholder={t('recipes.searchPh')} value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()} />
          {check(t('filters.ages'), ages, selAges, setSelAges, x => x.id, x => localized(x, 'label', lang))}
          {check(t('filters.feeding'), feeds, selFeeds, setSelFeeds, x => x.id, x => localized(x, 'name', lang))}
          {check(t('filters.categories'), cats, selCats, setSelCats, x => x.slug, x => `${x.icon || ''} ${localized(x, 'name', lang)}`)}
          {check(t('filters.restrictions'), restrs, selRestrs, setSelRestrs, x => x.slug, x => localized(x, 'name', lang))}
          <button className="btn" onClick={() => { load(); setShowFilters(false); }}>{t('filters.search')} ({total})</button>
        </aside>
        <div>
          <p className="meta">{total} {t('filters.results')}</p>
          <div className="grid">
            {items.map(r => (
              <div className="card" key={r.id}>
                {r.imageUrl
                  ? <img src={imgUrl(r.imageUrl)} alt="" loading="lazy" />
                  : <div className="card-ph">🥣</div>}
                <div className="body">
                  <strong>{localized(r, 'title', lang)}</strong>
                  <div>
                    {(r.ageGroups || []).map((a: any) => <span key={a.ageGroupId} className="badge">{localized(a.ageGroup, 'label', lang)}</span>)}
                    {r.feedingType && <span className="badge orange">{localized(r.feedingType, 'name', lang)}</span>}
                  </div>
                  <span className="meta">⭐ {Number(r.avgRating).toFixed(1)} · {r.ratingsCount} {t('recipes.votes')}</span>
                  <div className="row"><Link className="btn secondary small" to={recipeUrl(r)}>{t('recipes.details')}</Link></div>
                </div>
              </div>
            ))}
          </div>
          {!items.length && <p className="meta">—</p>}
        </div>
      </div>
    </>
  );
}
