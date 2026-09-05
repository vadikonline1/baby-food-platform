import { useState } from 'react';
import { NavLink, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './lib/auth-context';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Categories from './pages/Categories';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import RecipeForm from './pages/RecipeForm';
import Cookies from './pages/Cookies';
import CookieBanner from './components/CookieBanner';
import Verify from './pages/Verify';
import Contact from './pages/Contact';
import NotifBell from './components/NotifBell';

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const canAdmin = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');
  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand" onClick={close}>GustBebe</Link>
        <button className="menu-toggle" aria-label="Meniu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
        <div className="nav-links">
          <NavLink className="link" to="/" onClick={close}>{t('nav.home')}</NavLink>
          <NavLink className="link" to="/retete" onClick={close}>{t('nav.recipes')}</NavLink>
          <NavLink className="link" to="/categorii" onClick={close}>{t('nav.categories')}</NavLink>
          <NavLink className="link" to="/cautare" onClick={close}>{t('nav.search')}</NavLink>
          <NavLink className="link" to="/contact" onClick={close}>{t('nav.contact')}</NavLink>
          <span className="spacer" />
          <select className="langselect" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} aria-label="Language">
            <option value="ro">Ro</option>
            <option value="ru">Ru</option>
            <option value="en">En</option>
          </select>
          {canAdmin && <NavLink className="link" to="/admin" onClick={close}>🛠 {t('nav.admin')}</NavLink>}
          {user?.role === 'ADMIN' && <NotifBell />}
          {user ? (<><NavLink className="link" to="/profil" onClick={close}>{t('nav.profile')} ({user.name})</NavLink><button className="btn secondary small" onClick={() => { logout(); close(); nav('/'); }}>{t('nav.logout')}</button></>) :
            (<NavLink className="link" to="/login" onClick={close}>👤 {t('nav.login')}</NavLink>)}
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/retete" element={<Recipes />} />
          <Route path="/retete/:slug" element={<RecipeDetail />} />
          <Route path="/categorii" element={<Categories />} />
          <Route path="/cautare" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/retete/noua" element={<RecipeForm />} />
          <Route path="/admin/retete/:id/editeaza" element={<RecipeForm />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
      <footer className="footer">
        <nav>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/retete">{t('nav.recipes')}</Link>
          <Link to="/categorii">{t('nav.categories')}</Link>
          <Link to="/contact">{t('nav.contact')}</Link>
          <Link to="/cookies">{t('cookies.more')}</Link>
        </nav>
        <p>GustBebe — {t('tagline')}</p>
      </footer>
      <CookieBanner />
    </>
  );
}
