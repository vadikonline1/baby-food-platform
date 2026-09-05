import axios from 'axios';
// In Docker/prod VITE_API_URL=/api (acelasi DNS+port via gateway).
// In dev local: http://localhost:4000/api
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('gb_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export function localized(obj: any, base: string, lang: string) {
  if (!obj) return '';
  const cap = lang.charAt(0).toUpperCase() + lang.slice(1);
  return obj[`${base}${cap}`] ?? obj[`${base}Ro`] ?? '';
}
// URL public reteta: /retete/id-slug (ex: /retete/12-piure-de-morcov)
export function recipeUrl(r: any) {
  return `/retete/${r.id}-${r.slug}`;
}
export function imgUrl(u?: string | null) {
  if (!u) return '';
  if (/^https?:\/\//.test(u)) return u;
  return u.startsWith('/') ? u : `/${u}`;
}
