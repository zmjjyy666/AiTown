import { hooks, memories as seedMemories, residents } from "./data.js";

const daySlots = ["08:30", "10:30", "12:30", "15:30", "18:00"];

const state = {
  day: 1,
  slotIndex: 0,
  time: daySlots[0],
  selectedResidentId: "linxia",
  selectedHookId: "",
  selectedInsight: "",
  memories: [],
  timeline: [],
  metricLogs: [],
  stats: {
    happiness: 78,
    harmony: 65,
    prosperity: 42,
  },
  story: "",
  storyCommitted: false,
  actionHint: "",
  interactionId: 0,
  selectionStarted: false,
  dayStarted: false,
  dayEnded: false,
  memoryFilter: "latest",
  metricFilter: "latest",
  milestoneUnlocked: false,
};

const initialResidents = residents.map((resident) => ({ ...resident }));
const initialStats = { ...state.stats };

const interactionRules = {
  coffee: {
    label: "轻社交",
    summary: "缓解情绪、拉近关系",
    stats: { happiness: 4, harmony: 2, prosperity: 1 },
    mood: [5, 3, 1],
  },
  book: {
    label: "共同学习",
    summary: "沉淀记忆、带来新点子",
    stats: { happiness: 2, harmony: 2, prosperity: 3 },
    mood: [3, 2, 2],
  },
  clinic: {
    label: "互相照顾",
    summary: "解决焦虑、提升安全感",
    stats: { happiness: 3, harmony: 4, prosperity: 1 },
    mood: [4, 4, 1],
  },
  festival: {
    label: "公共活动",
    summary: "带动人气、增强归属感",
    stats: { happiness: 3, harmony: 3, prosperity: 4 },
    mood: [3, 3, 3],
  },
};

const statDescriptions = {
  prosperity: "繁荣度：小镇资源、人流和公共活力。图书馆讨论、广场活动提升更多。",
  happiness: "幸福度：居民当天的愉悦和满足感。轻松社交、被帮助、共同活动都会提升。",
  harmony: "和谐度：居民关系和互相信任。诊所求助、共同活动提升更多。",
};

function resetToday() {
  state.day = 1;
  state.slotIndex = 0;
  state.time = daySlots[0];
  state.selectedResidentId = "linxia";
  state.selectedHookId = "";
  state.selectedInsight = "";
  state.rerollCount = 0;
  state.actionHint = "";
  state.memories = [];
  state.timeline = [];
  state.metricLogs = [];
  state.stats = { ...initialStats };
  residents.forEach((resident, index) => {
    Object.assign(resident, initialResidents[index]);
  });
  state.story = "";
  state.storyCommitted = false;
  state.interactionId = 0;
  state.selectionStarted = false;
  state.dayStarted = false;
  state.dayEnded = false;
  state.memoryFilter = "latest";
  state.metricFilter = "latest";
  state.milestoneUnlocked = false;
  render();
}

const storyTemplates = [
  "{time}，{place}先热闹起来。{a}因为「{memory}」想起了{b}，于是两人决定{hook}。{c}把这件事记进了小镇日志，觉得今天会留下一个温柔的传闻。",
  "第 {day} 天的阳光落在{place}，{a}正在完成自己的小目标：{goal}。{b}带来了一条新线索，{c}则把旧记忆和今天的计划串在一起，三个人决定{hook}。",
  "{time}之后，{place}出现了一个小插曲。{a}提到「{memory}」，{b}马上接过话题，{c}则提出一个更大胆的主意：不如今天就{hook}。",
];

