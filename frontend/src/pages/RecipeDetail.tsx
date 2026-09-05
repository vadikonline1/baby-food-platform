import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl } from '../lib/api';
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
  const [voted, setVoted] = useState(false);
  const lang = i18n.language;
  useEffect(() => { api.get(`/recipes/${slug}`).then(res => setR(res.data)); }, [slug]);
  if (!r) return <p>{t('common.loading')}</p>;

  const sendVote = async (v: number) => {
    setMyVote(v);
    const { data } = await api.post(`/recipes/${r.id}/rate`, { value: v });
    setR({ ...r, avgRating: data.avgRating, ratingsCount: data.ratingsCount });
    setVoted(true);
  };
  const fav = async () => { await api.post(`/recipes/${r.id}/favorite`); alert('❤'); };
  const stepsList = String(localized(r, 'steps', lang) || '').split('\n').map(s => s.trim()).filter(Boolean);
  const detailed = r.ingredientsDetailed || [];

  return (
    <article className="detail">
      <h1>{localized(r, 'title', lang)}</h1>
      <div className="detail-meta">
        <span className="stars static"><Stars value={Math.round(Number(r.avgRating))} size={18} /></span>
        <span><strong>{Number(r.avgRating).toFixed(1)}</strong> ({r.ratingsCount})</span>
        <span>⏱ {(r.prepMinutes || 0) + (r.cookMinutes || 0)} min</span>
        <span>🍽 {r.servings}</span>
      </div>
      <div className="detail-tags">
        {(r.ageGroups || []).map((a: any) => <span key={a.ageGroupId} className="badge">{localized(a.ageGroup, 'label', lang)}</span>)}
        {r.feedingType && <span className="badge orange">{localized(r.feedingType, 'name', lang)}</span>}
        {(r.categories || []).map((c: any) => <span key={c.categoryId ?? c.category?.id} className="badge gray">{localized(c.category, 'name', lang)}</span>)}
      </div>
      {r.imageUrl && <img src={imgUrl(r.imageUrl)} alt="" className="detail-cover" />}
      {localized(r, 'summary', lang) && <p className="lead">{localized(r, 'summary', lang)}</p>}

      <div className="detail-grid">
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

      {user && (
        <div className="panel vote-box">
          <p style={{ margin: '0 0 6px' }}>{t('recipes.vote')}{myVote ? <>: <strong>{myVote} / 5</strong></> : ''}</p>
          <Stars value={myVote} onPick={sendVote} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary small" onClick={fav}>{t('recipes.favorite')}</button>
          </div>
          {voted && <p className="ok">Mulțumim pentru vot! ✓</p>}
        </div>
      )}
    </article>
  );
}
