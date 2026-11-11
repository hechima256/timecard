import { useState, useCallback, useEffect } from 'react';
import type { WorkStatus, WorkTimeRecord, WorkStatusHook } from '../types';
import { formatWorkHours } from '../utils/workHours';
import { loadRecords, saveRecords, clearStoredRecords } from '../utils/storage';

// 最後の記録が未終了なら業務中
const statusFromRecords = (records: WorkTimeRecord[]): WorkStatus => {
  const lastRecord = records[records.length - 1];
  return lastRecord && !lastRecord.endTime ? 'working' : 'free';
};

export const useWorkStatus = (): WorkStatusHook => {
  // 今日の勤務記録を管理（ページ再読み込み後も残るよう localStorage から復元する）
  const [todayRecords, setTodayRecords] = useState<WorkTimeRecord[]>(() => loadRecords());

  // 現在の勤怠状態を管理
  const [currentStatus, setCurrentStatus] = useState<WorkStatus>(() => statusFromRecords(todayRecords));

  // 記録が変わるたびに保存する
  useEffect(() => {
    saveRecords(todayRecords);
  }, [todayRecords]);

  // 時刻の検証
  const validateTimeRecord = useCallback((startTime: Date, endTime: Date | null): boolean => {
    // 開始時刻が未来の場合はエラー
    if (startTime.getTime() > Date.now()) {
      console.error('不正な開始時刻（未来の時刻）:', {
        開始時刻: startTime.toLocaleString(),
        現在時刻: new Date().toLocaleString()
      });
      return false;
    }

    // 終了時刻がある場合の検証
    if (endTime) {
      // 終了時刻が開始時刻より前の場合はエラー
      if (endTime.getTime() < startTime.getTime()) {
        console.error('不正な終了時刻（開始時刻より前）:', {
          開始時刻: startTime.toLocaleString(),
          終了時刻: endTime.toLocaleString()
        });
        return false;
      }

      // 業務時間が24時間を超える場合は警告
      const duration = endTime.getTime() - startTime.getTime();
      if (duration > 24 * 60 * 60 * 1000) {
        console.warn('異常に長い業務時間:', {
          開始時刻: startTime.toLocaleString(),
          終了時刻: endTime.toLocaleString(),
          経過時間: `${Math.floor(duration / (1000 * 60 * 60))}時間${Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))}分`
        });
      }
    }

    return true;
  }, []);

  const startWork = useCallback(() => {
    if (currentStatus === 'free') {
      const newStartTime = new Date();
      
      // 前回の記録が未終了の場合は警告
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (lastRecord && !lastRecord.endTime) {
        console.warn('前回の記録が終了していません:', {
          前回開始: lastRecord.startTime.toLocaleString()
        });
        return;
      }

      // 同じ日に10回以上の記録がある場合は警告
      if (todayRecords.length >= 10) {
        console.warn('1日の記録回数が多すぎます:', {
          現在の記録数: todayRecords.length
        });
      }

      if (validateTimeRecord(newStartTime, null)) {
        const newRecord: WorkTimeRecord = {
          startTime: newStartTime,
          endTime: null
        };
        console.log('業務開始:', {
          時刻: newRecord.startTime.toLocaleString(),
          現在の記録数: todayRecords.length
        });
        setTodayRecords(prev => [...prev, newRecord]);
        setCurrentStatus('working');
      }
    } else {
      console.warn('不正な状態での業務開始操作:', currentStatus);
    }
  }, [currentStatus, todayRecords, validateTimeRecord]);

  const endWork = useCallback(() => {
    if (currentStatus === 'working') {
      const endTime = new Date();
      setTodayRecords(prev => {
        const newRecords = [...prev];
        const currentRecord = newRecords[newRecords.length - 1];
        if (!currentRecord) {
          console.error('現在の記録が見つかりません');
          return newRecords;
        }

        if (validateTimeRecord(currentRecord.startTime, endTime)) {
          currentRecord.endTime = endTime;
          const duration = endTime.getTime() - currentRecord.startTime.getTime();
          console.log('業務終了:', {
            開始時刻: currentRecord.startTime.toLocaleString(),
            終了時刻: endTime.toLocaleString(),
            経過時間: `${Math.floor(duration / (1000 * 60))}分`
          });
        }
        return newRecords;
      });
      setCurrentStatus('free');
    } else {
      console.warn('不正な状態での業務終了操作:', currentStatus);
    }
  }, [currentStatus, validateTimeRecord]);

  // 合計勤務時間を "H:MM" 形式（例: 2時間32分 → "2:32"）でクリップボードにコピーする処理
  const copyToClipboard = useCallback(async () => {
    const text = formatWorkHours(todayRecords, Date.now());

    try {
      await navigator.clipboard.writeText(text);
      console.log('クリップボードにコピーしました:', {
        コピーした内容: text
      });
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      throw error;
    }
  }, [todayRecords]);

  // 今日の記録をすべて削除して初期状態に戻す
  const resetRecords = useCallback(() => {
    console.log('記録をリセットしました:', { 削除した記録数: todayRecords.length });
    clearStoredRecords();
    setTodayRecords([]);
    setCurrentStatus('free');
  }, [todayRecords.length]);

  return {
    currentStatus,
    todayRecords,
    startWork,
    endWork,
    copyToClipboard,
    resetRecords
  };
};