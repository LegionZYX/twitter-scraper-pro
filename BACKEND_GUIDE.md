# Twitter Scraper Pro v2.2 - Python 后端使用指南

> 📦 可选组件 - 用于数据持久化和自动同步  
> 🚀 极简设计 - 仅 1 个依赖（kuzu）

---

## 🎯 后端作用

### 核心功能
1. **数据持久化** - KuzuDB 存储（无容量限制）
2. **自动同步** - 每 5 分钟检查并同步
3. **历史查询** - 查询任意时间段数据
4. **批量导出** - 导出为 CSV/JSON

### 与 Chrome 扩展的关系
```
Chrome 扩展（必须）          Python 后端（可选）
├── 实时抓取                 ├── 持久化存储
├── 本地缓存                 ├── 历史数据
├── UI 展示                   ├── 数据分析
└── 离线使用                 └── 自动同步
```

**无后端也能完全使用！** 后端是可选的增强功能。

---

## 🚀 快速启动

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

**依赖说明：**
```
kuzu==0.5.0     # 图数据库（唯一依赖）
```

### 2. 启动服务

```bash
python server_minimal.py --port 8770
```

**输出：**
```
18:30:45 [INFO] Initializing database at ./database/twitter_scraper...
18:30:46 [INFO] Database initialized
18:30:46 [INFO] Starting server on 127.0.0.1:8770
18:30:46 [OK] Server running - http://127.0.0.1:8770
```

### 3. 验证运行

```bash
# 健康检查
curl http://localhost:8770/health

# 返回：
{
  "status": "healthy",
  "database": "connected",
  "stats": {
    "posts": 0,
    "filtered_posts": 0,
    "discovery_results": 0
  }
}
```

---

## 🔧 配置选项

### 命令行参数

```bash
python server_minimal.py \
  --host 127.0.0.1 \
  --port 8770 \
  --db-path ./database/twitter_scraper
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--host` | 127.0.0.1 | 监听地址 |
| `--port` | 8770 | 监听端口 |
| `--db-path` | ./database/twitter_scraper | 数据库路径 |

### 环境变量（可选）

创建 `backend/.env` 文件：

```bash
KUZU_DB_PATH=./data/kuzu
LOG_LEVEL=INFO
```

---

## 📡 API 端点

### GET /health

健康检查

```bash
curl http://localhost:8770/health
```

**响应：**
```json
{
  "status": "healthy",
  "database": "connected",
  "stats": {...}
}
```

---

### GET /api/stats

获取统计数据

```bash
curl http://localhost:8770/api/stats
```

**响应：**
```json
{
  "posts": 150,
  "filtered_posts": 45,
  "discovery_results": 45,
  "archived_posts": 0,
  "sentiments": {
    "positive": 20,
    "negative": 5,
    "neutral": 20
  }
}
```

---

### GET /api/posts

获取帖子列表

```bash
curl "http://localhost:8770/api/posts?hours=24&limit=100"
```

**参数：**
- `hours` - 最近 N 小时（默认 24）
- `limit` - 最大数量（默认 100）
- `platform` - 平台过滤（twitter/reddit）

**响应：**
```json
{
  "posts": [...],
  "count": 100
}
```

---

### GET /api/posts/filtered

获取筛选后的帖子

```bash
curl "http://localhost:8770/api/posts/filtered?category=tech&limit=50"
```

**参数：**
- `category` - 分类过滤
- `limit` - 最大数量（默认 50）

---

### POST /api/posts/batch

批量上传帖子

```bash
curl -X POST http://localhost:8770/api/posts/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [...],
    "filtered": [...]
  }'
```

**响应：**
```json
{
  "status": "success",
  "posts_stored": 50,
  "filtered_stored": 15,
  "discovery_stored": 15
}
```

---

### POST /api/cleanup/run

手动触发清理

```bash
curl -X POST http://localhost:8770/api/cleanup/run \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

**参数：**
- `dry_run` - 预览模式（不实际删除）

---

## 💾 数据管理

### 数据库位置

```
twitter-scraper-extension-v2/backend/database/twitter_scraper/
```

### 备份数据库

```bash
# 复制整个数据库目录
cp -r backend/database/twitter_scraper /backup/location/
```

### 恢复数据库

```bash
# 停止后端
# 复制备份到原位置
cp -r /backup/location/twitter_scraper backend/database/
# 重启后端
```

### 清空数据

```bash
# 删除数据库目录
rm -rf backend/database/twitter_scraper
# 重启后端会自动创建
```

---

## 📊 监控与日志

### 查看日志

后端默认输出日志到控制台：

```
18:30:45 [INFO] Initializing database...
18:30:46 [OK] Database initialized
18:35:00 [INFO] Received batch: 50 posts
18:35:01 [OK] Batch stored: 50 posts, 15 filtered, 15 discovery
```

### 重定向日志到文件

```bash
python server_minimal.py --port 8770 > server.log 2>&1
```

### 查看实时日志

```bash
tail -f server.log
```

---

## 🔄 与 Chrome 扩展示同步

### 自动同步机制

1. **Chrome 扩展**每 5 分钟检查后端状态
2. **后端可用**时发送待同步数据
3. **后端不可用**时继续使用本地缓存
4. **后端恢复**后自动同步所有待处理数据

### 手动触发同步

在 Chrome 扩展中：
1. 点击扩展图标
2. 查看同步状态
3. 点击"立即同步"按钮

---

## 🧪 测试后端

### 测试数据库初始化

```bash
python -c "
import sys, os
sys.path.insert(0, '.')
os.environ['KUZU_DB_PATH'] = './database/test'
from database import SocialScraperKG
import asyncio

