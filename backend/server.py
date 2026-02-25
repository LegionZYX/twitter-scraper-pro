"""
Social Scraper FastAPI Backend
提供 HTTP API 供 Chrome 扩展调用
"""

import os
import sys
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from loguru import logger

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from database import SocialScraperKG

# 配置日志
logger.remove()
logger.add(
    "logs/social_scraper_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="7 days",
    level="DEBUG",
    format="{time:HH:mm:ss} | {level} | {message}"
)
logger.add(sys.stdout, level="INFO")

# FastAPI 应用
app = FastAPI(
    title="Social Scraper API",
    description="Chrome Extension Backend for Social Scraper Pro",
    version="2.2.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chrome 扩展不受 CORS 限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量
kg: Optional[SocialScraperKG] = None


# ========== Pydantic 模型 ==========

class Post(BaseModel):
    id: str
    platform: str = "twitter"
    author: str
    authorDisplayName: str = ""
    content: str
    title: Optional[str] = ""
    url: str
    timestamp: str
    score: int = 0
    replies: int = 0
    raw: bool = False
    scrapedAt: str
    metadata: Dict[str, Any] = {}


class FilteredPost(BaseModel):
    id: str
    postId: str
    relevanceScore: float
    category: str
    subCategory: Optional[str] = ""
    reason: str
    summary: Optional[str] = ""
    keywords: List[str] = []
    filteredAt: str


class DiscoveryResult(BaseModel):
    id: str
    postId: str
    sentiment: Optional[Dict[str, Any]] = {}
    kolProfile: Optional[Dict[str, Any]] = {}
    trendData: Optional[Dict[str, Any]] = {}
    alertTrigger: Optional[List[Dict[str, Any]]] = []
    analyzedAt: str


class BatchPostRequest(BaseModel):
    posts: List[Post]
    filtered: Optional[List[FilteredPost]] = []
    discovery: Optional[List[DiscoveryResult]] = []


class CleanupRequest(BaseModel):
    dry_run: bool = False  # 只预览，不实际执行


# ========== 生命周期管理 ==========

@app.on_event("startup")
async def startup_event():
    """启动时初始化 KuzuDB"""
    global kg
    
    db_path = os.getenv("KUZU_DB_PATH", "./data/knowledge_graph")
    kg = SocialScraperKG(db_path)
    await kg.init()
    
    logger.info("Social Scraper API started")


@app.on_event("shutdown")
async def shutdown_event():
    """关闭时清理资源"""
    global kg
    if kg:
        await kg.close()
    logger.info("Social Scraper API stopped")


# ========== API 端点 ==========

@app.get("/")
async def root():
    """根路径 - 健康检查"""
    return {
        "service": "Social Scraper API",
        "version": "2.2.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        stats = await kg.get_stats()
        return {
            "status": "healthy",
            "database": "connected",
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/posts/batch")
async def receive_posts_batch(request: BatchPostRequest):
    """
    批量接收帖子（精选后的内容）
    
    接收 Chrome 扩展发送的批量数据：
    - posts: 原始帖子（精选后，约 20-30%）
    - filtered: LLM 筛选结果
    - discovery: 发现性分析结果
    """
    try:
        logger.info(f"Received batch: {len(request.posts)} posts, {len(request.filtered)} filtered, {len(request.discovery)} discovery")
        
        # 1. 存储原始帖子
        posts_data = [post.dict() for post in request.posts]
        posts_count = await kg.add_posts_batch(posts_data)
        
        # 2. 存储筛选结果
        filtered_count = 0
        for fp in request.filtered:
            if await kg.add_filtered_post(fp.dict()):
                filtered_count += 1
        
        # 3. 存储发现性分析结果
        discovery_count = 0
        for dr in request.discovery:
            if await kg.add_discovery_result(dr.dict()):
                discovery_count += 1
        
        logger.info(
            f"Batch stored: {posts_count} posts, "
            f"{filtered_count} filtered, "
            f"{discovery_count} discovery"
        )
        
        return {
            "status": "success",
            "posts_stored": posts_count,
            "filtered_stored": filtered_count,
            "discovery_stored": discovery_count,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to store batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/posts")
async def get_posts(
    hours: int = 24,
    limit: int = 100,
    platform: Optional[str] = None
):
    """获取最近的帖子"""
    try:
        posts = await kg.get_recent_posts(hours=hours, limit=limit)
        
        # 平台过滤
        if platform:
            posts = [p for p in posts if p.get("platform") == platform]
        
        return {
            "posts": posts,
            "count": len(posts),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/posts/filtered")
async def get_filtered_posts(
    category: Optional[str] = None,
    limit: int = 50
):
    """获取筛选后的帖子"""
    try:
        posts = await kg.get_filtered_posts(category=category, limit=limit)
        
        return {
            "posts": posts,
            "count": len(posts),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get filtered posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/discovery/stats")
async def get_discovery_stats():
    """获取发现性分析统计"""
    try:
        stats = await kg.get_discovery_stats()
        
        return {
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get discovery stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    """获取总体统计信息"""
    try:
        stats = await kg.get_stats()
        discovery_stats = await kg.get_discovery_stats()
        
        return {
            "posts": stats.get("posts", 0),
            "filtered_posts": stats.get("filtered_posts", 0),
            "discovery_results": stats.get("discovery_results", 0),
            "archived_posts": stats.get("archived_posts", 0),
            "sentiments": discovery_stats.get("sentiments", {}),
            "kols": discovery_stats.get("kols", 0),
            "trends": discovery_stats.get("trends", 0),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cleanup/run")
async def run_cleanup(
    request: CleanupRequest,
    background_tasks: BackgroundTasks
):
    """
    运行清理任务
    
    可以后台执行或立即返回预览结果
    """
    try:
        rules = await kg.get_cleanup_rules(enabled_only=True)
        logger.info(f"Running cleanup with {len(rules)} rules")
        
        results = []
        
        for rule in rules:
            rule_result = {
                "rule_id": rule["id"],
                "targetType": rule["targetType"],
                "condition": rule["condition"],
                "action": rule["action"],
                "affected": 0,
                "executed": not request.dry_run
            }
            
            # 执行清理动作
            if not request.dry_run:
                if rule["targetType"] == "Post" and rule["condition"] == "age_days":
                    rule_result["affected"] = await kg.archive_old_posts(
                        days=rule["threshold"]
                    )
                elif rule["targetType"] == "FilteredPost" and rule["condition"] == "relevance_below":
                    rule_result["affected"] = await kg.delete_low_relevance_posts(
                        threshold=rule["threshold"]
                    )
            else:
                # Dry run - 只统计数量，不实际删除
                rule_result["affected"] = 0  # TODO: 实现预览逻辑
            
            results.append(rule_result)
        
        return {
            "status": "success",
            "dry_run": request.dry_run,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cleanup/rules")
async def get_cleanup_rules():
    """获取清理规则"""
    try:
        rules = await kg.get_cleanup_rules(enabled_only=False)
        
        return {
            "rules": rules,
            "count": len(rules),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get cleanup rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== 主程序 ==========

def main():
    """启动服务"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Twitter Scraper Backend")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8769, help="Port to listen on")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--db-path", default="./database/twitter_scraper", help="KuzuDB path")
    
    args = parser.parse_args()
    
    # 设置环境变量
    os.environ["KUZU_DB_PATH"] = args.db_path
    
    logger.info(f"Starting Twitter Scraper API on {args.host}:{args.port}")
    
    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()
