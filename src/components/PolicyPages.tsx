import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-lg">
      <h1 className="text-3xl font-bold text-slate-200 mb-6">プライバシーポリシー</h1>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold mb-3">個人情報の取り扱いについて</h2>
          <p>当サイトでは、ユーザーの個人情報保護を重要視し、以下の方針に基づいて適切に取り扱います。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">収集する情報</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Analytics による匿名のアクセス解析情報</li>
            <li>ローカルストレージに保存される塗装プロジェクトデータ（端末内のみ）</li>
            <li>APIキー（端末内のみ保存、サーバーには送信されません）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookieの使用</h2>
          <p>当サイトでは、サービス向上のためにCookieを使用する場合があります。Cookieの使用を望まない場合は、ブラウザの設定で無効にできます。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">第三者配信の広告サービス</h2>
          <p>当サイトでは、Google AdSenseを利用して広告を配信しています。広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他のサイトへのアクセスに関する情報（氏名、住所、メール アドレス、電話番号は含まれません）を使用することがあります。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">お問い合わせ</h2>
          <p>プライバシーポリシーに関するお問い合わせは、サイト管理者までご連絡ください。</p>
        </section>

        <p className="text-sm text-slate-400 mt-8">最終更新日: {new Date().toLocaleDateString('ja-JP')}</p>
      </div>
    </div>
  );
};

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-lg">
      <h1 className="text-3xl font-bold text-slate-200 mb-6">利用規約</h1>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold mb-3">サービスについて</h2>
          <p>プラモ塗料重ね塗りシミュレーターは、プラモデル塗装の計画立案を支援するツールです。実際の塗装結果とは異なる場合があります。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">利用条件</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>本サービスは無料でご利用いただけます</li>
            <li>商用利用も可能ですが、再配布は禁止します</li>
            <li>サービスの改善のため、機能追加や変更を行う場合があります</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">免責事項</h2>
          <p>本サービスの利用により生じた損害について、当サイトは一切の責任を負いません。シミュレーション結果は参考程度にご利用ください。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">著作権</h2>
          <p>本サイトのコンテンツの著作権は当サイトに帰属します。無断転載・複製を禁止します。</p>
        </section>

        <p className="text-sm text-slate-400 mt-8">最終更新日: {new Date().toLocaleDateString('ja-JP')}</p>
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-lg">
      <h1 className="text-3xl font-bold text-slate-200 mb-6">このサイトについて</h1>
      
      <div className="space-y-6 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold mb-3">サイトの目的</h2>
          <p>プラモデル愛好家の皆様が、より効率的で美しい塗装を実現できるよう支援することを目的としています。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">主な機能</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>塗料の重ね塗りシミュレーション</li>
            <li>AI による色再現レシピ生成</li>
            <li>塗装アドバイス機能</li>
            <li>プロジェクト保存・管理</li>
            <li>調色機能</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">対応塗料</h2>
          <p>GSIクレオス、ガイアノーツの主要塗料に対応しています。今後も対応塗料を拡充予定です。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">技術仕様</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>React + TypeScript で開発</li>
            <li>Google AI (Gemini) API を使用</li>
            <li>データはブラウザのローカルストレージに保存</li>
            <li>レスポンシブデザイン対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">お問い合わせ</h2>
          <p>ご質問、ご要望、バグ報告などがございましたら、お気軽にお問い合わせください。</p>
        </section>
      </div>
    </div>
  );
};