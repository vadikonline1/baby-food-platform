const bcrypt = require('bcryptjs');
const { prisma } = require('../src/lib/db');

async function main() {
  // credentiale din .env (docker) cu fallback pentru dev local
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gustbebe.md';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin123!';
  const modEmail = process.env.MODERATOR_EMAIL || 'moderator@gustbebe.md';
  const modPass = process.env.MODERATOR_PASSWORD || 'Mod12345!';
  const adminHash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { emailVerified: true },
    create: { name: 'Administrator', email: adminEmail, passwordHash: adminHash, role: 'ADMIN', lang: 'ro', emailVerified: true }
  });
  const modHash = await bcrypt.hash(modPass, 10);
  await prisma.user.upsert({
    where: { email: modEmail },
    update: { emailVerified: true },
    create: { name: 'Moderator', email: modEmail, passwordHash: modHash, role: 'MODERATOR', lang: 'ro', emailVerified: true }
  });

  // varste "Potrivit de la X" (praguri, fara suprapuneri) — idempotent + migrare
  // legaturile vechi (intervale 6-8 luni etc.) se muta pe pragul cu acelasi minMonths
  const { AGES, FEEDINGS, CATS, RESTR, CHARS } = require('./taxonomy-data');
  const ageIdByMin = {};
  for (const a of AGES) {
    let row = await prisma.ageGroup.findFirst({ where: { minMonths: a.minMonths, maxMonths: a.maxMonths } });
    if (!row) row = await prisma.ageGroup.create({ data: a });
    else await prisma.ageGroup.update({ where: { id: row.id }, data: { labelRo: a.labelRo, labelRu: a.labelRu, labelEn: a.labelEn } });
    ageIdByMin[a.minMonths] = row.id;
  }
  const staleAges = await prisma.ageGroup.findMany({
    where: { NOT: { id: { in: Object.values(ageIdByMin) } } },
    include: { recipeLinks: true }
  });
  for (const o of staleAges) {
    const target = ageIdByMin[o.minMonths];
    if (target) {
      for (const l of o.recipeLinks) {
        await prisma.recipeAge.upsert({
          where: { recipeId_ageGroupId: { recipeId: l.recipeId, ageGroupId: target } },
          update: {}, create: { recipeId: l.recipeId, ageGroupId: target }
        });
      }
      console.log(`[seed] varsta migrata: ${o.labelRo} -> prag ${o.minMonths} (${o.recipeLinks.length} retete)`);
    } else {
      console.log(`[seed] varsta veche pastrata (are retete, fara prag echivalent): ${o.labelRo}`);
      continue;
    }
    await prisma.recipeAge.deleteMany({ where: { ageGroupId: o.id } });
    await prisma.ageGroup.delete({ where: { id: o.id } });
  }

  // helper generic: upsert canonic + sterge necanonice fara retete
  async function syncTax(model, linkModel, linkField, canon, extraFields) {
    const keep = new Set();
    for (const item of canon) {
      const row = await prisma[model].upsert({
        where: { slug: item.slug },
        update: Object.fromEntries(extraFields.map(k => [k, item[k]])),
        create: item
      });
      keep.add(row.id);
    }
    const stale = await prisma[model].findMany({ where: { NOT: { id: { in: [...keep] } } } });
    for (const s of stale) {
      const used = await prisma[linkModel].count({ where: { [linkField]: s.id } });
      if (used) { console.log(`[seed] ${model} pastrat (are ${used} retete): ${s.slug}`); continue; }
      await prisma[model].delete({ where: { id: s.id } });
      console.log(`[seed] ${model} sters (necanonic, gol): ${s.slug}`);
    }
  }

  // tipuri de masa — "Cand se serveste?"
  await syncTax('feedingType', 'recipe', 'feedingTypeId', FEEDINGS, ['nameRo', 'nameRu', 'nameEn']);

  // categorii meniu — "Ce fel de preparat este?"
  await syncTax('menuCategory', 'recipeCategory', 'categoryId', CATS, ['nameRo', 'nameRu', 'nameEn', 'icon']);

  // restrictii
  await syncTax('dietaryRestriction', 'recipeRestriction', 'restrictionId', RESTR, ['nameRo', 'nameRu', 'nameEn']);

  // caracteristici
  await syncTax('characteristic', 'recipeCharacteristic', 'characteristicId', CHARS, ['nameRo', 'nameRu', 'nameEn']);

  // unitati de masura
  const units = [
    { slug: 'buc', nameRo: 'bucată', nameRu: 'шт.', nameEn: 'pc' },
    { slug: 'g', nameRo: 'gram', nameRu: 'грамм', nameEn: 'gram' },
    { slug: 'kg', nameRo: 'kilogram', nameRu: 'килограмм', nameEn: 'kilogram' },
    { slug: 'ml', nameRo: 'mililitru', nameRu: 'миллилитр', nameEn: 'millilitre' },
    { slug: 'l', nameRo: 'litru', nameRu: 'литр', nameEn: 'litre' },
    { slug: 'lingura', nameRo: 'lingură', nameRu: 'столовая ложка', nameEn: 'tablespoon' },
    { slug: 'lingurita', nameRo: 'linguriță', nameRu: 'чайная ложка', nameEn: 'teaspoon' },
    { slug: 'cana', nameRo: 'cană', nameRu: 'стакан', nameEn: 'cup' },
    { slug: 'felie', nameRo: 'felie', nameRu: 'ломтик', nameEn: 'slice' },
    { slug: 'priza', nameRo: 'priză', nameRu: 'щепотка', nameEn: 'pinch' }
  ];
  for (const u of units) await prisma.unit.upsert({ where: { slug: u.slug }, update: {}, create: u });

  // setari aplicatie (AdMob + buton sustinere) — goale = de completat din Admin
  const defaults = {    admob_android_banner: '', admob_android_rewarded_interstitial: '', admob_android_rewarded: '',
    admob_ios_banner: '', admob_ios_rewarded_interstitial: '', admob_ios_rewarded: '',
    support_enabled: 'true',
    support_title_ro: 'Susține proiectul GustBebe', support_title_ru: 'Поддержите проект GustBebe', support_title_en: 'Support the GustBebe project',
    support_text_ro: 'Urmărește o reclamă și ne ajuți să adăugăm rețete noi în fiecare săptămână.',
    support_text_ru: 'Посмотрите рекламу и помогите нам добавлять новые рецепты каждую неделю.',
    support_text_en: 'Watch an ad and help us add new recipes every week.',
    firebase_web_apikey: '', firebase_web_authdomain: '', firebase_web_projectid: '',
    firebase_web_storagebucket: '', firebase_web_senderid: '', firebase_web_appid: '', firebase_web_measurementid: '',
    seo_head_end: '', seo_body_start: '', seo_body_end: '',
    seo_meta_title: 'GustBebe — rețete pentru bebeluși și copii mici',
    seo_meta_description: '', seo_meta_keywords: '',
    home_hero_title_ro: 'Rețete sănătoase pentru bebelușii tăi',
    home_hero_title_ru: 'Полезные рецепты для ваших малышей',
    home_hero_title_en: 'Healthy recipes for your little ones',
    home_hero_subtitle_ro: 'Descoperă rețete verificate, adaptate vârstei copilului tău: de la primele gustări la mese complete de familie.',
    home_hero_subtitle_ru: 'Проверенные рецепты по возрасту ребёнка: от первых ложек прикорма до полноценных семейных обедов.',
    home_hero_subtitle_en: "Discover trusted recipes matched to your child's age: from first tastes to full family meals.",
    store_android_url: '', store_ios_url: '',
    auth_google_enabled: 'false', auth_google_web_client_id: '', auth_google_ios_client_id: '', auth_google_android_client_id: '',
    auth_apple_enabled: 'false', auth_apple_service_id: '',
    app_url: '', dns_source_url: '',
    smtp_host: '', smtp_port: '587', smtp_secure: 'false', smtp_user: '', smtp_pass: '', smtp_from: 'GustBebe <no-reply@gustbebe.md>',
    telegram_bot_token: '', telegram_channel_id: '', telegram_channel_admin: '',
    telegram_public_url: ''
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.appSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // continut editabil (doar la prima initializare — dupa aceea se gestioneaza din Admin)
  // datele stau in backend (content-data.js), NU in frontend — in Docker frontend/src nu exista
  const { GUIDE_ICONS, GUIDE, COOKIES, COOKIES_EXTRA, FAQ, FAQ_EXTRA } = require('./content-data');
  if ((await prisma.guideItem.count()) === 0) {
    let pos = 0;
    for (const [i, g] of GUIDE.entries()) {
      await prisma.guideItem.create({
        data: {
          icon: GUIDE_ICONS[i % GUIDE_ICONS.length],
          titleRo: g.q[0], titleRu: g.q[1], titleEn: g.q[2],
          bodyRo: g.a[0], bodyRu: g.a[1], bodyEn: g.a[2],
          position: pos++
        }
      });
    }
    console.log(`[seed] guide items: ${GUIDE.length}`);
  }
  if ((await prisma.cookieSection.count()) === 0) {
    let pos = 0;
    for (const s of COOKIES) {
      await prisma.cookieSection.create({
        data: {
          titleRo: s.h[0], titleRu: s.h[1], titleEn: s.h[2],
          bodyRo: s.p[0], bodyRu: s.p[1], bodyEn: s.p[2],
          position: pos++
        }
      });
    }
    console.log(`[seed] cookie sections: ${COOKIES.length}`);
  }
  // sectiunile noi de cookies se adauga daca lipsesc (functii noi, fara duplicate)
  for (const s of COOKIES_EXTRA) {
    const exists = await prisma.cookieSection.findFirst({ where: { titleRo: s.h[0] } });
    if (!exists) {
      const maxPos = await prisma.cookieSection.aggregate({ _max: { position: true } });
      await prisma.cookieSection.create({
        data: {
          titleRo: s.h[0], titleRu: s.h[1], titleEn: s.h[2],
          bodyRo: s.p[0], bodyRu: s.p[1], bodyEn: s.p[2],
          position: (maxPos._max.position ?? -1) + 1
        }
      });
      console.log(`[seed] cookie extra: ${s.h[0]}`);
    }
  }
  if ((await prisma.faqItem.count()) === 0) {
    let pos = 0;
    for (const f of FAQ) {
      await prisma.faqItem.create({
        data: { questionRo: f.q[0], questionRu: f.q[1], questionEn: f.q[2], answerRo: f.a[0], answerRu: f.a[1], answerEn: f.a[2], position: pos++ }
      });
    }
    console.log(`[seed] faq items: ${FAQ.length}`);
  }
  // intrebarile generale noi se adauga doar daca lipsesc (fara duplicate la update-uri)
  for (const f of FAQ_EXTRA) {
    const exists = await prisma.faqItem.findFirst({ where: { questionRo: f.q[0] } });
    if (!exists) {
      const maxPos = await prisma.faqItem.aggregate({ _max: { position: true } });
      await prisma.faqItem.create({
        data: { questionRo: f.q[0], questionRu: f.q[1], questionEn: f.q[2], answerRo: f.a[0], answerRu: f.a[1], answerEn: f.a[2], position: (maxPos._max.position ?? -1) + 1 }
      });
      console.log(`[seed] faq extra: ${f.q[0]}`);
    }
  }
  // banca quiz (50 intrebari) — la prima initializare tot, apoi se completeaza ce lipseste
  const { QUIZ: SEED_QUIZ, EXTRA_QUIZ: SEED_EXTRA, EXTRA2_QUIZ: SEED_EXTRA2 } = require('../src/lib/quiz');
  if ((await prisma.quizQuestion.count()) === 0) {
    let pos = 0;
    for (const q of [...SEED_QUIZ, ...SEED_EXTRA, ...SEED_EXTRA2]) {
      await prisma.quizQuestion.create({
        data: {
          qRo: q.q[0], qRu: q.q[1], qEn: q.q[2],
          options: JSON.stringify(q.o), correct: q.c, position: pos++
        }
      });
    }
    console.log('[seed] quiz questions: 50');
  } else {
    let added = 0;
    for (const q of [...SEED_QUIZ, ...SEED_EXTRA, ...SEED_EXTRA2]) {
      const exists = await prisma.quizQuestion.findFirst({ where: { qRo: q.q[0] } });
      if (!exists) {
        const maxPos = await prisma.quizQuestion.aggregate({ _max: { position: true } });
        await prisma.quizQuestion.create({
          data: {
            qRo: q.q[0], qRu: q.q[1], qEn: q.q[2],
            options: JSON.stringify(q.o), correct: q.c, position: (maxPos._max.position ?? -1) + 1
          }
        });
        added++;
      }
    }
    if (added) console.log(`[seed] quiz questions added: ${added}`);
  }
  const existing = await prisma.recipe.findUnique({ where: { slug: 'piure-de-morcov-diversificare' } });
  if (!existing) {
    const age = await prisma.ageGroup.findFirst();
    const feed = await prisma.feedingType.findFirst({ where: { slug: 'diversificare' } });
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const cat = await prisma.menuCategory.findFirst({ where: { slug: 'piureuri' } });
    await prisma.recipe.create({
      data: {
        slug: 'piure-de-morcov-diversificare',
        titleRo: 'Piure de morcov pentru diversificare', titleRu: 'Морковное пюре для прикорма', titleEn: 'Carrot puree for weaning',
        summaryRo: 'Rețetă simplă, perfectă pentru începutul diversificării (6+ luni).',
        summaryRu: 'Простой рецепт, идеальный для начала прикорма (6+ месяцев).',
        summaryEn: 'Simple recipe, perfect to start weaning (6+ months).',
        ingredientsRo: '2 morcovi medii\n200 ml apă', ingredientsRu: '2 средние моркови\n200 мл воды', ingredientsEn: '2 medium carrots\n200 ml water',
        stepsRo: 'Curăță și taie morcovii.\nFierbe 15 min.\nBlenduiește cu puțină apă.', stepsRu: 'Очистите и нарежьте морковь.\nВарите 15 мин.\nИзмельчите блендером.', stepsEn: 'Peel and chop carrots.\nBoil 15 min.\nBlend with a little water.',
        prepMinutes: 5, cookMinutes: 15, servings: 2, difficulty: 'usor', status: 'PUBLISHED',
        authorId: admin?.id, feedingTypeId: feed?.id,
        ageGroups: age ? { create: [{ ageGroupId: age.id }] } : undefined,
        categories: cat ? { create: [{ categoryId: cat.id }] } : undefined
      }
    });
  }
  console.log(`Seed OK: ${adminEmail} (+ moderator ${modEmail})`);
}

main().finally(() => prisma.$disconnect());
