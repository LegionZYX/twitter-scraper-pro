import React, { useState, useEffect } from 'react';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { WarningBanner } from './WarningBanner';
import { syncManager } from '../sync/SyncManager';

type Tab = 'tweets' | 'filtered' | 'summary' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tweets');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // 订阅同步状态
    const unsubscribe = syncManager.onStatusChange((status) => {
      setPendingCount(status.pendingCount);
      setShowWarning(status.status === 'offline' && status.pendingCount > 0);
    });
    return () => unsubscribe;
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🐦 Twitter Scraper <span className="version">v2.2</span></h1>
        <SyncStatusIndicator />
      </header>

      <WarningBanner 
        visible={showWarning} 
        pendingCount={pendingCount}
        onDismiss={() => setShowWarning(false)}
      />

      <nav className="tabs">
        {(['tweets', 'filtered', 'summary', 'settings'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'tweets' && '全部帖子'}
            {tab === 'filtered' && '筛选结果'}
            {tab === 'summary' && '分析报告'}
            {tab === 'settings' && '设置'}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'tweets' && <TweetsTab />}
        {activeTab === 'filtered' && <FilteredTab />}
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <footer className="footer">
        <button className="btn btn-primary">📥 导出全部</button>
      </footer>
    </div>
  );
}

function TweetsTab() {
  return (
    <div className="tab-content">
      <div className="empty">
        <p>暂无数据</p>
        <small>打开 Twitter 页面开始抓取</small>
      </div>
    </div>
  );
}

function FilteredTab() {
  return (
    <div className="tab-content">
      <div className="empty">
        <p>暂无筛选结果</p>
        <button className="btn btn-primary">🤖 运行筛选</button>
      </div>
    </div>
  );
}

function SummaryTab() {
  return (
    <div className="tab-content">
      <div className="empty">
        <p>暂无分析报告</p>
        <button className="btn btn-primary">生成报告</button>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="tab-content settings-content">
      <div className="form-section">
        <h3>🤖 LLM 配置</h3>
        <div className="form-group">
          <label>提供商</label>
          <select>
            <option value="zhipu">智谱 GLM</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div className="form-group">
          <label>API Key</label>
          <input type="password" placeholder="输入 API Key" />
        </div>
      </div>
      <div className="form-section">
        <h3>⚙️ 筛选设置</h3>
        <div className="form-group">
          <label>最低相关度 (1-10)</label>
          <input type="number" min="1" max="10" defaultValue={5} />
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-primary">保存设置</button>
      </div>
    </div>
  );
}
