"""
Twitter Scraper Backend - 极简版
仅依赖 kuzu，使用 Python 标准库
"""

import json
import sys
import asyncio
import logging
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# 导入数据库
sys.path.insert(0, str(Path(__file__).parent))
from database import SocialScraperKG

kg: SocialScraperKG = None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info(args[0])
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        
        try:
            if path == '/':
                self.send_json({"service": "Twitter Scraper", "version": "2.2-minimal"})
            
            elif path == '/health':
                stats = asyncio.run(kg.get_stats())
                self.send_json({"status": "healthy", "database": "connected", "stats": stats})
            
            elif path == '/api/stats':
                stats = asyncio.run(kg.get_stats())
                discovery = asyncio.run(kg.get_discovery_stats())
                self.send_json({**stats, "sentiments": discovery.get("sentiments", {})})
            
            elif path == '/api/posts':
                hours = int(params.get('hours', [24])[0])
                limit = int(params.get('limit', [100])[0])
                posts = asyncio.run(kg.get_recent_posts(hours, limit))
                self.send_json({"posts": posts, "count": len(posts)})
            
            elif path == '/api/posts/filtered':
                category = params.get('category', [None])[0]
                limit = int(params.get('limit', [50])[0])
                posts = asyncio.run(kg.get_filtered_posts(category, limit))
                self.send_json({"posts": posts, "count": len(posts)})
            
            elif path == '/api/discovery/stats':
                stats = asyncio.run(kg.get_discovery_stats())
                self.send_json({"stats": stats})
            
            else:
                self.send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            self.send_json({"error": str(e)}, 500)
    
    def do_POST(self):
        path = urlparse(self.path).path
        
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length).decode()) if length else {}
            
            if path == '/api/posts/batch':
                posts = data.get('posts', [])
                filtered = data.get('filtered', [])
                discovery = data.get('discovery', [])
                
                posts_count = asyncio.run(kg.add_posts_batch(posts))
                filtered_count = sum(1 for fp in filtered if asyncio.run(kg.add_filtered_post(fp)))
                discovery_count = sum(1 for dr in discovery if asyncio.run(kg.add_discovery_result(dr)))
                
                self.send_json({
                    "status": "success",
                    "posts": posts_count,
                    "filtered": filtered_count,
                    "discovery": discovery_count
                })
            
            else:
                self.send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            self.send_json({"error": str(e)}, 500)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Twitter Scraper Backend (Minimal)")
    parser.add_argument("--host", default="127.0.0.1", help="Host")
    parser.add_argument("--port", type=int, default=8769, help="Port")
    parser.add_argument("--db-path", default="./database/twitter_scraper", help="DB path")
    args = parser.parse_args()
    
    global kg
    logger.info(f"Initializing database at {args.db_path}...")
    kg = SocialScraperKG(args.db_path)
    asyncio.run(kg.init())
    
    logger.info(f"Starting server on {args.host}:{args.port}")
    server = HTTPServer((args.host, args.port), Handler)
    logger.info(f"Server running - http://{args.host}:{args.port}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        asyncio.run(kg.close())
        server.shutdown()
        logger.info("Server stopped")


if __name__ == "__main__":
    main()
