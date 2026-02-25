# Twitter Scraper Backend - 版本对比

## 轻量版 (Lite) ✅ 推荐

**文件：** `server_lite.py`

### 优点
- ✅ **零依赖** - 仅需 kuzu 和 loguru
- ✅ **极简代码** - 单文件 200 行
- ✅ **快速启动** - 无框架开销
- ✅ **易于调试** - 标准库 HTTP 服务器
- ✅ **完全兼容** - API 与完整版一致

### 缺点
- ❌ 无自动重载
- ❌ 无异步支持（使用兼容层）
- ❌ 无 Pydantic 验证

### 安装
```bash
pip install kuzu loguru
```

### 启动
```bash
python server_lite.py --port 8769
```

---

## 完整版 (Full)

**文件：** `server.py`

### 优点
- ✅ FastAPI 完整功能
- ✅ 异步支持
- ✅ 自动重载
- ✅ Pydantic 数据验证
- ✅ Swagger UI 文档

### 缺点
- ❌ 依赖多（FastAPI, uvicorn, pydantic）
- ❌ 代码复杂（400+ 行）
- ❌ 启动慢

### 安装
```bash
pip install -r requirements_full.txt
```

### 启动
```bash
python server.py --port 8769 --reload
```

---

## API 对比

| 端点 | Lite | Full |
|------|------|------|
| GET / | ✅ | ✅ |
| GET /health | ✅ | ✅ |
| GET /api/stats | ✅ | ✅ |
| GET /api/posts | ✅ | ✅ |
| GET /api/posts/filtered | ✅ | ✅ |
| GET /api/discovery/stats | ✅ | ✅ |
| POST /api/posts/batch | ✅ | ✅ |
| POST /api/cleanup/run | ✅ | ✅ |

**结论：** API 完全一致，可无缝切换

---

## 性能对比

| 指标 | Lite | Full |
|------|------|------|
| **启动时间** | ~1 秒 | ~3 秒 |
| **内存占用** | ~50MB | ~100MB |
| **依赖数量** | 2 个 | 10+ 个 |
| **代码行数** | 200 | 400+ |

---

## 推荐使用场景

### 选择 Lite 版：
- ✅ 本地开发
- ✅ 简单部署
- ✅ 资源受限环境
- ✅ 快速原型

### 选择 Full 版：
- ✅ 需要 Swagger UI
- ✅ 需要自动重载
- ✅ 需要异步处理
- ✅ 生产环境

---

## 当前状态

**✅ Lite 版已部署并运行**
- 地址：http://localhost:8769
- 状态：健康
- 数据库：已连接

---

## 快速切换

如需切换到 Full 版：

```bash
# 停止 Lite 版
taskkill /F /IM python.exe

# 安装 Full 版依赖
pip install fastapi uvicorn pydantic

# 启动 Full 版
python server.py --port 8769
```
