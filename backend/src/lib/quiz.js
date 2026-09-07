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
  const idx = [...QUIZ.keys()].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    questions: idx.map((qi) => ({
      qid: qi,
      q: QUIZ[qi].q[L],
      options: QUIZ[qi].o.map((o) => o[L])
    })),
    correct: idx.map((qi) => QUIZ[qi].c)
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

module.exports = { QUIZ, EXTRA_QUIZ, pickQuiz };
