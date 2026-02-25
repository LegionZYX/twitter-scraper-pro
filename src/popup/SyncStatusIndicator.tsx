import React, { useState, useEffect } from 'react';
import { syncManager } from '../sync/SyncManager';

interface SyncStatus {
  status: 'online' | 'offline' | 'syncing';
  lastSync: number;
  pendingCount: number;
  retryCount: number;
}

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'online',
    lastSync: Date.now(),
    pendingCount: 0,
    retryCount: 0
  });

  useEffect(() => {
    // 订阅状态变更
    const unsubscribe = syncManager.onStatusChange(setSyncStatus);
    return () => unsubscribe;
  }, []);

  const handleManualSync = async () => {
    await syncManager.manualSync();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={`sync-status ${syncStatus.status}`}>
      <div className="sync-status-header">
        <span className="sync-icon">
          {syncStatus.status === 'online' && '🟢'}
          {syncStatus.status === 'offline' && '🟡'}
          {syncStatus.status === 'syncing' && '🔄'}
        </span>
        <span className="sync-text">
          {syncStatus.status === 'online' && '在线'}
          {syncStatus.status === 'offline' && '离线模式'}
          {syncStatus.status === 'syncing' && '同步中...'}
        </span>
        {syncStatus.status === 'online' && (
          <span className="sync-last">
            上次同步：{formatTime(syncStatus.lastSync)}
          </span>
        )}
      </div>
      
      {syncStatus.status === 'offline' && (
        <div className="sync-offline-details">
          <div className="pending-count">
            待同步：{syncStatus.pendingCount} 条
          </div>
          <button 
            className="btn btn-sync"
            onClick={handleManualSync}
            disabled={syncStatus.pendingCount === 0}
          >
            立即同步
          </button>
        </div>
      )}
    </div>
  );
}
