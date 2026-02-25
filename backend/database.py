"""
Social Scraper Knowledge Graph Schema
基于 KuzuDB 的社交媒体情报存储
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

import kuzu
from loguru import logger


class SocialScraperKG:
    """Social Scraper KuzuDB 管理器"""
    
    def __init__(self, db_path: str = "./database/twitter_scraper"):
        self.db_path = Path(db_path)
        self.db = None
        self.conn = None
        
    async def init(self):
        """初始化数据库连接和 Schema"""
        try:
            self.db = kuzu.Database(str(self.db_path))
            self.conn = kuzu.Connection(self.db)
            await self._create_schema()
            logger.info(f"SocialScraperKG initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to initialize SocialScraperKG: {e}")
            raise
    
    async def _create_schema(self):
        """创建 Social Scraper 专用 Schema"""
        
        # 1. Post 表 - 原始抓取池（只存储精选内容）
        post_schema = """
        CREATE NODE TABLE IF NOT EXISTS Post (
            id STRING,
            platform STRING,
            author STRING,
            authorDisplayName STRING,
            content STRING,
            title STRING,
            url STRING,
            timestamp TIMESTAMP,
            score INT64,
            replies INT64,
            raw BOOLEAN,
            scrapedAt TIMESTAMP,
            metadata STRING,
            PRIMARY KEY (id)
        )
        """
        
        # 2. FilteredPost 表 - LLM 筛选后
        filtered_post_schema = """
        CREATE NODE TABLE IF NOT EXISTS FilteredPost (
            id STRING,
            postId STRING,
            relevanceScore DOUBLE,
            category STRING,
            subCategory STRING,
            reason STRING,
            summary STRING,
            keywords STRING,
            filteredAt TIMESTAMP,
            PRIMARY KEY (id)
        )
        """
        
        # 3. DiscoveryResult 表 - 发现性分析结果
        discovery_schema = """
        CREATE NODE TABLE IF NOT EXISTS DiscoveryResult (
            id STRING,
            postId STRING,
            sentiment STRING,
            kolProfile STRING,
            trendData STRING,
            alertTrigger STRING,
            analyzedAt TIMESTAMP,
            PRIMARY KEY (id)
        )
        """
        
        # 4. Source 表 - 频道配置
        source_schema = """
        CREATE NODE TABLE IF NOT EXISTS Source (
            id STRING,
            name STRING,
            type STRING,
            config STRING,
            enabled BOOLEAN,
            lastFetched TIMESTAMP,
            fetchInterval INTEGER,
            PRIMARY KEY (id)
        )
        """
        
        # 5. CleanupRule 表 - 清理规则
        cleanup_rule_schema = """
        CREATE NODE TABLE IF NOT EXISTS CleanupRule (
            id STRING,
            targetType STRING,
            condition STRING,
            threshold INTEGER,
            action STRING,
            enabled BOOLEAN,
            lastRun TIMESTAMP,
            PRIMARY KEY (id)
        )
        """
        
        # 6. ArchivedPost 表 - 归档帖子
        archived_post_schema = """
        CREATE NODE TABLE IF NOT EXISTS ArchivedPost (
            id STRING,
            originalId STRING,
            platform STRING,
            author STRING,
            content STRING,
            archivedAt TIMESTAMP,
            reason STRING,
            metadata STRING,
            PRIMARY KEY (id)
        )
        """
        
        # 关系表
        relationships = [
            """
            CREATE REL TABLE IF NOT EXISTS FILTERED_FROM (
                FROM FilteredPost TO Post
            )
            """,
            """
            CREATE REL TABLE IF NOT EXISTS ANALYZED (
                FROM DiscoveryResult TO Post
            )
            """,
            """
            CREATE REL TABLE IF NOT EXISTS CONTAINS_POST (
                FROM Event TO Post
            )
            """,
            """
            CREATE REL TABLE IF NOT EXISTS ARCHIVED_FROM (
                FROM ArchivedPost TO Post
            )
            """
        ]
        
        schemas = [
            post_schema,
            filtered_post_schema,
            discovery_schema,
            source_schema,
            cleanup_rule_schema,
            archived_post_schema
        ] + relationships
        
        for schema in schemas:
            try:
                self.conn.execute(schema)
                logger.debug(f"Created schema: {schema[:50]}...")
            except Exception as e:
                logger.warning(f"Schema may already exist: {e}")
        
        # 初始化默认清理规则
        await self._init_default_cleanup_rules()
    
    async def _init_default_cleanup_rules(self):
        """初始化默认清理规则"""
        default_rules = [
            {
                "id": "rule_001",
                "targetType": "Post",
                "condition": "age_days",
                "threshold": 90,
                "action": "archive",
                "enabled": True
            },
            {
                "id": "rule_002",
                "targetType": "FilteredPost",
                "condition": "relevance_below",
                "threshold": 3,
                "action": "delete",
                "enabled": True
            },
            {
                "id": "rule_003",
                "targetType": "DiscoveryResult",
                "condition": "age_days",
                "threshold": 365,
                "action": "export",
                "enabled": True
            }
        ]
        
        for rule in default_rules:
            try:
                query = """
                CREATE (r:CleanupRule {
                    id: $id,
                    targetType: $targetType,
                    condition: $condition,
                    threshold: $threshold,
                    action: $action,
                    enabled: $enabled,
                    lastRun: NULL
                })
                """
                self.conn.execute(query, rule)
                logger.debug(f"Created cleanup rule: {rule['id']}")
            except Exception as e:
                logger.warning(f"Cleanup rule may already exist: {e}")
    
    # ========== Post 操作方法 ==========
    
    async def add_post(self, post: Dict[str, Any]) -> bool:
        """添加帖子"""
        try:
            query = """
            CREATE (p:Post {
                id: $id,
                platform: $platform,
                author: $author,
                authorDisplayName: $authorDisplayName,
                content: $content,
                title: $title,
                url: $url,
                timestamp: $timestamp,
                score: $score,
                replies: $replies,
                raw: $raw,
                scrapedAt: $scrapedAt,
                metadata: $metadata
            })
            """
            
            self.conn.execute(query, {
                "id": post["id"],
                "platform": post.get("platform", "twitter"),
                "author": post.get("author", ""),
                "authorDisplayName": post.get("authorDisplayName", ""),
                "content": post.get("content", ""),
                "title": post.get("title", ""),
                "url": post.get("url", ""),
                "timestamp": post.get("timestamp"),
                "score": post.get("score", 0),
                "replies": post.get("replies", 0),
                "raw": post.get("raw", False),
                "scrapedAt": post.get("scrapedAt"),
                "metadata": str(post.get("metadata", {}))
            })
            
            logger.debug(f"Added post: {post['id']}")
            return True
        except Exception as e:
            logger.error(f"Failed to add post {post.get('id')}: {e}")
            return False
    
    async def add_posts_batch(self, posts: List[Dict[str, Any]]) -> int:
        """批量添加帖子"""
        success_count = 0
        for post in posts:
            if await self.add_post(post):
                success_count += 1
        logger.info(f"Batch added {success_count}/{len(posts)} posts")
        return success_count
    
    async def get_post_by_id(self, post_id: str) -> Optional[Dict]:
        """根据 ID 查询帖子"""
        try:
            query = """
            MATCH (p:Post {id: $id})
            RETURN p.id, p.platform, p.author, p.content, p.url, 
                   p.timestamp, p.score, p.replies, p.raw, p.scrapedAt
            """
            
            result = self.conn.execute(query, {"id": post_id})
            if result.has_next():
                row = result.get_next()
                return {
                    "id": row[0],
                    "platform": row[1],
                    "author": row[2],
                    "content": row[3],
                    "url": row[4],
                    "timestamp": row[5],
                    "score": row[6],
                    "replies": row[7],
                    "raw": row[8],
                    "scrapedAt": row[9]
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get post by id: {e}")
            return None
    
    async def get_recent_posts(self, hours: int = 24, limit: int = 100) -> List[Dict]:
        """获取最近的帖子"""
        try:
            query = """
            MATCH (p:Post)
            WHERE p.scrapedAt > datetime_subtract(timestamp(), interval $hours hour)
            RETURN p.id, p.platform, p.author, p.content, p.url,
                   p.timestamp, p.score, p.replies, p.scrapedAt
            ORDER BY p.scrapedAt DESC
            LIMIT $limit
            """
            
            result = self.conn.execute(query, {"hours": hours, "limit": limit})
            posts = []
            while result.has_next():
                row = result.get_next()
                posts.append({
                    "id": row[0],
                    "platform": row[1],
                    "author": row[2],
                    "content": row[3],
                    "url": row[4],
                    "timestamp": row[5],
                    "score": row[6],
                    "replies": row[7],
                    "scrapedAt": row[8]
                })
            return posts
        except Exception as e:
            logger.error(f"Failed to get recent posts: {e}")
            return []
    
    # ========== FilteredPost 操作方法 ==========
    
    async def add_filtered_post(self, filtered: Dict[str, Any]) -> bool:
        """添加筛选后的帖子"""
        try:
            query = """
            CREATE (fp:FilteredPost {
                id: $id,
                postId: $postId,
                relevanceScore: $relevanceScore,
                category: $category,
                subCategory: $subCategory,
                reason: $reason,
                summary: $summary,
                keywords: $keywords,
                filteredAt: $filteredAt
            })
            """
            
            self.conn.execute(query, {
                "id": filtered["id"],
                "postId": filtered["postId"],
                "relevanceScore": filtered.get("relevanceScore", 0),
                "category": filtered.get("category", "other"),
                "subCategory": filtered.get("subCategory", ""),
                "reason": filtered.get("reason", ""),
                "summary": filtered.get("summary", ""),
                "keywords": str(filtered.get("keywords", [])),
                "filteredAt": filtered.get("filteredAt")
            })
            
            # 创建关系
            rel_query = """
            MATCH (fp:FilteredPost {id: $fp_id}), (p:Post {id: $post_id})
            CREATE (fp)-[:FILTERED_FROM]->(p)
            """
            self.conn.execute(rel_query, {"fp_id": filtered["id"], "post_id": filtered["postId"]})
            
            logger.debug(f"Added filtered post: {filtered['id']}")
            return True
        except Exception as e:
            logger.error(f"Failed to add filtered post: {e}")
            return False
    
    async def get_filtered_posts(self, category: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """获取筛选后的帖子"""
        try:
            if category:
                query = """
                MATCH (fp:FilteredPost)
                WHERE fp.category = $category
                RETURN fp.id, fp.postId, fp.relevanceScore, fp.category, 
                       fp.reason, fp.summary, fp.filteredAt
                ORDER BY fp.relevanceScore DESC
                LIMIT $limit
                """
                result = self.conn.execute(query, {"category": category, "limit": limit})
            else:
                query = """
                MATCH (fp:FilteredPost)
                RETURN fp.id, fp.postId, fp.relevanceScore, fp.category,
                       fp.reason, fp.summary, fp.filteredAt
                ORDER BY fp.filteredAt DESC
                LIMIT $limit
                """
                result = self.conn.execute(query, {"limit": limit})
            
            posts = []
            while result.has_next():
                row = result.get_next()
                posts.append({
                    "id": row[0],
                    "postId": row[1],
                    "relevanceScore": row[2],
                    "category": row[3],
                    "reason": row[4],
                    "summary": row[5],
                    "filteredAt": row[6]
                })
            return posts
        except Exception as e:
            logger.error(f"Failed to get filtered posts: {e}")
            return []
    
    # ========== DiscoveryResult 操作方法 ==========
    
    async def add_discovery_result(self, result: Dict[str, Any]) -> bool:
        """添加发现性分析结果"""
        try:
            query = """
            CREATE (dr:DiscoveryResult {
                id: $id,
                postId: $postId,
                sentiment: $sentiment,
                kolProfile: $kolProfile,
                trendData: $trendData,
                alertTrigger: $alertTrigger,
                analyzedAt: $analyzedAt
            })
            """
            
            self.conn.execute(query, {
                "id": result["id"],
                "postId": result["postId"],
                "sentiment": str(result.get("sentiment", {})),
                "kolProfile": str(result.get("kolProfile", {})),
                "trendData": str(result.get("trendData", {})),
                "alertTrigger": str(result.get("alertTrigger", [])),
                "analyzedAt": result.get("analyzedAt")
            })
            
            # 创建关系
            rel_query = """
            MATCH (dr:DiscoveryResult {id: $dr_id}), (p:Post {id: $post_id})
            CREATE (dr)-[:ANALYZED]->(p)
            """
            self.conn.execute(rel_query, {"dr_id": result["id"], "post_id": result["postId"]})
            
            logger.debug(f"Added discovery result: {result['id']}")
            return True
        except Exception as e:
            logger.error(f"Failed to add discovery result: {e}")
            return False
    
    async def get_discovery_stats(self) -> Dict[str, Any]:
        """获取发现性分析统计"""
        try:
            stats = {}
            
            # 情感分布
            sentiment_query = """
            MATCH (dr:DiscoveryResult)
            WHERE dr.sentiment IS NOT NULL
            RETURN dr.sentiment
            """
            result = self.conn.execute(sentiment_query)
            sentiments = {"positive": 0, "negative": 0, "neutral": 0}
            while result.has_next():
                row = result.get_next()
                sentiment_str = str(row[0])
                if "positive" in sentiment_str.lower():
                    sentiments["positive"] += 1
                elif "negative" in sentiment_str.lower():
                    sentiments["negative"] += 1
                else:
                    sentiments["neutral"] += 1
            stats["sentiments"] = sentiments
            
            # KOL 数量
            kol_query = """
            MATCH (dr:DiscoveryResult)
            WHERE dr.kolProfile IS NOT NULL AND dr.kolProfile <> '{}'
            RETURN count(dr)
            """
            result = self.conn.execute(kol_query)
            if result.has_next():
                stats["kols"] = result.get_next()[0]
            
            # 趋势检测数量
            trend_query = """
            MATCH (dr:DiscoveryResult)
            WHERE dr.trendData IS NOT NULL AND dr.trendData <> '{}'
            RETURN count(dr)
            """
            result = self.conn.execute(trend_query)
            if result.has_next():
                stats["trends"] = result.get_next()[0]
            
            return stats
        except Exception as e:
            logger.error(f"Failed to get discovery stats: {e}")
            return {}
    
    # ========== 清理操作方法 ==========
    
    async def get_cleanup_rules(self, enabled_only: bool = True) -> List[Dict]:
        """获取清理规则"""
        try:
            if enabled_only:
                query = """
                MATCH (r:CleanupRule)
                WHERE r.enabled = true
                RETURN r.id, r.targetType, r.condition, r.threshold, 
                       r.action, r.enabled, r.lastRun
                """
            else:
                query = """
                MATCH (r:CleanupRule)
                RETURN r.id, r.targetType, r.condition, r.threshold,
                       r.action, r.enabled, r.lastRun
                """
            
            result = self.conn.execute(query)
            rules = []
            while result.has_next():
                row = result.get_next()
                rules.append({
                    "id": row[0],
                    "targetType": row[1],
                    "condition": row[2],
                    "threshold": row[3],
                    "action": row[4],
                    "enabled": row[5],
                    "lastRun": row[6]
                })
            return rules
        except Exception as e:
            logger.error(f"Failed to get cleanup rules: {e}")
            return []
    
    async def archive_old_posts(self, days: int = 90) -> int:
        """归档旧帖子"""
        try:
            # 查询符合条件的帖子
            query = """
            MATCH (p:Post)
            WHERE p.scrapedAt < datetime_subtract(timestamp(), interval $days day)
            RETURN p.id, p.platform, p.author, p.content, p.metadata
            """
            result = self.conn.execute(query, {"days": days})
            
            archived_count = 0
            while result.has_next():
                row = result.get_next()
                post_id = row[0]
                
                # 移动到归档表
                archive_query = """
                CREATE (ap:ArchivedPost {
                    id: $id,
                    originalId: $originalId,
                    platform: $platform,
                    author: $author,
                    content: $content,
                    archivedAt: timestamp(),
                    reason: $reason,
                    metadata: $metadata
                })
                """
                self.conn.execute(archive_query, {
                    "id": f"archived_{post_id}",
                    "originalId": post_id,
                    "platform": row[1],
                    "author": row[2],
                    "content": row[3],
                    "reason": f"Auto-archive after {days} days",
                    "metadata": row[4]
                })
                
                # 删除原帖子（关联数据会级联删除）
                delete_query = """
                MATCH (p:Post {id: $id})
                DELETE p
                """
                self.conn.execute(delete_query, {"id": post_id})
                
                archived_count += 1
            
            logger.info(f"Archived {archived_count} old posts")
            return archived_count
        except Exception as e:
            logger.error(f"Failed to archive old posts: {e}")
            return 0
    
    async def delete_low_relevance_posts(self, threshold: float = 3.0) -> int:
        """删除低相关度帖子"""
        try:
            query = """
            MATCH (fp:FilteredPost)
            WHERE fp.relevanceScore < $threshold
            DELETE fp
            """
            result = self.conn.execute(query, {"threshold": threshold})
            deleted = result.get_summary()
            logger.info(f"Deleted {deleted} low relevance posts")
            return deleted
        except Exception as e:
            logger.error(f"Failed to delete low relevance posts: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, int]:
        """获取统计信息"""
        try:
            stats = {}
            
            # Post 数量
            result = self.conn.execute("MATCH (p:Post) RETURN count(p)")
            if result.has_next():
                stats["posts"] = result.get_next()[0]
            
            # FilteredPost 数量
            result = self.conn.execute("MATCH (fp:FilteredPost) RETURN count(fp)")
            if result.has_next():
                stats["filtered_posts"] = result.get_next()[0]
            
            # DiscoveryResult 数量
            result = self.conn.execute("MATCH (dr:DiscoveryResult) RETURN count(dr)")
            if result.has_next():
                stats["discovery_results"] = result.get_next()[0]
            
            # ArchivedPost 数量
            result = self.conn.execute("MATCH (ap:ArchivedPost) RETURN count(ap)")
            if result.has_next():
                stats["archived_posts"] = result.get_next()[0]
            
            return stats
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}
    
    async def close(self):
        """关闭数据库连接"""
        try:
            if self.conn:
                self.conn.close()
            if self.db:
                self.db.close()
            logger.info("SocialScraperKG connection closed")
        except Exception as e:
            logger.error(f"Error closing SocialScraperKG: {e}")
