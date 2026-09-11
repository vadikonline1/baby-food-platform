import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

// Card "Susține proiectul" + buton Telegram — din remote config (Admin → Setări aplicație).
// Afișat pe Home și în Profil (web). Pe web nu există reclame rewarded, deci doar info + Telegram.
export default function SupportSection() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ro').slice(0, 2);
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    api.get('/settings/config').then(r => setCfg(r.data)).catch(() => {});
  }, []);
  const support = cfg?.support?.enabled ? cfg.support : null;
  const tgUrl = cfg?.telegram?.channelUrl;
  if (!support && !tgUrl) return null;
  const title = support?.title?.[lang] || support?.title?.ro || t('support.title');
  const text = support?.text?.[lang] || support?.text?.ro;
  return (
    <section className="panel" style={{ marginBottom: 18 }}>
      {!!title && <h3>{support ? title : t('support.title')}</h3>}
      {!!text && support && <p style={{ color: 'var(--muted)', fontSize: 14 }}>{text}</p>}
      {!!tgUrl && (
        <div className="row-btns" style={{ marginTop: 10 }}>
          <a className="btn secondary" href={tgUrl} target="_blank" rel="noreferrer">📢 {t('support.joinTelegram')}</a>
        </div>
      )}
    </section>
  );
}
