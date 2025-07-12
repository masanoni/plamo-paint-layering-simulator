
import React, { useState, useEffect } from 'react';
import { Paint } from '../types';
import { getNewPaintInfo } from '../services/geminiService';
import TrashIcon from './icons/TrashIcon';

interface AdminPanelProps {
  paints: Paint[];
  onUpdate: (newPaints: Paint[]) => void;
  isVisible: boolean;
  onClose: () => void;
  apiKey: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ paints, onUpdate, isVisible, onClose, apiKey }) => {
  const [editablePaints, setEditablePaints] = useState<Paint[]>([]);
  const [newPaintQuery, setNewPaintQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deep copy to avoid direct mutation
    setEditablePaints(JSON.parse(JSON.stringify(paints)));
  }, [paints, isVisible]);

  const handleLinkChange = (code: string, field: 'amazonUrl' | 'rakutenUrl', value: string) => {
    setEditablePaints(prev =>
      prev.map(p => (p.code === code ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveChanges = () => {
    onUpdate(editablePaints);
    alert('変更がローカルストレージに保存されました。サイト全体に反映するには、設定をエクスポートしてpaints.jsonを置き換えてください。');
  };
  
  const handleExport = () => {
      const dataStr = JSON.stringify(editablePaints, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
      const exportFileDefaultName = 'paints.json';
  
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      linkElement.remove();
  }

  const handleDeletePaint = (code: string) => {
    if (window.confirm('この塗料を本当に削除しますか？この操作は元に戻せません。')) {
       const updated = editablePaints.filter(p => p.code !== code);
       setEditablePaints(updated);
       onUpdate(updated);
    }
  };

  const handleAiAddPaint = async () => {
    if (!newPaintQuery.trim()) {
      setError('登録したい塗料の名前を入力してください。');
      return;
    }
    if (!apiKey) {
      setError('AI機能を利用するには、まずAPIキーを設定してください。');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newPaintInfo = await getNewPaintInfo(newPaintQuery, paints, apiKey);
      
      // Check for duplicate code
      if (editablePaints.some(p => p.code === newPaintInfo.code && newPaintInfo.code !== 'N/A')) {
          throw new Error(`製品コード '${newPaintInfo.code}' は既に存在します。`);
      }
      
      const newPaintEntry: Paint = {
        ...newPaintInfo,
        amazonUrl: '',
        rakutenUrl: '',
      };
      
      const updatedPaints = [...editablePaints, newPaintEntry];
      setEditablePaints(updatedPaints);
      onUpdate(updatedPaints);
      setNewPaintQuery('');

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('AIによる登録中に不明なエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 h-4/5 bg-slate-900 border-t-2 border-indigo-500 shadow-2xl rounded-t-lg flex flex-col transform transition-transform duration-300 ease-in-out"
        style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-indigo-400">管理者パネル</h2>
          <div className="flex items-center gap-4">
            <button onClick={handleExport} className="px-4 py-2 font-bold text-sky-300 bg-sky-800 rounded-md hover:bg-sky-700 transition-colors">設定をJSONファイルにエクスポート</button>
            <button onClick={onClose} className="px-4 py-2 font-bold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">閉じる</button>
          </div>
        </header>

        <div className="flex-grow p-6 overflow-y-auto">
          {/* AI Paint Registration */}
          <div className="bg-slate-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-slate-200 mb-2">AIによる塗料の自動登録</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPaintQuery}
                onChange={e => setNewPaintQuery(e.target.value)}
                placeholder="例: ガイアノーツ Ex-フラットクリアープレミアム"
                className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                disabled={isLoading}
              />
              <button onClick={handleAiAddPaint} disabled={isLoading || !apiKey} className="px-4 py-2 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-600">
                {isLoading ? '登録中...' : 'AIで登録'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Paint List for Affiliate Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-200">塗料リストとアフィリエイトリンク管理</h3>
            {editablePaints.map(paint => (
              <div key={paint.code} className="bg-slate-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-300">{paint.brand} {paint.series} - {paint.name} ({paint.code})</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">{paint.paintSystem}</span>
                        <button onClick={() => handleDeletePaint(paint.code)} className="p-1 text-slate-500 hover:text-red-500">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Amazon URL"
                    value={paint.amazonUrl || ''}
                    onChange={e => handleLinkChange(paint.code, 'amazonUrl', e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Rakuten URL"
                    value={paint.rakutenUrl || ''}
                    onChange={e => handleLinkChange(paint.code, 'rakutenUrl', e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-4 bg-slate-800 border-t border-slate-700 flex-shrink-0 text-right">
          <button onClick={handleSaveChanges} className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
            ローカルに変更を保存
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;
