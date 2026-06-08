# AI 小镇 / NPC 社交游戏 MVP

这是一个 1-2 天范围内可运行的轻量 demo，借鉴 [a16z AI Town](https://github.com/a16z-infra/ai-town) 的核心玩法：小镇场景、NPC、记忆、关系事件和每日自动剧情。

## 为什么不是直接复现原仓库

AI Town 官方项目是完整多人/agent 架构，主要包含 React + PixiJS 前端、Convex 后端、agent 调度，以及 OpenAI/Together/Ollama 等模型配置。它很适合继续深入改造，但首次 demo 的依赖和配置成本偏高。

这个 MVP 先抽取最有演示价值的闭环：

- 3 个角色：林夏、阿哲、小满
- 1 个小镇场景：咖啡馆、诊所、图书馆、小镇广场
- 10 条初始记忆
- 每天自动生成一段小剧情
- 可继续一天、选择事件钩子、查看关系时间线和记忆

## 文件结构

```text
.
├── index.html
├── README.md
├── assets/
│   ├── town-map.svg
│   ├── avatar-linxia.svg
│   ├── avatar-azhe.svg
│   └── avatar-xiaoman.svg
└── src/
    ├── app.js
    ├── data.js
    └── styles.css
```

## 运行方式

最简单：直接用浏览器打开 `index.html`。

也可以启动本地静态服务：

```powershell
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

## 下一步可以扩展

- 把 `src/app.js` 里的本地规则生成器替换为真实 LLM 调用
- 增加角色行动队列、目标、计划和对话
- 用 IndexedDB 或后端保存长期记忆
- 引入 PixiJS/Phaser，让角色在地图上真实移动
- 后续再接近原 AI Town 的 Convex agent 架构
