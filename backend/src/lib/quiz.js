// Quiz cunostinte pentru cererea de Autor (trilingv).
// Daca raspunde corect din prima la toate -> aprobare automata (fara admin).
// Altfel cererea intra PENDING pentru analiza adminului.
const QUIZ = [
  {
    q: ['La ce vârstă se recomandă începerea diversificării?', 'В каком возрасте рекомендуют начинать прикорм?', 'At what age is starting solids recommended?'],
    o: [
      ['6 luni', '6 месяцев', '6 months'],
      ['3 luni', '3 месяца', '3 months'],
      ['12 luni', '12 месяцев', '12 months']
    ],
    c: 0
  },
  {
    q: ['Care aliment e potrivit printre primele?', 'Какой продукт подходит одним из первых?', 'Which food suits first tastes?'],
    o: [
      ['Morcov fiert', 'Варёная морковь', 'Boiled carrot'],
      ['Miere', 'Мёд', 'Honey'],
      ['Nuci întregi', 'Целые орехи', 'Whole nuts']
    ],
    c: 0
  },
  {
    q: ['Până când rămâne laptele alimentul de bază?', 'До каких пор молоко — основа питания?', 'How long does milk stay the staple food?'],
    o: [
      ['Până la 1 an', 'До года', 'Until age one'],
      ['Doar 3 luni', 'Только 3 месяца', 'Only 3 months'],
      ['Nu mai contează după diversificare', 'Не важно после прикорма', "Doesn't matter after solids"]
    ],
    c: 0
  },
  {
    q: ['Ce NU se oferă sub 1 an?', 'Что НЕ дают до года?', 'What is NOT given under age one?'],
    o: [
      ['Măr copt', 'Печёное яблоко', 'Baked apple'],
      ['Morcov fiert', 'Варёная морковь', 'Boiled carrot'],
      ['Miere', 'Мёд', 'Honey']
    ],
    c: 2
  },
  {
    q: ['Câte alimente noi odată, la început?', 'Сколько новых продуктов сразу вначале?', 'How many new foods at once at first?'],
    o: [
      ['Cinci odată', 'Пять сразу', 'Five at once'],
      ['Unul singur, treptat', 'Один, постепенно', 'One at a time, gradually'],
      ['Nu contează', 'Не важно', "Doesn't matter"]
    ],
    c: 1
  }
];

function pickQuiz(lang) {
  const L = lang === 'ru' ? 1 : lang === 'en' ? 2 : 0;
  const bank = [...QUIZ, ...EXTRA_QUIZ, ...EXTRA2_QUIZ];
  const idx = [...bank.keys()].sort(() => Math.random() - 0.5).slice(0, 5);
  return {
    questions: idx.map((qi) => ({
      qid: qi,
      q: bank[qi].q[L],
      options: bank[qi].o.map((o) => o[L])
    })),
    correct: idx.map((qi) => bank[qi].c)
  };
}

