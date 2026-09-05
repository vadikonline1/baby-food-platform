import { useTranslation } from 'react-i18next';

export default function Cookies() {
  const { t } = useTranslation();
  const sections = (t('cookies.sections', { returnObjects: true }) as any[]) || [];
  return (
    <div className="cookies-page">
      <h1>{t('cookies.title')}</h1>
      <p className="meta">{t('cookies.updated')}</p>
      {Array.isArray(sections) && sections.map((s: any, i: number) => (
        <section key={i}>
          <h3>{s.h}</h3>
          <p>{s.p}</p>
        </section>
      ))}
    </div>
  );
}
