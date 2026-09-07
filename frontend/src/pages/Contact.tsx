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
  const [threads, setThreads] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const benefits = (t('contact.benefits', { returnObjects: true }) as string[]) || [];

  const loadCaptcha = () => api.get('/contact/captcha').then(r => setCaptcha(r.data)).catch(() => {});
  const loadMine = () => api.get('/contact/mine').then(r => setThreads(r.data)).catch(() => {});
  useEffect(() => {
    loadCaptcha();
    api.get('/content/faq').then(r => setFaq(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); loadMine(); }
  }, [user]);

  const send = async (e: any) => {
    e.preventDefault(); setErr('');
    try {
      await api.post('/contact', { name, email, message, captchaId: captcha.id, captcha: answer });
      setState('ok');
      setMessage(''); loadMine();
    } catch (e: any) {
      const code = e.response?.data?.error;
      setErr(code === 'wrong_captcha' ? String(t('contact.wrongCaptcha')) : String(t('contact.checkFields')));
      setState('err');
      loadCaptcha(); setAnswer('');
      setTimeout(() => setState('form'), 2500);
    }
  };

  const sendReply = async (id: number) => {
    const text = (replyText[id] || '').trim();
    if (!text) return;
    await api.post(`/contact/messages/${id}/reply`, { text });
    setReplyText({ ...replyText, [id]: '' });
    loadMine();
  };

  return (
    <>
      <h1>{t('contact.title')}</h1>
      <p className="meta">{t('contact.sub')}</p>

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

      {!!user && !!threads.length && (
        <section style={{ marginTop: 22 }}>
          <h2>{t('contact.myThreads')}</h2>
          {threads.map((m: any) => (
            <div className="panel" key={m.id} style={{ marginBottom: 12 }}>
              <p className="meta">{new Date(m.createdAt).toLocaleString()}</p>
              <p><strong>{t('contact.you')}:</strong> {m.message}</p>
              {(m.replies || []).map((r: any) => (
                <p key={r.id} className={r.from === 'admin' ? 'notice' : ''} style={{ padding: r.from === 'admin' ? 10 : 0 }}>
                  <strong>{r.from === 'admin' ? t('contact.adminSays') : t('contact.you')}:</strong> {r.text}
                </p>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input placeholder={t('contact.replyPh')} value={replyText[m.id] || ''} onChange={e => setReplyText({ ...replyText, [m.id]: e.target.value })} />
                <button className="btn secondary small" onClick={() => sendReply(m.id)}>{t('contact.send')}</button>
              </div>
            </div>
          ))}
        </section>
      )}

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
