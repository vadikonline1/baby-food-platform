import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import HeroArt from '../components/HeroArt';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GUIDE_ICONS = ['⏳', '🥕', '🥄', '🤗', '📅', '👀', '🍎', '🔢', '🥣', '⚖️', '🍼', '🕒', '⚠️', '🚫', '🛡️', '😟', '🚫', '🧂', '💧', '🆘'];

function RecipeCard({ r, lang, detailsLabel }: { r: any; lang: string; detailsLabel: string }) {
  return (
    <div className="card">
      {r.imageUrl
        ? <img src={imgUrl(r.imageUrl)} alt="" loading="lazy" />
        : <div style={{ height: 120, background: 'linear-gradient(135deg,#e9f4ec,#d8ecdf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🥣</div>}
      <div className="body">
        <strong>{localized(r, 'title', lang)}</strong>
        <span className="meta">⭐ {Number(r.avgRating || 0).toFixed(1)} · {r.ratingsCount || 0}</span>
        <div className="row"><Link className="btn secondary small" to={recipeUrl(r)}>{detailsLabel}</Link></div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;
  const [popular, setPopular] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [randomPick, setRandomPick] = useState<any[]>([]);
  const [siteStats, setSiteStats] = useState<any>(null);
  const guide = (t('home.items', { returnObjects: true }) as any[]) || [];

  useEffect(() => {
    api.get('/stats').then(r => setSiteStats(r.data)).catch(() => {});
    api.get('/recipes', { params: { sort: 'popular', limit: 6 } }).then(r => setPopular(r.data.items)).catch(() => {});
    api.get('/recipes', { params: { limit: 24 } }).then(r => {
      setPool(r.data.items);
      setRandomPick(shuffle(r.data.items).slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero-emerald">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>{t('home.heroTitle')}</h1>
            <p className="lead">{t('home.subtitle')}</p>
            <div className="cta-row">
              <Link to="/retete" className="btn-white">{t('home.explore')}</Link>
              <a href="#ghid" className="btn-outline-light">{t('home.guideBtn')}</a>
              {!user ? (
                <Link to="/register" className="btn-outline-light">{t('home.registerFree')}</Link>
              ) : (
                <Link to="/profil" className="btn-outline-light">{t('home.viewProfile')}</Link>
              )}
            </div>
            {siteStats && (
              <div className="hero-card inline">
                <div><strong>{siteStats.recipes}</strong><span>{t('home.statsRecipes')}</span></div>
                <div><strong>{siteStats.categories}</strong><span>{t('home.statsCategories')}</span></div>
                <div><strong>{siteStats.ratings}</strong><span>{t('home.statsVotes')}</span></div>
              </div>
            )}
          </div>
          <div className="hero-side">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>{t('home.popular')}</h2>
          <Link to="/retete" className="link-more">{t('home.viewAll')} →</Link>
        </div>
        <div className="grid">
          {popular.map(r => <RecipeCard key={r.id} r={r} lang={lang} detailsLabel={t('recipes.details')} />)}
        </div>
        {!popular.length && <p className="meta">{t('common.loading')}</p>}
      </section>

      {!!pool.length && (
        <section className="home-section">
          <div className="section-head">
            <h2>{t('home.random')}</h2>
            <button className="btn secondary small" onClick={() => setRandomPick(shuffle(pool).slice(0, 3))}>🔀 {t('home.shuffle')}</button>
          </div>
          <div className="grid">
            {randomPick.map(r => <RecipeCard key={r.id} r={r} lang={lang} detailsLabel={t('recipes.details')} />)}
          </div>
        </section>
      )}

      <section className="home-section" id="ghid">
        <h2>{t('home.guideTitle')}</h2>
        <p className="meta">{t('home.guideSub')}</p>
        <div className="guide-grid">
          {Array.isArray(guide) && guide.map((g: any, i: number) => (
            <div className="guide-card" key={i}>
              <span className="card-icon">{GUIDE_ICONS[i % GUIDE_ICONS.length]}</span>
              <h3>{g.q}</h3>
              <p>{g.a}</p>
            </div>
          ))}
        </div>
        <div className="disclaimer-box">
          <p>ℹ️ {t('home.disclaimer')}</p>
          <span className="tag">👩‍⚕️ pediatru</span>
        </div>
      </section>
    </div>
  );
}
