import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Badge-uri magazine (SVG desenat local, fara assete externe).
// Pe Android arata doar Google Play, pe iOS doar App Store, pe web ambele.
// Linkurile vin din Admin → Setari aplicatie → Magazine (remote config).
function PlayBadge() {
  return (
    <svg viewBox="0 0 150 44" style={{ height: 44, width: 'auto' }} role="img" aria-label="Google Play">
      <rect x="1" y="1" width="148" height="42" rx="8" fill="#111" stroke="#555" />
      <path d="M34 12 L50 22 L34 32 Z" fill="#00d2ff" />
      <path d="M34 12 L42 22 L34 32 Z" fill="#00f076" opacity="0.85" />
      <path d="M34 12 L50 22 L44 22 Z" fill="#ffce00" opacity="0.9" />
      <path d="M34 32 L50 22 L44 22 Z" fill="#ff3a44" opacity="0.9" />
      <text x="58" y="18" fill="#fff" fontSize="9" fontFamily="Inter,sans-serif">GET IT ON</text>
      <text x="58" y="33" fill="#fff" fontSize="15" fontWeight="600" fontFamily="Inter,sans-serif">Google Play</text>
    </svg>
  );
}

function StoreBadge() {
  return (
    <svg viewBox="0 0 150 44" style={{ height: 44, width: 'auto' }} role="img" aria-label="App Store">
      <rect x="1" y="1" width="148" height="42" rx="8" fill="#111" stroke="#555" />
      <path d="M40 12 c-3 0 -6 2 -7 5 c3 0 4 1 5 3 c-2 3 -3 5 -3 8 c3 -1 5 -1 7 1 c0 -2 1 -4 2 -5 c2 1 4 1 6 0 c-1 -5 -4 -9 -10 -12 z M42 11 c0 -2 1 -4 3 -5 c2 2 2 4 1 6 c-2 1 -4 0 -4 -1 z" fill="#fff" />
      <text x="58" y="18" fill="#fff" fontSize="9" fontFamily="Inter,sans-serif">Download on the</text>
      <text x="58" y="33" fill="#fff" fontSize="15" fontWeight="600" fontFamily="Inter,sans-serif">App Store</text>
    </svg>
  );
}

export default function StoreBadges() {
  const [links, setLinks] = useState<{ android: string; ios: string }>({ android: '', ios: '' });
  const [os, setOs] = useState<'android' | 'ios' | 'web'>('web');

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) setOs('android');
    else if (/iphone|ipad|ipod/i.test(ua)) setOs('ios');
    api.get('/settings/config').then(r => {
      setLinks({ android: r.data?.stores?.android || '', ios: r.data?.stores?.ios || '' });
    }).catch(() => {});
  }, []);

  if (!links.android && !links.ios) return null;
  const showAndroid = (os === 'android' || os === 'web') && links.android;
  const showIos = (os === 'ios' || os === 'web') && links.ios;
  if (!showAndroid && !showIos) return null;

  return (
    <div className="store-badges">
      {showAndroid && <a href={links.android} target="_blank" rel="noreferrer"><PlayBadge /></a>}
      {showIos && <a href={links.ios} target="_blank" rel="noreferrer"><StoreBadge /></a>}
    </div>
  );
}