// 10 intrebari in plus (total 15 in banca) — trilingve, cu raspuns clar
const EXTRA_QUIZ = [
  {
    q: ['Cu ce textură începem?', 'С какой текстуры начинаем?', 'Which texture first?'],
    o: [['Piure fin', 'Нежное пюре', 'Smooth puree'], ['Bucăți mari', 'Крупные куски', 'Big chunks'], ['Mâncare de adulți', 'Взрослая еда', 'Adult food']],
    c: 0
  },
  {
    q: ['Cât de des oferim la început?', 'Как часто предлагаем вначале?', 'How often at first?'],
    o: [['O dată pe săptămână', 'Раз в неделю', 'Once a week'], ['Zilnic, cantități mici', 'Ежедневно, понемногу', 'Daily, small amounts'], ['Doar când plânge', 'Только когда плачет', 'Only when crying']],
    c: 1
  },
  {
    q: ['Semn că îi place mâncarea?', 'Признак, что еда нравится?', 'Sign baby likes the food?'],
    o: [['Plânge și întoarce capul', 'Плачет и отворачивается', 'Cries and turns away'], ['Doarme', 'Спит', 'Falls asleep'], ['Deschide gura, zâmbește', 'Открывает рот, улыбается', 'Opens mouth, smiles']],
    c: 2
  },
  {
    q: ['Uleiul de măsline în piure?', 'Оливковое масло в пюре?', 'Olive oil in puree?'],
    o: [['Puțin e în regulă', 'Немного — нормально', 'A little is fine'], ['Mult unt', 'Много масла', 'Lots of butter'], ['Fără grăsimi deloc', 'Без жиров вообще', 'No fats at all']],
    c: 0
  },
  {
    q: ['Ce bem odată cu diversificarea?', 'Что пьём с началом прикорма?', 'What to drink with solids?'],
    o: [['Suc de fructe', 'Фруктовый сок', 'Fruit juice'], ['Ceai îndulcit', 'Сладкий чай', 'Sweetened tea'], ['Apă', 'Вода', 'Water']],
    c: 2
  },
  {
    q: ['Ouăle în diversificare?', 'Яйца в прикорме?', 'Eggs in weaning?'],
    o: [['Interzise până la 3 ani', 'Запрещены до 3 лет', 'Banned until age 3'], ['Doar albuș crud', 'Только сырой белок', 'Only raw white'], ['Se introduc treptat', 'Вводятся постепенно', 'Introduced gradually']],
    c: 2
  },
  {
    q: ['Sarea în mâncarea bebelușului?', 'Соль в еде малыша?', 'Salt in baby food?'],
    o: [['Fără sare adăugată', 'Без добавленной соли', 'No added salt'], ['O linguriță', 'Чайная ложка', 'A teaspoon'], ['După gustul adultului', 'По вкусу взрослого', "Like adults'"]],
    c: 0
  },
  {
    q: ['Ce fructe la început?', 'Какие фрукты вначале?', 'Which fruits first?'],
    o: [['Doar exotice', 'Только экзотика', 'Only exotic'], ['Cu mult zahăr', 'С сахаром', 'With lots of sugar'], ['Măr, pară coapte', 'Печёные яблоко, груша', 'Baked apple, pear']],
    c: 2
  },
  {
    q: ['Când ajungem la 3 mese pe zi?', 'Когда дойдём до 3 приёмов в день?', 'When to reach 3 meals a day?'],
    o: [['Din prima zi', 'С первого дня', 'From day one'], ['Treptat, spre 9–12 luni', 'Постепенно, к 9–12 месяцам', 'Gradually, by 9–12 months'], ['Niciodată', 'Никогда', 'Never']],
    c: 1
  },
  {
    q: ['Refuză persistent un aliment?', 'Упорно отказывается от продукта?', 'Persistently refuses a food?'],
    o: [['Forțăm să mănânce', 'Заставляем есть', 'Force to eat'], ['Renunțăm definitiv', 'Отказываемся навсегда', 'Give up forever'], ['Propunem din nou peste zile', 'Предлагаем снова через дни', 'Offer again in a few days']],
    c: 2
  }
];

function pickQuiz(lang) {
  const L = lang === 'ru' ? 1 : lang === 'en' ? 2 : 0;
  const bank = [...QUIZ, ...EXTRA_QUIZ, ...EXTRA2_QUIZ];
  const idx = [...bank.keys()].sort(() => Math.random() - 0.5).slice(0, 5);
  return {
    questions: idx.map((qi) => ({
      qid: qi,
      q: bank[qi].q[L],
      options: bank[qi].o.map((o) => o[L])
    })),
    correct: idx.map((qi) => bank[qi].c)
  };
}

