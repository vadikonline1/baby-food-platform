import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [needVerify, setNeedVerify] = useState(false);
  const go = async (e: any) => {
    e.preventDefault(); setErr(''); setNeedVerify(false);
    try { await login(email, password); nav('/'); }
    catch (e: any) {
      if (e.response?.data?.error === 'email_not_verified') { setNeedVerify(true); setErr('Contul nu e confirmat. Verifică emailul.'); }
      else setErr('Login invalid');
    }
  };
  const resend = async () => {
    await api.post('/auth/resend', { email });
    setErr('✓ Link nou trimis pe email.');
  };
  return (<form className="auth" onSubmit={go}><h2>{t('auth.login')}</h2>
    <input placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder={t('auth.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} />
    {err && <span style={{ color: 'red' }}>{err}</span>}
    {needVerify && <button type="button" className="btn secondary" onClick={resend}>Retrimite confirmarea</button>}
    <button className="btn">{t('auth.submit')}</button>
    <span>{t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link></span></form>);
}
