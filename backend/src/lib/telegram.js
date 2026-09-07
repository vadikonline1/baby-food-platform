// Publicare retete pe canal Telegram via Bot API (fetch nativ, fara dependinte).
// Sursa setarilor: ENV intai, fallback Admin UI (DB).
const { getValue } = require('./settings');

async function cfg() {
  const [token, chat, appUrl] = await Promise.all([
    getValue('TELEGRAM_BOT_TOKEN'),
    getValue('TELEGRAM_CHANNEL_ID'),
    getValue('APP_URL', null, 'http://localhost:4000')
  ]);
  return { token, chat, app: appUrl.replace(/\/$/, '') };
}

function recipeLink(r, app) {
  return `${app}/retete/${r.id}-${r.slug}`;
}

function caption(r, app) {
  const lines = [
    `🍼 <b>${r.titleRo || ''}</b>`,
    r.summaryRo || '',
    '',
    `⏱ ${(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 ${r.servings || ''} porții`,
    `⭐ ${Number(r.avgRating || 0).toFixed(1)} (${r.ratingsCount || 0} voturi)`,
    '',
    `👉 ${recipeLink(r, app)}`
  ];
  return lines.join('\n');
}

async function tg(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) {
    const err = new Error(data.description || `telegram_${method}_failed`);
    err.code = 'telegram_failed';
    throw err;
  }
  return data.result;
}

// reteta publicata -> mesaj cu poza (upload direct daca e fisier local /uploads/*)
async function postRecipe(r) {
  const { token, chat, app } = await cfg();
  if (!token || !chat) {
    const err = new Error('telegram_not_configured');
    err.code = 'not_configured';
    throw err;
  }
  const text = caption(r, app);
  const fs = require('fs');
  const path = require('path');

  const img = r.imageUrl && /^https?:\/\//.test(r.imageUrl) ? r.imageUrl : null;
  if (img) {
    return tg(token, 'sendPhoto', { chat_id: chat, photo: img, caption: text, parse_mode: 'HTML' });
  }
  if (r.imageUrl && r.imageUrl.startsWith('/uploads/')) {
    const dir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
    const file = path.join(dir, path.basename(r.imageUrl));
    if (fs.existsSync(file)) {
      const form = new FormData();
      form.append('chat_id', chat);
      form.append('caption', text);
      form.append('parse_mode', 'HTML');
      form.append('photo', new Blob([fs.readFileSync(file)]), path.basename(file));
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) {
        const err = new Error(data.description || 'telegram_sendPhoto_failed');
        err.code = 'telegram_failed';
        throw err;
      }
      return data.result;
    }
  }
  return tg(token, 'sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: false });
}

// fire-and-forget din rute (nu blocheaza requestul, doar logheaza)
function postRecipeAsync(r) {
  postRecipe(r).then(
    () => console.log(`[telegram] posted recipe ${r.id}`),
    (e) => { if (e.code !== 'not_configured') console.error('[telegram] post failed:', e.message); }
  );
}

module.exports = { postRecipe, postRecipeAsync };
