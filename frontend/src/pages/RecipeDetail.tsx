import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// dispozitiv tactil/mobil → afișăm butonul de deschidere în aplicația GustBebe
const isTouchDevice =
  typeof navigator !== 'undefined' &&
  (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0);

function Stars({ value, onPick, size = 30 }: { value: number; onPick?: (v: number) => void; size?: number }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v} type="button" aria-label={t('recipes.stars', { v })}
          className={v <= shown ? 'lit' : ''}
          style={{ fontSize: size }}
          onMouseEnter={() => onPick && setHover(v)}
          onClick={() => onPick && onPick(v)}
          disabled={!onPick}
        >★</button>
      ))}
    </span>
  );
}

export default function RecipeDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [r, setR] = useState<any>(null);
  const [myVote, setMyVote] = useState(0);
  const [fav, setFav] = useState(false);
  const [views, setViews] = useState(0);
  const [related, setRelated] = useState<any[]>([]);
  const [stores, setStores] = useState<{ android: string; ios: string }>({ android: '', ios: '' });
  const lang = i18n.language;

  useEffect(() => {
    api.get(`/recipes/${slug}`).then(res => {
      const data = res.data;
      setR(data);
      setMyVote(data.myRating || 0);
      setFav(Boolean(data.isFavorite));
      setViews(data.viewsCount || 0);
      // recomandate: aceeasi prima categorie, altfel populare
      const cat = data.categories?.[0]?.category?.slug;
      const params = cat ? { category: cat, limit: 8 } : { sort: 'popular', limit: 8 };
      api.get('/recipes', { params }).then(rr => {
        setRelated(rr.data.items.filter((x: any) => x.id !== data.id).slice(0, 4));
      }).catch(() => {});
      api.post(`/recipes/${data.id}/view`).then(v => setViews(v.data.views)).catch(() => {});
    });
  }, [slug]);
  useEffect(() => {
    // linkurile magazinelor (Play Store / App Store) le setăm din Admin → Setări → Magazine
    api.get('/settings/config').then(r => setStores(r.data?.stores || { android: '', ios: '' })).catch(() => {});
  }, []);
  if (!r) return <p>{t('common.loading')}</p>;

  const sendVote = async (v: number) => {
    setMyVote(v);
    const { data } = await api.post(`/recipes/${r.id}/rate`, { value: v });
    setR({ ...r, avgRating: data.avgRating, ratingsCount: data.ratingsCount });
  };
  const toggleFav = async () => {
    if (fav) {
      await api.delete(`/recipes/${r.id}/favorite`);
      setFav(false);
    } else {
      await api.post(`/recipes/${r.id}/favorite`);
      setFav(true);
    }
  };
  const summary = localized(r, 'summary', lang);
  const stepsList = String(localized(r, 'steps', lang) || '').split('\n').map(s => s.trim()).filter(Boolean);
  const detailed = r.ingredientsDetailed || [];

  // Încearcă să deschidă aplicația; dacă nu e instalată, după ~1.5s trimite la magazinul corespunzător.
  const openApp = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const ios = /iphone|ipad|ipod/i.test(ua);
    // doar URL-ul configurat din Admin → Magazine aplicații (dacă există)
    const store = isAndroid ? stores.android : ios ? stores.ios : '';
    try { window.location.href = `gustbebe://retete/${r.id}-${r.slug}`; } catch {}
    setTimeout(() => {
      // dacă aplicația a pornit, pagina și-a pierdut focusul → nu redirecționăm
      if (document.visibilityState !== 'hidden' && store) window.location.href = store;
    }, 1500);
  };

  return (
    <article className="detail">
      <h1>{localized(r, 'title', lang)}</h1>

      {isTouchDevice && (
        <a className="btn app-open" href={`gustbebe://retete/${r.id}-${r.slug}`} onClick={openApp}>
          📲 {t('app.openInApp')}
        </a>
      )}

      <div className="detail-meta">
        <span className="meta-group">
          <Stars value={Math.round(Number(r.avgRating))} size={17} />
          <strong>{Number(r.avgRating).toFixed(1)}</strong>
          <span className="meta">({r.ratingsCount})</span>
        </span>
        <span className="meta-sep" />
        <span>⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min</span>
        <span>🍽 {r.servings}</span>
        <span title={t('recipes.uniqueViews')}>👁 {views}</span>
        {user && (
          <>
            <span className="meta-sep" />
            <span className="meta-group vote-inline">
              <span className="meta">{t('recipes.voteCta')}</span>
              <Stars value={myVote} onPick={sendVote} size={22} />
            </span>
            <button className={`heart ${fav ? 'on' : ''}`} onClick={toggleFav} aria-label="favorite" title={t('recipes.favorite')}>
              {fav ? '♥' : '♡'}
            </button>
          </>
        )}
        {user && (user.role === 'ADMIN' || user.id === r.authorId) && (
          <>
            <span className="meta-sep" />
            <Link className="btn secondary small edit-meta" to={`/admin/retete/${r.id}/editeaza`}>✏️ {t('common.edit')}</Link>
          </>
        )}
      </div>

      <div className="detail-tags">
        {(r.ageGroups || []).map((a: any) => <span key={a.ageGroupId} className="badge">{localized(a.ageGroup, 'label', lang)}</span>)}
        {r.feedingType && <span className="badge orange">{localized(r.feedingType, 'name', lang)}</span>}
        {(r.categories || []).map((c: any) => <span key={c.categoryId ?? c.category?.id} className="badge gray">{localized(c.category, 'name', lang)}</span>)}
        <button className="btn secondary small" onClick={() => window.print()} style={{ marginLeft: 'auto' }}>🖨 {t('recipes.exportPdf')}</button>
      </div>

      {!user && (
        <div className="notice" style={{ marginTop: 12 }}>
          <strong>{t('auth.whyAccount')}</strong><br />
          {t('auth.whyAccountText')}{' '}
          <Link to="/register">{t('auth.whyAccountCta')}</Link>
        </div>
      )}

      <div className="detail-grid">
        {r.imageUrl && (
          <section className="panel photo-panel">
            <img src={imgUrl(r.imageUrl)} alt="" className="detail-cover" />
          </section>
        )}
        {summary && (
          <section className="panel">
            <h3>{t('recipes.about')}</h3>
            <p className="lead">{summary}</p>
          </section>
        )}
        <section className="panel">
          <h3>{t('recipes.ingredients')}</h3>
          {detailed.length ? (
            <ul className="ing-list">
              {detailed.map((d: any) => (
                <li key={d.id}>
                  <strong>{localized(d.ingredient, 'name', lang)}</strong>
                  {(d.quantity != null || d.unit) && <span> — {[d.quantity, d.unit].filter(Boolean).join(' ')}</span>}
                  {(d.noteRo || d.noteRu || d.noteEn) && <span className="meta"> ({localized(d, 'note', lang)})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <pre className="pre">{localized(r, 'ingredients', lang)}</pre>
          )}
        </section>
        <section className="panel">
          <h3>{t('recipes.prep')}</h3>
          {stepsList.length > 1 ? (
            <ol className="steps-list">
              {stepsList.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          ) : (
            <pre className="pre">{localized(r, 'steps', lang)}</pre>
          )}
        </section>
      </div>

      {!!related.length && (
        <section className="home-section">
          <div className="section-head">
            <h2>{t('home.recommended')}</h2>
            <Link to="/retete" className="link-more">{t('home.viewAll')} →</Link>
          </div>
          <div className="grid">
            {related.map(x => (
              <div className="card" key={x.id}>
                {x.imageUrl ? <img src={imgUrl(x.imageUrl)} alt="" loading="lazy" /> : <div className="card-ph">🥣</div>}
                <div className="body">
                  <strong>{localized(x, 'title', lang)}</strong>
                  <span className="meta">⭐ {Number(x.avgRating || 0).toFixed(1)} · {x.ratingsCount || 0} · 👁 {x.viewsCount || 0}</span>
                  <div className="row"><Link className="btn secondary small" to={recipeUrl(x)}>{t('recipes.details')}</Link></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
