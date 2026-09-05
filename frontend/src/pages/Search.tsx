import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';

// Cautare standard: rezultate live (debounce) + sugestii populare cand e gol.
export default function Search() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState<any[]>([]);
  const timer = useRef<any>(null);

  useEffect(() => {
    api.get('/recipes', { params: { sort: 'popular', limit: 6 } }).then(r => setPopular(r.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) { setItems([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      api.get('/recipes', { params: { q: q.trim(), limit: 24 } })
        .then(r => { setItems(r.data.items); setTotal(r.data.total); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer.current);
  }, [q]);

  const card = (r: any) => (
    <div className="card" key={r.id}>
      {r.imageUrl ? <img src={imgUrl(r.imageUrl)} alt="" loading="lazy" /> : <div className="card-ph">🥣</div>}
      <div className="body">
        <strong>{localized(r, 'title', lang)}</strong>
        <span className="meta">⭐ {Number(r.avgRating || 0).toFixed(1)} · {r.ratingsCount || 0}</span>
        <div className="row"><Link className="btn secondary small" to={recipeUrl(r)}>{t('recipes.details')}</Link></div>
      </div>
    </div>
  );

  return (
    <>
      <h1>{t('nav.search')}</h1>
      <div className="search-bar">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('recipes.searchPh')} autoFocus />
        {q && <button className="btn secondary small" onClick={() => setQ('')}>✕</button>}
      </div>
      {loading && <p className="meta">{t('common.loading')}</p>}
      {!q.trim() ? (
        <>
          <h2>{t('home.popular')}</h2>
          <div className="grid">{popular.map(card)}</div>
        </>
      ) : !loading && (
        <>
          <p className="meta">{total} {t('filters.results')}</p>
          <div className="grid">{items.map(card)}</div>
        </>
      )}
    </>
  );
}
