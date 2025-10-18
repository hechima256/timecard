import { useState, useCallback, useEffect } from 'react';
import type { WorkStatus, WorkTimeRecord, CopyFormat, WorkStatusHook } from '../types';

// ストレージのキー設定
const STORAGE_KEY_PREFIX = 'timecard';
const getStorageKey = (date: string = new Date().toISOString().split('T')[0]) =>
  `${STORAGE_KEY_PREFIX}_${date}`;

// 日付が変わったかどうかを判定する関数
const isNewDay = (lastUpdated: string): boolean => {
  const lastDate = new Date(lastUpdated).toISOString().split('T')[0];
  const currentDate = new Date().toISOString().split('T')[0];
  return lastDate !== currentDate;
};

// ストレージデータの型
interface StorageData {
  currentStatus: WorkStatus;
  todayRecords: {
    startTime: string;
    endTime: string | null;
  }[];
  lastUpdated: string;
}

export const useWorkStatus = (): WorkStatusHook => {
  // 現在の勤怠状態を管理
  const [currentStatus, setCurrentStatus] = useState<WorkStatus>('free');
  
  // 今日の勤務記録を管理
  const [todayRecords, setTodayRecords] = useState<WorkTimeRecord[]>([]);

  // ストレージからデータを読み込む
  const loadFromStorage = useCallback(() => {
    try {
      const key = getStorageKey();
      const storedData = localStorage.getItem(key);
      console.log('ストレージからのデータ読み込み試行:', { key });
      
      if (storedData) {
        const data: StorageData = JSON.parse(storedData);
        
        // 日付が変わっていた場合はリセット
        if (isNewDay(data.lastUpdated)) {
          console.log('日付が変更されたためデータをリセット:', {
            前回の更新: data.lastUpdated,
            現在時刻: new Date().toISOString()
          });
          return;
        }

        // データを復元
        setCurrentStatus(data.currentStatus);
        const records = data.todayRecords.map(record => ({
          startTime: new Date(record.startTime),
          endTime: record.endTime ? new Date(record.endTime) : null
        }));
        setTodayRecords(records);
        
        console.log('データを復元:', {
          状態: data.currentStatus,
          記録数: records.length
        });
      } else {
        console.log('保存されたデータなし');
      }
    } catch (error) {
      console.error('ストレージからの読み込みに失敗しました:', error);
    }
  }, []);

  // ストレージにデータを保存
  const saveToStorage = useCallback(() => {
    try {
      const key = getStorageKey();
      const data: StorageData = {
        currentStatus,
        todayRecords: todayRecords.map(record => ({
          startTime: record.startTime.toISOString(),
          endTime: record.endTime?.toISOString() ?? null
        })),
        lastUpdated: new Date().toISOString()
      };
      
      console.log('ストレージに保存:', {
        キー: key,
        状態: currentStatus,
        記録数: todayRecords.length,
        最終更新: data.lastUpdated
      });

      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      
      // 保存後の確認
      const savedData = localStorage.getItem(key);
      if (savedData !== serializedData) {
        console.warn('保存データの不一致:', {
          期待値: serializedData,
          実際: savedData
        });
      } else {
        console.log('保存成功');
      }
    } catch (error) {
      console.error('ストレージへの保存に失敗しました:', error);
    }
  }, [currentStatus, todayRecords]);

  // 日付変更の監視
  useEffect(() => {
    const checkDateChange = () => {
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (lastRecord && isNewDay(lastRecord.startTime.toISOString())) {
        console.log('日付が変更されたため記録をリセット');
        setTodayRecords([]);
        setCurrentStatus('free');
      }
    };

    const timer = setInterval(checkDateChange, 1000 * 60); // 1分ごとにチェック
    return () => clearInterval(timer);
  }, [todayRecords]);

  // 初回マウント時にデータを読み込む
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 状態が変更されたときにストレージに保存
  useEffect(() => {
    saveToStorage();
  }, [currentStatus, todayRecords, saveToStorage]);

  // 業務開始処理
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

  // 時刻を "HH:mm" 形式にフォーマットする関数
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // クリップボードにコピーする処理
  const copyToClipboard = useCallback(async (format: CopyFormat) => {
    let text = '';
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    console.log('クリップボードコピー開始:', {
      フォーマット: format,
      記録数: todayRecords.length
    });

    if (format === 'simple') {
      // シンプルフォーマット: "MM/DD: 開始-終了"
      text = `${today}: ${todayRecords
        .map(record => {
          const start = formatTime(record.startTime);
          const end = record.endTime ? formatTime(record.endTime) : '進行中';
          return `${start}-${end}`;
        })
        .join(', ')}`;
    } else {
      // 詳細フォーマット
      const totalTime = todayRecords.reduce((total, record) => {
        if (!record.endTime) return total;
        return total + (record.endTime.getTime() - record.startTime.getTime());
      }, 0);
      
      text = `${today}\n\n`;
      todayRecords.forEach((record, index) => {
        const start = formatTime(record.startTime);
        const end = record.endTime ? formatTime(record.endTime) : '進行中';
        const duration = record.endTime
          ? `（${Math.floor((record.endTime.getTime() - record.startTime.getTime()) / (1000 * 60))}分）`
          : '';
        text += `${index + 1}回目: ${start} - ${end}${duration}\n`;
      });

      if (totalTime > 0) {
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        text += `\n合計時間: ${hours}時間${minutes}分`;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      console.log('クリップボードにコピーしました:', {
        フォーマット: format,
        コピーした内容: text
      });
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      throw error;
    }
  }, [todayRecords]);

  return {
    currentStatus,
    todayRecords,
    startWork,
    endWork,
    copyToClipboard
  };
};