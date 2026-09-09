// Liste canonice de taxonomii (TRILINGV) — folosite de seed la fiecare deploy:
// - creeaza ce lipseste, ACTUALIZEAZA numele/iconitele existente,
// - migreaza legaturile vechi de varsta (intervale) spre praguri "Potrivit de la",
// - sterge intrarile necanonice DOAR daca nu au retete legate (altfel le pastreaza + log).
const AGES = [
  { minMonths: 4, maxMonths: 1200, labelRo: '4 luni+', labelRu: '4+ месяцев', labelEn: '4+ months' },
  { minMonths: 6, maxMonths: 1200, labelRo: '6 luni+', labelRu: '6+ месяцев', labelEn: '6+ months' },
  { minMonths: 8, maxMonths: 1200, labelRo: '8 luni+', labelRu: '8+ месяцев', labelEn: '8+ months' },
  { minMonths: 10, maxMonths: 1200, labelRo: '10 luni+', labelRu: '10+ месяцев', labelEn: '10+ months' },
  { minMonths: 12, maxMonths: 1200, labelRo: '12 luni+', labelRu: '12+ месяцев', labelEn: '12+ months' },
  { minMonths: 18, maxMonths: 1200, labelRo: '18 luni+', labelRu: '18+ месяцев', labelEn: '18+ months' },
  { minMonths: 24, maxMonths: 1200, labelRo: '2 ani+', labelRu: '2+ года', labelEn: '2+ years' },
  { minMonths: 36, maxMonths: 1200, labelRo: '3 ani+', labelRu: '3+ года', labelEn: '3+ years' },
  { minMonths: 48, maxMonths: 1200, labelRo: '4 ani+', labelRu: '4+ лет', labelEn: '4+ years' }
];

// Tipuri de masa — "Cand se serveste?"
const FEEDINGS = [
  { slug: 'mic-dejun', nameRo: 'Mic dejun', nameRu: 'Завтрак', nameEn: 'Breakfast' },
  { slug: 'gustare', nameRo: 'Gustare', nameRu: 'Перекус', nameEn: 'Snack' },
  { slug: 'pranz', nameRo: 'Prânz', nameRu: 'Обед', nameEn: 'Lunch' },
  { slug: 'cina', nameRo: 'Cină', nameRu: 'Ужин', nameEn: 'Dinner' },
  { slug: 'gustare-dimineata', nameRo: 'Gustare de dimineață', nameRu: 'Утренний перекус', nameEn: 'Morning snack' },
  { slug: 'gustare-dupa-amiaza', nameRo: 'Gustare de după-amiază', nameRu: 'Дневной перекус', nameEn: 'Afternoon snack' }
];

// Categorii meniu — "Ce fel de preparat este?"
const CATS = [
  { slug: 'blw', nameRo: 'BLW / Finger food', nameRu: 'BLW / Еда кусочками', nameEn: 'BLW / Finger food', icon: '🥕' },
  { slug: 'piureuri', nameRo: 'Piureuri', nameRu: 'Пюре', nameEn: 'Purees', icon: '🥣' },
  { slug: 'supe', nameRo: 'Supe și ciorbe', nameRu: 'Супы', nameEn: 'Soups', icon: '🍲' },
  { slug: 'fel-principal', nameRo: 'Fel principal', nameRu: 'Основные блюда', nameEn: 'Main dishes', icon: '🍽️' },
  { slug: 'garnituri', nameRo: 'Garnituri', nameRu: 'Гарниры', nameEn: 'Side dishes', icon: '🍚' },
  { slug: 'clatite-pancakes', nameRo: 'Clătite & pancakes', nameRu: 'Блины и панкейки', nameEn: 'Crepes & pancakes', icon: '🥞' },
  { slug: 'briose-mini-tarte', nameRo: 'Brioșe & mini tarte', nameRu: 'Маффины и мини-тарты', nameEn: 'Muffins & mini tarts', icon: '🧁' },
  { slug: 'biscuiti-fursecuri', nameRo: 'Biscuiți & fursecuri pentru bebeluși', nameRu: 'Детское печенье', nameEn: 'Baby biscuits & cookies', icon: '🍪' },
  { slug: 'desert', nameRo: 'Deserturi', nameRu: 'Десерты', nameEn: 'Desserts', icon: '🍎' },
  { slug: 'salate', nameRo: 'Salate', nameRu: 'Салаты', nameEn: 'Salads', icon: '🥗' },
  { slug: 'sandvisuri-tartine', nameRo: 'Sandvișuri & tartine', nameRu: 'Сэндвичи и тартины', nameEn: 'Sandwiches & tartines', icon: '🥪' },
  { slug: 'smoothie-uri', nameRo: 'Smoothie-uri', nameRu: 'Смузи', nameEn: 'Smoothies', icon: '🥤' },
  { slug: 'terciuri-budinci', nameRo: 'Terciuri & budinci', nameRu: 'Каши и пудинги', nameEn: 'Porridges & puddings', icon: '🥣' },
  { slug: 'chiftelute-crochete', nameRo: 'Chifteluțe & crochete', nameRu: 'Котлетки и крокеты', nameEn: 'Meatballs & croquettes', icon: '🧆' },
  { slug: 'paste', nameRo: 'Paste & preparate cu paste', nameRu: 'Паста и блюда с пастой', nameEn: 'Pasta & pasta dishes', icon: '🍝' }
];

