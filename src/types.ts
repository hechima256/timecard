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
  // 記録を手動で追加する。問題があればエラーメッセージ、成功なら null を返す
  addRecord: (startTime: Date, endTime: Date | null) => string | null;
  // 記録を修正する。問題があればエラーメッセージ、成功なら null を返す
  updateRecord: (index: number, startTime: Date, endTime: Date | null) => string | null;
  // 記録を1件削除する
  deleteRecord: (index: number) => void;
  // 合計勤務時間（"H:MM" 形式、例: "2:32"）をクリップボードにコピー
  copyToClipboard: () => Promise<void>;
  // 今日の記録をすべて削除して初期状態に戻す
  resetRecords: () => void;
}