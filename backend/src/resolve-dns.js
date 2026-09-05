// Rezolva DNS-ul public al site-ului din hosts_app_dns (poate sa se schimbe):
//   md.vadikonline1.gustbebe=<dns>
// Afiseaza "APP_URL=https://<dns>" sau nimic (fallback pe APP_URL din .env).
// Folosit in CMD: export $(node src/resolve-dns.js)
const SRC = process.env.DNS_SOURCE_URL
  || 'https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns';

fetch(SRC, { signal: AbortSignal.timeout(8000) })
  .then((r) => { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
  .then((t) => {
    const line = t.split('\n').map((x) => x.trim()).find((x) => x.startsWith('md.vadikonline1.gustbebe='));
    const dns = line ? line.split('=').slice(1).join('=').trim() : '';
    if (dns) console.log(`APP_URL=https://${dns}`);
  })
  .catch(() => {});
