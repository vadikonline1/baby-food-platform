import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

// Clopotel notificari admin (doar ADMIN): numar necitite + dropdown
export default function NotifBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => api.get('/notifications?unread=1&limit=8').then(r => {
    setCount(r.data.count); setItems(r.data.items);
  }).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const readAll = async () => {
    await api.patch('/notifications/read-all');
    setCount(0); setItems(items.map(i => ({ ...i, read: true })));
  };

  return (
    <span className="bell-wrap">
      <button className="bell" aria-label="Notificări" onClick={() => setOpen(!open)}>
        🔔{count > 0 && <span className="bell-n">{count}</span>}
      </button>
      {open && (
        <div className="bell-drop">
          <div className="bell-head"><strong>Notificări</strong><button className="link-more" onClick={readAll}>Marchează citite</button></div>
          {!items.length && <p className="meta">Nicio notificare nouă.</p>}
          {items.map(n => (
            <Link key={n.id} to={n.link || '/admin'} onClick={() => setOpen(false)} className="bell-item">
              <small className="meta">{new Date(n.createdAt).toLocaleString()} · {n.type}</small>
              <span>{n.title}</span>
            </Link>
          ))}
        </div>
      )}
    </span>
  );
}
