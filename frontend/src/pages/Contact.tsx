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
  const benefits = (t('contact.benefits', { returnObjects: true }) as string[]) || [];

  const loadCaptcha = () => api.get('/contact/captcha').then(r => setCaptcha(r.data)).catch(() => {});
  useEffect(() => {
    loadCaptcha();
    api.get('/content/faq').then(r => setFaq(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user]);

  const send = async (e: any) => {
    e.preventDefault(); setErr('');
    try {
      await api.post('/contact', { name, email, message, captchaId: captcha.id, captcha: answer });
      setState('ok');
    } catch (e: any) {
      const code = e.response?.data?.error;
      setErr(code === 'wrong_captcha' ? String(t('contact.wrongCaptcha')) : String(t('contact.checkFields')));
      setState('err');
      loadCaptcha(); setAnswer('');
      setTimeout(() => setState('form'), 2500);
    }
  };

  if (state === 'ok') {
    return (<div className="panel" style={{ maxWidth: 560, margin: '30px auto', textAlign: 'center' }}>
      <h2>✓ {t('contact.sent')}</h2><p>{t('contact.sentSub')}</p>
    </div>);
  }
  return (
    <>
      <h1>{t('contact.title')}</h1>
      <p className="meta">{t('contact.sub')}</p>

      <section className="panel" style={{ margin: '16px 0' }}>
        <h3>{t('contact.benefitsTitle')}</h3>
        <ul className="ing-list">
          {Array.isArray(benefits) && benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
        </ul>
        <p className="meta">{user ? `${t('contact.loggedNote')} (${user.name})` : <>{t('contact.guestNote')} <Link to="/login">Login →</Link></>}</p>
      </section>

      <form className="auth" style={{ margin: '20px 0' }} onSubmit={send}>
        <input placeholder={t('contact.name')} value={name} onChange={e => setName(e.target.value)} />
        <input placeholder={t('contact.email')} value={email} onChange={e => setEmail(e.target.value)} />
        <textarea rows={5} placeholder={t('contact.message')} value={message} onChange={e => setMessage(e.target.value)} />
        <label>{t('contact.captcha')} <strong>{captcha.q}</strong>
          <input placeholder="?" value={answer} onChange={e => setAnswer(e.target.value)} inputMode="numeric" /></label>
        {err && state === 'err' && <span style={{ color: 'red' }}>{err}</span>}
        <button className="btn">{t('contact.send')}</button>
      </form>

      {!!faq.length && (
        <section>
          <h2>{t('contact.faqTitle')}</h2>
          {faq.map((f: any) => (
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
