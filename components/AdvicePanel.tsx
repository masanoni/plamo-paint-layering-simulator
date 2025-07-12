import React from 'react';
import { PaintLayer, Paint } from '../types';
import { getPaintingAdvice } from '../services/geminiService';

interface AdvicePanelProps {
  layers: PaintLayer[];
  baseColor: string;
  paints: Paint[];
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ layers, baseColor, paints }) => {
  const [advice, setAdvice] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleGetAdvice = async () => {
    setIsLoading(true);
    setAdvice('');
    const result = await getPaintingAdvice(baseColor, layers, paints);
    setAdvice(result);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col p-6 bg-slate-800 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-bold text-slate-300 mb-4">AI ペイントアドバイザー</h2>
      <button
        onClick={handleGetAdvice}
        disabled={isLoading || layers.length === 0}
        className="w-full px-4 py-2 mb-4 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? 'アドバイスを生成中...' : 'AIにアドバイスをもらう'}
      </button>
      <div className="flex-grow p-4 bg-slate-900 rounded-md overflow-y-auto h-96 prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-sky-400">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        )}
        {advice && (
          <div className="whitespace-pre-wrap">{advice}</div>
        )}
        {!isLoading && !advice && (
          <div className="text-slate-400 text-center pt-8">
            <p>下地と塗料レイヤーを設定し、「AIにアドバイスをもらう」ボタンを押してください。</p>
            <p className="mt-2 text-sm">塗装プランについて、AIが専門的な視点から評価と提案をします。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvicePanel;
