"""
Social Scraper Backend Launcher
按需启动后台服务
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_port_available(port: int) -> bool:
    """检查端口是否可用"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result != 0
    except:
        return False

def is_backend_running(port: int = 8768) -> bool:
    """检查后台服务是否已在运行"""
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_backend(
    port: int = 8768,
    host: str = "127.0.0.1",
    db_path: str = None,
    background: bool = True
) -> subprocess.Popen:
    """启动后台服务"""
    
    if is_backend_running(port):
        print(f"✅ Backend already running on port {port}")
        return None
    
    # 查找后端脚本
    script_dir = Path(__file__).parent
    backend_script = script_dir / "social_scraper_backend.py"
    
    if not backend_script.exists():
        print(f"❌ Backend script not found: {backend_script}")
        sys.exit(1)
    
    # 构建命令
    cmd = [
        sys.executable,
        str(backend_script),
        "--host", host,
        "--port", str(port)
    ]
    
    if db_path:
        cmd.extend(["--db-path", db_path])
    
    print(f"🚀 Starting Social Scraper Backend on {host}:{port}")
    print(f"   Database: {db_path or './data/knowledge_graph'}")
    
    # 启动进程
    if background:
        process = subprocess.Popen(
            cmd,
            cwd=str(script_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True
        )
        
        # 等待服务启动
        print("   Waiting for service to start...")
        for i in range(30):  # 最多等待 30 秒
            time.sleep(1)
            if is_backend_running(port):
                print(f"✅ Backend started successfully (PID: {process.pid})")
                return process
            if process.poll() is not None:
                # 进程已退出
                stdout, stderr = process.communicate()
                print(f"❌ Backend failed to start:")
                print(f"   STDOUT: {stdout.decode()}")
                print(f"   STDERR: {stderr.decode()}")
                sys.exit(1)
        
        print(f"⚠️  Backend may still be starting (PID: {process.pid})")
        return process
    else:
        # 前台运行
        subprocess.run(cmd, cwd=str(script_dir))
        return None

def stop_backend(port: int = 8768):
    """停止后台服务"""
    import signal
    
    # 查找进程
    try:
        import psutil
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or [])
                if 'social_scraper_backend' in cmdline and str(port) in cmdline:
                    print(f"Stopping backend process {proc.info['pid']}...")
                    proc.send_signal(signal.SIGTERM)
                    proc.wait(timeout=5)
                    print(f"✅ Backend stopped")
                    return True
            except:
                continue
        
        print("⚠️  No running backend found")
        return False
        
    except ImportError:
        print("⚠️  psutil not installed, cannot stop backend automatically")
        print("   Please stop it manually")
        return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Social Scraper Backend Launcher")
    parser.add_argument("action", choices=["start", "stop", "restart", "status"],
                       help="Action to perform")
    parser.add_argument("--port", type=int, default=8768, help="Port number")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--db-path", help="KuzuDB path")
    parser.add_argument("--foreground", action="store_true", help="Run in foreground")
    
    args = parser.parse_args()
    
    if args.action == "start":
        if is_backend_running(args.port):
            print(f"✅ Backend already running on port {args.port}")
        else:
            start_backend(
                port=args.port,
                host=args.host,
                db_path=args.db_path,
                background=not args.foreground
            )
    
    elif args.action == "stop":
        stop_backend(args.port)
    
    elif args.action == "restart":
        stop_backend(args.port)
        time.sleep(2)
        start_backend(
            port=args.port,
            host=args.host,
            db_path=args.db_path,
            background=not args.foreground
        )
    
    elif args.action == "status":
        if is_backend_running(args.port):
            try:
                response = requests.get(f"http://localhost:{args.port}/health")
                health = response.json()
                print(f"✅ Backend is running on port {args.port}")
                print(f"   Status: {health.get('status')}")
                print(f"   Database: {health.get('database')}")
                if 'stats' in health:
                    print(f"   Stats:")
                    for key, value in health['stats'].items():
                        print(f"     - {key}: {value}")
            except:
                print(f"✅ Backend is running on port {args.port}")
        else:
            print(f"❌ Backend is not running on port {args.port}")

if __name__ == "__main__":
    main()