const RESTR = [
  { slug: 'fara-gluten', nameRo: '🚫 Fără gluten', nameRu: '🚫 Без глютена', nameEn: '🚫 Gluten-free' },
  { slug: 'fara-lactoza', nameRo: '🥛 Fără lactoză', nameRu: '🥛 Без лактозы', nameEn: '🥛 Lactose-free' },
  { slug: 'fara-ou', nameRo: '🥚 Fără ou', nameRu: '🥚 Без яиц', nameEn: '🥚 Egg-free' },
  { slug: 'fara-lactate', nameRo: '🥛 Fără lactate', nameRu: '🥛 Без молочных продуктов', nameEn: '🥛 Dairy-free' },
  { slug: 'vegetarian', nameRo: '🌱 Vegetarian', nameRu: '🌱 Вегетарианское', nameEn: '🌱 Vegetarian' },
  { slug: 'vegan', nameRo: '🌱 Vegan', nameRu: '🌱 Веганское', nameEn: '🌱 Vegan' },
  { slug: 'fara-arahide', nameRo: '🥜 Fără arahide', nameRu: '🥜 Без арахиса', nameEn: '🥜 Peanut-free' },
  { slug: 'fara-nuci', nameRo: '🌰 Fără nuci', nameRu: '🌰 Без орехов', nameEn: '🌰 Nut-free' },
  { slug: 'fara-peste', nameRo: '🐟 Fără pește', nameRu: '🐟 Без рыбы', nameEn: '🐟 Fish-free' },
  { slug: 'fara-crustacee', nameRo: '🦐 Fără crustacee / fructe de mare', nameRu: '🦐 Без морепродуктов', nameEn: '🦐 Shellfish-free' },
  { slug: 'fara-grau', nameRo: '🌾 Fără grâu', nameRu: '🌾 Без пшеницы', nameEn: '🌾 Wheat-free' },
  { slug: 'fara-soia', nameRo: '🫘 Fără soia', nameRu: '🫘 Без сои', nameEn: '🫘 Soy-free' }
];

