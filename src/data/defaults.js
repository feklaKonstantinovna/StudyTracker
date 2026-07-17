export const DEF_SCHED = [
  {id:'b1',time:'12:00',dur:90,icon:'📖',cls:'ic-qa',title:'QA Bible — Теория',sub:'Глубокое чтение + конспект',isBreak:false,pomo:'3×25 мин + 5 мин перерыв',
   tasks:[{id:'b1t1',text:'Открыть QA Bible',link:'https://vladislaveremeev.gitbook.io/qa_bible/',anki:false,comment:''},{id:'b1t2',text:'Прочитать текущую тему',anki:false,comment:''},{id:'b1t3',text:'Составить 5–10 Anki-карточек',anki:true,comment:''},{id:'b1t4',text:'Выписать ключевые термины',anki:false,comment:''}]},
  {id:'b2',time:'13:30',dur:15,icon:'☕',cls:'ic-break',title:'Перерыв',sub:'Встать, подышать',isBreak:true,pomo:'',
   tasks:[{id:'b2t1',text:'Встать от экрана',anki:false,comment:''}]},
  {id:'b3',time:'13:45',dur:90,icon:'🗄️',cls:'ic-sql',title:'SQL — Практика',sub:'sql-academy.org',isBreak:false,pomo:'3×25 мин + 5 мин',
   tasks:[{id:'b3t1',text:'Открыть sql-academy.org',link:'https://sql-academy.org',anki:false,comment:''},{id:'b3t2',text:'Решить 5–8 задач',anki:false,comment:''},{id:'b3t3',text:'Anki-карточки по операторам',anki:true,comment:''}]},
  {id:'b4',time:'15:15',dur:45,icon:'🍽️',cls:'ic-break',title:'Обед',sub:'Без экрана',isBreak:true,pomo:'',
   tasks:[{id:'b4t1',text:'Поесть без телефона',anki:false,comment:''}]},
  {id:'b5',time:'16:00',dur:60,icon:'🔁',cls:'ic-anki',title:'Anki — Повторение',sub:'Все колоды',isBreak:false,pomo:'2×25 мин',
   tasks:[{id:'b5t1',text:'QA Bible колода',anki:true,comment:''},{id:'b5t2',text:'SQL колода',anki:true,comment:''},{id:'b5t3',text:'English колода',anki:true,comment:''}]},
  {id:'b6',time:'17:15',dur:90,icon:'🇬🇧',cls:'ic-eng',title:'Английский',sub:'Учебник + упражнения',isBreak:false,pomo:'3×25 мин + 5 мин',
   tasks:[{id:'b6t1',text:'Прочитать 1–2 страницы',anki:false,comment:''},{id:'b6t2',text:'Выполнить упражнения',anki:false,comment:''},{id:'b6t3',text:'Новые слова в Anki',anki:true,comment:''}]},
  {id:'b7',time:'19:00',dur:60,icon:'📖',cls:'ic-qa',title:'QA Bible — Блок 2',sub:'Второй подход',isBreak:false,pomo:'2×25 мин',
   tasks:[{id:'b7t1',text:'Разобрать непонятные темы',anki:false,comment:''},{id:'b7t2',text:'Дополнить Anki',anki:true,comment:''}]},
  {id:'b8',time:'20:00',dur:30,icon:'📝',cls:'ic-anki',title:'Итоги дня',sub:'Записать, проанализировать',isBreak:false,pomo:'',
   tasks:[{id:'b8t1',text:'3 вещи что усвоила',anki:false,comment:''},{id:'b8t2',text:'Что осталось непонятным',anki:false,comment:''},{id:'b8t3',text:'План на завтра',anki:false,comment:''}]},
];

export const DEF_WEEKEND = [
  {id:'w1',time:'12:00',dur:90,icon:'🔁',cls:'ic-anki',title:'Anki — Большое повторение',sub:'Все колоды',isBreak:false,pomo:'3×25 мин',
   tasks:[{id:'w1t1',text:'QA Bible',anki:true,comment:''},{id:'w1t2',text:'SQL',anki:true,comment:''},{id:'w1t3',text:'English',anki:true,comment:''}]},
  {id:'w2',time:'13:30',dur:30,icon:'📖',cls:'ic-qa',title:'Лёгкое чтение',sub:'QA или English',isBreak:false,pomo:'',
   tasks:[{id:'w2t1',text:'Прочитать 1 статью',anki:false,comment:''}]},
  {id:'w3',time:'14:00',dur:30,icon:'📝',cls:'ic-anki',title:'Итоги недели',sub:'Что усвоено',isBreak:false,pomo:'',
   tasks:[{id:'w3t1',text:'3 главных темы недели',anki:false,comment:''},{id:'w3t2',text:'План следующей недели',anki:false,comment:''}]},
];

export const TOPIC_COLORS = [
  '#7c6ff7','#22d3ee','#4ade80','#f472b6','#fbbf24','#f87171','#a78bfa','#34d399'
];
