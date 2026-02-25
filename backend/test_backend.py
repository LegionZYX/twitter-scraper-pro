"""
Test Twitter Scraper Backend
测试后端服务和数据库
"""

import sys
import time
import requests
from pathlib import Path

# 添加后端路径
sys.path.insert(0, str(Path(__file__).parent))

def test_database():
    """测试数据库初始化"""
    print("🧪 Testing Database Initialization...")
    
    try:
        from database import SocialScraperKG
        import asyncio
        
        async def init_db():
            kg = SocialScraperKG(db_path="./database/twitter_scraper")
            await kg.init()
            
            stats = await kg.get_stats()
            print(f"✅ Database initialized successfully")
            print(f"   Stats: {stats}")
            
            await kg.close()
            return True
        
        result = asyncio.run(init_db())
        return result
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_backend_start():
    """测试后端启动"""
    print("\n🧪 Testing Backend Startup...")
    
    import subprocess
    
    # 启动后端
    process = subprocess.Popen(
        [sys.executable, "server.py", "--port", "8769"],
        cwd=str(Path(__file__).parent),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # 等待 5 秒
    print("   Waiting for backend to start...")
    time.sleep(5)
    
    # 检查健康状态
    try:
        response = requests.get("http://127.0.0.1:8769/health", timeout=3)
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Backend is running")
            print(f"   Status: {health.get('status')}")
            if 'stats' in health:
                print(f"   Stats:")
                for key, value in health['stats'].items():
                    print(f"     - {key}: {value}")
            
            # 停止后端
            process.terminate()
            process.wait(timeout=5)
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            process.terminate()
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to backend: {e}")
        process.kill()
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        process.kill()
        return False

def test_api_endpoints():
    """测试 API 端点"""
    print("\n🧪 Testing API Endpoints...")
    
    import subprocess
    
    # 启动后端
    process = subprocess.Popen(
        [sys.executable, "server.py", "--port", "8769"],
        cwd=str(Path(__file__).parent),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # 等待启动
    time.sleep(5)
    
    try:
        base_url = "http://127.0.0.1:8769"
        
        # 测试 /api/stats
        response = requests.get(f"{base_url}/api/stats", timeout=3)
        if response.ok:
            stats = response.json()
            print(f"✅ GET /api/stats - OK")
            print(f"   Posts: {stats.get('posts', 0)}")
        else:
            print(f"❌ GET /api/stats - Failed ({response.status_code})")
        
        # 测试 /api/posts
        response = requests.get(f"{base_url}/api/posts?limit=10", timeout=3)
        if response.ok:
            data = response.json()
            print(f"✅ GET /api/posts - OK (count: {data.get('count', 0)})")
        else:
            print(f"❌ GET /api/posts - Failed ({response.status_code})")
        
        # 测试 /api/discovery/stats
        response = requests.get(f"{base_url}/api/discovery/stats", timeout=3)
        if response.ok:
            data = response.json()
            print(f"✅ GET /api/discovery/stats - OK")
        else:
            print(f"❌ GET /api/discovery/stats - Failed ({response.status_code})")
        
        # 停止后端
        process.terminate()
        process.wait(timeout=5)
        print("\n✅ All API tests completed")
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        process.kill()
        return False

def main():
    """运行所有测试"""
    print("=" * 60)
    print(" Twitter Scraper v2.2 - Backend Test Suite")
    print("=" * 60)
    
    results = {
        "Database": test_database(),
        "Backend Startup": test_backend_start(),
        "API Endpoints": test_api_endpoints()
    }
    
    print("\n" + "=" * 60)
    print(" Test Summary")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed!")
        print("\nTo start the backend:")
        print(f"  cd {Path(__file__).parent}")
        print("  python server.py --port 8769")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Check if port 8769 is available")
        print("  3. Make sure kuzu is installed: pip install kuzu")
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
