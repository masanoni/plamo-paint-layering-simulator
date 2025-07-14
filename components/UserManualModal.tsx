import React from 'react';

interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-sky-400">ユーザーマニュアル</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-bold">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto flex-grow prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-sky-400 max-w-none">
                    <p>この度は「プラモ塗料 重ね塗りシミュレーター」をご利用いただき、誠にありがとうございます。</p>
                    <p>このアプリケーションを使えば、エアブラシでの重ね塗りをバーチャルで試し、理想の仕上がり色を見つけることができます。</p>

                    <h3>1. このアプリでできること</h3>
                    <ul>
                        <li><strong>色の重ね塗りシミュレーション</strong>: 塗料を何層にも重ねたとき、最終的にどんな色になるかをプレビューできます。</li>
                        <li><strong>リアルな質感表現</strong>: メタリック、パール、クリアー、つや消しなど、塗料や仕上げの質感を3D風プレビューでリアルに確認できます。</li>
                        <li><strong>AIによるアドバイス</strong>: あなたが考えた塗装プランについて、プロのモデラーのような視点からAIが評価と改善案を提案します。</li>
                        <li><strong>AIによる色再現 (カラーリプリケーター)</strong>: 写真やイラストから色を抽出し、その色を再現するための塗装レシピをAIが生成します。</li>
                        <li><strong>調色 (カラーミキサー)</strong>: 複数の塗料を混ぜて、自分だけのカスタムカラーを作成できます。</li>
                        <li><strong>プロジェクト管理</strong>: 作成した塗装レシピを保存し、いつでも呼び出すことができます。</li>
                    </ul>

                    <h3>2. 基本的な使い方：重ね塗りシミュレーション</h3>
                    <p>メイン画面では、3つの簡単なステップで塗装シミュレーションができます。</p>

                    <h4>STEP 1: 下地の色を選ぶ</h4>
                    <ol>
                        <li>画面左側にある「塗装レイヤー設定」の中の「<strong>下地の色</strong>」を見つけます。</li>
                        <li>色のついた四角いボックスをクリックするとカラーピッカーが開きます。好きな色を選んでください。サーフェイサーの色（グレー、黒、白など）を想定して選ぶのがおすすめです。</li>
                    </ol>

                    <h4>STEP 2: 塗料のレイヤーを追加・設定する</h4>
                    <ol>
                        <li>「<strong>新しいレイヤーを追加</strong>」ボタンを押すと、塗装の1層目が追加されます。</li>
                        <li>追加されたレイヤーの各項目を設定していきましょう。
                            <ul>
                                <li><strong>塗料の選択</strong>: 4つのドロップダウンリストを左から順に選んで、使いたい塗料を絞り込みます。
                                    <ol>
                                        <li><strong>塗料系統</strong>: 「ラッカー」「水性」「アクリジョン」から選びます。</li>
                                        <li><strong>ブランド</strong>: 「GSIクレオス」「ガイアノーツ」などから選びます。</li>
                                        <li><strong>シリーズ</strong>: 「Mr.カラー」「ガイアカラー」などから選びます。</li>
                                        <li><strong>塗料名</strong>: 最後に具体的な塗料を選びます。</li>
                                    </ol>
                                </li>
                                <li><strong>カスタムカラーを使いたい場合</strong>: 「ブランド」で「その他」を選ぶと、自由に色を選択できるカラーピッカーが表示されます。</li>
                                <li><strong>吹付回数</strong>: スライダーを左右に動かして、塗料を何回吹き付けるかを調整します（1〜10回）。回数が多いほど、色が濃く乗ります。</li>
                            </ul>
                        </li>
                        <li>塗装の層を増やしたい場合は、再度「新しいレイヤーを追加」ボタンを押してください。</li>
                        <li>レイヤーの順番は、左側の「≡」アイコンをドラッグ＆ドロップすることで自由に入れ替えられます。</li>
                    </ol>

                    <h4>STEP 3: プレビューで仕上がりを確認する</h4>
                    <p>画面左下にある「<strong>仕上がりプレビュー (3D風)</strong>」を見てみましょう。</p>
                    <p>設定した下地とレイヤーの通りに塗装した場合の、最終的な色と質感が球体で表示されます。メタリックの粒子感や、光沢・つや消しといった質感の違いも再現されるので、理想の仕上がりになるようレイヤーを調整してみてください。</p>
                    
                    <h3>3. 便利な機能を使ってみよう</h3>

                    <h4>AI ペイントアドバイザー (画面右)</h4>
                    <p>あなたの塗装プランがうまくいくか、AIが専門的な視点からチェックしてくれます。</p>
                    <ul>
                        <li><strong>使い方</strong>:
                            <ol>
                                <li>下地とレイヤーを1つ以上設定します。</li>
                                <li>「<strong>AIにアドバイスをもらう</strong>」ボタンを押します。</li>
                                <li>しばらく待つと、AIが発色、塗料の相性、塗装のコツなどを詳しく解説してくれます。</li>
                            </ol>
                        </li>
                    </ul>
                    <p><strong>※ヒント</strong>: この機能を使うには、Google AIのAPIキーが必要です。画面上部の「Google AI APIキー設定」からキーを設定してください。キーは無料で取得できます。</p>

                    <h4>カラーリプリケーター (AI色再現)</h4>
                    <p>「この色をプラモデルで再現したい！」と思ったときに役立つ機能です。</p>
                     <ul>
                        <li><strong>使い方</strong>:
                            <ol>
                                <li>「<strong>画像をアップロード</strong>」ボタンを押し、目標の色が含まれる写真やイラストを選びます。</li>
                                <li>プレビューに表示された画像の上で、再現したい色をクリックします。</li>
                                <li>仕上がりの条件（下地の色、仕上がりの種類、トップコート、使用する塗料系統）を指定します。</li>
                                <li>「<strong>この条件で再現レシピを生成する</strong>」ボタンを押すと、AIが具体的な塗装手順と調色レシピを提案してくれます。</li>
                                <li>気に入ったレシピは「<strong>このレシピをレイヤー設定に適用</strong>」ボタンで、メインのシミュレーターに反映させることも可能です。</li>
                            </ol>
                        </li>
                    </ul>

                    <h4>カラーミキサー (調色機能)</h4>
                    <p>レイヤーの右側にある<strong>ミキサーのアイコン</strong>（⚙のようなアイコン）をクリックすると、カラーミキサーが開きます。複数の塗料を選んで混ぜ合わせ、それぞれの比率を調整することで、オリジナルの色を作成できます。作成した色はレイヤーに適用されます。</p>

                    <h4>プロジェクト管理</h4>
                    <p>頑張って作った塗装プランは、名前を付けて保存できます。「<strong>プロジェクト管理</strong>」セクションでプロジェクト名を入力して「保存」ボタンを押してください。保存したプロジェクトは「読込」ボタンでいつでも呼び出すことができます。</p>
                </div>

                 <footer className="p-4 border-t border-slate-700 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                        閉じる
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UserManualModal;
