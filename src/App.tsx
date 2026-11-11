import React from 'react';
import { useWorkStatus } from './hooks/useWorkStatus';
import { WorkStatusDisplay } from './components/WorkStatusDisplay';
import { RecordsList } from './components/RecordsList';
import { WorkSummary } from './components/WorkSummary';
import { ActionButtons } from './components/ActionButtons';
import './styles.css';

export const App: React.FC = () => {
  const {
    currentStatus,
    todayRecords,
    startWork,
    endWork,
    addRecord,
    updateRecord,
    deleteRecord,
    copyToClipboard,
    resetRecords
  } = useWorkStatus();

  return (
    <div className="app">
      <header className="app-header">
        <h1>タイムカード</h1>
      </header>
      
      <main className="app-main">
        <WorkStatusDisplay currentStatus={currentStatus} />

        <WorkSummary
          currentStatus={currentStatus}
          todayRecords={todayRecords}
          copyToClipboard={copyToClipboard}
        />

        <ActionButtons
          currentStatus={currentStatus}
          hasRecords={todayRecords.length > 0}
          startWork={startWork}
          endWork={endWork}
          resetRecords={resetRecords}
        />

        <RecordsList
          todayRecords={todayRecords}
          addRecord={addRecord}
          updateRecord={updateRecord}
          deleteRecord={deleteRecord}
        />
      </main>
    </div>
  );
};

export default App;
