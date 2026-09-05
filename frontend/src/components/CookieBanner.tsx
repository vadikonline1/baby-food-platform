import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const KEY = 'gb_cookies';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(KEY); } catch { return true; }
  });
  if (!visible) return null;
  const choose = (v: string) => {
    try { localStorage.setItem(KEY, v); } catch {}
    setVisible(false);
  };
  return (
    <div className="cookie-banner" role="dialog" aria-label="cookies">
      <p>🍪 {t('cookies.banner')} <Link to="/cookies">{t('cookies.more')}</Link></p>
      <div className="row-btns">
        <button className="btn secondary small" onClick={() => choose('essential')}>{t('cookies.essential')}</button>
        <button className="btn small" onClick={() => choose('all')}>{t('cookies.accept')}</button>
      </div>
    </div>
  );
}
