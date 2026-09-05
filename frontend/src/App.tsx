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

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const canAdmin = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');

  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand">GustBebe</Link>
        <NavLink className="link" to="/">{t('nav.home')}</NavLink>
        <NavLink className="link" to="/retete">{t('nav.recipes')}</NavLink>
        <NavLink className="link" to="/categorii">{t('nav.categories')}</NavLink>
        <NavLink className="link" to="/cautare">{t('nav.search')}</NavLink>
        <span className="spacer" />
        <select className="langselect" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} aria-label="Language">
          <option value="ro">Ro</option>
          <option value="ru">Ru</option>
          <option value="en">En</option>
        </select>
        {canAdmin && <NavLink className="link" to="/admin">🛠 {t('nav.admin')}</NavLink>}
        {user ? (<><NavLink className="link" to="/profil">{t('nav.profile')} ({user.name})</NavLink><button className="btn secondary small" onClick={() => { logout(); nav('/'); }}>{t('nav.logout')}</button></>) :
          (<NavLink className="link" to="/login">👤 {t('nav.login')}</NavLink>)}
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
        </Routes>
      </div>
      <footer className="footer">
        <nav>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/retete">{t('nav.recipes')}</Link>
          <Link to="/categorii">{t('nav.categories')}</Link>
          <Link to="/cookies">{t('cookies.more')}</Link>
        </nav>
        <p>GustBebe — {t('tagline')}</p>
      </footer>
      <CookieBanner />
    </>
  );
}
