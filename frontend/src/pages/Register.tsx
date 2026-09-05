import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [done, setDone] = useState<any>(null);
  const [err, setErr] = useState('');

  const go = async (e: any) => {
    e.preventDefault(); setErr('');
    try {
      const data = await register(name, email, password);
      if (data?.token) { window.location.href = '/'; return; }
      setDone(data);
    } catch (e: any) {
      setErr(e.response?.data?.error === 'email_taken' ? 'Email deja folosit.' : 'Eroare la înregistrare.');
    }
  };
  const resend = async () => {
    await api.post('/auth/resend', { email });
    setDone({ ...done, resent: true });
  };

  if (done) {
    return (
      <div className="panel" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2>📧 Verifică emailul</h2>
        <p>Contul a fost creat. L-am trimis un link de confirmare pe <b>{email}</b> (valabil 24h). Contul se activează doar după confirmare.</p>
        <button className="btn secondary" onClick={resend}>Retrimite emailul</button>
        {done.resent && <p className="meta">✓ Trimis din nou.</p>}
        <p><Link to="/login">Mergi la login</Link></p>
      </div>
    );
  }
  return (<form className="auth" onSubmit={go}><h2>{t('auth.register')}</h2>
    <input placeholder={t('auth.name')} value={name} onChange={e => setName(e.target.value)} />
    <input placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder={t('auth.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} />
    {err && <span style={{ color: 'red' }}>{err}</span>}
    <button className="btn">{t('auth.submit')}</button></form>);
}
