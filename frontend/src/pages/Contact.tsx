import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, localized } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export default function Contact() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [captcha, setCaptcha] = useState({ id: '', q: '' });
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<'form' | 'ok' | 'err'>('form');
  const [err, setErr] = useState('');
  const [faq, setFaq] = useState<any[]>([]);
  const [hasThreads, setHasThreads] = useState(false);
  const benefits = (t('contact.benefits', { returnObjects: true }) as string[]) || [];

  const loadCaptcha = () => api.get('/contact/captcha').then(r => setCaptcha(r.data)).catch(() => {});
  useEffect(() => {
    loadCaptcha();
    api.get('/content/faq').then(r => setFaq(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (user) {
      setName(user.name); setEmail(user.email);
      api.get('/contact/mine').then(r => setHasThreads(r.data.length > 0)).catch(() => {});
    } else {
      setHasThreads(false);
    }
  }, [user]);

  const send = async (e: any) => {
    e.preventDefault(); setErr('');
    try {
      await api.post('/contact', { name, email, message, captchaId: captcha.id, captcha: answer });
      setState('ok');
      setMessage(''); setHasThreads(true);
    } catch (e: any) {
      const code = e.response?.data?.error;
      setErr(code === 'wrong_captcha' ? String(t('contact.wrongCaptcha')) : String(t('contact.checkFields')));
      setState('err');
      loadCaptcha(); setAnswer('');
      setTimeout(() => setState('form'), 2500);
    }
  };

  return (
    <>
      <h1>{t('contact.title')}</h1>
      <p className="meta">{t('contact.sub')}</p>
      {!!user && hasThreads && (
        <p><Link to="/conversatii" className="btn secondary small">💬 {t('contact.myThreads')} →</Link></p>
      )}

      <div className="contact-grid">
        <form className="auth" style={{ margin: 0 }} onSubmit={send}>
          <input placeholder={t('contact.name')} value={name} onChange={e => setName(e.target.value)} />
          <input placeholder={t('contact.email')} value={email} onChange={e => setEmail(e.target.value)} />
          <textarea rows={5} placeholder={t('contact.message')} value={message} onChange={e => setMessage(e.target.value)} />
          <label>{t('contact.captcha')} <strong>{captcha.q}</strong>
            <input placeholder="?" value={answer} onChange={e => setAnswer(e.target.value)} inputMode="numeric" /></label>
          {err && state === 'err' && <span style={{ color: 'red' }}>{err}</span>}
          {state === 'ok' && <span style={{ color: 'green' }}>✓ {t('contact.sent')}</span>}
          <button className="btn">{t('contact.send')}</button>
        </form>
        <section className="panel">
          <h3>{t('contact.benefitsTitle')}</h3>
          <ul className="ing-list">
            {Array.isArray(benefits) && benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
          </ul>
          <p className="meta">{user ? `${t('contact.loggedNote')} (${user.name})` : <>{t('contact.guestNote')} <Link to="/login">Login →</Link></>}</p>
        </section>
      </div>

      {!!faq.length && (
        <section style={{ marginTop: 22 }}>
          <div className="section-head">
            <h2>{t('contact.faqTitle')}</h2>
            <Link to="/intrebari-frecvente" className="link-more">{t('contact.allFaq')} →</Link>
          </div>
          {faq.slice(0, 5).map((f: any) => (
            <details key={f.id} className="faq-item">
              <summary>{localized(f, 'question', lang)}</summary>
              <p>{localized(f, 'answer', lang)}</p>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
