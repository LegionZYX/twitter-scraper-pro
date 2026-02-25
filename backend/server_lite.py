"""
Twitter Scraper Backend - 轻量级版本
使用 Python 内置 HTTP 服务器，无需 FastAPI 依赖
"""

import json
import sys
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from database import SocialScraperKG

# 全局变量
kg: SocialScraperKG = None


class TwitterScraperHandler(BaseHTTPRequestHandler):
    """HTTP 请求处理器"""
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")
    
    def send_json(self, data: dict, status: int = 200):
        """发送 JSON 响应"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """处理 GET 请求"""
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        
        try:
            if path == '/':
                self.send_json({
                    "service": "Twitter Scraper Backend",
                    "version": "2.2.0-lite",
                    "status": "running"
                })
            
            elif path == '/health':
                stats = asyncio_run(kg.get_stats())
                self.send_json({
                    "status": "healthy",
                    "database": "connected",
                    "stats": stats
                })
            
            elif path == '/api/stats':
                stats = asyncio_run(kg.get_stats())
                discovery = asyncio_run(kg.get_discovery_stats())
                self.send_json({
                    **stats,
                    "sentiments": discovery.get("sentiments", {}),
                    "kols": discovery.get("kols", 0),
                    "trends": discovery.get("trends", 0)
                })
            
            elif path == '/api/posts':
                hours = int(params.get('hours', [24])[0])
                limit = int(params.get('limit', [100])[0])
                posts = asyncio_run(kg.get_recent_posts(hours, limit))
                self.send_json({"posts": posts, "count": len(posts)})
            
            elif path == '/api/posts/filtered':
                category = params.get('category', [None])[0]
                limit = int(params.get('limit', [50])[0])
                posts = asyncio_run(kg.get_filtered_posts(category, limit))
                self.send_json({"posts": posts, "count": len(posts)})
            
            elif path == '/api/discovery/stats':
                stats = asyncio_run(kg.get_discovery_stats())
                self.send_json({"stats": stats})
            
            else:
                self.send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            self.send_json({"error": str(e)}, 500)
    
    def do_POST(self):
        """处理 POST 请求"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            data = json.loads(body) if body else {}
            
            if path == '/api/posts/batch':
                posts = data.get('posts', [])
                filtered = data.get('filtered', [])
                discovery = data.get('discovery', [])
                
                # 存储帖子
                posts_count = asyncio_run(kg.add_posts_batch(posts))
                
                # 存储筛选结果
                filtered_count = 0
                for fp in filtered:
                    if asyncio_run(kg.add_filtered_post(fp)):
                        filtered_count += 1
                
                # 存储发现性分析
                discovery_count = 0
                for dr in discovery:
                    if asyncio_run(kg.add_discovery_result(dr)):
                        discovery_count += 1
                
                self.send_json({
                    "status": "success",
                    "posts_stored": posts_count,
                    "filtered_stored": filtered_count,
                    "discovery_stored": discovery_count
                })
            
            elif path == '/api/cleanup/run':
                dry_run = data.get('dry_run', False)
                rules = asyncio_run(kg.get_cleanup_rules())
                
                results = []
                if not dry_run:
                    for rule in rules:
                        if rule['targetType'] == 'Post' and rule['condition'] == 'age_days':
                            affected = asyncio_run(kg.archive_old_posts(rule['threshold']))
                            results.append({"rule": rule['id'], "affected": affected})
                
                self.send_json({
                    "status": "success",
                    "dry_run": dry_run,
                    "results": results
                })
            
            else:
                self.send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            self.send_json({"error": str(e)}, 500)


def asyncio_run(coro):
    """兼容不同 Python 版本的 asyncio 运行"""
    import asyncio
    try:
        return asyncio.run(coro)
    except AttributeError:
        # Python 3.6 兼容
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro)


def main():
    """启动服务"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Twitter Scraper Backend (Lite)")
    parser.add_argument("--host", default="127.0.0.1", help="Host")
    parser.add_argument("--port", type=int, default=8769, help="Port")
    parser.add_argument("--db-path", default="./database/twitter_scraper", help="Database path")
    
    args = parser.parse_args()
    
    global kg
    print(f"[INFO] Initializing database at {args.db_path}...")
    kg = SocialScraperKG(args.db_path)
    asyncio_run(kg.init())
    
    print(f"[OK] Database initialized")
    print(f"[INFO] Starting server on {args.host}:{args.port}")
    
    server = HTTPServer((args.host, args.port), TwitterScraperHandler)
    print(f"[OK] Server running - http://{args.host}:{args.port}")
    print("[INFO] Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
        asyncio_run(kg.close())
        server.shutdown()
        print("[OK] Server stopped")


if __name__ == "__main__":
    main()
