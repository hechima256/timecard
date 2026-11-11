import type { WorkTimeRecord } from '../types';

const STORAGE_KEY = 'timecard:state';
const STORAGE_VERSION = 1;

interface StoredRecord {
  startTime: string;
  endTime: string | null;
}

interface StoredState {
  version: number;
  // 記録を保存した日（ローカル日付、YYYY-MM-DD）
  date: string;
  records: StoredRecord[];
}

/** ローカル日付を YYYY-MM-DD の文字列にする */
export const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

/**
 * 今日の記録を localStorage に保存する。
 * 記録が空なら保存内容も削除する。
 */
export const saveRecords = (records: WorkTimeRecord[]): void => {
  try {
    if (records.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const state: StoredState = {
      version: STORAGE_VERSION,
      date: toLocalDateKey(records[0].startTime),
      records: records.map(record => ({
        startTime: record.startTime.toISOString(),
        endTime: record.endTime ? record.endTime.toISOString() : null
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('記録の保存に失敗しました:', error);
  }
};

/**
 * localStorage から記録を復元する。
 *
 * 復元するのは次のいずれかの場合だけ:
 * - 保存した日が今日である
 * - 業務中のまま（最後の記録が未終了）である（日付をまたいで働いている場合）
 * それ以外（昨日以前の終了済みの記録）は破棄する。
 */
export const loadRecords = (now: Date = new Date()): WorkTimeRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' || parsed === null ||
      (parsed as StoredState).version !== STORAGE_VERSION ||
      !Array.isArray((parsed as StoredState).records)
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const state = parsed as StoredState;

    const records: WorkTimeRecord[] = [];
    for (const item of state.records) {
      const startTime = new Date(item.startTime);
      const endTime = item.endTime ? new Date(item.endTime) : null;
      if (!isValidDate(startTime) || (endTime && !isValidDate(endTime))) {
        console.warn('不正な保存データを読み飛ばしました:', item);
        continue;
      }
      records.push({ startTime, endTime });
    }
    if (records.length === 0) return [];

    const lastRecord = records[records.length - 1];
    const isWorking = lastRecord.endTime === null;
    const isToday = state.date === toLocalDateKey(now);
    if (!isToday && !isWorking) {
      console.log('前日以前の記録のため破棄しました:', { 保存日: state.date });
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    console.log('保存されていた記録を復元しました:', {
      保存日: state.date,
      記録数: records.length,
      業務中: isWorking
    });
    return records;
  } catch (error) {
    console.error('記録の復元に失敗しました:', error);
    return [];
  }
};

/** 保存されている記録を削除する */
export const clearStoredRecords = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('記録の削除に失敗しました:', error);
  }
};
