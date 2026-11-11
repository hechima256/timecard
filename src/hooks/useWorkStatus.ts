import { useState, useCallback, useEffect, useMemo } from 'react';
import type { WorkStatus, WorkTimeRecord, WorkStatusHook } from '../types';
import { formatWorkHours } from '../utils/workHours';
import { loadRecords, saveRecords, clearStoredRecords } from '../utils/storage';
import { sortRecords, validateRecordChange } from '../utils/records';

// 進行中（終了時刻なし）の記録があれば業務中
const statusFromRecords = (records: WorkTimeRecord[]): WorkStatus =>
  records.some(record => record.endTime === null) ? 'working' : 'free';

export const useWorkStatus = (): WorkStatusHook => {
  // 今日の勤務記録を管理（ページ再読み込み後も残るよう localStorage から復元する）
  const [todayRecords, setTodayRecords] = useState<WorkTimeRecord[]>(() => sortRecords(loadRecords()));

  // 現在の勤怠状態は記録から導く（手入力で記録を変えても食い違わないようにする）
  const currentStatus = useMemo(() => statusFromRecords(todayRecords), [todayRecords]);

  // 記録が変わるたびに保存する
  useEffect(() => {
    saveRecords(todayRecords);
  }, [todayRecords]);

  const startWork = useCallback(() => {
    if (currentStatus !== 'free') {
      console.warn('不正な状態での業務開始操作:', currentStatus);
      return;
    }
    const newRecord: WorkTimeRecord = { startTime: new Date(), endTime: null };
    const error = validateRecordChange(todayRecords, newRecord, null);
    if (error) {
      console.error('業務開始できません:', error);
      return;
    }
    console.log('業務開始:', {
      時刻: newRecord.startTime.toLocaleString(),
      現在の記録数: todayRecords.length
    });
    setTodayRecords(prev => sortRecords([...prev, newRecord]));
  }, [currentStatus, todayRecords]);

  const endWork = useCallback(() => {
    if (currentStatus !== 'working') {
      console.warn('不正な状態での業務終了操作:', currentStatus);
      return;
    }
    const endTime = new Date();
    setTodayRecords(prev => {
      const index = prev.findIndex(record => record.endTime === null);
      if (index === -1) {
        console.error('進行中の記録が見つかりません');
        return prev;
      }
      const current = prev[index];
      // 開始と同じ分に終了した場合など、終了が開始以前にならないよう最低でも開始時刻にそろえる
      const safeEnd = endTime.getTime() > current.startTime.getTime() ? endTime : new Date(current.startTime.getTime());
      console.log('業務終了:', {
        開始時刻: current.startTime.toLocaleString(),
        終了時刻: safeEnd.toLocaleString(),
        経過時間: `${Math.floor((safeEnd.getTime() - current.startTime.getTime()) / (1000 * 60))}分`
      });
      return prev.map((record, i) => (i === index ? { ...record, endTime: safeEnd } : record));
    });
  }, [currentStatus]);

  // 記録を手動で追加する。問題があればエラーメッセージを返す
  const addRecord = useCallback((startTime: Date, endTime: Date | null): string | null => {
    const candidate: WorkTimeRecord = { startTime, endTime };
    const error = validateRecordChange(todayRecords, candidate, null);
    if (error) return error;
    console.log('記録を追加:', {
      開始時刻: startTime.toLocaleString(),
      終了時刻: endTime ? endTime.toLocaleString() : '進行中'
    });
    setTodayRecords(prev => sortRecords([...prev, candidate]));
    return null;
  }, [todayRecords]);

  // 記録を修正する。問題があればエラーメッセージを返す
  const updateRecord = useCallback((index: number, startTime: Date, endTime: Date | null): string | null => {
    if (index < 0 || index >= todayRecords.length) return '対象の記録が見つかりません';
    const candidate: WorkTimeRecord = { startTime, endTime };
    const error = validateRecordChange(todayRecords, candidate, index);
    if (error) return error;
    console.log('記録を修正:', {
      番号: index + 1,
      開始時刻: startTime.toLocaleString(),
      終了時刻: endTime ? endTime.toLocaleString() : '進行中'
    });
    setTodayRecords(prev => sortRecords(prev.map((record, i) => (i === index ? candidate : record))));
    return null;
  }, [todayRecords]);

  // 記録を1件削除する
  const deleteRecord = useCallback((index: number) => {
    console.log('記録を削除:', { 番号: index + 1 });
    setTodayRecords(prev => prev.filter((_, i) => i !== index));
  }, []);

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
  }, [todayRecords.length]);

  return {
    currentStatus,
    todayRecords,
    startWork,
    endWork,
    addRecord,
    updateRecord,
    deleteRecord,
    copyToClipboard,
    resetRecords
  };
};
