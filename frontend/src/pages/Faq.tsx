import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, localized } from '../lib/api';

export default function Faq() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get('/content/faq').then(r => setItems(r.data)).catch(() => {});
  }, []);
  return (
    <>
      <h1>{t('contact.faqTitle')}</h1>
      <p className="meta">{t('contact.faqSub')}</p>
      {items.map((f: any) => (
        <details key={f.id} className="faq-item">
          <summary>{localized(f, 'question', lang)}</summary>
          <p>{localized(f, 'answer', lang)}</p>
        </details>
      ))}
      {!items.length && <p className="meta">{t('common.loading')}</p>}
    </>
  );
}
