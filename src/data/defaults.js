export const DEF_SCHED = [];
export const DEF_WEEKEND = [];

export const DEMO_SCHED = [
  {id:'demo1',time:'10:00',dur:50,icon:'📚',cls:'ic-qa',title:'Учёба',sub:'Один сосредоточенный блок',isBreak:false,pomo:'2×25 мин',tasks:[]},
  {id:'demo2',time:'10:50',dur:15,icon:'☕',cls:'ic-break',title:'Перерыв',sub:'Встать и отдохнуть',isBreak:true,pomo:'',tasks:[]},
  {id:'demo3',time:'11:05',dur:50,icon:'✍️',cls:'ic-eng',title:'Практика',sub:'Задачи или упражнения',isBreak:false,pomo:'2×25 мин',tasks:[]},
];

export const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-qa', builtin: true, name: 'QA-день',
    blocks: [
      {time:'10:00',dur:50,icon:'🧪',cls:'ic-qa',title:'Теория QA',sub:'Конспект или урок',isBreak:false,pomo:'2×25 мин',tasks:[{text:'Прочитать тему',anki:false}]},
      {time:'10:50',dur:10,icon:'☕',cls:'ic-break',title:'Перерыв',sub:'Встать',isBreak:true,pomo:'',tasks:[]},
      {time:'11:00',dur:50,icon:'🐛',cls:'ic-sql',title:'Практика багов',sub:'Чек-лист или баг-репорт',isBreak:false,pomo:'2×25 мин',tasks:[{text:'Оформить 1 находку',anki:true}]},
      {time:'11:50',dur:20,icon:'🧠',cls:'ic-anki',title:'Anki',sub:'Повторение карточек',isBreak:false,pomo:'',tasks:[{text:'Пройти очередь Anki',anki:true}]},
    ],
  },
  {
    id: 'tpl-lang', builtin: true, name: 'Язык',
    blocks: [
      {time:'19:00',dur:25,icon:'📖',cls:'ic-eng',title:'Ввод',sub:'Текст или аудио',isBreak:false,pomo:'25 мин',tasks:[]},
      {time:'19:25',dur:5,icon:'☕',cls:'ic-break',title:'Пауза',sub:'',isBreak:true,pomo:'',tasks:[]},
      {time:'19:30',dur:25,icon:'✍️',cls:'ic-eng',title:'Практика',sub:'Говорение или упражнения',isBreak:false,pomo:'25 мин',tasks:[]},
      {time:'19:55',dur:15,icon:'🧠',cls:'ic-anki',title:'Карточки',sub:'Только новые + due',isBreak:false,pomo:'',tasks:[{text:'Anki due',anki:true}]},
    ],
  },
  {
    id: 'tpl-pomo4', builtin: true, name: 'Короткий фокус 4×25',
    blocks: [
      {time:'19:00',dur:25,icon:'①',cls:'ic-qa',title:'Фокус 1',sub:'Одна задача',isBreak:false,pomo:'25 мин',tasks:[]},
      {time:'19:25',dur:5,icon:'☕',cls:'ic-break',title:'Пауза',sub:'',isBreak:true,pomo:'',tasks:[]},
      {time:'19:30',dur:25,icon:'②',cls:'ic-sql',title:'Фокус 2',sub:'',isBreak:false,pomo:'25 мин',tasks:[]},
      {time:'19:55',dur:5,icon:'☕',cls:'ic-break',title:'Пауза',sub:'',isBreak:true,pomo:'',tasks:[]},
      {time:'20:00',dur:25,icon:'③',cls:'ic-eng',title:'Фокус 3',sub:'',isBreak:false,pomo:'25 мин',tasks:[]},
      {time:'20:25',dur:5,icon:'☕',cls:'ic-break',title:'Пауза',sub:'',isBreak:true,pomo:'',tasks:[]},
      {time:'20:30',dur:25,icon:'④',cls:'ic-anki',title:'Фокус 4',sub:'Закрепить',isBreak:false,pomo:'25 мин',tasks:[]},
    ],
  },
  {
    id: 'tpl-anki-we', builtin: true, name: 'Выходной — только Anki',
    blocks: [
      {time:'11:00',dur:20,icon:'🧠',cls:'ic-anki',title:'Anki утро',sub:'Due-карточки',isBreak:false,pomo:'',tasks:[{text:'Пройти утреннюю очередь',anki:true}]},
      {time:'18:00',dur:15,icon:'🧠',cls:'ic-anki',title:'Anki вечер',sub:'Короткое повторение',isBreak:false,pomo:'',tasks:[{text:'Вечерние due',anki:true}]},
    ],
  },
  {
    id: 'tpl-study', builtin: true, name: 'Учёба — 3 блока',
    blocks: [
      {time:'19:00',dur:50,icon:'📚',cls:'ic-qa',title:'Учёба',sub:'Главный блок',isBreak:false,pomo:'2×25 мин',tasks:[]},
      {time:'19:50',dur:15,icon:'☕',cls:'ic-break',title:'Отдых',sub:'Время вышло — остановись',isBreak:true,pomo:'',tasks:[]},
      {time:'20:05',dur:40,icon:'✍️',cls:'ic-eng',title:'Практика',sub:'Закрепить',isBreak:false,pomo:'',tasks:[]},
    ],
  },
  {
    id: 'tpl-soft', builtin: true, name: 'Мягкий вход после срыва',
    blocks: [
      {time:'19:00',dur:25,icon:'🔧',cls:'ic-sql',title:'Один короткий блок',sub:'Не догонять вчерашнее',isBreak:false,pomo:'',tasks:[]},
      {time:'19:25',dur:10,icon:'✅',cls:'ic-break',title:'Хватит',sub:'Возврат уже считается',isBreak:true,pomo:'',tasks:[]},
    ],
  },
];

export const TOPIC_COLORS = [
  '#7c6ff7','#22d3ee','#4ade80','#f472b6','#fbbf24','#f87171','#a78bfa','#34d399'
];
