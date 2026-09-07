// Trimitere emailuri via SMTP. Sursa setarilor: ENV intai, fallback Admin UI (DB).
// Daca SMTP nu e configurat niciunde, linkul se afiseaza in consola (mod dev).
const nodemailer = require('nodemailer');
const { getValue } = require('./settings');

async function smtpConfigured() {
  return (await getValue('SMTP_HOST')) !== '';
}

async function transporter() {
  const host = await getValue('SMTP_HOST');
  const port = Number(await getValue('SMTP_PORT', null, '587')) || 587;
  const secure = (await getValue('SMTP_SECURE', null, 'false')) === 'true';
  const user = await getValue('SMTP_USER');
  const pass = await getValue('SMTP_PASS');
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined
  });
}

async function sendVerifyEmail(to, name, verifyUrl) {
  const from = await getValue('SMTP_FROM', null, 'GustBebe <no-reply@gustbebe.md>');
  if (!(await smtpConfigured())) {
    console.log(`[mail/dev] link verificare pentru ${to}: ${verifyUrl}`);
    return { dev: true, verifyUrl };
  }
  const subject = 'Confirmă adresa de email — GustBebe';
  const html = `<p>Bună, ${name || ''}!</p>
<p>Contul tău GustBebe a fost creat. Confirmă adresa de email accesând linkul (valabil 24h):</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>Dacă nu tu ai cerut acest cont, ignoră mesajul.</p>`;
  await (await transporter()).sendMail({ from, to, subject, html });
  return { dev: false };
}

module.exports = { sendVerifyEmail, smtpConfigured };
