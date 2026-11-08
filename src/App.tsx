import React from 'react';
import { useWorkStatus } from './hooks/useWorkStatus';
import { WorkStatusDisplay } from './components/WorkStatusDisplay';
import { WorkSummary } from './components/WorkSummary';
import { ActionButtons } from './components/ActionButtons';
import './styles.css';

export const App: React.FC = () => {
  const {
    currentStatus,
    todayRecords,
    startWork,
    endWork,
    copyToClipboard
  } = useWorkStatus();

  return (
    <div className="app">
      <header className="app-header">
        <h1>タイムカード</h1>
      </header>
      
      <main className="app-main">
        <WorkStatusDisplay
          currentStatus={currentStatus}
          todayRecords={todayRecords}
        />

        <WorkSummary
          currentStatus={currentStatus}
          todayRecords={todayRecords}
          copyToClipboard={copyToClipboard}
        />
        
        <ActionButtons
          currentStatus={currentStatus}
          startWork={startWork}
          endWork={endWork}
        />
      </main>
    </div>
  );
};

export default App;
