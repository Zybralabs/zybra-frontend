import React from 'react';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <div className="min-h-screen flex bg-dark text-white">
      <Sidebar />
      <div className="flex-1">
        <Dashboard />
      </div>
    </div>
  );
};

export default App;
