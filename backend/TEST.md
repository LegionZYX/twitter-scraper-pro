# Twitter Scraper v2.2 - 后端测试

## 快速测试

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动后端服务

```bash
python server.py --port 8769
```

### 3. 测试 API

```bash
# 健康检查
curl http://localhost:8769/health

# 获取统计
curl http://localhost:8769/api/stats

# 获取帖子
curl http://localhost:8769/api/posts?limit=10
```

## 数据库位置

```
twitter-scraper-extension-v2/database/twitter_scraper/
```

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /api/stats` | 总体统计 |
| `GET /api/posts` | 获取帖子 |
| `GET /api/posts/filtered` | 筛选结果 |
| `GET /api/discovery/stats` | 发现性统计 |
| `POST /api/posts/batch` | 批量接收 |
| `POST /api/cleanup/run` | 清理任务 |

## 下一步

Chrome 扩展需要配置：
1. 更新 `src/nativeMessaging.ts` 的端口为 8769
2. 开发 DiscoveryTab 和 KnowledgeGraphTab 组件
3. 测试批量同步功能
