import React, { useState } from 'react';
import AICodeGenerator from './components/AICodeGenerator';
import AetheriaVocalForge from './daw/AetheriaVocalForge';
import { Code, Music } from 'lucide-react';
import './styles/index.css';

function App() {
  const [currentView, setCurrentView] = useState('daw');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Professional Audio Suite
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('daw')}
              className={`px-4 py-2 rounded flex items-center space-x-2 ${
                currentView === 'daw' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Music size={20} />
              <span>DAW</span>
            </button>
            <button
              onClick={() => setCurrentView('ai')}
              className={`px-4 py-2 rounded flex items-center space-x-2 ${
                currentView === 'ai' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Code size={20} />
              <span>AI Code Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentView === 'daw' ? <AetheriaVocalForge /> : <AICodeGenerator />}
    </div>
  );
}

export default App;