const CHARS = [
  { slug: 'bogat-in-fier', nameRo: '💪 Bogat în fier', nameRu: '💪 Богато железом', nameEn: '💪 Iron-rich' },
  { slug: 'bogat-omega3', nameRo: '🧠 Bogat în omega-3', nameRu: '🧠 Богато омега-3', nameEn: '🧠 Omega-3 rich' },
  { slug: 'bogat-fibre', nameRo: '🥬 Bogat în fibre', nameRu: '🥬 Богато клетчаткой', nameEn: '🥬 Fiber-rich' },
  { slug: 'bogat-proteine', nameRo: '🍗 Bogat în proteine', nameRu: '🍗 Богато белком', nameEn: '🍗 Protein-rich' },
  { slug: 'sursa-calciu', nameRo: '🦴 Sursă de calciu', nameRu: '🦴 Источник кальция', nameEn: '🦴 Calcium source' },
  { slug: 'bogat-vitamina-c', nameRo: '🍊 Bogat în vitamina C', nameRu: '🍊 Богато витамином C', nameEn: '🍊 Vitamin C rich' },
  { slug: 'grasimi-sanatoase', nameRo: '🥑 Bogat în grăsimi sănătoase', nameRu: '🥑 Полезные жиры', nameEn: '🥑 Healthy fats' },
  { slug: 'fara-zahar', nameRo: '🚫 Fără zahăr adăugat', nameRu: '🚫 Без добавленного сахара', nameEn: '🚫 No added sugar' },
  { slug: 'fara-sare', nameRo: '🧂 Fără sare adăugată', nameRu: '🧂 Без добавленной соли', nameEn: '🧂 No added salt' },
  { slug: 'bogat-legume', nameRo: '🌱 Bogat în legume', nameRu: '🌱 Много овощей', nameEn: '🌱 Veggie-rich' },
  { slug: 'rapid-20min', nameRo: '⚡ Gata în 20 min', nameRu: '⚡ Готово за 20 мин', nameEn: '⚡ Ready in 20 min' },
  { slug: 'rapid-30min', nameRo: '⚡ Gata în 30 min', nameRu: '⚡ Готово за 30 мин', nameEn: '⚡ Ready in 30 min' },
  { slug: 'congelabil', nameRo: '❄️ Se poate congela', nameRu: '❄️ Можно замораживать', nameEn: '❄️ Freezable' },
  { slug: 'preparat-in-avans', nameRo: '🔥 Se poate prepara în avans', nameRu: '🔥 Можно готовить заранее', nameEn: '🔥 Make-ahead' },
  { slug: 'potrivit-pachet', nameRo: '🍱 Potrivită pentru pachet', nameRu: '🍱 Подходит для ланч-бокса', nameEn: '🍱 Lunchbox-friendly' },
  { slug: 'potrivita-familie', nameRo: '👨‍👩‍👧 Potrivită pentru întreaga familie', nameRu: '👨‍👩‍👧 Для всей семьи', nameEn: '👨‍👩‍👧 Family-friendly' },
  { slug: 'usor-de-preparat', nameRo: '🥄 Ușor de preparat', nameRu: '🥄 Легко готовить', nameEn: '🥄 Easy to make' },
  { slug: 'buget-redus', nameRo: '💰 Buget redus', nameRu: '💰 Бюджетно', nameEn: '💰 Budget-friendly' },
  { slug: 'putine-ingrediente', nameRo: '🛒 Puține ingrediente', nameRu: '🛒 Мало ингредиентов', nameEn: '🛒 Few ingredients' },
  { slug: 'potrivit-blw', nameRo: '🤲 Potrivit pentru BLW', nameRu: '🤲 Подходит для BLW', nameEn: '🤲 BLW-friendly' },
  { slug: 'potrivit-incepatori', nameRo: '🦷 Potrivit pentru începători', nameRu: '🦷 Для новичков', nameEn: '🦷 Beginner-friendly' },
  { slug: 'textura-moale', nameRo: '👅 Textură moale', nameRu: '👅 Мягкая текстура', nameEn: '👅 Soft texture' },
  { slug: 'usor-de-tinut', nameRo: '✋ Ușor de ținut în mână', nameRu: '✋ Удобно держать', nameEn: '✋ Easy to hold' },
  { slug: 'auto-hranire', nameRo: '🥄 Potrivit pentru auto-hrănire', nameRu: '🥄 Для самостоятельной еды', nameEn: '🥄 Self-feeding friendly' },
  { slug: 'introduce-alimente-noi', nameRo: '🌈 Introduce alimente noi', nameRu: '🌈 Знакомит с новыми продуктами', nameEn: '🌈 Introduces new foods' }
];

module.exports = { AGES, FEEDINGS, CATS, RESTR, CHARS };
