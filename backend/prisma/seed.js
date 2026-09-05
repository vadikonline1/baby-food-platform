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

  // varste (idempotent)
  const ageCount = await prisma.ageGroup.count();
  if (ageCount === 0) {
    const ages = [
    { minMonths: 6, maxMonths: 8, labelRo: '6–8 luni', labelRu: '6–8 месяцев', labelEn: '6–8 months' },
    { minMonths: 8, maxMonths: 12, labelRo: '8–12 luni', labelRu: '8–12 месяцев', labelEn: '8–12 months' },
    { minMonths: 12, maxMonths: 24, labelRo: '1–2 ani', labelRu: '1–2 года', labelEn: '1–2 years' },
    { minMonths: 24, maxMonths: 48, labelRo: '2–4 ani', labelRu: '2–4 года', labelEn: '2–4 years' }
  ];
  for (const a of ages) await prisma.ageGroup.create({ data: a });
  }

  // tipuri alimentare
  const feedings = [
    { slug: 'diversificare', nameRo: 'Diversificare', nameRu: 'Прикорм', nameEn: 'Weaning' },
    { slug: 'mic-dejun', nameRo: 'Mic dejun', nameRu: 'Завтрак', nameEn: 'Breakfast' },
    { slug: 'pranz', nameRo: 'Prânz', nameRu: 'Обед', nameEn: 'Lunch' },
    { slug: 'gustare', nameRo: 'Gustare', nameRu: 'Перекус', nameEn: 'Snack' },
    { slug: 'cina', nameRo: 'Cină', nameRu: 'Ужин', nameEn: 'Dinner' }
  ];
  for (const f of feedings) await prisma.feedingType.upsert({ where: { slug: f.slug }, update: {}, create: f });

  // categorii meniu
  const cats = [
    { slug: 'piureuri', nameRo: 'Piureuri', nameRu: 'Пюре', nameEn: 'Purees', icon: '🥣' },
    { slug: 'supe', nameRo: 'Supe', nameRu: 'Супы', nameEn: 'Soups', icon: '🍲' },
    { slug: 'fel-principal', nameRo: 'Fel principal', nameRu: 'Основное', nameEn: 'Main dish', icon: '🍽️' },
    { slug: 'desert', nameRo: 'Deserturi', nameRu: 'Десерты', nameEn: 'Desserts', icon: '🍎' },
    { slug: 'blw', nameRo: 'BLW / Finger food', nameRu: 'BLW / Кусочки', nameEn: 'BLW / Finger food', icon: '🥕' }
  ];
  for (const c of cats) await prisma.menuCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });

  // restrictii
  const restr = [
    { slug: 'fara-gluten', nameRo: 'Fără gluten', nameRu: 'Без глютена', nameEn: 'Gluten-free' },
    { slug: 'fara-lactoza', nameRo: 'Fără lactoză', nameRu: 'Без лактозы', nameEn: 'Lactose-free' },
    { slug: 'fara-ou', nameRo: 'Fără ou', nameRu: 'Без яиц', nameEn: 'Egg-free' },
    { slug: 'vegetarian', nameRo: 'Vegetarian', nameRu: 'Вегетарианское', nameEn: 'Vegetarian' }
  ];
  for (const r of restr) await prisma.dietaryRestriction.upsert({ where: { slug: r.slug }, update: {}, create: r });

  // caracteristici
  const chars = [
    { slug: 'bogat-in-fier', nameRo: 'Bogat în fier', nameRu: 'Богато железом', nameEn: 'Iron-rich' },
    { slug: 'fara-zahar', nameRo: 'Fără zahăr adăugat', nameRu: 'Без добавленного сахара', nameEn: 'No added sugar' },
    { slug: 'rapid-20min', nameRo: 'Gata în 20 min', nameRu: 'Готово за 20 мин', nameEn: 'Ready in 20 min' },
    { slug: 'congelabil', nameRo: 'Se poate congela', nameRu: 'Можно замораживать', nameEn: 'Freezable' }
  ];
  for (const c of chars) await prisma.characteristic.upsert({ where: { slug: c.slug }, update: {}, create: c });

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
  const defaults = {
    admob_android_banner: '', admob_android_rewarded_interstitial: '', admob_android_rewarded: '',
    admob_ios_banner: '', admob_ios_rewarded_interstitial: '', admob_ios_rewarded: '',
    support_enabled: 'true',
    support_title_ro: 'Susține proiectul GustBebe', support_title_ru: 'Поддержите проект GustBebe', support_title_en: 'Support the GustBebe project',
    support_text_ro: 'Urmărește o reclamă și ne ajuți să adăugăm rețete noi în fiecare săptămână.',
    support_text_ru: 'Посмотрите рекламу и помогите нам добавлять новые рецепты каждую неделю.',
    support_text_en: 'Watch an ad and help us add new recipes every week.'
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.appSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // reteta demo
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