// Banca extinsa la 50 (35 intrebari noi) — trilingve, cu raspuns clar
const EXTRA2_QUIZ = [
  {
    q: ['Mierea este sigură sub 1 an?', 'Мёд безопасен до года?', 'Is honey safe under age one?'],
    o: [['Da, e naturală', 'Да, он натуральный', 'Yes, it is natural'], ['Doar puțină', 'Немного можно', 'Just a little'], ['Nu — risc de botulism', 'Нет — риск ботулизма', 'No — botulism risk']],
    c: 2
  },
  {
    q: ['Laptele de vacă ca băutură principală?', 'Коровье молоко как основной напиток?', 'Cow milk as the main drink?'],
    o: [['De la naștere', 'С рождения', 'From birth'], ['După 1 an', 'После года', 'After age one'], ['Niciodată', 'Никогда', 'Never']],
    c: 1
  },
  {
    q: ['De ce e important fierul după 6 luni?', 'Почему железо важно после 6 месяцев?', 'Why does iron matter after 6 months?'],
    o: [['Rezervele de la naștere scad', 'Запасы с рождения снижаются', 'Birth reserves run low'], ['Nu e important', 'Не важно', 'It is not important'], ['Doar pentru poftă', 'Только для аппетита', 'Only for appetite']],
    c: 0
  },
  {
    q: ['Surse bune de fier?', 'Хорошие источники железа?', 'Good iron sources?'],
    o: [['Dulciuri', 'Сладости', 'Sweets'], ['Carne, leguminoase, cereale îmbogățite', 'Мясо, бобовые, обогащённые каши', 'Meat, legumes, fortified cereals'], ['Doar laptele', 'Только молоко', 'Only milk']],
    c: 1
  },
  {
    q: ['Vitamina D în primul an?', 'Витамин D на первом году?', 'Vitamin D in the first year?'],
    o: [['Nu e necesară', 'Не нужен', 'Not needed'], ['Doar vara', 'Только летом', 'Only in summer'], ['Se suplimentează la recomandarea pediatrului', 'Добавляют по назначению педиатра', 'Supplemented as the pediatrician advises']],
    c: 2
  },
  {
    q: ['Nucile întregi la bebeluși?', 'Целые орехи малышам?', 'Whole nuts for babies?'],
    o: [['Sunt sigure oricând', 'Безопасны всегда', 'Safe anytime'], ['Doar sub formă de pastă/unt, din cauza înecului', 'Только в виде пасты из-за риска удушья', 'Only as paste/butter — choking risk'], ['Interzise până la 5 ani', 'Запрещены до 5 лет', 'Banned until age 5']],
    c: 1
  },
  {
    q: ['Peștele în diversificare?', 'Рыба в прикорме?', 'Fish in weaning?'],
    o: [['Se introduce treptat, bine gătit', 'Вводится постепенно, хорошо приготовленной', 'Introduced gradually, well cooked'], ['Niciodată până la 2 ani', 'Никак до 2 лет', 'Never before age two'], ['Doar crud', 'Только сырая', 'Only raw']],
    c: 0
  },
  {
    q: ['Ouăle: cât de des?', 'Яйца: как часто?', 'Eggs: how often?'],
    o: [['Zilnic obligatoriu', 'Ежедневно обязательно', 'Daily, mandatory'], ['De câteva ori pe săptămână, în rotație', 'Несколько раз в неделю, по очереди', 'A few times a week, in rotation'], ['O dată pe lună', 'Раз в месяц', 'Once a month']],
    c: 1
  },
  {
    q: ['Iaurtul și brânzica?', 'Йогурт и творожок?', 'Yogurt and soft cheese?'],
    o: [['Potrivite după 6–8 luni, simple, fără zahăr', 'Подходят после 6–8 месяцев, простые, без сахара', 'Fine after 6–8 months, plain, no sugar'], ['Interzise până la 3 ani', 'Запрещены до 3 лет', 'Banned until age 3'], ['Doar cu arome', 'Только с ароматизаторами', 'Only flavoured ones']],
    c: 0
  },
  {
    q: ['Leguminoasele (linte, năut)?', 'Бобовые (чечевица, нут)?', 'Legumes (lentils, chickpeas)?'],
    o: [['De evitat complet', 'Избегать полностью', 'Avoid completely'], ['Bune: proteine și fibre, bine fierte și pasate', 'Хороши: белок и клетчатка, варить и пюрировать', 'Good: protein and fibre, well cooked and mashed'], ['Doar din conservă cu sare', 'Только консервы с солью', 'Only salty canned ones']],
    c: 1
  },
  {
    q: ['Glutenul trebuie amânat mult?', 'Глютен нужно откладывать надолго?', 'Should gluten be delayed a lot?'],
    o: [['Da, după 2 ani', 'Да, после 2 лет', 'Yes, after age two'], ['Nu — se introduce în diversificare, ca orice aliment', 'Нет — вводится в прикорм, как любой продукт', 'No — introduced during weaning like any food'], ['Niciodată', 'Никогда', 'Never']],
    c: 1
  },
  {
    q: ['Temperatura mâncării?', 'Температура еды?', 'Food temperature?'],
    o: [['Fierbinte, ca să fie sigură', 'Горячая, так безопаснее', 'Hot, to be safe'], ['Călduță, testată pe încheietură', 'Тёплая, проверенная на запястье', 'Lukewarm, wrist-tested'], ['Rece de la frigider', 'Холодная из холодильника', 'Straight from the fridge']],
    c: 1
  },
  {
    q: ['Reîncălzirea mâncării?', 'Разогрев еды?', 'Reheating food?'],
    o: [['De câte ori vrei', 'Сколько угодно', 'As many times as you like'], ['O singură dată, apoi se aruncă restul', 'Один раз, остаток выбрасывается', 'Once, then leftovers are tossed'], ['Nu se reîncălzește nimic', 'Ничего не разогревать', 'Never reheat anything']],
    c: 1
  },
  {
    q: ['Congelarea porțiilor?', 'Заморозка порций?', 'Freezing portions?'],
    o: [['E practică: porții mici, etichetate cu data', 'Практично: маленькие порции с датой', 'Practical: small dated portions'], ['Distruge toți nutrienții', 'Уничтожает все нутриенты', 'Destroys all nutrients'], ['Interzisă la bebeluși', 'Запрещена малышам', 'Forbidden for babies']],
    c: 0
  },
  {
    q: ['Sucurile de fructe?', 'Фруктовые соки?', 'Fruit juices?'],
    o: [['Recomandate zilnic', 'Рекомендуются ежедневно', 'Recommended daily'], ['Apa e băutura potrivită; sucul nu e necesar', 'Подходит вода; сок не нужен', 'Water fits best; juice is unnecessary'], ['Doar din comerț', 'Только магазинные', 'Only store-bought']],
    c: 1
  },
  {
    q: ['Biberonul cu lapte noaptea după 1 an?', 'Бутылочка с молоком ночью после года?', 'Night milk bottle after age one?'],
    o: [['E ideal pentru dinți', 'Идеально для зубов', 'Great for teeth'], ['Se renunță treptat, protejează dinții', 'Убирается постепенно, бережёт зубы', 'Phased out gradually, protects teeth'], ['Se dublează porția', 'Порция удваивается', 'Double the portion']],
    c: 1
  },
  {
    q: ['Cana în locul biberonului?', 'Чашка вместо бутылочки?', 'Cup instead of bottle?'],
    o: [['De la 6 luni se exersează cana', 'С 6 месяцев осваивают чашку', 'Practice with a cup from 6 months'], ['Biberonul până la 4 ani', 'Бутылочка до 4 лет', 'Bottle until age 4'], ['Direct pahar de adult', 'Сразу взрослый стакан', 'Straight adult glass']],
    c: 0
  },
  {
    q: ['Condimentele ușoare (chimen, scorțișoară)?', 'Мягкие специи (тмин, корица)?', 'Mild spices (cumin, cinnamon)?'],
    o: [['Interzise complet', 'Полностью запрещены', 'Fully banned'], ['Puțin, pentru gust — acceptabil', 'Немного для вкуса — допустимо', 'A little for taste is fine'], ['Doar iute', 'Только острое', 'Only hot ones']],
    c: 1
  },
  {
    q: ['Uleiul în mâncare?', 'Масло в еде?', 'Oil in food?'],
    o: [['O linguriță de ulei bun e utilă', 'Ложечка хорошего масла полезна', 'A teaspoon of good oil helps'], ['Zero grăsimi', 'Ноль жиров', 'Zero fats'], ['Prăjeli multe', 'Много жареного', 'Lots of frying']],
    c: 0
  },
  {
    q: ['Cerealele integrale?', 'Цельные крупы?', 'Whole grains?'],
    o: [['Prea grele pentru bebeluși', 'Слишком тяжелы малышам', 'Too heavy for babies'], ['Bune: ovăz, hrișcă, orez brun', 'Хороши: овёс, гречка, бурый рис', 'Good: oats, buckwheat, brown rice'], ['Doar albe, rafinate', 'Только белые, рафинированные', 'Only white, refined ones']],
    c: 1
  },
  {
    q: ['Fructele întregi tari (măr crud)?', 'Твёрдые фрукты целиком (сырое яблоко)?', 'Hard whole fruits (raw apple)?'],
    o: [['Bune de ronțăit oricum', 'Хороши как есть', 'Fine to gnaw anyway'], ['Rase sau coapte, din cauza înecului', 'Тёртые или печёные — риск удушья', 'Grated or baked — choking risk'], ['Interzise până la școală', 'Запрещены до школы', 'Banned until school']],
    c: 1
  },
  {
    q: ['Semnele unei alergii?', 'Признаки аллергии?', 'Signs of an allergy?'],
    o: [['Doar pofta mai mare', 'Только больший аппетит', 'Just bigger appetite'], ['Erupție, umflături, vărsături, respirație grea', 'Сыпь, отёки, рвота, тяжёлое дыхание', 'Rash, swelling, vomiting, hard breathing'], ['Somn mai lung', 'Более долгий сон', 'Longer naps']],
    c: 1
  },
  {
    q: ['La înec: ce NU faci?', 'При удушье: чего НЕ делать?', 'If choking: what NOT to do?'],
    o: [['Suni la urgențe dacă nu trece', 'Звонишь в скорую, если не проходит', 'Call emergency if it persists'], ['Bagi degetele orbește pe gât', 'Лезешь пальцами в горло вслепую', 'Blindly sweep fingers in throat'], ['Ajuți copilul să tușească', 'Помогаешь кашлять', 'Help the child cough']],
    c: 1
  },
  {
    q: ['Ecranele la masă?', 'Экраны за едой?', 'Screens at meals?'],
    o: [['Ajută să mănânce mai mult', 'Помогают съесть больше', 'Help them eat more'], ['Distrag și strică semnalele de sațietate', 'Отвлекают и ломают сигналы сытости', 'Distract and break fullness cues'], ['Obligatorii', 'Обязательны', 'Mandatory']],
    c: 1
  },
  {
    q: ['Forțatul să termine farfuria?', 'Заставлять доедать?', 'Forcing a clean plate?'],
    o: [['Da, altfel nu crește', 'Да, иначе не вырастет', 'Yes, or they won\u2019t grow'], ['Nu — respectăm sațietatea', 'Нет — уважаем сытость', 'No — respect fullness'], ['Doar la cină', 'Только за ужином', 'Only at dinner']],
    c: 1
  },
  {
    q: ['Dulcele ca recompensă?', 'Сладкое как награда?', 'Sweets as a reward?'],
    o: [['O strategie bună', 'Хорошая стратегия', 'A good strategy'], ['Creează relație nesănătoasă cu mâncarea', 'Создаёт нездоровые отношения с едой', 'Builds an unhealthy food relationship'], ['Doar de sărbători contează', 'Важно только по праздникам', 'Only matters on holidays']],
    c: 1
  },
  {
    q: ['Masa în familie?', 'Еда всей семьёй?', 'Family meals?'],
    o: [['Copilul mănâncă separat mereu', 'Ребёнок всегда ест отдельно', 'Child always eats separately'], ['Mâncatul împreună îl învață obiceiuri bune', 'Совместная еда учит хорошим привычкам', 'Eating together teaches good habits'], ['Doar de weekend', 'Только по выходным', 'Only on weekends']],
    c: 1
  },
  {
    q: ['Piureurile din comerț?', 'Магазинные пюре?', 'Store-bought purees?'],
    o: [['Citești eticheta: fără zahăr/sare adăugate', 'Читаешь этикетку: без сахара и соли', 'Read the label: no added sugar/salt'], ['Orice borcan e perfect', 'Любая баночка идеальна', 'Any jar is perfect'], ['Interzise total', 'Полностью запрещены', 'Totally banned']],
    c: 0
  },
  {
    q: ['Când sari peste o masă?', 'Когда пропускать приём пищи?', 'When to skip a meal?'],
    o: [['Niciodată, program fix', 'Никогда, строгий режим', 'Never, strict schedule'], ['Dacă nu îi e foame — se compensează la următoarea', 'Если не голоден — наверстает в следующий раз', 'If not hungry — balances out next time'], ['Dacă plânge', 'Если плачет', 'If crying']],
    c: 1
  },
  {
    q: ['Gustările dintre mese?', 'Перекусы между едой?', 'Snacks between meals?'],
    o: [['Cât mai multe, non-stop', 'Как можно больше, без перерыва', 'As many as possible, nonstop'], ['1–2 gustări planificate, simple', '1–2 запланированных простых перекуса', '1–2 planned simple snacks'], ['Deloc până la 3 ani', 'Никаких до 3 лет', 'None until age three']],
    c: 1
  },
  {
    q: ['Textura la 8–10 luni?', 'Текстура в 8–10 месяцев?', 'Texture at 8–10 months?'],
    o: [['Doar piure fin', 'Только нежное пюре', 'Only smooth puree'], ['Piure cu bucățele moi + finger food', 'Пюре с мягкими кусочками + еда руками', 'Mashed with soft lumps + finger food'], ['Mâncare de adult', 'Взрослая еда', 'Adult food']],
    c: 1
  },
  {
    q: ['Auto-hrănirea face mizerie. E normal?', 'Самостоятельная еда — грязно. Это нормально?', 'Self-feeding is messy. Normal?'],
    o: [['Nu, oprește-o', 'Нет, прекрати', 'No, stop it'], ['Da — face parte din învățare', 'Да — часть обучения', 'Yes — part of learning'], ['Doar afară din casă', 'Только вне дома', 'Only outside home']],
    c: 1
  },
  {
    q: ['Când mergi la pediatru cu diversificarea?', 'Когда к педиатру с прикормом?', 'When to see the pediatrician about weaning?'],
    o: [['Doar la 3 ani', 'Только в 3 года', 'Only at age three'], ['La controalele de rutină + la orice îngrijorare', 'На плановых осмотрах + при беспокойстве', 'At routine checkups + with any concern'], ['Niciodată', 'Никогда', 'Never']],
    c: 1
  },
  {
    q: ['Prematurii și diversificarea?', 'Недоношенные и прикорм?', 'Preemies and solids?'],
    o: [['După vârsta corectată, cu pediatrul', 'По скорректированному возрасту, с педиатром', 'By corrected age, with the pediatrician'], ['Ca toți ceilalți, fix', 'Как все, строго', 'Exactly like everyone else'], ['De la 1 an', 'С года', 'From age one']],
    c: 0
  },
  {
    q: ['Carnea de la început?', 'Мясо с начала?', 'Meat from the start?'],
    o: [['Bună sursă de fier și zinc, bine gătită și tocată', 'Хороший источник железа и цинка, варить и измельчать', 'Good iron and zinc source, cooked and minced'], ['Doar după 2 ani', 'Только после 2 лет', 'Only after age two'], ['Crudă e mai nutritivă', 'Сырое питательнее', 'Raw is more nutritious']],
    c: 0
  }
];

module.exports = { QUIZ, EXTRA_QUIZ, EXTRA2_QUIZ, pickQuiz };
