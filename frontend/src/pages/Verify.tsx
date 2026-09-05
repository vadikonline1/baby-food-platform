import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export default function Verify() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); setMsg('invalid_token'); return; }
    api.post('/auth/verify', { token }).then(async (res) => {
      if (res.data.token) {
        localStorage.setItem('gb_token', res.data.token);
        await refresh();
      }
      setState('ok');
      setTimeout(() => nav('/'), 2500);
    }).catch((e) => {
      setState('error');
      setMsg(e.response?.data?.error || 'invalid_token');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="panel" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
      {state === 'loading' && <p>{t('common.loading')}</p>}
      {state === 'ok' && (<><h2>✓ Email confirmat!</h2><p>Contul tău este activ. Te redirecționăm...</p></>)}
      {state === 'error' && (<><h2>Link invalid sau expirat ({msg})</h2><p><Link to="/login">Înapoi la login</Link> — cere un link nou din pagina de înregistrare.</p></>)}
    </div>
  );
}
