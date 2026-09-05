import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, localized } from '../lib/api';

export default function Cookies() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [apiSections, setApiSections] = useState<any[] | null>(null);
  const localeSections = (t('cookies.sections', { returnObjects: true }) as any[]) || [];
  useEffect(() => {
    api.get('/content/cookies').then(r => setApiSections(r.data)).catch(() => {});
  }, []);
  const sections = apiSections && apiSections.length ? apiSections : localeSections;
  const title = (s: any) => (s.titleRo !== undefined ? localized(s, 'title', lang) : s.h);
  const body = (s: any) => (s.bodyRo !== undefined ? localized(s, 'body', lang) : s.p);
  const updated = apiSections && apiSections.length
    ? new Date(Math.max(...apiSections.map(s => new Date(s.updatedAt).getTime()))).toLocaleDateString()
    : null;
  return (
    <div className="cookies-page">
      <h1>{t('cookies.title')}</h1>
      <p className="meta">{updated || t('cookies.updated')}</p>
      {Array.isArray(sections) && sections.map((s: any, i: number) => (
        <section key={s.id || i}>
          <h3>{title(s)}</h3>
          <p>{body(s)}</p>
        </section>
      ))}
    </div>
  );
}
