# Twitter Scraper Pro v2.2 - 独立部署指南

> 🎯 定位：完全独立的 Chrome 扩展产品  
> 📦 不依赖 OSIS 或其他系统  
> 🚀 开箱即用

---

## 📦 项目结构

```
twitter-scraper-extension-v2/
├── src/                    # TypeScript 源代码
│   ├── sync/              # 离线同步模块
│   ├── popup/             # React UI
│   ├── background/        # Service Worker
│   └── content/           # 内容脚本
├── backend/               # Python 后端（可选）
│   ├── server_minimal.py  # 极简 HTTP 服务
│   ├── database.py        # KuzuDB 数据访问
│   └── requirements.txt   # Python 依赖
├── tests/                 # Playwright E2E 测试
├── dist/                  # 构建输出（加载到 Chrome）
└── package.json           # Node.js 配置
```

---

## 🎯 产品定位

### 目标用户
- ✅ 社交媒体研究人员
- ✅ 市场分析师
- ✅ 数据科学家
- ✅ 自媒体运营者

### 核心功能
1. **实时抓取** - Twitter/Reddit 浏览即抓取
2. **LLM 筛选** - 智谱 GLM-5 智能分析
3. **离线优先** - 无需后端也能使用
4. **一键导出** - CSV 格式导出数据

---

## 🚀 快速开始

### 方案 A：仅使用 Chrome 扩展（推荐新手）

**无需安装 Python，零配置！**

1. **打开 Chrome**
   ```
   chrome://extensions/
   ```

2. **开启开发者模式**

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 文件夹

4. **配置 API Key**
   - 点击扩展图标
   - 进入"设置"
   - 输入智谱 API Key

5. **开始使用**
   - 访问 twitter.com 或 reddit.com
   - 开始浏览，自动抓取

---

### 方案 B：Chrome 扩展 + Python 后端（推荐高级用户）

**优势：数据持久化、自动同步、历史查询**

#### 1. 安装 Python 依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 2. 启动后端服务

```bash
python server_minimal.py --port 8770
```

#### 3. 验证服务

```bash
curl http://localhost:8770/health
# 返回：{"status": "healthy", ...}
```

#### 4. Chrome 扩展自动同步

- 扩展会每 5 分钟自动检查后端
- 后端可用时自动同步数据
- 后端不可用时使用本地缓存

---

## 🔧 配置选项

### 环境变量（后端）

```bash
# backend/.env (可选)
KUZU_DB_PATH=./database/twitter_scraper
LOG_LEVEL=INFO
```

### Chrome 扩展设置

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| LLM 提供商 | 智谱/DeepSeek/OpenAI | 智谱 |
| API Key | 你的 API Key | (必填) |
| 模型 | glm-5/glm-4-flash | glm-5 |
| 筛选模式 | 普通/深度/自定义 | 深度 |
| 最低相关度 | 1-10 分 | 5 |
| 自动筛选 | 是否自动分析 | 是 |

---

## 📊 数据流

### 无后端模式（离线）
```
浏览器 → DOM 抓取 → Chrome Storage → 用户查看/导出
```

### 有后端模式（在线）
```
浏览器 → DOM 抓取 → Chrome Storage → 自动同步 → KuzuDB
                                               ↓
                                        历史查询/分析
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

# 查看报告
npm run test:e2e:report
```

### 测试覆盖率

- ✅ 扩展加载测试
- ✅ UI 渲染测试
- ✅ 同步功能测试
- ✅ 离线模式测试

**当前通过率：87.5% (7/8)**

---

## 📁 导出数据

### 导出格式

1. **原始数据** - `social_posts_raw_日期.csv`
   - 所有抓取的帖子
   - 包含平台、作者、内容、时间等

2. **筛选后数据** - `social_posts_filtered_日期.csv`
   - LLM 筛选后的帖子
   - 包含相关度评分、分类、原因

3. **分析报告** - `social_posts_summary_日期.csv`
   - AI 生成的总结报告
   - 分类统计、关键主题

### 导出步骤

1. 点击扩展图标
2. 点击底部"📥 导出全部"按钮
3. 浏览器自动下载 CSV 文件

---

## 🔒 隐私与安全

### 数据存储
- **本地存储** - Chrome Storage（最多 10MB）
- **云端存储** - KuzuDB（如果启用后端）

### 数据安全
- ✅ 不上传到第三方服务器
- ✅ API Key 仅用于 LLM 调用
- ✅ 可选完全离线使用

### 权限说明
```json
{
  "permissions": [
    "storage",      // 本地存储
    "activeTab"     // 当前标签页访问
  ],
  "host_permissions": [
    "https://twitter.com/*",
    "https://reddit.com/*",
    "https://api.openai.com/*"
  ]
}
```

---

## 🐛 故障排除

### 问题 1：看不到扩展图标

**解决：**
```
1. 点击 Chrome 工具栏的 🧩 图标
2. 找到"Twitter Scraper Pro v2.2"
3. 点击图钉图标固定
```

### 问题 2：显示"离线模式"

**说明：** 正常现象，表示后端未运行

**解决：**
- 继续使用：数据存储在本地
- 启动后端：`python backend/server_minimal.py --port 8770`

### 问题 3：LLM 筛选失败

**检查：**
```
1. API Key 是否正确
2. API Key 是否有余额
3. 网络连接是否正常
```

**解决：**
```bash
# 测试 API
curl -X POST https://open.bigmodel.cn/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5","messages":[{"role":"user","content":"你好"}]}'
```

### 问题 4：数据不同步

**检查后端状态：**
```bash
curl http://localhost:8770/health
```

**手动触发同步：**
```
1. 点击扩展图标
2. 点击"立即同步"按钮
```

---

## 📈 性能优化

### Chrome 扩展优化

1. **定期清理本地缓存**
   - 默认保留 90 天数据
   - 每天自动检查

2. **批量同步**
   - 累积 50 条或每 10 分钟同步一次
   - 减少 API 调用次数

### Python 后端优化

1. **数据库索引**
   ```python
   # KuzuDB 自动创建主键索引
   # 可添加时间戳索引加速查询
   ```

2. **批量操作**
   ```python
   # 使用 add_posts_batch() 而非逐条添加
   ```

---

## 🔄 更新日志

### v2.2.0 (2026-02-25)
- ✨ 离线优先架构
- ✨ 自动同步管理器
- ✨ 状态指示器和警告横幅
- ✨ Playwright E2E 测试
- ✨ GitHub Actions CI/CD

### v2.1.0 (2026-02-24)
- ✨ Reddit 支持
- ✨ 双平台抓取

### v2.0.0 (2026-02-23)
- ✨ LLM 筛选
- ✨ 分类系统
- ✨ 分页浏览

---

## 🤝 支持

### 文档
- `README.md` - 主文档
- `INDEPENDENT_DEPLOYMENT.md` - 部署指南（本文件）
- `tests/TEST_REPORT.md` - 测试报告

### GitHub Issues
- 报告 Bug
- 功能建议
- 使用问题

### 社区
- 讨论区：GitHub Discussions
- 更新日志：Releases

---

## 📄 许可证

MIT License

---

**Twitter Scraper Pro v2.2** - 独立的社交媒体抓取工具 🐦
