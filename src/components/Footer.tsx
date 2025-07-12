import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-4">プラモ塗料シミュレーター</h3>
            <p className="text-slate-400 text-sm">
              プラモデル塗装の計画立案を支援するツールです。
              AI技術を活用した色再現レシピ生成機能も搭載。
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-slate-200 mb-3">機能</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>重ね塗りシミュレーション</li>
              <li>AI色再現レシピ生成</li>
              <li>塗装アドバイス</li>
              <li>プロジェクト管理</li>
              <li>調色機能</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-slate-200 mb-3">サイト情報</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/about" className="hover:text-slate-200 transition-colors">このサイトについて</a></li>
              <li><a href="/privacy" className="hover:text-slate-200 transition-colors">プライバシーポリシー</a></li>
              <li><a href="/terms" className="hover:text-slate-200 transition-colors">利用規約</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} プラモ塗料重ね塗りシミュレーター. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;