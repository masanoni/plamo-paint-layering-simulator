
import React, { useState, useRef } from 'react';
import { getReplicationRecipe } from '../services/geminiService';
import EyedropperIcon from './icons/EyedropperIcon';
import GeneratedRecipe from './GeneratedRecipe';
import ProductAffiliateLinks from './ProductAffiliateLinks';
import { RecipeConditions, FinishTypeGoal, TopCoatFinish, ParsedRecipe, Paint, PaintSystem } from '../types';

interface ColorReplicatorProps {
    onApplyRecipe: (recipe: ParsedRecipe) => void;
    paints: Paint[];
    apiKey: string;
}

const ColorReplicator: React.FC<ColorReplicatorProps> = ({ onApplyRecipe, paints, apiKey }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [targetColor, setTargetColor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conditions, setConditions] = useState<RecipeConditions>({
        baseCoat: '黒サーフェイサー',
        finishType: '通常',
        topCoat: '光沢',
        paintSystem: PaintSystem.LACQUER,
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (!targetColor || !apiKey) return;
        setIsLoading(true);
        setRecipe(null);
        setError(null);
        try {
            const result = await getReplicationRecipe(targetColor, conditions, paints, apiKey);
            setRecipe(result);

        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('レシピの生成中に不明なエラーが発生しました。');
            }
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConditionChange = (field: keyof RecipeConditions, value: string | PaintSystem) => {
        setConditions(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-slate-300 mb-4">カラーリプリケーター (AI色再現)</h2>
            <p className="text-slate-400 mb-4 text-sm">画像から色を抽出し、その色を再現するための塗装・調色レシピをAIが生成します。</p>
            
            <input ref={fileInputRef} type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="hidden" />
            <button
                onClick={handleUploadButtonClick}
                className="w-full inline-block text-center cursor-pointer px-4 py-2 mb-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
                {imageSrc ? '別の画像をアップロード' : '画像をアップロード'}
            </button>
            <p className="text-center text-xs text-slate-500 mb-4">対応形式: JPG, PNG, WEBP</p>
            
            {error && !isLoading && (
                <div className="p-3 mb-4 bg-red-900 border border-red-700 text-red-200 rounded-md text-center">
                    {error}
                </div>
            )}
            
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
                <div className="space-y-4 mt-4">
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

                    {targetColor && (
                        <div className="mt-4 p-4 bg-slate-700 rounded-lg space-y-4">
                            <h3 className="text-md font-bold text-slate-200 mb-2">仕上がり条件を指定</h3>
                            
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
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">2. 仕上がりの種類</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                   {(['通常', 'メタリック', 'キャンディ', '偏光塗装'] as FinishTypeGoal[]).map(type => (
                                       <button key={type} onClick={() => handleConditionChange('finishType', type)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.finishType === type ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{type}</button>
                                   ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">3. トップコート</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['光沢', '半光沢', 'つや消し'] as TopCoatFinish[]).map(finish => (
                                        <button key={finish} onClick={() => handleConditionChange('topCoat', finish)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.topCoat === finish ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{finish}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">4. 使用する塗料系統</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.values(PaintSystem)).map(system => (
                                        <button key={system} onClick={() => handleConditionChange('paintSystem', system)} className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${conditions.paintSystem === system ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-600'}`}>{system}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleGetRecipe}
                        disabled={!targetColor || isLoading || !apiKey}
                        className="w-full px-4 py-2 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? 'AIがレシピを生成中...' : 'この条件で再現レシピを生成する'}
                    </button>

                   {(recipe || isLoading || error) && (
                        <div className='mt-4'>
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
                </div>
            )}
        </div>
    );
};

export default ColorReplicator;
