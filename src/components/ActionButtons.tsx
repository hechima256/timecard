import React, { useCallback } from 'react';
import type { WorkStatus } from '../types';

interface ActionButtonsProps {
  currentStatus: WorkStatus;
  hasRecords: boolean;
  startWork: () => void;
  endWork: () => void;
  resetRecords: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentStatus,
  hasRecords,
  startWork,
  endWork,
  resetRecords
}) => {
  const handleReset = useCallback(() => {
    const message = currentStatus === 'working'
      ? '業務中の記録も含めて、本日の記録をすべて削除します。よろしいですか？'
      : '本日の記録をすべて削除します。よろしいですか？';
    if (window.confirm(message)) {
      resetRecords();
    }
  }, [currentStatus, resetRecords]);

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

      <button
        type="button"
        className="reset-button"
        onClick={handleReset}
        disabled={!hasRecords}
        title="保存されている本日の記録をすべて削除します"
      >
        記録をリセット
      </button>
    </div>
  );
};
