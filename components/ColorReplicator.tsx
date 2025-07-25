import React, { useState, useRef } from 'react';
import { getReplicationRecipe, getConceptualRecipe } from '../services/geminiService';
import EyedropperIcon from './icons/EyedropperIcon';
import GeneratedRecipe from './GeneratedRecipe';
import ProductAffiliateLinks from './ProductAffiliateLinks';
import { RecipeConditions, FinishTypeGoal, TopCoatFinish, ParsedRecipe, Paint, PaintSystem } from '../types';
import CameraIcon from './icons/CameraIcon';
import LightbulbIcon from './icons/LightbulbIcon';

interface ColorReplicatorProps {
    onApplyRecipe: (recipe: ParsedRecipe) => void;
    paints: Paint[];
    apiKey: string;
}

const ColorReplicator: React.FC<ColorReplicatorProps> = ({ onApplyRecipe, paints, apiKey }) => {
    const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
    
    // States for image-based replication
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [targetColor, setTargetColor] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States for text-based replication
    const [baseConcept, setBaseConcept] = useState('');
    const [finishConcept, setFinishConcept] = useState('');
    
    // Common states
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conditions, setConditions] = useState<RecipeConditions>({
        baseCoat: '黒サーフェイサー',
        finishType: 'おまかせ',
        topCoat: 'おまかせ',
        paintSystem: PaintSystem.LACQUER,
    });


    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setRecipe(null);
        setTargetColor(null);
        setImageSrc(null);

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const dataUrl = e.target?.result;
            if (typeof dataUrl !== 'string') {
                setError('画像データの読み込みに失敗しました。');
                return;
            }

            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const container = canvas.parentElement;
                        if (!container) return;
                        
                        const containerWidth = container.clientWidth;
                        const scale = Math.min(1, containerWidth / img.width);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        setImageSrc(dataUrl);
                    }
                }
            };
            img.onerror = () => {
                setError('画像のデコードに失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。');
            };
            img.src = dataUrl;
        };
        
        reader.onerror = () => {
            setError('ファイルの読み込み中にエラーが発生しました。');
        };
        
        reader.readAsDataURL(file);
    };
    
    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = `#${pixel.slice(0, 3).reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '')}`;
        setTargetColor(hex);
        setRecipe(null);
    };

    const handleGetRecipe = async () => {
        if (!apiKey) return;
        setIsLoading(true);
        setRecipe(null);
        setError(null);

        try {
            let result: ParsedRecipe;
            if (activeTab === 'image') {
                if (!targetColor) {
                    setError('画像をクリックして目標の色を選択してください。');
                    setIsLoading(false);
                    return;
                }
                result = await getReplicationRecipe(targetColor, conditions, paints, apiKey);
            } else { // activeTab === 'text'
                if (!baseConcept.trim() || !finishConcept.trim()) {
                    setError('下地のイメージと完成イメージの両方を入力してください。');
                    setIsLoading(false);
                    return;
                }
                result = await getConceptualRecipe(baseConcept, finishConcept, conditions, paints, apiKey);
            }
            setRecipe(result);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('レシピの生成中に不明なエラーが発生しました。');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConditionChange = (field: keyof RecipeConditions, value: string | PaintSystem) => {
        setConditions(prev => ({ ...prev, [field]: value }));
    };

    const tabButtonClass = (tabName: 'image' | 'text') => 
        `flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-colors duration-200 border-b-4 focus:outline-none ${
        activeTab === tabName
            ? 'text-sky-400 border-sky-400 bg-slate-800'
            : 'text-slate-400 border-transparent hover:bg-slate-700/50'
        }`;

    const canGenerate = apiKey && (
        (activeTab === 'image' && !!targetColor) ||
        (activeTab === 'text' && baseConcept.trim() !== '' && finishConcept.trim() !== '')
    );
    
    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-slate-300 mb-4">カラーリプリケーター (AI色再現)</h2>
            <p className="text-slate-400 mb-4 text-sm">画像やイメージから色を再現するための塗装・調色レシピをAIが生成します。</p>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-700 mb-4 rounded-t-lg overflow-hidden bg-slate-900">
                <button onClick={() => setActiveTab('image')} className={tabButtonClass('image')}>
                    <CameraIcon className="w-5 h-5" /> 画像から再現
                </button>
                <button onClick={() => setActiveTab('text')} className={tabButtonClass('text')}>
                    <LightbulbIcon className="w-5 h-5" /> イメージから生成
                </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'image' && (
                <div className="space-y-4">
                     <input ref={fileInputRef} type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="hidden" />
                    <button
                        onClick={handleUploadButtonClick}
                        className="w-full inline-block text-center cursor-pointer px-4 py-2 mb-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                    >
                        {imageSrc ? '別の画像をアップロード' : '画像をアップロード'}
                    </button>
                     <p className="text-center text-xs text-slate-500 -mt-2 mb-2">対応形式: JPG, PNG, WEBP</p>
                    
                    <div className="bg-slate-900 p-2 rounded-lg min-h-[200px] flex items-center justify-center border-2 border-dashed border-slate-700 transition-all">
                        {!imageSrc && (
                            <div className="text-center text-slate-500">
                                <p>ここに画像プレビューが表示されます。</p>
                            </div>
                        )}
                        <canvas 
                            ref={canvasRef} 
                            onClick={handleCanvasClick} 
                            className={`${!imageSrc ? 'hidden' : 'block max-w-full h-auto cursor-crosshair rounded-md'}`}
                            aria-label="画像プレビュー。クリックして色を選択"
                        />
                    </div>
                    {imageSrc && (
                        <div className="flex items-center justify-center gap-4 bg-slate-700 p-3 rounded-lg">
                            <EyedropperIcon className="w-8 h-8 text-sky-400 flex-shrink-0"/>
                            {!targetColor ? (
                                <p className="text-slate-300">画像をクリックして目標の色を選択してください。</p>
                            ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-slate-300">選択中の色:</span>
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-400" style={{backgroundColor: targetColor}} />
                                    <span className="font-mono text-lg">{targetColor}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'text' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="baseConcept" className="block text-sm font-medium text-slate-300 mb-1">下地の色・種類 (出発点)</label>
                        <input
                            type="text" id="baseConcept" value={baseConcept}
                            onChange={e => setBaseConcept(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            placeholder="例: クリアーレッド、メタリックシルバー下地" />
                    </div>
                    <div>
                        <label htmlFor="finishConcept" className="block text-sm font-medium text-slate-300 mb-1">完成イメージ (ゴール)</label>
                        <textarea
                            id="finishConcept" value={finishConcept}
                            onChange={e => setFinishConcept(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            placeholder="例: サファイヤをイメージした宝石のような輝かしい赤"
                        />
                    </div>
                </div>
            )}

            {/* Common Conditions & Actions */}
             <div className="mt-6 p-4 bg-slate-700 rounded-lg space-y-4">
                <h3 className="text-md font-bold text-slate-200 -mb-2">共通の仕上がり条件</h3>

                {activeTab === 'image' && (
                    <div>
                        <label htmlFor="baseCoat" className="block text-sm font-medium text-slate-300 mb-1">1. 下地の色 (自由入力)</label>
                        <input
                            type="text"
                            id="baseCoat"
                            value={conditions.baseCoat}
                            onChange={(e) => handleConditionChange('baseCoat', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            placeholder="例: 黒サフ、シルバー下地、白"
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">仕上がりの種類</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {(['おまかせ', '通常', 'メタリック', 'キャンディ', '偏光塗装'] as FinishTypeGoal[]).map(type => (
                            <button key={type} onClick={() => handleConditionChange('finishType', type)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.finishType === type ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{type}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">トップコート</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['おまかせ', '光沢', '半光沢', 'つや消し'] as TopCoatFinish[]).map(finish => (
                            <button key={finish} onClick={() => handleConditionChange('topCoat', finish)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.topCoat === finish ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{finish}</button>
                        ))}
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">使用する塗料系統</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.values(PaintSystem)).map(system => (
                            <button key={system} onClick={() => handleConditionChange('paintSystem', system)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.paintSystem === system ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{system}</button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleGetRecipe}
                disabled={!canGenerate || isLoading}
                className="w-full px-4 py-3 mt-6 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
            >
                {isLoading ? 'AIがレシピを生成中...' : 'この条件で再現レシピを生成する'}
            </button>

            {(recipe || isLoading || error) && (
                <div className='mt-6'>
                    <GeneratedRecipe recipeText={recipe?.recipeText || null} isLoading={isLoading} error={error} />
                    {recipe && (
                        <div className="mt-4">
                                <button 
                                onClick={() => onApplyRecipe(recipe)}
                                className="w-full px-4 py-2 mb-4 font-bold text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors duration-200"
                            >
                                このレシピをレイヤー設定に適用
                            </button>
                            <ProductAffiliateLinks products={recipe.products} paints={paints} />
                        </div>
                    )}
                </div>
            )}

            {error && !isLoading && !recipe && (
                <div className="p-3 mt-4 bg-red-900 border border-red-700 text-red-200 rounded-md text-center">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ColorReplicator;