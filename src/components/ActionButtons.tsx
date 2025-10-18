import React, { useState, useCallback } from 'react';
import type { WorkStatus, CopyFormat, WorkTimeRecord } from '../types';

interface ActionButtonsProps {
  currentStatus: WorkStatus;
  todayRecords: WorkTimeRecord[];
  startWork: () => void;
  endWork: () => void;
  copyToClipboard: (format: CopyFormat) => Promise<void>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentStatus,
  todayRecords,
  startWork,
  endWork,
  copyToClipboard
}) => {
  const [copyingButton, setCopyingButton] = useState<string | null>(null);

  const handleCopy = useCallback(async (format: CopyFormat) => {
    console.log('コピーボタンクリック:', { format });
    const buttonId = `copy-${format}`;
    
    try {
      setCopyingButton(buttonId);
      await copyToClipboard(format);
      console.log('コピー成功');
      // アニメーション完了後にリセット
      setTimeout(() => setCopyingButton(null), 500);
    } catch (error) {
      console.error('コピー失敗:', error);
      setCopyingButton(null);
    }
  }, [copyToClipboard]);

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
      
      <div className="copy-buttons" role="group" aria-label="記録のコピー">
        <button
          className={`copy-button simple ${copyingButton === 'copy-simple' ? 'success' : ''}`}
          onClick={() => handleCopy('simple')}
          disabled={todayRecords.length === 0}
          aria-label="シンプル形式でコピー"
          title="一行形式で記録をコピーします"
        >
          シンプルコピー
        </button>
        <button
          className={`copy-button spreadsheet ${copyingButton === 'copy-spreadsheet' ? 'success' : ''}`}
          onClick={() => handleCopy('spreadsheet')}
          disabled={todayRecords.length === 0}
          aria-label="スプレッドシート形式でコピー"
          title="スプレッドシート用にタブ区切りでコピーします"
        >
          スプレッドシートコピー
        </button>
      </div>
    </div>
  );
};