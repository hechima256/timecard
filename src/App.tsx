import React from 'react';
import { useWorkStatus } from './hooks/useWorkStatus';
import { WorkStatusDisplay } from './components/WorkStatusDisplay';
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
        
        <ActionButtons
          currentStatus={currentStatus}
          todayRecords={todayRecords}
          startWork={startWork}
          endWork={endWork}
          copyToClipboard={copyToClipboard}
        />
      </main>
    </div>
  );
};

export default App;
