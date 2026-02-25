# Social Scraper Pro v2.2 - Offline First

智能抓取 Twitter/Reddit 帖子，支持离线使用，自动同步到 KuzuDB 知识库。

## ✨ v2.2 新特性：离线优先架构

### 核心特性

- 🟢 **始终可用** - 即使后端服务不可用，扩展仍可正常工作
- 🔄 **自动同步** - 后端恢复后自动同步待处理数据
- 📦 **本地缓存** - Chrome Storage 存储，保留 90 天数据
- ⚠️ **状态提示** - 清晰显示在线/离线状态和待同步数量
- 🧹 **自动清理** - 定期清理旧数据，防止超出存储限制

### 工作流程

```
抓取数据 → Chrome Storage → 检查后端状态
                              ├─ 可用 → 同步到 KuzuDB
                              └─ 不可用 → 标记待同步
                                           ↓
                                    定期重试（每 5 分钟）
                                           ↓
                                    后端恢复后自动同步
```

## 📦 安装

### Chrome 扩展安装

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角的 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `dist` 文件夹

### 后端服务（可选）

后端服务是**可选的**，扩展可以在没有后端的情况下完全使用本地功能。

```bash
cd backend
pip install -r requirements.txt
python server_minimal.py --port 8770
```

## 🔧 配置

### LLM 配置

1. 点击扩展图标 → **设置**
2. 选择 LLM 提供商（智谱 GLM / DeepSeek / OpenAI）
3. 输入 API Key
4. 设置最低相关度分数（1-10）

### 后端服务配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--host` | 127.0.0.1 | 监听地址 |
| `--port` | 8770 | 监听端口 |
| `--db-path` | ./database/twitter_scraper | KuzuDB 路径 |

## 📊 同步状态说明

### 状态指示器

| 状态 | 图标 | 说明 |
|------|------|------|
| 🟢 在线 | 🟢 | 后端服务可用，数据实时同步 |
| 🟡 离线 | 🟡 | 后端服务不可用，使用本地缓存 |
| 🔄 同步中 | 🔄 | 正在同步待处理数据 |

### 警告横幅

当后端服务不可用且有待同步数据时，会显示警告横幅：
- 显示待同步数量
- 提供"立即同步"按钮
- 可手动关闭警告

## 📁 项目结构

```
twitter-scraper-extension-v2/
├── src/
│   ├── sync/                    # 离线优先同步模块
│   │   ├── types.ts             # 类型定义
│   │   ├── SyncManager.ts       # 同步管理器
│   │   └── cleanup.ts           # 清理策略
│   ├── popup/                   # 弹窗 UI
│   │   ├── App.tsx              # 主界面（集成状态显示）
│   │   ├── SyncStatusIndicator.tsx  # 状态指示器
│   │   ├── WarningBanner.tsx    # 警告横幅
│   │   └── styles.css           # 样式
│   ├── background/
│   │   └── index.ts             # 后台服务（启动同步）
│   └── nativeMessaging.ts       # 通信模块（支持降级）
├── backend/                     # Python 后端（可选）
│   ├── server_minimal.py        # 极简版后端（1 个依赖）
│   ├── database.py              # KuzuDB 数据访问
│   └── requirements.txt         # 依赖（仅 kuzu）
└── dist/                        # 构建输出
```

## 🔌 API 端点

如果运行后端服务，可用 API：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/health` | GET | 健康检查 |
| `/api/stats` | GET | 统计信息 |
| `/api/posts` | GET | 获取帖子 |
| `/api/posts/filtered` | GET | 筛选结果 |
| `/api/posts/batch` | POST | 批量接收 |
| `/api/discovery/stats` | GET | 发现性统计 |

## 🧪 测试

### 测试场景 1：后端正常运行

1. 启动后端服务：`python backend/server_minimal.py --port 8770`
2. 打开 Twitter 页面
3. 扩展抓取数据
4. 验证状态显示"🟢 在线"
5. 验证数据同步到 KuzuDB

### 测试场景 2：后端停止服务

1. 停止后端服务
2. 打开 Twitter 页面
3. 扩展抓取数据
4. 验证状态显示"🟡 离线模式"
5. 验证显示待同步数量
6. 验证显示警告横幅

### 测试场景 3：后端恢复

1. 重新启动后端服务
2. 等待自动同步（或点击"立即同步"）
3. 验证状态切换为"🟢 在线"
4. 验证待同步数量归零
5. 验证警告横幅消失

## 📈 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 启动时间 | <1 秒 | ✅ ~0.5 秒 |
| 内存占用 | <100MB | ✅ ~50MB |
| 依赖数量 | 最少 | ✅ 仅 kuzu (1 个) |
| 同步延迟 | <5 分钟 | ✅ 5 分钟自动检查 |
| 数据保留 | 90 天 | ✅ 可配置 |

## 🛠️ 开发

### 构建扩展

```bash
npm install
npm run build
```

### 启动后端

```bash
cd backend
pip install -r requirements.txt
python server_minimal.py --port 8770
```

### 运行测试

```bash
npm test
```

## 📝 更新日志

### v2.2 (2026-02-25) - Offline First

- ✨ 离线优先架构
- ✨ 自动同步管理器
- ✨ 状态指示器和警告横幅
- ✨ 本地缓存和定期清理
- ✨ 降级使用支持

### v2.1 (2026-02-24) - Reddit Support

- ✨ Reddit 支持
- ✨ 双平台抓取

### v2.0 (2026-02-23) - Core Features

- ✨ LLM 筛选
- ✨ 分类系统
- ✨ 分页浏览

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 已知问题

- Chrome Storage 容量限制为 10MB（已实现自动清理）
- 后端服务需要手动启动（已实现离线降级）

### TODO

- [ ] 发现性功能 UI（情感分析/KOL 识别/趋势检测）
- [ ] 批量筛选功能
- [ ] 数据导出增强（JSON/RSS）
- [ ] 多设备同步

---

**Social Scraper Pro v2.2** - 即使离线，也能高效抓取！
