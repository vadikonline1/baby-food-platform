import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';

function Stars({ value, onPick, size = 30 }: { value: number; onPick?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(v => (
        <button
          key={v} type="button" aria-label={`${v} stele`}
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
  const [related, setRelated] = useState<any[]>([]);
  const lang = i18n.language;

  useEffect(() => {
    api.get(`/recipes/${slug}`).then(res => {
      const data = res.data;
      setR(data);
      setMyVote(data.myRating || 0);
      setFav(Boolean(data.isFavorite));
      // recomandate: aceeasi prima categorie, altfel populare
      const cat = data.categories?.[0]?.category?.slug;
      const params = cat ? { category: cat, limit: 8 } : { sort: 'popular', limit: 8 };
      api.get('/recipes', { params }).then(rr => {
        setRelated(rr.data.items.filter((x: any) => x.id !== data.id).slice(0, 4));
      }).catch(() => {});
    });
  }, [slug]);
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

  return (
    <article className="detail">
      <h1>{localized(r, 'title', lang)}</h1>

      <div className="detail-meta">
        <span className="meta-group">
          <Stars value={Math.round(Number(r.avgRating))} size={17} />
          <strong>{Number(r.avgRating).toFixed(1)}</strong>
          <span className="meta">({r.ratingsCount})</span>
        </span>
        <span className="meta-sep" />
        <span>⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min</span>
        <span>🍽 {r.servings}</span>
        {user && (
          <>
            <span className="meta-sep" />
            <span className="meta-group vote-inline">
              <span className="meta">Votează:</span>
              <Stars value={myVote} onPick={sendVote} size={22} />
            </span>
            <button className={`heart ${fav ? 'on' : ''}`} onClick={toggleFav} aria-label="favorite" title={t('recipes.favorite')}>
              {fav ? '♥' : '♡'}
            </button>
          </>
        )}
      </div>

      <div className="detail-tags">
        {(r.ageGroups || []).map((a: any) => <span key={a.ageGroupId} className="badge">{localized(a.ageGroup, 'label', lang)}</span>)}
        {r.feedingType && <span className="badge orange">{localized(r.feedingType, 'name', lang)}</span>}
        {(r.categories || []).map((c: any) => <span key={c.categoryId ?? c.category?.id} className="badge gray">{localized(c.category, 'name', lang)}</span>)}
      </div>

      <div className="detail-grid">
        {r.imageUrl && (
          <section className="panel photo-panel">
            <img src={imgUrl(r.imageUrl)} alt="" className="detail-cover" />
          </section>
        )}
        {summary && (
          <section className="panel">
            <h3>Despre</h3>
            <p className="lead">{summary}</p>
          </section>
        )}
        <section className="panel">
          <h3>Ingrediente</h3>
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
          <h3>Preparare</h3>
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
                  <span className="meta">⭐ {Number(x.avgRating || 0).toFixed(1)} · {x.ratingsCount || 0}</span>
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
