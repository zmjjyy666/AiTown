export const residents = [
  {
    id: "linxia",
    name: "林夏",
    role: "咖啡馆店主",
    mood: 68,
    location: "咖啡馆",
    avatar: "./assets/avatar-linxia.svg",
    color: "#2f9f93",
    trait: "细心、喜欢记录客人的口味",
    goal: "让今天第一杯手冲咖啡有一个新名字",
  },
  {
    id: "azhe",
    name: "阿哲",
    role: "诊所医生",
    mood: 56,
    location: "诊所",
    avatar: "./assets/avatar-azhe.svg",
    color: "#e3725d",
    trait: "认真、嘴硬心软",
    goal: "确认镇上没人因为熬夜错过早餐",
  },
  {
    id: "xiaoman",
    name: "小满",
    role: "图书馆管理员",
    mood: 72,
    location: "图书馆",
    avatar: "./assets/avatar-xiaoman.svg",
    color: "#7aa75a",
    trait: "好奇、擅长把传闻整理成档案",
    goal: "找到一本被放错书架的小镇旧相册",
  },
];

export const memories = [
  { id: 1, time: "06:40", actor: "小满", place: "广场", text: "小镇广场的花坛被园丁修剪得很整齐。", tag: "环境" },
  { id: 2, time: "07:10", actor: "林夏", place: "街角", text: "林夏和阿哲打了招呼，聊了几句近况。", tag: "关系" },
  { id: 3, time: "07:30", actor: "小满", place: "图书馆", text: "小满在图书馆借了一本《小镇的历史》，看得很入迷。", tag: "兴趣" },
  { id: 4, time: "07:50", actor: "阿哲", place: "诊所", text: "阿哲在诊所帮助了一位感冒的居民，对方很感激。", tag: "帮助" },
  { id: 5, time: "08:15", actor: "林夏", place: "咖啡馆", text: "林夏在咖啡馆尝试了新口味的拿铁，她很喜欢。", tag: "发现" },
  { id: 6, time: "08:25", actor: "阿哲", place: "广场", text: "阿哲注意到广场喷泉旁有一张被风吹落的便签。", tag: "线索" },
  { id: 7, time: "08:35", actor: "小满", place: "图书馆", text: "小满把旧相册目录抄到了自己的笔记里。", tag: "记忆" },
  { id: 8, time: "08:45", actor: "林夏", place: "咖啡馆", text: "林夏给熟客留了一杯少糖热饮。", tag: "习惯" },
  { id: 9, time: "09:00", actor: "阿哲", place: "诊所", text: "阿哲准备下午去图书馆查一份草药资料。", tag: "计划" },
  { id: 10, time: "09:10", actor: "小满", place: "广场", text: "小满觉得今天的小镇比往常更适合办一次小型读书会。", tag: "想法" },
];

export const hooks = [
  { id: "coffee", label: "一起喝咖啡", place: "咖啡馆", boost: "warmth" },
  { id: "book", label: "讨论书籍", place: "图书馆", boost: "curiosity" },
  { id: "clinic", label: "诊所求助", place: "诊所", boost: "care" },
  { id: "festival", label: "广场活动", place: "广场", boost: "community" },
];

export const timelineSeed = [
  { time: "07:10", actor: "林夏", text: "打招呼（阿哲）", type: "heart" },
  { time: "07:30", actor: "小满", text: "借阅书籍", type: "leaf" },
  { time: "07:50", actor: "阿哲", text: "帮助居民", type: "care" },
  { time: "08:15", actor: "林夏", text: "新口味拿铁", type: "heart" },
];
