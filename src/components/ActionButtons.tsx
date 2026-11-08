import React from 'react';
import type { WorkStatus } from '../types';

interface ActionButtonsProps {
  currentStatus: WorkStatus;
  startWork: () => void;
  endWork: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentStatus,
  startWork,
  endWork
}) => {
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
    </div>
  );
};
