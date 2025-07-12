
import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  initialKey: string;
  onSave: (key: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ initialKey, onSave }) => {
  const [apiKey, setApiKey] = useState(initialKey);

  useEffect(() => {
    setApiKey(initialKey);
  }, [initialKey]);

  const handleSave = () => {
    onSave(apiKey);
    alert('APIキーが保存されました。');
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold text-slate-300 mb-2">Google AI APIキー設定</h2>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-grow w-full">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ここにAPIキーを貼り付け"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              aria-label="Google AI API Key"
            />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-600"
              disabled={!apiKey}
            >
              保存
            </button>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-3">
        AI機能を利用するにはGoogle AIのAPIキーが必要です。
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-2 text-sky-400 hover:text-sky-300 font-bold underline"
        >
          Google AI Studioから無料でAPIキーを取得
        </a>
      </p>
    </div>
  );
};

export default ApiKeyManager;
