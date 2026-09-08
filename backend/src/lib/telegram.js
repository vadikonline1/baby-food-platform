// Publicare retete pe canal Telegram via Bot API (fetch nativ, fara dependinte).
// Sursa setarilor: ENV intai, fallback Admin UI (DB).
const { getValue } = require('./settings');

async function cfg() {
  const [token, chat, topic, appUrl] = await Promise.all([
    getValue('TELEGRAM_BOT_TOKEN'),
    getValue('TELEGRAM_CHANNEL_ID'),
    getValue('TELEGRAM_TOPIC_ID'),
    getValue('APP_URL', null, 'http://localhost:4000')
  ]);
  // topic (thread) in canal: pasat ca message_thread_id daca e setat
  const topicId = String(topic || '').trim();
  return { token, chat, topic: topicId ? Number(topicId) : undefined, app: appUrl.replace(/\/$/, '') };
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
  const { token, chat, topic, app } = await cfg();
  if (!token || !chat) {
    const err = new Error('telegram_not_configured');
    err.code = 'not_configured';
    throw err;
  }
  // trimitem mereu sendMessage (text + link cu preview) — fiabil, fara upload multipart
  const text = caption(r, app);
  const thread = topic !== undefined ? { message_thread_id: topic } : {};
  return tg(token, 'sendMessage', { chat_id: chat, ...thread, text, parse_mode: 'HTML', disable_web_page_preview: false });
}

// fire-and-forget din rute (nu blocheaza requestul, doar logheaza)
function postRecipeAsync(r) {
  postRecipe(r).then(
    () => console.log(`[telegram] posted recipe ${r.id}`),
    (e) => { if (e.code !== 'not_configured') console.error('[telegram] post failed:', e.message); }
  );
}

// mesaj direct catre admin (TELEGRAM_CHANNEL_ADMIN: @canal sau id gen -100123...) — silentios daca lipseste
async function notifyAdmin(text) {
  try {
    const [token, adminChat] = await Promise.all([
      getValue('TELEGRAM_BOT_TOKEN'),
      getValue('TELEGRAM_CHANNEL_ADMIN')
    ]);
    if (!token || !adminChat) return { skipped: true };
    return tg(token, 'sendMessage', { chat_id: adminChat, text, parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (e) {
    console.error('[telegram] admin notify failed:', e.message);
    return { failed: true };
  }
}

function notifyAdminAsync(text) {
  notifyAdmin(text).then(
    (r) => { if (r && !r.skipped) console.log('[telegram] admin notified'); },
    () => {}
  );
}

module.exports = { postRecipe, postRecipeAsync, notifyAdmin, notifyAdminAsync };
