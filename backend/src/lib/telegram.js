// Publicare retete pe canal Telegram via Bot API (fetch nativ, fara dependinte).
// .env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID (ex: @gustbebe sau -100xxx), APP_URL (linkuri retete)
const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const CHAT = () => process.env.TELEGRAM_CHANNEL_ID;
const APP = () => (process.env.APP_URL || '').replace(/\/$/, '');

function configured() {
  return Boolean(TOKEN() && CHAT());
}

function recipeLink(r) {
  return `${APP()}/retete/${r.id}-${r.slug}`;
}

function caption(r) {
  const lines = [
    `🍼 <b>${r.titleRo || ''}</b>`,
    r.summaryRo || '',
    '',
    `⏱ ${(r.prepMinutes || 0) + (r.cookMinutes || 0)} min · 🍽 ${r.servings || ''} porții`,
    `⭐ ${Number(r.avgRating || 0).toFixed(1)} (${r.ratingsCount || 0} voturi)`,
    '',
    `👉 ${recipeLink(r)}`
  ];
  return lines.join('\n');
}

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description || `telegram_${method}_failed`);
  return data.result;
}

// reteta publicata -> mesaj cu poza (upload direct daca e fisier local /uploads/*)
async function postRecipe(r) {
  if (!configured()) return { skipped: true };
  const chat_id = CHAT();
  const text = caption(r);
  const fs = require('fs');
  const path = require('path');

  // 1) imagine externa (URL absolut)
  const img = r.imageUrl && /^https?:\/\//.test(r.imageUrl) ? r.imageUrl : null;
  if (img) {
    return tg('sendPhoto', { chat_id, photo: img, caption: text, parse_mode: 'HTML' });
  }
  // 2) fisier local din /uploads -> upload multipart (FormData nativ Node 22)
  if (r.imageUrl && r.imageUrl.startsWith('/uploads/')) {
    const dir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
    const file = path.join(dir, path.basename(r.imageUrl));
    if (fs.existsSync(file)) {
      const form = new FormData();
      form.append('chat_id', chat_id);
      form.append('caption', text);
      form.append('parse_mode', 'HTML');
      form.append('photo', new Blob([fs.readFileSync(file)]), path.basename(file));
      const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/sendPhoto`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.description || 'telegram_sendPhoto_failed');
      return data.result;
    }
  }
  // 3) fallback: doar text + link
  return tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: false });
}

// fire-and-forget din rute (nu blocheaza requestul, doar logheaza)
function postRecipeAsync(r) {
  if (!configured()) return;
  postRecipe(r).then(
    () => console.log(`[telegram] posted recipe ${r.id}`),
    (e) => console.error('[telegram] post failed:', e.message)
  );
}

module.exports = { configured, postRecipe, postRecipeAsync };
