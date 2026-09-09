import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// Convorbirile mele cu echipa — pagina separata (doar daca exista discutii)
export default function Conversations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[] | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  const load = () => api.get('/contact/mine').then(r => setThreads(r.data)).catch(() => setThreads([]));
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <p>{t('auth.needLogin')} <Link to="/login">{t('auth.login')}</Link>.</p>;
  if (threads === null) return <p>{t('common.loading')}</p>;
  if (!threads.length) {
    return (<><h1>{t('contact.myThreads')}</h1>
      <p className="meta">{t('contact.noThreads')} <Link to="/contact">{t('nav.contact')} →</Link></p></>);
  }

  const sendReply = async (id: number) => {
    const text = (replyText[id] || '').trim();
    if (!text) return;
    await api.post(`/contact/messages/${id}/reply`, { text });
    setReplyText({ ...replyText, [id]: '' });
    load();
  };

  return (
    <>
      <h1>{t('contact.myThreads')}</h1>
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
    </>
  );
}
