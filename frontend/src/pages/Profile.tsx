import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, localized, imgUrl, recipeUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { t, i18n } = useTranslation();
  const [favs, setFavs] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    api.get('/users/me/favorites').then(r => setFavs(r.data)).catch(() => {});
  }, []);
  useEffect(() => { if (user) setName(user.name); }, [user]);

  if (!user) return <p>Necesită <Link to="/login">login</Link>.</p>;

  const saveName = async (e: any) => {
    e.preventDefault(); setMsg('');
    try {
      await api.patch('/auth/me', { name });
      await refresh(); setMsg('✓');
    } catch { setMsg('Eroare la salvare.'); }
  };
  const removeFav = async (recipeId: number) => {
    await api.delete(`/recipes/${recipeId}/favorite`);
    setFavs(favs.filter(r => r.id !== recipeId));
  };
  const savePw = async (e: any) => {
    e.preventDefault(); setPwMsg('');
    if (npw.length < 6) { setPwMsg('Parola nouă trebuie să aibă minim 6 caractere.'); return; }
    try {
      await api.patch('/auth/me/password', { currentPassword: cur, newPassword: npw });
      setCur(''); setNpw(''); setPwMsg('✓ Parola a fost schimbată.');
    } catch (err: any) {
      setPwMsg(err.response?.data?.error === 'wrong_current_password' ? 'Parola curentă e greșită.' : 'Eroare la schimbare.');
    }
  };

  return (
    <>
      <h1>Profil — {user.name}</h1>
      <p className="meta">{user.email} · rol: <b>{user.role}</b></p>
      <div className="dash-cols">
        <section className="panel">
          <h3>Datele mele</h3>
          <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>Nume<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email (nu poate fi schimbat)<input value={user.email} disabled style={{ opacity: 0.6 }} /></label>
            <div><button className="btn small">Salvează {msg}</button></div>
          </form>
        </section>
        <section className="panel">
          <h3>Schimbă parola</h3>
          <form onSubmit={savePw} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>Parola curentă<input type="password" value={cur} onChange={e => setCur(e.target.value)} /></label>
            <label>Parola nouă (min 6)<input type="password" value={npw} onChange={e => setNpw(e.target.value)} /></label>
            <div><button className="btn small">Schimbă parola</button></div>
            {pwMsg && <p className="meta">{pwMsg}</p>}
          </form>
        </section>
      </div>
      <h2>Favorite ❤</h2>
      <div className="grid">{favs.map((r: any) => (
        <div className="card" key={r.id}>
          {r.imageUrl ? <img src={imgUrl(r.imageUrl)} alt="" loading="lazy" /> : <div className="card-ph">🥣</div>}
          <div className="body">
            <strong>{localized(r, 'title', i18n.language)}</strong>
            <div className="row">
              <Link className="btn secondary small" to={recipeUrl(r)}>Vezi</Link>
              <button className="btn danger small" onClick={() => removeFav(r.id)}>✕ Favorit</button>
            </div>
          </div>
        </div>
      ))}</div>
    </>
  );
}
