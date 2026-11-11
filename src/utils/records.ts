import type { WorkTimeRecord } from '../types';

/** 開始時刻順に並べた新しい配列を返す */
export const sortRecords = (records: WorkTimeRecord[]): WorkTimeRecord[] =>
  [...records].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

/**
 * 記録を追加・更新するときの検証。
 * 問題があれば日本語のエラーメッセージ、なければ null を返す。
 *
 * @param records       現在の記録一覧
 * @param candidate     追加・更新しようとしている記録
 * @param excludeIndex  更新時は元の記録の位置（重なりの判定から除外する）
 */
export const validateRecordChange = (
  records: WorkTimeRecord[],
  candidate: WorkTimeRecord,
  excludeIndex: number | null,
  now: number = Date.now()
): string | null => {
  const start = candidate.startTime.getTime();
  const end = candidate.endTime ? candidate.endTime.getTime() : null;

  if (Number.isNaN(start) || (end !== null && Number.isNaN(end))) {
    return '時刻の形式が正しくありません';
  }
  if (start > now) {
    return '開始時刻に未来の時刻は指定できません';
  }
  if (end !== null && end > now) {
    return '終了時刻に未来の時刻は指定できません';
  }
  if (end !== null && end <= start) {
    return '終了時刻は開始時刻より後にしてください';
  }

  const others = records.filter((_, i) => i !== excludeIndex);

  // 進行中（終了時刻なし）の記録は1件まで
  if (end === null && others.some(r => r.endTime === null)) {
    return '進行中の記録は1件までです';
  }

  // 他の記録と時間が重ならないこと（進行中の記録は現在時刻まで続いているとみなす）
  const candidateEnd = end ?? now;
  for (const other of others) {
    const otherStart = other.startTime.getTime();
    const otherEnd = other.endTime ? other.endTime.getTime() : now;
    if (start < otherEnd && otherStart < candidateEnd) {
      return '他の記録と時間が重なっています';
    }
  }

  // 進行中の記録は最後（最も遅い開始）でなければならない
  if (end === null && others.some(r => r.startTime.getTime() > start)) {
    return '進行中の記録より後に始まる記録があります。終了時刻を入力してください';
  }

  return null;
};

/** Date を <input type="time"> 用の "HH:mm" にする */
export const toTimeInputValue = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * "HH:mm" と基準日から Date を作る。秒は 0 にする。
 * 形式が不正なら null を返す。
 */
export const fromTimeInputValue = (value: string, baseDate: Date): Date | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  );
};
