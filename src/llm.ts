import { Post, FilteredPost, LLMSummary, Settings } from './types';
import { NORMAL_PROMPT, DEEP_PROMPT } from './config';

interface NormalFilterResponse {
  isRelevant: boolean;
  relevanceScore: number;
}

interface DeepFilterResponse {
  isRelevant: boolean;
  relevanceScore: number;
  category: string;
  subCategory?: string;
  reason: string;
  summary?: string;
  keywords?: string[];
}

export class LLMService {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  private getEndpoint(): string {
    if (this.settings.apiEndpoint) {
      return this.settings.apiEndpoint;
    }
    
    switch (this.settings.llmProvider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'zhipu':
        return 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
      default:
        return 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.settings.llmProvider === 'anthropic') {
      headers['x-api-key'] = this.settings.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${this.settings.apiKey}`;
    }

    return headers;
  }

  private getPrompt(): string {
    switch (this.settings.filterLevel) {
      case 'normal':
        return NORMAL_PROMPT;
      case 'deep':
        return DEEP_PROMPT;
      case 'custom':
        return this.settings.customPrompt || DEEP_PROMPT;
      default:
        return DEEP_PROMPT;
    }
  }

  private getCategoryNames(): string {
    const enabledCategories = this.settings.categories
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order);
    
    return enabledCategories
      .map(c => `${c.icon} ${c.name} - ${c.description}`)
      .join('\n');
  }

  async filterPosts(posts: Post[]): Promise<FilteredPost[]> {
    if (!this.settings.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    const filtered: FilteredPost[] = [];
    const batchSize = this.settings.filterLevel === 'deep' ? 5 : 10;
    const prompt = this.getPrompt();
    const categoryList = this.getCategoryNames();

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.filterBatch(batch, prompt, categoryList);
        
        batch.forEach((post, idx) => {
          const result = batchResults[idx];
          if (result && result.isRelevant && result.relevanceScore >= this.settings.minRelevanceScore) {
            filtered.push({
              ...post,
              relevanceScore: result.relevanceScore,
              category: result.category || 'other',
              subCategory: result.subCategory,
              reason: result.reason || '',
              summary: result.summary,
              keywords: result.keywords,
            });
          }
        });
      } catch (error) {
        console.error(`Batch ${i} filter error:`, error);
      }
    }

    return filtered;
  }

  private async filterBatch(
    posts: Post[], 
    systemPrompt: string,
    categoryList: string
  ): Promise<DeepFilterResponse[]> {
    const postsText = posts.map((p, i) => {
      const platform = p.platform === 'reddit' ? 'Reddit' : 'Twitter';
      const engagement = p.platform === 'reddit' 
        ? `${p.upvotes}赞 ${p.replies}评论`
        : `${p.score}赞 ${p.replies}回复`;
      
      return `[${i + 1}] 平台：${platform}\n作者：@${p.author}\n内容：${p.content}\n互动：${engagement}`;
    }).join('\n\n---\n\n');

    const fullPrompt = this.settings.filterLevel === 'normal'
      ? systemPrompt
      : `${systemPrompt}\n\n可用分类：\n${categoryList}`;

    const body = this.settings.llmProvider === 'anthropic' 
      ? {
          model: this.settings.model,
          max_tokens: 4096,
          system: fullPrompt,
          messages: [{
            role: 'user',
            content: `分析以下${posts.length}条帖子，逐条判断是否值得保留。\n\n${postsText}\n\n返回 JSON 数组格式，每条帖子一个对象。`
          }]
        }
      : {
          model: this.settings.model,
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: `分析以下${posts.length}条帖子，逐条判断是否值得保留。\n\n${postsText}\n\n返回 JSON 数组格式，每条帖子一个对象。` }
          ],
          temperature: 0.3,
        };

    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API 请求失败：${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = this.settings.llmProvider === 'anthropic'
      ? data.content[0].text
      : data.choices[0].message.content;

    return this.parseFilterResponse(content, posts.length);
  }

  private parseFilterResponse(content: string, expectedCount: number): DeepFilterResponse[] {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        cleanContent = markdownMatch[1].trim();
      }
      
      // Find and parse the JSON array
      const startIndex = cleanContent.indexOf('[');
      const endIndex = cleanContent.lastIndexOf(']');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON array found');
      }
      
      const jsonString = cleanContent.substring(startIndex, endIndex + 1);
      const parsed = JSON.parse(jsonString);
      
      if (Array.isArray(parsed)) {
        // Validate and normalize results
        const normalized = parsed.map((item: any, idx: number) => ({
          isRelevant: !!item.isRelevant,
          relevanceScore: typeof item.relevanceScore === 'number' ? item.relevanceScore : 0,
          category: item.category || 'other',
          subCategory: item.subCategory || '',
          reason: item.reason || '',
          summary: item.summary || '',
          keywords: Array.isArray(item.keywords) ? item.keywords : [],
        }));
        
        // Fill missing results
        while (normalized.length < expectedCount) {
          normalized.push({
            isRelevant: false,
            relevanceScore: 0,
            category: 'other',
            subCategory: '',
            reason: '解析不完整',
            summary: '',
            keywords: [],
          });
        }
        
        return normalized.slice(0, expectedCount);
      }
      
      throw new Error('Parsed content is not an array');
    } catch (error) {
      console.error('Parse error:', error, 'Content:', content);
      return Array(expectedCount).fill({
        isRelevant: false,
        relevanceScore: 0,
        category: 'other',
        subCategory: '',
        reason: '解析失败',
        summary: '',
        keywords: [],
      });
    }
  }

  async generateSummary(filtered: FilteredPost[]): Promise<LLMSummary> {
    if (filtered.length === 0) {
      return {
        totalAnalyzed: 0,
        relevantCount: 0,
        categories: {},
        keyTopics: [],
        summary: '没有可分析的帖子',
        topPosts: [],
        generatedAt: Date.now(),
      };
    }

    const postsText = filtered.slice(0, 30).map((p, i) => {
      const platform = p.platform === 'reddit' ? 'Reddit' : 'Twitter';
      return `[${i + 1}] ${platform} - ${p.category} (${p.relevanceScore}分): ${p.content.slice(0, 200)}`;
    }).join('\n');

    const summaryPrompt = `你是一个信息分析师。分析以下筛选后的帖子，生成一份简洁的总结报告。

帖子列表：
${postsText}

返回 JSON 格式：
{
  "totalAnalyzed": 数字,
  "relevantCount": 数字,
  "categories": {"分类名": 数量},
  "keyTopics": ["主题 1", "主题 2", "主题 3"],
  "summary": "100-200 字的总体摘要",
  "topPosts": ["最重要帖子的 ID"]
}`;

    const body = this.settings.llmProvider === 'anthropic'
      ? {
          model: this.settings.model,
          max_tokens: 2048,
          system: summaryPrompt,
          messages: [{ role: 'user', content: '请生成总结报告' }]
        }
      : {
          model: this.settings.model,
          messages: [{ role: 'user', content: summaryPrompt }],
          temperature: 0.5,
        };

    try {
      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const content = this.settings.llmProvider === 'anthropic'
        ? data.content[0].text
        : data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          generatedAt: Date.now(),
        };
      }

      return this.getDefaultSummary(filtered);
    } catch (error) {
      console.error('Summary generation error:', error);
      return this.getDefaultSummary(filtered);
    }
  }

  private getDefaultSummary(filtered: FilteredPost[]): LLMSummary {
    const categories: Record<string, number> = {};
    const platforms: Record<string, number> = { twitter: 0, reddit: 0 };
    
    filtered.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
      platforms[p.platform] = (platforms[p.platform] || 0) + 1;
    });

    const platformSummary = filtered.filter(p => p.platform === 'reddit').length > 0
      ? `（Twitter: ${platforms.twitter}, Reddit: ${platforms.reddit}）`
      : '';

    return {
      totalAnalyzed: filtered.length,
      relevantCount: filtered.length,
      categories,
      keyTopics: Object.keys(categories).slice(0, 5),
      summary: `共筛选出 ${filtered.length} 条相关帖子${platformSummary}，涉及 ${Object.keys(categories).length} 个类别。`,
      topPosts: filtered.slice(0, 5).map(p => p.id),
      generatedAt: Date.now(),
    };
  }
}
