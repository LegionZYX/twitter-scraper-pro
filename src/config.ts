import { Category, Settings } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'startup',
    name: '创业/新产品',
    icon: '🚀',
    description: '新产品发布、融资、创业动态',
    keywords: ['launch', 'startup', 'funding', 'new product', 'MVP', '创业', '新品', '融资', '发布'],
    enabled: true,
    order: 1
  },
  {
    id: 'insight',
    name: '洞察/观点',
    icon: '💡',
    description: '深度分析、行业趋势、独到见解',
    keywords: ['insight', 'analysis', 'trend', 'opinion', 'thread', '洞察', '分析', '趋势', '观点'],
    enabled: true,
    order: 2
  },
  {
    id: 'tech',
    name: '技术/教程',
    icon: '🔧',
    description: '技术分享、教程、工具推荐',
    keywords: ['tutorial', 'how to', 'tool', 'library', 'code', '教程', '工具', '技术', '开发'],
    enabled: true,
    order: 3
  },
  {
    id: 'research',
    name: '数据/研究',
    icon: '📊',
    description: '研究报告、数据分析、统计',
    keywords: ['research', 'data', 'report', 'study', 'survey', '研究', '数据', '报告'],
    enabled: true,
    order: 4
  },
  {
    id: 'news',
    name: '新闻/资讯',
    icon: '📢',
    description: '重要新闻、公告、事件',
    keywords: ['news', 'announce', 'breaking', 'update', '新闻', '公告', '发布'],
    enabled: true,
    order: 5
  },
  {
    id: 'business',
    name: '商业/市场',
    icon: '💼',
    description: '商业模式、市场机会、投资',
    keywords: ['business', 'market', 'investment', 'revenue', '商业', '市场', '投资', '盈利'],
    enabled: true,
    order: 6
  },
  {
    id: 'design',
    name: '设计/产品',
    icon: '🎨',
    description: '设计理念、产品思维、UX',
    keywords: ['design', 'UX', 'product', 'interface', '设计', '产品', '体验', 'UI'],
    enabled: true,
    order: 7
  },
  {
    id: 'other',
    name: '其他',
    icon: '📌',
    description: '不属于以上类别',
    keywords: [],
    enabled: true,
    order: 99
  }
];

export const NORMAL_PROMPT = `你是一个信息筛选助手。快速分析以下推文，判断是否值得用户关注。

筛选标准（保留以下类型的推文）：
1. 重要的行业新闻和趋势
2. 有价值的技术分享或教程
3. 重要人物的声明或观点
4. 值得关注的市场信息
5. 有深度的分析和见解

过滤掉（不要保留）：
1. 纯广告和营销内容
2. 无意义的日常琐事
3. 低质量的转发和复制
4. 争议性极强的无价值争论

返回JSON格式：
{
  "isRelevant": boolean,
  "relevanceScore": 1-10
}`;

export const DEEP_PROMPT = `你是一个信息筛选助手。深度分析以下推文，进行全面评估。

分类标准：
🚀 创业/新产品 - 新产品发布、融资消息、创业动态
💡 洞察/观点 - 深度分析、行业趋势、独到见解
🔧 技术/教程 - 技术分享、教程、工具推荐
📊 数据/研究 - 研究报告、数据分析
📢 新闻/资讯 - 重要新闻、公告
💼 商业/市场 - 商业模式、市场机会
🎨 设计/产品 - 设计理念、产品思维
📌 其他 - 不属于以上类别

筛选标准（保留以下类型的推文）：
1. 有独特价值或见解
2. 可执行、可学习
3. 有时效性或长期参考价值

过滤掉（不要保留）：
1. 纯广告和营销内容
2. 无意义的日常琐事
3. 低质量的转发和复制
4. 争议性极强的无价值争论

返回JSON格式：
{
  "isRelevant": boolean,
  "relevanceScore": 1-10,
  "category": "分类名称",
  "subCategory": "细分类别",
  "reason": "简短说明为什么保留或过滤",
  "summary": "一句话摘要（保留时）",
  "keywords": ["关键词1", "关键词2"]
}`;

export const DEFAULT_SETTINGS: Settings = {
  llmProvider: 'zhipu',
  apiKey: '',
  model: 'glm-5',
  filterLevel: 'deep',
  customPrompt: DEEP_PROMPT,
  categories: DEFAULT_CATEGORIES,
  minRelevanceScore: 5,
  pageSize: 50,
  autoFilter: true,
};

export const CATEGORY_ICONS: Record<string, string> = {
  startup: '🚀',
  insight: '💡',
  tech: '🔧',
  research: '📊',
  news: '📢',
  business: '💼',
  design: '🎨',
  other: '📌',
};
