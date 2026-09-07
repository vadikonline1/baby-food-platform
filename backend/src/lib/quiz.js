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

module.exports = { QUIZ, pickQuiz };
