import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized } from '../lib/api';

export default function Categories() {
  const { t, i18n } = useTranslation();
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { api.get('/taxonomies/categories?withCounts=1').then(r => setCats(r.data)).catch(() => {}); }, []);
  return (
    <>
      <h1>{t('nav.categories')}</h1>
      <div className="grid">
        {cats.map(c => (
          <Link key={c.id} to={`/retete?categorie=${c.slug}`} className="card cat-card">
            <div className="body">
              <span className="cat-icon">{c.icon || '🍽️'}</span>
              <strong>{localized(c, 'name', i18n.language)}</strong>
              <span className="meta">{c._count?.recipes ?? ''} {t('filters.results')}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
