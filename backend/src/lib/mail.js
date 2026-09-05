// Trimitere emailuri via SMTP (setari din .env). Daca SMTP nu e configurat,
// linkul de verificare se afiseaza in consola (mod dev) si se intoarce apelantului.
const nodemailer = require('nodemailer');

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function sendVerifyEmail(to, name, verifyUrl) {
  const from = process.env.SMTP_FROM || 'GustBebe <no-reply@gustbebe.md>';
  if (!smtpConfigured()) {
    console.log(`[mail/dev] link verificare pentru ${to}: ${verifyUrl}`);
    return { dev: true, verifyUrl };
  }
  const subject = 'Confirmă adresa de email — GustBebe';
  const html = `<p>Bună, ${name || ''}!</p>
<p>Contul tău GustBebe a fost creat. Confirmă adresa de email accesând linkul (valabil 24h):</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>Dacă nu tu ai cerut acest cont, ignoră mesajul.</p>`;
  await transporter().sendMail({ from, to, subject, html });
  return { dev: false };
}

module.exports = { sendVerifyEmail, smtpConfigured };
