import type { WorkTimeRecord } from '../types';

/**
 * 今日の記録から合計勤務時間（ミリ秒）を求める。
 * 進行中の記録は now までを勤務時間として数える。
 */
export const calculateTotalWorkMs = (records: WorkTimeRecord[], now: number): number => {
  return records.reduce((sum, record) => {
    const end = record.endTime ? record.endTime.getTime() : now;
    return sum + Math.max(0, end - record.startTime.getTime());
  }, 0);
};

/**
 * 合計勤務時間を "H:MM" 形式の文字列にする（例: 2時間32分 → "2:32"）。
 * これがクリップボードにコピーされる値。秒は切り捨てる。
 */
export const formatWorkHours = (records: WorkTimeRecord[], now: number): string => {
  const totalMinutes = Math.floor(calculateTotalWorkMs(records, now) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * 合計勤務時間を「H時間M分」の文字列にする（表示用）。
 */
export const formatWorkDuration = (records: WorkTimeRecord[], now: number): string => {
  const totalMinutes = Math.floor(calculateTotalWorkMs(records, now) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
};
