import React, { useState, useEffect } from 'react';
import type { WorkStatus, WorkTimeRecord } from '../types';

interface WorkStatusDisplayProps {
  currentStatus: WorkStatus;
  todayRecords: WorkTimeRecord[];
}

export const WorkStatusDisplay: React.FC<WorkStatusDisplayProps> = ({
  currentStatus,
  todayRecords
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1秒ごとに現在時刻を更新
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 時刻のフォーマット
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 現在時刻の表示形式
  const formattedCurrentTime = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // 状態に応じたメッセージ
  const statusMessage = currentStatus === 'working' ? '業務中' : '自由時間';
  const statusClassName = `status ${currentStatus}`;

  return (
    <div className="work-status-display">
      <div className={statusClassName}>
        <span className="status-label">現在の状態:</span>
        <span className="status-value">{statusMessage}</span>
      </div>
      <div className="current-time">
        <span className="time-label">現在時刻:</span>
        <span className="time-value">{formattedCurrentTime}</span>
      </div>
      {todayRecords.length > 0 && (
        <div className="records-list">
          <h3>本日の記録</h3>
          <div className="records-container">
            {todayRecords.map((record, index) => (
              <div key={index} className="record-item">
                <span className="record-number">{index + 1}回目:</span>
                <span className="record-time">
                  {formatTime(record.startTime)} - {record.endTime ? formatTime(record.endTime) : '進行中'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};