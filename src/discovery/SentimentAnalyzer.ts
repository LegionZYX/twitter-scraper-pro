/**
 * 情感分析模块
 * 分析帖子的情感倾向（正面/负面/中性）
 */

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number; // -1 到 1，负数表示负面，正数表示正面
  keywords: string[];
}

export class SentimentAnalyzer {
  private positiveWords = [
    'great', 'awesome', 'excellent', 'amazing', 'love', 'best', 'wonderful',
    'fantastic', 'good', 'happy', 'excited', 'impressive', 'brilliant',
    'perfect', 'beautiful', 'successful', 'innovative', 'breakthrough',
    'recommended', 'valuable', 'helpful', 'useful', 'powerful', 'efficient',
    '革命性', '突破', '优秀', '精彩', '推荐', '有价值', '帮助', '强大',
    '创新', '成功', '令人印象深刻', '激动人心', '棒', '好', '爱', '喜欢'
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing',
    'frustrating', 'annoying', 'useless', 'broken', 'fail', 'failed', 'failure',
    'error', 'problem', 'issue', 'bug', 'crash', 'slow', 'difficult',
    '糟糕', '差', '失望', '失败', '错误', '问题', 'bug', '崩溃', '慢', '困难',
    '讨厌', '恨', '没用', '破碎', '令人沮丧', '烦人'
  ];

  private intensifiers = [
    'very', 'extremely', 'incredibly', 'absolutely', 'really', 'highly',
    '特别', '非常', '极其', '十分', '相当', '高度'
  ];

  analyze(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/[\s\p{P}]+/u);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let intensity = 1;
    const foundKeywords: string[] = [];

    words.forEach(word => {
      if (this.positiveWords.includes(word)) {
        positiveCount += intensity;
        foundKeywords.push(word);
      } else if (this.negativeWords.includes(word)) {
        negativeCount += intensity;
        foundKeywords.push(word);
      } else if (this.intensifiers.includes(word)) {
        intensity = 1.5;
      }
    });

    // 检查常见短语
    const positivePhrases = ['game changer', 'must have', 'highly recommend', 'life saver'];
    const negativePhrases = ['waste of time', 'do not recommend', 'stay away', 'avoid this'];

    positivePhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        positiveCount += 2;
        foundKeywords.push(phrase);
      }
    });

    negativePhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        negativeCount += 2;
        foundKeywords.push(phrase);
      }
    });

    const total = positiveCount + negativeCount;
    let score = 0;
    let sentiment: SentimentResult['sentiment'] = 'neutral';
    let confidence = 0;

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      
      if (score > 0.3) {
        sentiment = 'positive';
        confidence = Math.min(score * 100, 95);
      } else if (score < -0.3) {
        sentiment = 'negative';
        confidence = Math.min(Math.abs(score) * 100, 95);
      } else {
        sentiment = 'neutral';
        confidence = 50 + (1 - Math.abs(score)) * 30;
      }
    } else {
      sentiment = 'neutral';
      confidence = 50;
    }

    return {
      sentiment,
      confidence: Math.round(confidence),
      score: Math.round(score * 100) / 100,
      keywords: [...new Set(foundKeywords)].slice(0, 5)
    };
  }

  batchAnalyze(texts: string[]): SentimentResult[] {
    return texts.map(text => this.analyze(text));
  }

  getOverallSentiment(results: SentimentResult[]): {
    average: number;
    distribution: { positive: number; negative: number; neutral: number };
    dominant: 'positive' | 'negative' | 'neutral';
  } {
    const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    const distribution = {
      positive: results.filter(r => r.sentiment === 'positive').length,
      negative: results.filter(r => r.sentiment === 'negative').length,
      neutral: results.filter(r => r.sentiment === 'neutral').length
    };

    let dominant: typeof distribution.positive extends number ? 'positive' | 'negative' | 'neutral' : never = 'neutral';
    if (distribution.positive > distribution.negative && distribution.positive > distribution.neutral) {
      dominant = 'positive';
    } else if (distribution.negative > distribution.positive && distribution.negative > distribution.neutral) {
      dominant = 'negative';
    }

    return {
      average: Math.round(average * 100) / 100,
      distribution,
      dominant
    };
  }
}
