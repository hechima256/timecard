import React, { useState, useCallback } from 'react';
import type { WorkTimeRecord } from '../types';
import { toTimeInputValue, fromTimeInputValue } from '../utils/records';

interface RecordsListProps {
  todayRecords: WorkTimeRecord[];
  addRecord: (startTime: Date, endTime: Date | null) => string | null;
  updateRecord: (index: number, startTime: Date, endTime: Date | null) => string | null;
  deleteRecord: (index: number) => void;
}

// 編集中の対象: 既存の記録の位置、または新規追加（'new'）
type EditTarget = number | 'new' | null;

interface FormValues {
  start: string;
  end: string;
}

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * 本日の記録一覧。各記録の編集・削除と、記録の手動追加ができる。
 */
export const RecordsList: React.FC<RecordsListProps> = ({
  todayRecords,
  addRecord,
  updateRecord,
  deleteRecord
}) => {
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [form, setForm] = useState<FormValues>({ start: '', end: '' });
  const [error, setError] = useState<string | null>(null);

  const closeForm = useCallback(() => {
    setEditTarget(null);
    setForm({ start: '', end: '' });
    setError(null);
  }, []);

  const startEditing = useCallback((index: number) => {
    const record = todayRecords[index];
    setEditTarget(index);
    setForm({
      start: toTimeInputValue(record.startTime),
      end: record.endTime ? toTimeInputValue(record.endTime) : ''
    });
    setError(null);
  }, [todayRecords]);

  const startAdding = useCallback(() => {
    setEditTarget('new');
    setForm({ start: '', end: '' });
    setError(null);
  }, []);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (editTarget === null) return;

    // 編集なら元の記録の日付、追加なら今日の日付を基準にする
    const baseDate = editTarget === 'new' ? new Date() : todayRecords[editTarget].startTime;

    const startTime = fromTimeInputValue(form.start, baseDate);
    if (!startTime) {
      setError('開始時刻を入力してください');
      return;
    }
    let endTime: Date | null = null;
    if (form.end.trim() !== '') {
      endTime = fromTimeInputValue(form.end, baseDate);
      if (!endTime) {
        setError('終了時刻の形式が正しくありません');
        return;
      }
    }

    const result = editTarget === 'new'
      ? addRecord(startTime, endTime)
      : updateRecord(editTarget, startTime, endTime);

    if (result) {
      setError(result);
      return;
    }
    closeForm();
  }, [editTarget, form, todayRecords, addRecord, updateRecord, closeForm]);

  const handleDelete = useCallback((index: number) => {
    const record = todayRecords[index];
    const range = `${formatTime(record.startTime)} - ${record.endTime ? formatTime(record.endTime) : '進行中'}`;
    if (window.confirm(`${index + 1}回目の記録（${range}）を削除しますか？`)) {
      if (editTarget === index) closeForm();
      deleteRecord(index);
    }
  }, [todayRecords, editTarget, closeForm, deleteRecord]);

  const renderForm = (label: string) => (
    <form className="record-form" onSubmit={handleSubmit} aria-label={label}>
      <div className="record-form-fields">
        <label className="record-form-field">
          <span>開始</span>
          <input
            type="time"
            value={form.start}
            onChange={e => setForm(prev => ({ ...prev, start: e.target.value }))}
            required
            autoFocus
          />
        </label>
        <span className="record-form-separator" aria-hidden="true">-</span>
        <label className="record-form-field">
          <span>終了</span>
          <input
            type="time"
            value={form.end}
            onChange={e => setForm(prev => ({ ...prev, end: e.target.value }))}
            placeholder="進行中"
          />
        </label>
      </div>
      <p className="record-form-hint">終了を空にすると「進行中」になります</p>
      {error && <p className="record-form-error" role="alert">{error}</p>}
      <div className="record-form-actions">
        <button type="submit" className="record-form-save">保存</button>
        <button type="button" className="record-form-cancel" onClick={closeForm}>キャンセル</button>
      </div>
    </form>
  );

  return (
    <section className="records-list" aria-labelledby="records-list-title">
      <div className="records-list-header">
        <h3 id="records-list-title">本日の記録</h3>
        <button
          type="button"
          className="record-add-button"
          onClick={startAdding}
          disabled={editTarget !== null}
          title="開始・終了時刻を指定して記録を追加します"
        >
          ＋ 記録を追加
        </button>
      </div>

      {todayRecords.length === 0 && editTarget !== 'new' && (
        <p className="records-empty">まだ記録がありません</p>
      )}

      <div className="records-container">
        {todayRecords.map((record, index) => (
          <div key={`${record.startTime.getTime()}-${index}`} className="record-item">
            {editTarget === index ? (
              <>
                <span className="record-number">{index + 1}回目:</span>
                {renderForm(`${index + 1}回目の記録を編集`)}
              </>
            ) : (
              <>
                <span className="record-number">{index + 1}回目:</span>
                <span className="record-time">
                  {formatTime(record.startTime)} - {record.endTime ? formatTime(record.endTime) : '進行中'}
                </span>
                <div className="record-actions">
                  <button
                    type="button"
                    className="record-action-button"
                    onClick={() => startEditing(index)}
                    disabled={editTarget !== null}
                    aria-label={`${index + 1}回目の記録を編集`}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="record-action-button danger"
                    onClick={() => handleDelete(index)}
                    disabled={editTarget !== null}
                    aria-label={`${index + 1}回目の記録を削除`}
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {editTarget === 'new' && (
          <div className="record-item editing">
            <span className="record-number">追加:</span>
            {renderForm('記録を追加')}
          </div>
        )}
      </div>
    </section>
  );
};