async def test():
    kg = SocialScraperKG('./database/test')
    await kg.init()
    stats = await kg.get_stats()
    print(f'Database initialized: {stats}')
    await kg.close()

asyncio.run(test())
"
```

### 测试 API 端点

```bash
# 健康检查
curl http://localhost:8770/health

# 获取统计
curl http://localhost:8770/api/stats

# 发送测试数据
curl -X POST http://localhost:8770/api/posts/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [{
      "id": "test_1",
      "platform": "twitter",
      "author": "test_user",
      "content": "Test post content",
      "url": "https://twitter.com/test/status/1",
      "timestamp": "2026-02-25T10:00:00Z",
      "score": 100,
      "replies": 10,
      "media": [],
      "scrapedAt": 1708851600000
    }]
  }'
```

---

## 🐛 故障排除

### 问题 1：端口被占用

**错误：**
```
OSError: [WinError 10048] Only one usage of each socket address is normally permitted
```

**解决：**
```bash
# Windows：查找占用端口的进程
netstat -ano | findstr :8770

# 杀死进程
taskkill /F /PID <PID>

# 或者使用其他端口
python server_minimal.py --port 8771
```

### 问题 2：KuzuDB 初始化失败

**错误：**
```
Exception: Failed to open database
```

**解决：**
```bash
# 删除损坏的数据库
rm -rf backend/database/twitter_scraper

# 重启后端会自动创建
python server_minimal.py --port 8770
```

### 问题 3：依赖安装失败

**错误：**
```
ERROR: Could not find a version that satisfies the requirement kuzu
```

**解决：**
```bash
# 升级 pip
python -m pip install --upgrade pip

# 重新安装
pip install -r requirements.txt

# 或者使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 📈 性能优化

### 批量操作

```python
# 好的做法：批量插入
await kg.add_posts_batch(posts)

# 不好的做法：逐条插入
for post in posts:
    await kg.add_post(post)
```

### 索引优化

KuzuDB 自动为 PRIMARY KEY 创建索引。

如需添加时间戳索引：
```python
# 在 schema 中添加
CREATE NODE INDEX ON Post(scrapedAt)
```

### 连接管理

```python
# 正确：使用完关闭连接
kg = SocialScraperKG(db_path)
await kg.init()
# ... 使用 ...
await kg.close()

# 错误：不关闭连接
kg = SocialScraperKG(db_path)
await kg.init()
# ... 使用后不关闭
```

---

## 📄 文件说明

```
backend/
├── server_minimal.py     # 极简 HTTP 服务器（150 行）
├── database.py           # KuzuDB 数据访问层（600 行）
├── requirements.txt      # Python 依赖（仅 kuzu）
├── TEST_REPORT.md        # 后端测试报告
└── database/             # 数据库目录
    └── twitter_scraper/  # KuzuDB 文件
```

---

## 🎓 最佳实践

### 1. 生产部署

```bash
# 使用 systemd 管理（Linux）
sudo systemctl add twitter-scraper-backend

# 使用 PM2 管理
pm2 start server_minimal.py --name twitter-backend

# 使用 Docker 部署
docker-compose up -d
```

### 2. 监控告警

添加健康检查脚本：
```bash
#!/bin/bash
# check_health.sh
curl -f http://localhost:8770/health || exit 1
```

### 3. 定期备份

```bash
# crontab 示例
# 每天凌晨 2 点备份
0 2 * * * cp -r /path/to/database /backup/$(date +\%Y\%m\%d)
```

---

## 📞 使用场景

### 场景 1：个人研究

```bash
# 本地运行，仅自己使用
python server_minimal.py --port 8770
```

### 场景 2：小团队共享

```bash
# 局域网内共享
python server_minimal.py --host 0.0.0.0 --port 8770
```

团队成员 Chrome 扩展配置：
```typescript
const BACKEND_HOST = 'http://192.168.1.100:8770'
```

### 场景 3：服务器部署

```bash
# 使用 Nginx 反向代理
# 配置 SSL 证书
# 添加认证机制
```

---

**文档版本：** 1.0  
**最后更新：** 2026-02-25  
**维护者：** Twitter Scraper Team
