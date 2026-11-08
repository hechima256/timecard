/**
 * 勤怠状態を表す型
 */
export type WorkStatus = 'free' | 'working';

/**
 * 勤務時間の記録を表す型
 */
export interface WorkTimeRecord {
  startTime: Date;
  endTime: Date | null;
}

/**
 * useWorkStatusフックの戻り値の型
 */
export interface WorkStatusHook {
  // 現在の勤怠状態
  currentStatus: WorkStatus;
  // 今日の勤務記録
  todayRecords: WorkTimeRecord[];
  // 業務開始処理
  startWork: () => void;
  // 業務終了処理
  endWork: () => void;
  // 合計勤務時間（小数の時間、例: "1.4"）をクリップボードにコピー
  copyToClipboard: () => Promise<void>;
}