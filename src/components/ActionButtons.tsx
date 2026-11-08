import React, { useState, useEffect, useCallback } from 'react';
import type { WorkStatus, WorkTimeRecord } from '../types';
import { formatWorkHours, formatWorkDuration } from '../utils/workHours';

interface ActionButtonsProps {
  currentStatus: WorkStatus;
  todayRecords: WorkTimeRecord[];
  startWork: () => void;
  endWork: () => void;
  copyToClipboard: () => Promise<void>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentStatus,
  todayRecords,
  startWork,
  endWork,
  copyToClipboard
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // 業務中は勤務時間が増え続けるので、コピーされる値の表示を1秒ごとに更新する
  // （now は進行中の記録にのみ使われるため、終了済みの記録だけなら古くても結果は変わらない）
  useEffect(() => {
    if (currentStatus !== 'working') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStatus]);

  const handleCopy = useCallback(async () => {
    try {
      setIsCopying(true);
      await copyToClipboard();
      console.log('コピー成功');
      // アニメーション完了後にリセット
      setTimeout(() => setIsCopying(false), 500);
    } catch (error) {
      console.error('コピー失敗:', error);
      setIsCopying(false);
    }
  }, [copyToClipboard]);

  const hasRecords = todayRecords.length > 0;
  const workHours = formatWorkHours(todayRecords, now);
  const workDuration = formatWorkDuration(todayRecords, now);

  return (
    <div className="action-buttons" role="group" aria-label="業務時間の操作">
      <div className="work-control">
        {currentStatus === 'free' ? (
          <button
            className="start-button"
            onClick={startWork}
            aria-label="業務を開始する"
            title="クリックして業務を開始します"
          >
            業務開始
          </button>
        ) : (
          <button
            className="end-button"
            onClick={endWork}
            aria-label="業務を終了する"
            title="クリックして業務を終了します"
          >
            業務終了
          </button>
        )}
      </div>

      <div className="copy-section" role="group" aria-label="勤務時間のコピー">
        <div className="copy-preview" aria-live="polite">
          <span className="copy-preview-label">コピーされる値:</span>
          <span className="copy-preview-value">{hasRecords ? workHours : '－'}</span>
          {hasRecords && (
            <span className="copy-preview-detail">（{workDuration}）</span>
          )}
        </div>
        <button
          className={`copy-button hours ${isCopying ? 'success' : ''}`}
          onClick={handleCopy}
          disabled={!hasRecords}
          aria-label="勤務時間をコピー"
          title="合計勤務時間を小数の時間（例: 1.4）でコピーします"
        >
          勤務時間コピー
        </button>
      </div>
    </div>
  );
};
