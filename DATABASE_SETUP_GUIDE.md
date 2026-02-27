# 🗄️ Twitter Scraper Pro - 本地数据库完整搭建指南

> 本指南教你如何搭建完整的本地数据持久化系统  
> 📦 支持：KuzuDB 图数据库 + 自动同步 + 历史查询

---

## 📋 目录

1. [方案选择](#方案选择)
2. [方案 A：仅 Chrome 扩展（零配置）](#方案-a 仅 chrome 扩展零配置)
3. [方案 B：Chrome 扩展 + Python 后端（推荐）](#方案-bchrome 扩展--python-后端推荐)
4. [方案 C：Docker 部署（高级）](#方案-cdocker 部署高级)
5. [数据库管理](#数据库管理)
6. [故障排除](#故障排除)

---

## 🎯 方案选择

| 方案 | 适用场景 | 难度 | 数据容量 |
|------|----------|------|----------|
| **方案 A** | 临时使用、轻度用户 | ⭐ 简单 | 10MB (Chrome Storage) |
| **方案 B** | 日常使用、研究人员 | ⭐⭐ 中等 | 无限 (KuzuDB) |
| **方案 C** | 团队使用、生产环境 | ⭐⭐⭐ 复杂 | 无限 + 多用户 |

---

## 方案 A：仅 Chrome 扩展（零配置）

### 适用人群
- ✅ 不想安装 Python
- ✅ 只需要临时抓取
- ✅ 数据量小（<1000 条）

### 安装步骤

#### 1. 打开 Chrome 扩展管理页
```
chrome://extensions/
```

#### 2. 开启开发者模式
点击右上角开关

#### 3. 加载扩展
- 点击"加载已解压的扩展程序"
- 选择 `dist` 文件夹
- 扩展图标出现在工具栏

#### 4. 配置 API Key
- 点击扩展图标
- 进入"设置"标签
- 输入 [智谱 API Key](https://open.bigmodel.cn/api-keys)
- 保存

#### 5. 开始使用
- 访问 twitter.com 或 reddit.com
- 开始浏览，自动抓取

### 数据管理

#### 查看本地数据
```javascript
// 在扩展弹窗控制台执行
const data = await chrome.storage.local.get(['posts', 'filteredPosts']);
console.log(`本地帖子数：${data.posts?.length || 0}`);
console.log(`筛选后帖子数：${data.filteredPosts?.length || 0}`);
```

#### 导出数据
1. 点击扩展图标
2. 点击"📥 导出全部"
3. 自动下载 CSV 文件

#### 清理数据
1. 点击扩展图标
2. 进入"全部帖子"标签
3. 点击"清空"按钮

### 限制
- ⚠️ 最多存储 ~10MB 数据
- ⚠️ 清除扩展会丢失数据
- ⚠️ 无法跨设备同步

---

## 方案 B：Chrome 扩展 + Python 后端（推荐）

### 适用人群
- ✅ 日常频繁使用
- ✅ 需要数据持久化
- ✅ 需要历史查询
- ✅ 数据量大（>1000 条）

### 系统要求
- Python 3.8+
- 操作系统：Windows/Mac/Linux
- 内存：最少 512MB

### 完整安装步骤

#### 步骤 1：安装 Python

**Windows:**
```powershell
# 从官网下载
# https://www.python.org/downloads/
# 安装时勾选 "Add Python to PATH"
```

**Mac:**
```bash
brew install python@3.11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

**验证安装:**
```bash
python --version
# 应该显示：Python 3.8.x 或更高
```

#### 步骤 2：克隆项目

```bash
# 克隆 GitHub 仓库
git clone https://github.com/LegionZYX/twitter-scraper-pro.git
cd twitter-scraper-pro/twitter-scraper-extension-v2
```

#### 步骤 3：安装 Python 依赖

```bash
cd backend
pip install -r requirements.txt
```

**如果 pip 安装慢（国内用户）:**
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

**依赖说明:**
```
kuzu==0.5.0     # 图数据库（核心）
```

#### 步骤 4：初始化数据库

```bash
cd backend
python -c "
import asyncio
from database import SocialScraperKG

async def init():
    kg = SocialScraperKG('./database/twitter_scraper')
    await kg.init()
    print('✓ 数据库初始化成功')
    stats = await kg.get_stats()
    print(f'数据库路径：./database/twitter_scraper')
    print(f'初始统计：{stats}')
    await kg.close()

asyncio.run(init())
"
```

**输出示例:**
```
✓ 数据库初始化成功
数据库路径：./database/twitter_scraper
初始统计：{'posts': 0, 'filtered_posts': 0, 'discovery_results': 0, 'archived_posts': 0}
```

#### 步骤 5：启动后端服务

```bash
# 基础启动
python server_minimal.py --port 8770

# 带日志输出
python server_minimal.py --port 8770 2>&1 | tee server.log

# 后台运行（Linux/Mac）
nohup python server_minimal.py --port 8770 > server.log 2>&1 &

# Windows 后台运行
start /B python server_minimal.py --port 8770
```

**成功输出:**
```
18:30:45 [INFO] Initializing database at ./database/twitter_scraper...
18:30:46 [INFO] Database initialized
18:30:46 [INFO] Starting server on 127.0.0.1:8770
18:30:46 [OK] Server running - http://127.0.0.1:8770
```

#### 步骤 6：验证后端

```bash
# 健康检查
curl http://localhost:8770/health

# 或者在浏览器访问
# http://localhost:8770/health
```

**响应示例:**
```json
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

#### 步骤 7：配置 Chrome 扩展

1. **加载扩展**
   ```
   chrome://extensions/
   → 开发者模式
   → 加载已解压的扩展程序
   → 选择 dist 文件夹
   ```

2. **自动同步**
   - 扩展会每 5 分钟自动检查后端
   - 后端可用时自动同步数据
   - 无需手动配置

3. **验证连接**
   - 点击扩展图标
   - 查看状态指示器
   - 应该显示"🟢 在线"

---

## 方案 C：Docker 部署（高级）

### 适用人群
- ✅ 团队使用
- ✅ 需要多用户
- ✅ 生产环境部署

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 内存：最少 1GB

### 创建 Dockerfile

**文件：** `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 创建数据库目录
RUN mkdir -p /app/database/twitter_scraper

# 暴露端口
EXPOSE 8770

# 启动命令
CMD ["python", "server_minimal.py", "--host", "0.0.0.0", "--port", "8770"]
```

### 创建 docker-compose.yml

**文件：** `docker-compose.yml`

```yaml
version: '3.8'

services:
  twitter-scraper-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8770:8770"
    volumes:
      - ./backend/database:/app/database
    restart: unless-stopped
    environment:
      - LOG_LEVEL=INFO
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8770/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 验证运行
curl http://localhost:8770/health
```

### 管理命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 进入容器
docker-compose exec twitter-scraper-backend bash
```

---

## 🗄️ 数据库管理

### 数据备份

#### 方法 1：手动备份

```bash
# 停止后端服务
# 复制数据库目录
cp -r backend/database/twitter_scraper /backup/location/twitter_scraper_$(date +%Y%m%d)

# 或者压缩备份
tar -czf twitter_scraper_backup_$(date +%Y%m%d).tar.gz backend/database/twitter_scraper
```

#### 方法 2：自动备份脚本

**文件：** `scripts/backup.sh` (Linux/Mac)

```bash
#!/bin/bash

BACKUP_DIR="/backup/twitter_scraper"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="./backend/database/twitter_scraper"

mkdir -p $BACKUP_DIR

echo "开始备份数据库..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $DB_PATH

if [ $? -eq 0 ]; then
    echo "✓ 备份成功：$BACKUP_DIR/backup_$DATE.tar.gz"
    
    # 清理 7 天前的备份
    find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
    echo "✓ 已清理旧备份"
else
    echo "✗ 备份失败"
    exit 1
fi
```

**设置定时任务:**
```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

### 数据恢复

```bash
# 停止后端服务
# 解压备份
tar -xzf twitter_scraper_backup_20260225.tar.gz -C ./backend/database/

# 重启后端
python server_minimal.py --port 8770
```

### 数据查询

#### 使用 Python 脚本查询

**文件：** `scripts/query_posts.py`

```python
import asyncio
import sys
sys.path.insert(0, '../backend')

from database import SocialScraperKG

async def query():
    kg = SocialScraperKG('../backend/database/twitter_scraper')
    await kg.init()
    
    # 查询最近 24 小时的帖子
    posts = await kg.get_recent_posts(hours=24, limit=10)
    
    print(f"找到 {len(posts)} 条帖子:")
    for post in posts:
        print(f"- {post['author']}: {post['content'][:50]}...")
    
    # 获取统计
    stats = await kg.get_stats()
    print(f"\n数据库统计:")
    print(f"  总帖子数：{stats['posts']}")
    print(f"  筛选后：{stats['filtered_posts']}")
    print(f"  已归档：{stats['archived_posts']}")
    
    await kg.close()

asyncio.run(query())
```

**运行:**
```bash
cd scripts
python query_posts.py
```

### 性能优化

#### 1. 批量操作

```python
# 好的做法
await kg.add_posts_batch(posts)

# 不好的做法
for post in posts:
    await kg.add_post(post)
```

#### 2. 定期清理

```python
# 添加自动清理任务
from scheduler import add_cleanup_job

add_cleanup_job(
    days_to_keep=90,  # 保留 90 天
    min_relevance_score=3  # 最低相关度
)
```

#### 3. 索引优化

KuzuDB 自动为 PRIMARY KEY 创建索引。

如需添加自定义索引：
```python
# 在 schema.py 中添加
CREATE NODE INDEX ON Post(scrapedAt)
CREATE NODE INDEX ON FilteredPost(category)
```

---

## 🐛 故障排除

### 问题 1：端口被占用

**错误:**
```
OSError: [WinError 10048] Only one usage of each socket address is normally permitted
```

**解决:**
```bash
# Windows：查找占用端口的进程
netstat -ano | findstr :8770

# 杀死进程
taskkill /F /PID <PID>

# 或者使用其他端口
python server_minimal.py --port 8771
```

### 问题 2：KuzuDB 初始化失败

**错误:**
```
Exception: Failed to open database
```

**解决:**
```bash
# 删除损坏的数据库
rm -rf backend/database/twitter_scraper

# 重新初始化
python -c "
import asyncio
from database import SocialScraperKG
async def init():
    kg = SocialScraperKG('./database/twitter_scraper')
    await kg.init()
    print('✓ 数据库重新初始化成功')
    await kg.close()
asyncio.run(init())
"
```

### 问题 3：Chrome 扩展无法连接后端

**检查:**
```bash
# 验证后端运行
curl http://localhost:8770/health

# 检查防火墙
# Windows: 允许 Python 通过防火墙
# Mac/Linux: sudo ufw allow 8770
```

**解决:**
1. 确保后端正在运行
2. 检查防火墙设置
3. 重启 Chrome 浏览器

### 问题 4：依赖安装失败

**错误:**
```
ERROR: Could not find a version that satisfies the requirement kuzu
```

**解决:**
```bash
# 升级 pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或者手动安装 kuzu
pip install kuzu==0.5.0
```

### 问题 5：数据不同步

**检查后端日志:**
```bash
# 查看日志
tail -f backend/server.log

# 或者实时查看
python server_minimal.py --port 8770 2>&1 | grep -E "(INFO|ERROR|OK)"
```

**手动触发同步:**
1. 点击扩展图标
2. 查看同步状态
3. 点击"立即同步"按钮

---

## 📊 数据库监控

### 查看数据库大小

```bash
# Linux/Mac
du -sh backend/database/twitter_scraper

# Windows
Get-ChildItem backend\database\twitter_scraper -Recurse | Measure-Object -Property Length -Sum
```

### 查看帖子数量

```bash
curl http://localhost:8770/api/stats | python -m json.tool
```

### 设置告警

**脚本：** `scripts/monitor.py`

```python
import requests
import smtplib
from email.mime.text import MIMEText

def check_health():
    try:
        response = requests.get('http://localhost:8770/health', timeout=5)
        if response.ok:
            print('✓ 后端健康')
            return True
        else:
            send_alert('后端响应异常')
            return False
    except:
        send_alert('后端无法连接')
        return False

def send_alert(message):
    # 发送邮件/Telegram/飞书通知
    print(f'⚠️ 告警：{message}')

if __name__ == '__main__':
    check_health()
```

**定时运行:**
```bash
# 每 5 分钟检查一次
*/5 * * * * python scripts/monitor.py
```

---

## 📚 相关文档

- [README.md](README.md) - 主文档
- [INDEPENDENT_DEPLOYMENT.md](INDEPENDENT_DEPLOYMENT.md) - 独立部署指南
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - 后端使用指南
- [GITHUB_PUSH_GUIDE.md](GITHUB_PUSH_GUIDE.md) - GitHub 推送指南

---

## 🤝 获取帮助

- **GitHub Issues:** 报告 Bug
- **GitHub Discussions:** 使用问题
- **文档:** 查看相关文档

---

**最后更新：** 2026-02-27  
**维护者：** Twitter Scraper Team