const insightCopy = {
  happiness: {
    title: "幸福度",
    text: "幸福度衡量居民当天是否过得开心。一起喝咖啡提升最多，诊所求助和广场活动也会明显提升；它会参与日终总结，数值越高，小镇剧情越偏温暖。",
  },
  mood: {
    title: "当前居民心情",
    text: "心情是单个 NPC 的状态。确认互动后，主角心情提升最多，参与者次之，记录者少量提升；第二天开始时，居民会根据昨日状态轻微回落或恢复。",
  },
  memory: {
    title: "记忆目标",
    text: "这里显示小镇已积累的可见记忆。达到 10 条后会解锁“小镇回顾”，日终总结会开始呈现更完整的连续故事档案。",
  },
};

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function rotate(list, offset) {
  return list.slice(offset).concat(list.slice(0, offset));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function interactionImpact(hookId) {
  return interactionRules[hookId] || interactionRules.coffee;
}

function applyInteractionImpact(cast, hook) {
  const rule = interactionImpact(hook.id);
  const statChanges = Object.entries(rule.stats).map(([key, delta]) => {
    const before = state.stats[key];
    const after = clampScore(before + delta);
    state.stats[key] = after;
    return { key, before, after, delta: after - before };
  });

  const moodChanges = cast.map((resident, index) => {
    const moodDelta = rule.mood[index] || 0;
    const before = resident.mood;
    const after = clampScore(before + moodDelta);
    resident.mood = after;
    return {
      id: resident.id,
      name: resident.name,
      role: ["主角", "参与者", "记录者"][index],
      before,
      after,
      delta: after - before,
    };
  });

  return { rule, statChanges, moodChanges };
}

function impactLine(hookId) {
  const rule = interactionImpact(hookId);
  return `幸福 ${formatDelta(rule.stats.happiness)} · 和谐 ${formatDelta(rule.stats.harmony)} · 繁荣 ${formatDelta(rule.stats.prosperity)}`;
}

function statName(key) {
  return {
    happiness: "幸福",
    harmony: "和谐",
    prosperity: "繁荣",
  }[key];
}

function composeStory() {
  const hook = byId(hooks, state.selectedHookId);
  if (!hook) {
    return null;
  }

  const selectedIndex = residents.findIndex((resident) => resident.id === state.selectedResidentId);
  const cast = rotate(residents, selectedIndex >= 0 ? selectedIndex : (state.day - 1) % residents.length);
  const sourceMemories = [...seedMemories, ...state.memories.filter((memory) => memory.tag !== "剧情")];
  const rerollOffset = state.rerollCount || 0;
  const memory = sourceMemories[(state.day + rerollOffset + sourceMemories.length - 1) % sourceMemories.length];
  const template = storyTemplates[(state.day + rerollOffset - 1) % storyTemplates.length];
  const story = template
    .replaceAll("{day}", state.day)
    .replaceAll("{time}", state.time)
    .replaceAll("{place}", hook.place)
    .replaceAll("{a}", cast[0].name)
    .replaceAll("{b}", cast[1].name)
    .replaceAll("{c}", cast[2].name)
    .replaceAll("{goal}", cast[0].goal)
    .replaceAll("{memory}", memory.text)
    .replaceAll("{hook}", hook.label);

  return { cast, hook, story };
}

function createPreview() {
  const draft = composeStory();
  if (!draft) {
    state.story = "";
    state.storyCommitted = false;
    state.actionHint = "请选择一个互动方向。";
    render();
    return;
  }

  state.story = draft.story;
  state.storyCommitted = false;
  state.selectedInsight = "";
  state.actionHint = "";
  state.selectionStarted = true;
  render();
}

function rerollStory() {
  if (!state.story) {
    createPreview();
    return;
  }

  state.rerollCount = (state.rerollCount || 0) + 1;
  createPreview();
}

function generateStory(options = { record: true }) {
  const draft = composeStory();
  if (!draft) {
    state.story = "";
    state.storyCommitted = false;
    state.actionHint = "请先选择一个互动方向，再开始剧情。";
    render();
    return;
  }

  const { cast, hook, story } = draft;
  if (!state.story) {
    state.story = story;
  }
  state.selectedInsight = "";

  if (!options.record) {
    state.story = story;
    state.storyCommitted = false;
    render();
    return;
  }

  state.interactionId += 1;

  const newMemory = {
    id: `story-${state.day}-${state.slotIndex}-${state.selectedHookId}-${state.interactionId}`,
    day: state.day,
    time: state.time,
    actor: cast[0].name,
    place: hook.place,
    text: `${cast[0].name}和${cast[1].name}在${hook.place}${hook.label}，${cast[2].name}把这件事记进了小镇日志。`,
    tag: "剧情",
    type: hook.id,
  };

  state.memories = [newMemory, ...state.memories].slice(0, 14);
  if (state.memories.length >= 10 && !state.milestoneUnlocked) {
    state.milestoneUnlocked = true;
    state.actionHint = "记忆目标已达成：已解锁“小镇回顾”，日终总结会包含更多回顾信息。";
  }

  const impact = applyInteractionImpact(cast, hook);
  const moodImpact = impact.moodChanges
    .map((change) => `${change.name}（${change.role}）${formatDelta(change.delta)}`)
    .join(" · ");

  const event = {
    day: state.day,
    time: state.time,
    actor: cast[0].name,
    text: hook.label,
    place: hook.place,
    type: hook.boost,
    impact: impactLine(hook.id),
    moodImpact,
    count: 1,
  };
  const latest = state.timeline[0];
  if (latest?.time === event.time && latest.actor === event.actor && latest.text === event.text) {
    state.timeline = [{ ...latest, place: event.place, count: (latest.count || 1) + 1 }, ...state.timeline.slice(1)];
  } else {
    state.timeline = [event, ...state.timeline].slice(0, 8);
  }

  const log = {
    id: `metric-${state.day}-${state.slotIndex}-${state.interactionId}`,
    day: state.day,
    time: state.time,
    hook: hook.label,
    place: hook.place,
    summary: impact.rule.summary,
    statChanges: impact.statChanges,
    moodChanges: impact.moodChanges,
  };
  state.metricLogs = [log, ...state.metricLogs].slice(0, 16);

  const rule = impact.rule;
  state.actionHint = `${hook.label}完成：${rule.summary}。${impactLine(hook.id)}，${cast[0].name}心情 ${formatDelta(rule.mood[0])}。`;
  moveToNextInteractionSlot();
}

function advanceToNextDay() {
  state.day += 1;
  state.slotIndex = 0;
  state.rerollCount = 0;
  state.selectedHookId = "";
  state.actionHint = "";
  state.dayEnded = false;
  state.time = daySlots[0];
  residents.forEach((resident) => {
    const recovery = state.stats.harmony >= 80 ? 1 : 0;
    resident.mood = clampScore(resident.mood - 2 + recovery);
  });
  state.story = "";
  state.storyCommitted = false;
  state.dayStarted = false;
  state.selectionStarted = false;
  render();
}

function moveToNextInteractionSlot() {
  state.selectedHookId = "";
  state.selectedInsight = "";
  state.rerollCount = 0;
  state.story = "";
  state.storyCommitted = false;
  state.selectionStarted = state.dayStarted;

  if (state.slotIndex >= daySlots.length - 1) {
    state.dayEnded = true;
    state.selectionStarted = false;
    render();
    return;
  }

  state.slotIndex += 1;
  state.time = daySlots[state.slotIndex];
  render();
}

function advanceStory() {
  if (state.dayEnded) {
    advanceToNextDay();
    return;
  }

  if (!state.story) {
    state.dayStarted = true;
    state.selectionStarted = true;
    state.actionHint = "请选择一个互动方向。";
    render();
    return;
  }

  if (!state.storyCommitted) {
    generateStory();
    return;
  }

  moveToNextInteractionSlot();
}

function showInsight(kind) {
  state.selectedInsight = kind;
  render();
}

function statBar(label, value, icon) {
  const description = statDescriptions[
    label === "繁荣度" ? "prosperity" : label === "幸福度" ? "happiness" : "harmony"
  ];
  return `
    <div class="stat-row">
      <span>${icon} ${label}</span>
      <strong>${value}</strong>
      <div class="meter"><i style="width:${value}%"></i></div>
      <small>${description}</small>
    </div>
  `;
}

function residentCard(resident) {
  const active = resident.id === state.selectedResidentId ? "active" : "";
  return `
    <button class="resident ${active}" data-resident="${resident.id}" aria-pressed="${resident.id === state.selectedResidentId}">
      <img src="${resident.avatar}" alt="${resident.name}" />
      <span>
        <strong>${resident.name}</strong>
        <small>${resident.role}</small>
        <em>心情 ${resident.mood} · ${resident.location}</em>
      </span>
    </button>
  `;
}

function memoryCard(memory) {
  const text = memory.text.length > 92 ? `${memory.text.slice(0, 92)}...` : memory.text;
  const icon = memoryIcon(memory);
  const timeLabel = state.memoryFilter === "all" ? `第 ${memory.day || 1} 天 · ${memory.time}` : memory.time;
  return `
    <article class="memory">
      <div class="memory-icon ${icon.className}" title="${icon.label}" aria-label="${icon.label}">
        <span>${icon.symbol}</span>
      </div>
      <div>
        <p>${text}</p>
        <small>${memory.actor} · ${memory.place}</small>
      </div>
      <time>${timeLabel}</time>
    </article>
  `;
}

function memoryIcon(memory) {
  const iconMap = {
    coffee: { symbol: "咖", label: "咖啡互动", className: "coffee" },
    book: { symbol: "书", label: "书籍互动", className: "book" },
    clinic: { symbol: "医", label: "诊所互动", className: "clinic" },
    festival: { symbol: "场", label: "广场活动", className: "festival" },
  };

  return iconMap[memory.type] || { symbol: "记", label: memory.tag || "记忆", className: "default" };
}

function groupedMemories() {
  if (!state.memories.length) {
    return emptyMemories();
  }

  const days = [...new Set(state.memories.map((memory) => memory.day || 1))].sort((a, b) => b - a);
  const selectedDay = state.memoryFilter === "latest" ? days[0] : Number(state.memoryFilter.replace("day-", ""));
  const filtered =
    state.memoryFilter === "all"
      ? state.memories
      : state.memories.filter((memory) => (memory.day || 1) === selectedDay);

  const groups = filtered.reduce((acc, memory) => {
    const day = memory.day || 1;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(memory);
    return acc;
  }, {});

  return `
    ${townReview()}
    <div class="memory-tabs">
      ${memoryTab("latest", "最新")}
      ${memoryTab("all", "全部")}
      ${days.map((day) => memoryTab(`day-${day}`, `第 ${day} 天`)).join("")}
    </div>
    <div class="memory-scroll" aria-label="记忆列表">
      ${Object.keys(groups)
    .sort((a, b) => Number(b) - Number(a))
    .map(
      (day) => `
        <div class="memory-group">
          <div class="memory-group-title">
            <strong>第 ${day} 天</strong>
            <span>${groups[day].length} 条</span>
          </div>
          ${groups[day].map(memoryCard).join("")}
        </div>
      `,
    )
    .join("")}
    </div>
  `;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "未知";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} ${count}`)
    .join(" · ");
}

function townReview() {
  if (!state.milestoneUnlocked && state.memories.length < 10) {
    return "";
  }

  const actorSummary = formatCounts(countBy(state.memories, "actor"));
  const placeSummary = formatCounts(countBy(state.memories, "place"));
  const latest = state.memories[0];
  return `
    <section class="town-review">
      <div class="section-title">
        <h2>小镇回顾</h2>
        <span>已解锁</span>
      </div>
      <p>小镇已经积累 ${state.memories.length} 条记忆，形成了连续故事档案。</p>
      <div class="review-grid">
        <div><strong>活跃居民</strong><span>${actorSummary}</span></div>
        <div><strong>高频地点</strong><span>${placeSummary}</span></div>
      </div>
      <small>最近记录：${latest?.text || "暂无"}</small>
    </section>
  `;
}

function memoryTab(id, label) {
  const active = state.memoryFilter === id || (id === "latest" && state.memoryFilter === "latest") ? "active" : "";
  return `<button class="memory-tab ${active}" data-memory-filter="${id}">${label}</button>`;
}

function timelineItem(item) {
  const count = item.count > 1 ? `<strong class="event-count">x${item.count}</strong>` : "";
  const place = item.place ? `<small>${item.place}</small>` : "";
  const impact = item.impact ? `<small class="timeline-impact">${item.impact}</small>` : "";
  const moodImpact = item.moodImpact ? `<small class="timeline-mood">${item.moodImpact}</small>` : "";
  return `
    <div class="timeline-item ${item.type}">
      <b>${item.time}${count}</b>
      <span>${item.actor}</span>
      <em>${item.text}</em>
      ${place}
      ${impact}
      ${moodImpact}
    </div>
  `;
}

function visibleMetricLogs() {
  if (!state.metricLogs.length) {
    return [];
  }

  const days = [...new Set(state.metricLogs.map((log) => log.day || 1))].sort((a, b) => b - a);
  const selectedDay = state.metricFilter === "latest" ? days[0] : Number(state.metricFilter.replace("day-", ""));
  return state.metricFilter === "all"
    ? state.metricLogs
    : state.metricLogs.filter((log) => (log.day || 1) === selectedDay);
}

function metricDays() {
  return [...new Set(state.metricLogs.map((log) => log.day || 1))].sort((a, b) => b - a);
}

function metricLogCard(log) {
  const timeLabel = state.metricFilter === "all" ? `第 ${log.day} 天 · ${log.time}` : log.time;
  const statItems = log.statChanges
    .map(
      (change) => `
        <span class="metric-chip">
          <small>${statName(change.key)}</small>
          <b>${formatDelta(change.delta)}</b>
          <em>${change.before}→${change.after}</em>
        </span>
      `,
    )
    .join("");
  const moodItems = log.moodChanges
    .map(
      (change) => `
        <span class="metric-chip">
          <small>${change.name} · ${change.role}</small>
          <b>${formatDelta(change.delta)}</b>
          <em>${change.before}→${change.after}</em>
        </span>
      `,
    )
    .join("");

  return `
    <article class="metric-log">
      <div class="memory-icon metric" title="指标变化" aria-label="指标变化">
        <span>数</span>
      </div>
      <div class="metric-log-body">
        <p>${log.hook}后，${log.summary}。</p>
        <small>${log.place} · 小镇指标</small>
        <div class="metric-log-grid town">${statItems}</div>
        <small>参与角色心情</small>
        <div class="metric-log-grid mood">${moodItems}</div>
      </div>
      <time>${timeLabel}</time>
    </article>
  `;
}

function metricLogPanel() {
  const logs = visibleMetricLogs();
  const days = metricDays();
  const label = state.metricFilter === "all" ? "全部" : state.metricFilter === "latest" ? "最新" : `第 ${state.metricFilter.replace("day-", "")} 天`;
  return `
    <section class="status-card metric-log-card">
      <div class="section-title">
        <h2>指标更新记录</h2>
        <span>${label} ${logs.length} 条</span>
      </div>
      <p class="metric-log-note">每次确认互动后，都会记录小镇指标和参与角色心情的变化。</p>
      ${
        days.length
          ? `<div class="memory-tabs metric-tabs">
              ${metricTab("latest", "最新")}
              ${metricTab("all", "全部")}
              ${days.map((day) => metricTab(`day-${day}`, `第 ${day} 天`)).join("")}
            </div>`
          : ""
      }
      <div class="metric-log-list">
        ${
          logs.length
            ? logs.map(metricLogCard).join("")
            : `<div class="empty-state"><strong>还没有指标变化</strong><span>${state.metricLogs.length ? "这个分类下还没有记录。" : "开始剧情并确认互动后，这里会显示本次互动带来的数值更新。"}</span></div>`
        }
      </div>
    </section>
  `;
}

function metricTab(id, label) {
  const active = state.metricFilter === id || (id === "latest" && state.metricFilter === "latest") ? "active" : "";
  return `<button class="memory-tab ${active}" data-metric-filter="${id}">${label}</button>`;
}

function visibleTimeline() {
  return state.timeline.filter((item) => (item.day || 1) === state.day);
}

function hookButton(hook) {
  const active = hook.id === state.selectedHookId ? "active" : "";
  const disabled = state.selectionStarted ? "" : "disabled";
  const rule = interactionImpact(hook.id);
  return `
    <button class="hook ${active}" data-hook="${hook.id}" ${disabled}>
      <strong>${hook.label}</strong>
      <small>${rule.label} · ${impactLine(hook.id)}</small>
    </button>
  `;
}

function hookControls() {
  if (state.dayEnded) {
    return "";
  }

  return `<div class="hooks">${hooks.map(hookButton).join("")}</div>`;
}

function storyImpactPreview() {
  if (!state.selectedHookId || state.dayEnded || state.selectedInsight) {
    return "";
  }

  const rule = interactionImpact(state.selectedHookId);
  return `
    <div class="impact-preview">
      <strong>本次互动影响</strong>
      <span>${rule.summary} · ${impactLine(state.selectedHookId)}</span>
      <small>确认后，当前剧情主角心情 ${formatDelta(rule.mood[0])}，参与者 ${formatDelta(rule.mood[1])}，记录者 ${formatDelta(rule.mood[2])}。</small>
    </div>
  `;
}

function topStatButton(kind, icon, label, value, description) {
  return `
    <button class="top-stat" data-insight="${kind}" data-tooltip="${label}：${description}">
      <span>${icon}</span>
      <em>${value}</em>
    </button>
  `;
}

function emptyTimeline() {
  return `
    <div class="empty-state">
      <strong>还没有互动</strong>
      <span>点击“开始剧情”后，NPC 的第一条互动会记录在这里。</span>
    </div>
  `;
}

function emptyMemories() {
  return `
    <div class="empty-state">
      <strong>还没有可见记忆</strong>
      <span>生成剧情后，小镇会把关键事件写成一条新记忆。</span>
    </div>
  `;
}

function storyPanelText() {
  if (state.dayEnded) {
    const review = state.milestoneUnlocked ? "记忆目标已达成，小镇开始形成连续的故事档案。" : `距离“小镇回顾”还差 ${Math.max(0, 10 - state.memories.length)} 条记忆。`;
    return `第 ${state.day} 天结束了。今天一共记录了 ${visibleTimeline().length} 条互动，当前共有 ${state.memories.length}/10 条记忆。${review} 准备好后进入第 ${state.day + 1} 天。`;
  }

  if (!state.story && !state.selectedInsight) {
    return state.actionHint || "还没有今日剧情。先选择一个互动方向，再点击“开始剧情”，小镇会把这一段事件写入记忆和互动记录。";
  }

  if (!state.selectedInsight) {
    return state.story;
  }

  const insight = insightCopy[state.selectedInsight];
  return `${insight.title}：${insight.text}`;
}

function storyTitle() {
  if (state.dayEnded) {
    return "今日结束";
  }

  if (state.selectedInsight) {
    return "指标说明";
  }

  if (state.storyCommitted) {
    return "今日剧情草稿";
  }

  return state.story ? "今日剧情草稿" : "今日剧情预览";
}

function storyPurposeText() {
  if (state.dayEnded) {
    return "今天的时段已经走完，先看一眼总结，再进入下一天。";
  }

  if (state.storyCommitted) {
    return "这段剧情确认后会写入记忆和互动记录，并推进到当天下一段时间。";
  }

  if (state.story) {
    return "这是还未写入记录的草稿；不满意可以重抽，满意后点击下方按钮确认。";
  }

  return state.selectionStarted
    ? "请选择一个互动方向，系统会先生成草稿，满意后再确认写入。"
    : "点击“开始剧情”进入今天的互动选择；当天后续时段会继续保持可选择。";
}

function rerollControl() {
  if (state.selectedInsight || state.dayEnded) {
    return "";
  }

  const disabled = !state.story || state.storyCommitted ? "disabled" : "";
  const title = state.storyCommitted ? "剧情已确认，进入下一天后可重抽" : "选择互动方向后可重抽当前剧情草稿";
  return `<button class="reroll-button" id="refreshStory" title="${title}" aria-label="${title}" ${disabled}>↻ 重抽剧情</button>`;
}

function storyAdvanceLabel() {
  if (state.dayEnded) {
    return `▶ 进入第 ${state.day + 1} 天`;
  }

  if (!state.selectionStarted) {
    return "▶ 开始剧情";
  }

  if (!state.selectedHookId) {
    return "请选择互动方向";
  }

  if (!state.story) {
    return "请选择互动方向";
  }

  if (!state.storyCommitted) {
    return "▶ 确定互动方向";
  }

  return "▶ 确认互动";
}

function storyAdvanceDisabled() {
  if (state.dayEnded) {
    return "";
  }

  return state.selectionStarted && !state.selectedHookId ? "disabled" : "";
}

function render() {
  const selected = byId(residents, state.selectedResidentId);
  const currentTimeline = visibleTimeline();
  const app = document.querySelector("#app");
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">屋</span>
          <h1>AI 小镇</h1>
        </div>
        <div class="clock">
          <span>第 ${state.day} 天</span>
          <strong>${state.time}</strong>
          <button class="quick-action muted" id="resetToday" title="重置今日" aria-label="重置今日">↺ 重置今日</button>
          <button class="quick-action muted" id="nextDayTop" title="进入下一天" aria-label="进入下一天">↻ 下一天</button>
        </div>
        <div class="top-stats" aria-label="小镇指标">
          ${topStatButton("happiness", "❤", "幸福度", state.stats.happiness, "小镇整体状态")}
          ${topStatButton("mood", "☻", "心情", selected.mood, `当前选中居民 ${selected.name} 的心情`)}
          ${topStatButton("memory", "●", "记忆目标", `${Math.min(state.memories.length, 10)}/10`, "达成 10 条后解锁小镇回顾")}
        </div>
      </header>

      <aside class="sidebar">
        <section>
          <h2>居民</h2>
          <div class="resident-list">${residents.map(residentCard).join("")}</div>
          <button class="outline-action" id="invite">＋ 邀请新居民</button>
        </section>
        <section class="status-card">
          <h2>小镇状态</h2>
          ${statBar("繁荣度", state.stats.prosperity, "☘")}
          ${statBar("幸福度", state.stats.happiness, "❤")}
          ${statBar("和谐度", state.stats.harmony, "●")}
        </section>
        ${metricLogPanel()}
      </aside>

      <section class="stage">
        <div class="town-frame">
          <img class="town-map" src="./assets/town-map.svg" alt="AI 小镇地图" />
          ${residents
            .map(
              (resident) => `
                <button class="map-avatar ${resident.id} ${resident.id === state.selectedResidentId ? "active" : ""}" data-resident="${resident.id}" title="${resident.name}" aria-pressed="${resident.id === state.selectedResidentId}">
                  <img src="${resident.avatar}" alt="${resident.name}" />
                  <span>${resident.name}</span>
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="timeline">
          <div class="section-title">
            <h2>今日 NPC 互动记录</h2>
            <span>当前 ${state.time}</span>
          </div>
          <p class="timeline-note">记录你开始模拟后发生的社交事件，新剧情会从这些互动和记忆里继续生长。</p>
          <div class="timeline-meta">今日时段 ${state.slotIndex + 1}/${daySlots.length} · 今日已记录 ${currentTimeline.length} 条互动</div>
          <div class="timeline-grid">${currentTimeline.length ? currentTimeline.map(timelineItem).join("") : emptyTimeline()}</div>
        </div>
      </section>

      <aside class="right-panel">
        <section>
          <div class="section-title">
            <h2>记忆</h2>
            <span>${state.memories.length} 条</span>
          </div>
          <div class="memories">${groupedMemories()}</div>
        </section>
        <section class="story-card ${state.selectedInsight ? "insight-mode" : ""} ${state.actionHint ? "hint-mode" : ""} ${state.dayEnded ? "day-ended" : ""}">
          <div class="section-title">
            <h2>${storyTitle()}</h2>
            ${rerollControl()}
          </div>
          <div class="story-purpose">${storyPurposeText()}</div>
          <p>${storyPanelText()}</p>
          ${storyImpactPreview()}
          ${hookControls()}
          <button class="secondary-action" id="nextDay" ${storyAdvanceDisabled()}>${storyAdvanceLabel()}</button>
        </section>
      </aside>
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-resident]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedResidentId = button.dataset.resident;
      state.selectedInsight = "";
      state.actionHint = "";
      if (state.story && !state.storyCommitted && state.selectedHookId) {
        state.story = composeStory().story;
      }
      render();
    });
  });

  document.querySelectorAll("[data-hook]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.selectionStarted) {
        return;
      }

      state.selectedHookId = button.dataset.hook;
      state.selectedInsight = "";
      state.rerollCount = 0;
      createPreview();
    });
  });

  document.querySelectorAll("[data-insight]").forEach((button) => {
    let tooltipTimer;
    button.addEventListener("click", () => {
      showInsight(button.dataset.insight);
      button.blur();
    });
    button.addEventListener("touchstart", () => {
      tooltipTimer = window.setTimeout(() => {
        button.classList.add("tooltip-open");
      }, 520);
    });
    button.addEventListener("touchend", () => {
      window.clearTimeout(tooltipTimer);
      window.setTimeout(() => button.classList.remove("tooltip-open"), 1300);
    });
    button.addEventListener("touchcancel", () => {
      window.clearTimeout(tooltipTimer);
      button.classList.remove("tooltip-open");
    });
  });

  document.querySelectorAll("[data-memory-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.memoryFilter = button.dataset.memoryFilter;
      render();
    });
  });

  document.querySelectorAll("[data-metric-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.metricFilter = button.dataset.metricFilter;
      render();
    });
  });

  document.querySelector("#refreshStory")?.addEventListener("click", rerollStory);
  document.querySelector("#resetToday").addEventListener("click", resetToday);
  document.querySelector("#nextDay").addEventListener("click", advanceStory);
  document.querySelector("#nextDayTop").addEventListener("click", advanceToNextDay);
  document.querySelector("#invite").addEventListener("click", () => {
    state.selectedInsight = "";
    state.story = "MVP 版本暂时固定 3 位居民。下一步可以把这里扩展成角色创建器，并为新居民生成目标、关系和初始记忆。";
    render();
  });
}

render();
