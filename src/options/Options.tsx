import React, { useState, useEffect } from 'react';
import { Settings, Category } from '../types';
import { getSettings, updateSettings } from '../storage';
import { DEFAULT_CATEGORIES, NORMAL_PROMPT, DEEP_PROMPT } from '../config';

export default function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'llm' | 'filter' | 'categories'>('llm');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const current = await getSettings();
    setSettings(current);
  };

  const handleSave = async () => {
    if (!settings) return;
    await updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({
      ...settings!,
      categories: DEFAULT_CATEGORIES,
      filterLevel: 'deep',
      customPrompt: DEEP_PROMPT
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (!settings) return;
    const updatedCategories = settings.categories.map(cat =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    );
    setSettings({ ...settings, categories: updatedCategories });
  };

  const handleCategoryUpdate = (categoryId: string, field: keyof Category, value: string) => {
    if (!settings) return;
    const updatedCategories = settings.categories.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    );
    setSettings({ ...settings, categories: updatedCategories });
  };

  const handleAddCategory = () => {
    if (!settings) return;
    const newCategory: Category = {
      id: `custom_${Date.now()}`,
      name: '新分类',
      icon: '📌',
      description: '自定义分类',
      keywords: [],
      enabled: true,
      order: settings.categories.length + 1
    };
    setSettings({ ...settings, categories: [...settings.categories, newCategory] });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!settings) return;
    const updatedCategories = settings.categories.filter(cat => cat.id !== categoryId);
    setSettings({ ...settings, categories: updatedCategories });
  };

  if (!settings) return <div className="loading">加载中...</div>;

  return (
    <div className="options-container">
      <h1>Twitter Scraper Pro <span className="version">v2</span></h1>

      <nav className="options-tabs">
        <button 
          className={`options-tab ${activeTab === 'llm' ? 'active' : ''}`}
          onClick={() => setActiveTab('llm')}
        >
          🤖 LLM 配置
        </button>
        <button 
          className={`options-tab ${activeTab === 'filter' ? 'active' : ''}`}
          onClick={() => setActiveTab('filter')}
        >
          ⚙️ 筛选设置
        </button>
        <button 
          className={`options-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 分类管理
        </button>
      </nav>

      {activeTab === 'llm' && (
        <section className="section">
          <div className="form-group">
            <label>LLM 提供商</label>
            <select
              value={settings.llmProvider}
              onChange={e => {
                const provider = e.target.value as Settings['llmProvider'];
                let model = settings.model;
                if (provider === 'zhipu') model = 'glm-5';
                if (provider === 'openai') model = 'gpt-4o-mini';
                if (provider === 'deepseek') model = 'deepseek-chat';
                setSettings({ ...settings, llmProvider: provider, model });
              }}
            >
              <option value="zhipu">智谱 GLM</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="输入 API Key"
            />
            <small>
              {settings.llmProvider === 'zhipu' && '获取 API Key: https://open.bigmodel.cn/api-keys'}
              {settings.llmProvider === 'deepseek' && '获取 API Key: https://platform.deepseek.com'}
              {settings.llmProvider === 'openai' && '获取 API Key: https://platform.openai.com'}
              {settings.llmProvider === 'anthropic' && '获取 API Key: https://console.anthropic.com'}
            </small>
          </div>

          <div className="form-group">
            <label>模型</label>
            <input
              type="text"
              value={settings.model}
              onChange={e => setSettings({ ...settings, model: e.target.value })}
            />
            <small>
              {settings.llmProvider === 'zhipu' && '推荐: glm-5 (旗舰) / glm-4.7-Flash (免费)'}
              {settings.llmProvider === 'deepseek' && '推荐: deepseek-chat'}
              {settings.llmProvider === 'openai' && '推荐: gpt-4o-mini'}
              {settings.llmProvider === 'anthropic' && '推荐: claude-3-haiku-20240307'}
            </small>
          </div>

          <div className="form-group">
            <label>自定义 API 端点 (可选)</label>
            <input
              type="text"
              value={settings.apiEndpoint || ''}
              onChange={e => setSettings({ ...settings, apiEndpoint: e.target.value })}
              placeholder="留空使用默认端点"
            />
          </div>
        </section>
      )}

      {activeTab === 'filter' && (
        <section className="section">
          <h2>筛选模式</h2>
          
          <div className="filter-modes">
            <label className={`filter-mode ${settings.filterLevel === 'normal' ? 'active' : ''}`}>
              <input
                type="radio"
                name="filterLevel"
                value="normal"
                checked={settings.filterLevel === 'normal'}
                onChange={e => setSettings({ ...settings, filterLevel: 'normal' })}
              />
              <div className="mode-info">
                <strong>⚡ 普通模式</strong>
                <p>快速筛选，仅判断是否相关</p>
                <small>输出: 评分</small>
              </div>
            </label>
            
            <label className={`filter-mode ${settings.filterLevel === 'deep' ? 'active' : ''}`}>
              <input
                type="radio"
                name="filterLevel"
                value="deep"
                checked={settings.filterLevel === 'deep'}
                onChange={e => setSettings({ ...settings, filterLevel: 'deep' })}
              />
              <div className="mode-info">
                <strong>🔍 深度模式</strong>
                <p>详细分析，包含分类和摘要</p>
                <small>输出: 评分、分类、原因、摘要、关键词</small>
              </div>
            </label>
            
            <label className={`filter-mode ${settings.filterLevel === 'custom' ? 'active' : ''}`}>
              <input
                type="radio"
                name="filterLevel"
                value="custom"
                checked={settings.filterLevel === 'custom'}
                onChange={e => setSettings({ ...settings, filterLevel: 'custom' })}
              />
              <div className="mode-info">
                <strong>✏️ 自定义模式</strong>
                <p>完全自定义筛选逻辑</p>
                <small>使用下方自定义提示词</small>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>最低相关度分数 (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.minRelevanceScore}
              onChange={e => setSettings({ ...settings, minRelevanceScore: parseInt(e.target.value) || 5 })}
            />
            <small>分数低于此值的推文将被过滤掉</small>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="autoFilter"
              checked={settings.autoFilter}
              onChange={e => setSettings({ ...settings, autoFilter: e.target.checked })}
            />
            <label htmlFor="autoFilter">自动筛选新抓取的推文</label>
          </div>

          {settings.filterLevel === 'custom' && (
            <div className="form-group">
              <label>自定义筛选提示词</label>
              <textarea
                value={settings.customPrompt}
                onChange={e => setSettings({ ...settings, customPrompt: e.target.value })}
                rows={15}
              />
              <div className="prompt-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSettings({ ...settings, customPrompt: NORMAL_PROMPT })}
                >
                  使用普通模板
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSettings({ ...settings, customPrompt: DEEP_PROMPT })}
                >
                  使用深度模板
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'categories' && (
        <section className="section">
          <h2>分类管理</h2>
          <p className="section-desc">启用/禁用分类，或修改分类名称和描述</p>
          
          <div className="category-manager">
            {settings.categories.sort((a, b) => a.order - b.order).map(cat => (
              <div key={cat.id} className={`category-edit-item ${!cat.enabled ? 'disabled' : ''}`}>
                <div className="category-header">
                  <input
                    type="text"
                    value={cat.icon}
                    onChange={e => handleCategoryUpdate(cat.id, 'icon', e.target.value)}
                    className="icon-input"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => handleCategoryUpdate(cat.id, 'name', e.target.value)}
                    className="name-input"
                  />
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={() => handleCategoryToggle(cat.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <input
                  type="text"
                  value={cat.description}
                  onChange={e => handleCategoryUpdate(cat.id, 'description', e.target.value)}
                  className="desc-input"
                  placeholder="分类描述"
                />
                {cat.id.startsWith('custom_') && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button className="btn btn-secondary" onClick={handleAddCategory}>
            + 添加新分类
          </button>
        </section>
      )}

      <div className="actions">
        <button className="btn btn-secondary" onClick={handleReset}>
          恢复默认
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          保存设置
        </button>
        {saved && <span className="saved">✓ 已保存</span>}
      </div>
    </div>
  );
}
