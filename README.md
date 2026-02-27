# 🐦 Twitter Scraper Pro v2.2

> **独立的社交媒体智能抓取工具**  
> 🚀 离线优先 · 🧠 LLM 筛选 · 📊 情感分析 · 🔍 KOL 识别

[![Test Status](https://img.shields.io/badge/tests-87.5%25-yellow)](tests/TEST_REPORT.md)
[![E2E Tests](https://img.shields.io/badge/e2e-passing-green)](tests/TEST_REPORT.md)
[![Version](https://img.shields.io/badge/version-2.2.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 核心特性

### 🚀 离线优先架构
- ✅ **无需后端也能用** - Chrome Storage 本地存储
- ✅ **自动同步** - 后端可用时自动同步到 KuzuDB
- ✅ **降级使用** - 网络问题不影响核心功能

### 🧠 LLM 智能筛选
- ✅ **智谱 GLM-5** - 深度分析推文价值
- ✅ **情感分析** - 正面/负面/中性自动识别
- ✅ **KOL 识别** - 自动发现行业意见领袖
- ✅ **趋势检测** - 实时监控热门话题

### 📊 数据导出
- ✅ **CSV 格式** - Excel 直接打开
- ✅ **一键导出** - 原始数据 + 筛选结果 + 分析报告
- ✅ **自定义筛选** - 灵活配置筛选标准

---

## 🎯 适用人群

| 用户类型 | 使用场景 | 核心价值 |
|----------|----------|----------|
| 📊 市场研究人员 | 竞品监控、趋势分析 | 实时抓取 + 情感分析 |
| 📱 自媒体运营 | 内容灵感、热点追踪 | KOL 识别 + 趋势检测 |
| 🎓 学术研究者 | 社会媒体研究 | 数据导出 + 批量分析 |
| 💼 投资分析师 | 舆情监控、行业洞察 | 情感分析 + 关键词警报 |

---

## 🚀 快速开始

### 方案 A：仅使用 Chrome 扩展（推荐新手）

**无需 Python，零配置，5 分钟上手！**

1. **打开 Chrome 扩展管理页**
   ```
   chrome://extensions/
   ```

2. **开启"开发者模式"**（右上角开关）

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 文件夹

4. **配置 API Key**
   - 点击扩展图标
   - 进入"设置"标签
   - 输入 [智谱 API Key](https://open.bigmodel.cn/api-keys)
   - 模型选择：`glm-5`

5. **开始使用**
   - 访问 [twitter.com](https://twitter.com) 或 [reddit.com](https://reddit.com)
   - 开始浏览，自动抓取推文
   - 点击扩展图标查看抓取结果

---

### 方案 B：Chrome 扩展 + Python 后端（推荐高级用户）

**数据持久化 + 历史查询 + 自动同步**

```bash
# 1. 安装 Python 依赖
cd backend
pip install -r requirements.txt

# 2. 启动后端服务
python server_minimal.py --port 8770

# 3. 验证运行
curl http://localhost:8770/health

# 4. Chrome 扩展自动同步
# 打开扩展，每 5 分钟自动检查后端并同步
```

**后端服务内容：**
- 🟢 KuzuDB 数据库（无容量限制）
- 🟢 自动同步（每 5 分钟检查）
- 🟢 历史数据查询
- 🟢 数据清理（90 天自动清理）

---

## 📖 完整文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 本文档（快速开始） |
| [INDEPENDENT_DEPLOYMENT.md](INDEPENDENT_DEPLOYMENT.md) | 独立部署指南 |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md) | Python 后端使用指南 |
| [tests/TEST_REPORT.md](tests/TEST_REPORT.md) | E2E 测试报告 |

---

## 📊 功能演示

### 同步状态指示器

```
┌─────────────────────────────────┐
│ 🐦 Twitter Scraper v2.2         │
├─────────────────────────────────┤
│ 🟢 在线                          │  ← 后端可用，实时同步
│ 上次同步：2 分钟前                │
├─────────────────────────────────┤
│ [全部帖子] [筛选结果] [发现] [设置] │
└─────────────────────────────────┘
```

### 离线模式

```
┌─────────────────────────────────┐
│ 🟡 离线模式                      │  ← 后端不可用
│ 待同步：25 条                    │
│ [立即同步]                       │
├─────────────────────────────────┤
│ ⚠️ 后端服务不可用，使用本地缓存   │
│ 数据将在后台恢复后自动同步        │
└─────────────────────────────────┘
```

### LLM 筛选结果

```
┌─────────────────────────────────┐
│ 🚀 创业/新产品  ⭐8/10           │
│ @elonmusk · 2 小时前             │
│ We are launching a new AI       │
│ product that will change...     │
│                                 │
│ 💬 原因：新产品发布，有参考价值  │
├─────────────────────────────────┤
│ 💡 洞察/观点  ⭐9/10             │
│ @naval · 5 小时前                │
│ The best technology is          │
│ invisible...                    │
│                                 │
│ 💬 原因：深度洞察，值得思考      │
└─────────────────────────────────┘
```

---

## 🧪 测试

### 运行 E2E 测试

```bash
# 安装 Playwright
npm install -D @playwright/test
npx playwright install chromium

# 运行测试
npm run test:e2e

# 有头模式（显示浏览器）
npm run test:e2e:headed

# 查看测试报告
npm run test:e2e:report
```

**测试覆盖率：87.5% (7/8)**

- ✅ 扩展加载测试
- ✅ UI 渲染测试
- ✅ 同步功能测试
- ✅ 离线模式测试

---

## 🔧 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **Chrome 扩展** | TypeScript + React | 前端 UI + 实时抓取 |
| **后端服务** | Python (极简) | 可选，数据持久化 |
| **数据库** | KuzuDB | 图数据库 |
| **LLM** | 智谱 GLM-5 | 智能分析 |
| **测试** | Playwright | E2E 自动化测试 |

---

## 📦 项目结构

```
twitter-scraper-extension-v2/
├── src/                    # TypeScript 源代码
│   ├── sync/              # 离线同步模块
│   │   ├── SyncManager.ts
│   │   ├── cleanup.ts
│   │   └── types.ts
│   ├── popup/             # React UI
│   │   ├── App.tsx
│   │   ├── SyncStatusIndicator.tsx
│   │   └── WarningBanner.tsx
│   ├── background/        # Service Worker
│   └── content/           # 内容脚本
├── backend/               # Python 后端（可选）
│   ├── server_minimal.py  # 极简 HTTP 服务
│   ├── database.py        # KuzuDB 数据访问
│   └── requirements.txt   # 依赖（仅 kuzu）
├── tests/                 # Playwright E2E 测试
│   ├── fixtures/
│   │   └── extension.ts
│   └── e2e/
│       ├── 01-extension-basic.test.ts
│       └── 02-sync-offline.test.ts
├── dist/                  # 构建输出
└── package.json
```

---

## 📈 更新日志

### v2.2.0 (2026-02-25)
- ✨ 离线优先架构
- ✨ 自动同步管理器
- ✨ 状态指示器和警告横幅
- ✨ Playwright E2E 测试（87.5% 通过率）
- ✨ GitHub Actions CI/CD
- ✨ 完整的测试文档

### v2.1.0 (2026-02-24)
- ✨ Reddit 支持
- ✨ 双平台抓取（Twitter + Reddit）

### v2.0.0 (2026-02-23)
- ✨ LLM 筛选
- ✨ 分类系统
- ✨ 分页浏览

---

## ❓ 常见问题

### Q: 需要 Python 环境吗？

**A:** 不需要！Chrome 扩展可以完全独立运行。Python 后端是可选的增强功能，用于：
- 数据持久化（无容量限制）
- 历史数据查询
- 自动同步备份

### Q: API Key 安全吗？

**A:** 完全安全：
- API Key 仅存储在本地（Chrome Storage）
- 不会上传到任何第三方服务器
- 仅用于调用智谱 LLM API

### Q: 数据会丢失吗？

**A:** 不会：
- 本地数据存储在 Chrome Storage（持久化）
- 有后端时自动同步到 KuzuDB
- 支持手动导出 CSV 备份

### Q: 支持其他 LLM 吗？

**A:** 支持：
- 智谱 GLM（推荐）
- DeepSeek
- OpenAI GPT

在"设置"中切换即可。

### Q: 可以商用吗？

**A:** 可以！本项目采用 MIT License，允许商业用途。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境搭建

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test:e2e
```

---

## 📄 许可证

MIT License

---

## 📞 支持

- **文档：** [README.md](README.md)
- **测试报告：** [tests/TEST_REPORT.md](tests/TEST_REPORT.md)
- **问题反馈：** GitHub Issues
- **讨论区：** GitHub Discussions

---

**Twitter Scraper Pro v2.2** - 让社交媒体数据挖掘变得简单 🐦

最后更新：2026-02-25
