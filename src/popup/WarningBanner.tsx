import React from 'react';

interface WarningBannerProps {
  visible: boolean;
  pendingCount: number;
  onDismiss?: () => void;
}

export function WarningBanner({ visible, pendingCount, onDismiss }: WarningBannerProps) {
  if (!visible) return null;

  return (
    <div className="warning-banner">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <div className="warning-title">后端服务不可用</div>
        <div className="warning-message">
          正在使用本地缓存，{pendingCount} 条数据待同步
          <br />
          <small>数据将在后台恢复后自动同步</small>
        </div>
      </div>
      {onDismiss && (
        <button className="warning-dismiss" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
}
