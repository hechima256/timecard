import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkStatus, WorkTimeRecord } from '../types';
import { formatWorkHours, formatWorkDuration } from '../utils/workHours';

interface WorkSummaryProps {
  currentStatus: WorkStatus;
  todayRecords: WorkTimeRecord[];
  copyToClipboard: () => Promise<void>;
}

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * 本日の合計勤務時間を表示し、その値（例: 2:32）をコピーするカード
 */
export const WorkSummary: React.FC<WorkSummaryProps> = ({
  currentStatus,
  todayRecords,
  copyToClipboard
}) => {
  const [now, setNow] = useState(() => Date.now());
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | null>(null);

  // 業務中は勤務時間が増え続けるので、表示を1秒ごとに更新する
  // （now は進行中の記録にのみ使われるため、終了済みの記録だけなら古くても結果は変わらない）
  useEffect(() => {
    if (currentStatus !== 'working') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStatus]);

  // アンマウント時に「コピーしました」表示のタイマーを片付ける
  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    try {
      await copyToClipboard();
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 1800);
  }, [copyToClipboard]);

  const hasRecords = todayRecords.length > 0;
  const hours = formatWorkHours(todayRecords, now);
  const duration = formatWorkDuration(todayRecords, now);

  const buttonLabel =
    copyState === 'copied' ? 'コピーしました' :
    copyState === 'failed' ? 'コピーできませんでした' :
    'コピー';

  return (
    <section className="work-summary" aria-labelledby="work-summary-title">
      <h2 id="work-summary-title" className="work-summary-title">本日の勤務時間</h2>

      <div className="work-summary-body">
        <div className="work-summary-figure">
          <span className="work-summary-hours">{hours}</span>
        </div>
        <p className="work-summary-duration">
          {hasRecords ? duration : 'まだ記録がありません'}
        </p>
      </div>

      <button
        type="button"
        className={`copy-button ${copyState}`}
        onClick={handleCopy}
        disabled={!hasRecords}
        aria-label={`勤務時間 ${hours} をコピー`}
        title={`「${hours}」をクリップボードにコピーします`}
      >
        <svg
          className="copy-button-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {copyState === 'copied' ? (
            <path d="M20 6L9 17l-5-5" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        <span className="copy-button-label" aria-live="polite">{buttonLabel}</span>
      </button>
    </section>
  );
};
