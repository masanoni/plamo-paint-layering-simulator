
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Brand, PaintLayer, PaintType, MixedPaintInfo, ParsedRecipe, ParsedLayer, Paint, PaintSystem, SavedProject } from './types';
import LayerItem from './components/LayerItem';
import ColorDisplay from './components/ColorDisplay';
import AdvicePanel from './components/AdvicePanel';
import PlusIcon from './components/icons/PlusIcon';
import ColorMixerModal from './components/ColorMixerModal';
import ColorReplicator from './components/ColorReplicator';
import AdminPanel from './components/AdminPanel';
import AdminIcon from './components/icons/AdminIcon';
import ApiKeyManager from './components/ApiKeyManager';
import ProjectManager from './components/ProjectManager';
import { allPaints as defaultPaints } from './paints/index';
import UserManualModal from './components/UserManualModal';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';

const PAINTS_STORAGE_KEY = 'plamo_paint_simulator_paints';
const API_KEY_STORAGE_KEY = 'plamo_paint_simulator_api_key';
const PROJECTS_STORAGE_KEY = 'plamo_simulator_projects';

// Helper to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Helper to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => `0${Math.round(c).toString(16)}`.slice(-2).padStart(2, '0');
  const clamp = (c: number) => Math.max(0, Math.min(255, c));
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
};

// Color blending function to simulate airbrushing
const blendColors = (topLayer: PaintLayer, bottomColorHex: string): string => {
  const topRgb = hexToRgb(topLayer.color);
  const bottomRgb = hexToRgb(bottomColorHex);

  if (!topRgb || !bottomRgb) return bottomColorHex;

  let opacity;
  const baseOpacity = topLayer.coats / 10.0;

  // Define opacity curves based on paint type
  switch (topLayer.type) {
    case PaintType.METALLIC:
    case PaintType.PEARL:
      // Metallics and pearls cover more effectively
      opacity = Math.pow(baseOpacity, 0.6);
      break;
    case PaintType.CLEAR:
      // Clear coats have less pigment and are more transparent
      opacity = Math.pow(baseOpacity, 1.2) * 0.5; // Less impact per coat
      break;
    case PaintType.NORMAL:
    default:
      // Standard opacity curve
      opacity = Math.pow(baseOpacity, 0.75);
      break;
  }

  // Special handling for clear colors to simulate candy coats
  if (topLayer.type === PaintType.CLEAR && opacity > 0) {
    // Multiply blend mode for the color part
    const multipliedR = (topRgb.r * bottomRgb.r) / 255;
    const multipliedG = (topRgb.g * bottomRgb.g) / 255;
    const multipliedB = (topRgb.b * bottomRgb.b) / 255;
    
    // Alpha blend the result of the multiply operation over the bottom layer
    const finalR = multipliedR * opacity + bottomRgb.r * (1 - opacity);
    const finalG = multipliedG * opacity + bottomRgb.g * (1 - opacity);
    const finalB = multipliedB * opacity + bottomRgb.b * (1 - opacity);
    
    return rgbToHex(finalR, finalG, finalB);
  }

  // Standard alpha compositing for other paint types
  const finalR = topRgb.r * opacity + bottomRgb.r * (1 - opacity);
  const finalG = topRgb.g * opacity + bottomRgb.g * (1 - opacity);
  const finalB = topRgb.b * opacity + bottomRgb.b * (1 - opacity);

  return rgbToHex(finalR, finalG, finalB);
};

const calculateMixedColor = (mixData: { paints: MixedPaintInfo[] }, availablePaints: Paint[]): string => {
    if (!mixData || mixData.paints.length === 0) return '#ffffff';

    let totalR = 0, totalG = 0, totalB = 0;
    const totalRatio = mixData.paints.reduce((sum, p) => sum + p.ratio, 0);
    if (totalRatio === 0) return '#ffffff';

    for (const mixInfo of mixData.paints) {
        const paint = availablePaints.find(p => p.code === mixInfo.code);
        if (paint) {
            const rgb = hexToRgb(paint.hex);
            if (rgb) {
                totalR += rgb.r * (mixInfo.ratio / totalRatio);
                totalG += rgb.g * (mixInfo.ratio / totalRatio);
                totalB += rgb.b * (mixInfo.ratio / totalRatio);
            }
        }
    }
    return rgbToHex(totalR, totalG, totalB);
};

const App: React.FC = () => {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [layers, setLayers] = useState<PaintLayer[]>([]);
  const [baseColor, setBaseColor] = useState<string>('#808080');
  const [apiKey, setApiKey] = useState<string>('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  const draggedItemIndex = useRef<number | null>(null);
  const [mixerState, setMixerState] = useState<{isOpen: boolean; layerId: string | null}>({isOpen: false, layerId: null});
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminPanelVisible, setIsAdminPanelVisible] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isLoadingPaints, setIsLoadingPaints] = useState(true);
  const [paintLoadingError, setPaintLoadingError] = useState<string | null>(null);

  useEffect(() => {
    // Load API Key
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    
    // Load Saved Projects
    try {
        const storedProjectsJSON = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (storedProjectsJSON) {
            setSavedProjects(JSON.parse(storedProjectsJSON));
        }
    } catch (e) {
        console.error("Failed to load projects from localStorage", e);
        localStorage.removeItem(PROJECTS_STORAGE_KEY); // Clear corrupted data
    }

    // Load Paint Database
    const loadPaints = () => {
      setIsLoadingPaints(true);
      setPaintLoadingError(null);
      try {
          const params = new URLSearchParams(window.location.search);
          const adminParam = params.get('admin') === 'true';
          setIsAdminMode(adminParam);
  
          let paintsData: Paint[] | null = null;
  
          if (adminParam) {
              const storedPaintsJSON = localStorage.getItem(PAINTS_STORAGE_KEY);
              if (storedPaintsJSON) {
                  try {
                      const storedPaints = JSON.parse(storedPaintsJSON);
                      if (Array.isArray(storedPaints) && storedPaints.length > 0) {
                          paintsData = storedPaints;
                      }
                  } catch (e) {
                      console.error("Failed to parse paints from localStorage. Initializing with default.", e);
                      localStorage.removeItem(PAINTS_STORAGE_KEY);
                  }
              }
          }
          
          if (paintsData === null) {
              paintsData = defaultPaints;
              if (adminParam) {
                  localStorage.setItem(PAINTS_STORAGE_KEY, JSON.stringify(paintsData));
              }
          }
          
          if (!paintsData || paintsData.length === 0) {
               throw new Error("利用可能な塗料データが見つかりませんでした。paints/index.tsからインポートされたデータが空か、正しくありません。");
          }
  
          setPaints(paintsData);
  
      } catch (error) {
          console.error("Error during paint data processing:", error);
          const message = error instanceof Error ? error.message : "An unknown error occurred.";
          setPaintLoadingError(`塗料データベースの読み込み中にエラーが発生しました。\n\n詳細: ${message}`);
      } finally {
          setIsLoadingPaints(false);
      }
    };

    loadPaints();
  }, []);
  
  const handlePaintsUpdate = (updatedPaints: Paint[]) => {
      if (isAdminMode) {
          setPaints(updatedPaints);
          try {
              localStorage.setItem(PAINTS_STORAGE_KEY, JSON.stringify(updatedPaints));
          } catch (error) {
              console.error("Failed to save paints to localStorage:", error);
          }
      }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  };
  
  // --- Project Management Handlers ---
  const handleSaveProject = useCallback((projectName: string) => {
    if (!projectName.trim()) {
        alert("プロジェクト名を入力してください。");
        return;
    }
    
    const newProject: SavedProject = {
        id: Date.now().toString(),
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
        baseColor: baseColor,
        layers: layers,
    };
    
    const updatedProjects = [...savedProjects, newProject];
    setSavedProjects(updatedProjects);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
    alert(`プロジェクト「${newProject.name}」が保存されました。`);
  }, [baseColor, layers, savedProjects]);

  const handleLoadProject = useCallback((projectId: string) => {
      const projectToLoad = savedProjects.find(p => p.id === projectId);
      if (projectToLoad) {
          if (window.confirm(`「${projectToLoad.name}」を読み込みますか？\n現在のレイヤー設定は上書きされます。`)) {
              setBaseColor(projectToLoad.baseColor);
              setLayers(projectToLoad.layers);
              alert(`プロジェクト「${projectToLoad.name}」を読み込みました。`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }
      }
  }, [savedProjects]);

  const handleDeleteProject = useCallback((projectId: string) => {
      const projectToDelete = savedProjects.find(p => p.id === projectId);
      if (projectToDelete) {
          if (window.confirm(`本当に「${projectToDelete.name}」を削除しますか？\nこの操作は元に戻せません。`)) {
              const updatedProjects = savedProjects.filter(p => p.id !== projectId);
              setSavedProjects(updatedProjects);
              localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
          }
      }
  }, [savedProjects]);

  // --- Layer Management Handlers ---
  const addNewLayer = useCallback(() => {
    if (paints.length === 0) return;
    const defaultPaint = paints.find(p => p.code === 'C1') || paints[0];
    const newLayer: PaintLayer = {
      id: Date.now().toString(),
      brand: defaultPaint.brand,
      series: defaultPaint.series,
      name: `${defaultPaint.name} (${defaultPaint.code})`,
      color: defaultPaint.hex,
      coats: 3,
      type: defaultPaint.type,
      paintSystem: defaultPaint.paintSystem,
      finish: defaultPaint.finish || 'gloss',
    };
    setLayers(prev => [...prev, newLayer]);
  }, [paints]);

  const updateLayer = useCallback((id: string, newLayerData: Partial<PaintLayer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...newLayerData } : l)));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
  }, []);
  
  const handleRecipeApply = useCallback((recipe: ParsedRecipe) => {
    setBaseColor(recipe.baseColorHex);

    const convertAiLayerToPaintLayer = (aiLayer: ParsedLayer): PaintLayer => {
        const firstPaintInfo = aiLayer.mixData.paints[0] ? paints.find(p => p.code === aiLayer.mixData.paints[0].code) : undefined;

        return {
            id: Date.now().toString() + Math.random(),
            brand: firstPaintInfo?.brand || Brand.OTHER,
            series: firstPaintInfo?.series,
            name: aiLayer.mixData.paints.length > 1 ? '調色カラー (AIレシピ)' : `${firstPaintInfo?.name} (${firstPaintInfo?.code})`,
            color: calculateMixedColor(aiLayer.mixData, paints),
            coats: aiLayer.coats,
            type: aiLayer.type,
            paintSystem: aiLayer.paintSystem,
            finish: aiLayer.finish,
            mixData: aiLayer.mixData,
        };
    };
    
    const newLayers = recipe.layers.map(convertAiLayerToPaintLayer);
    
    if (recipe.topCoat) {
        newLayers.push(convertAiLayerToPaintLayer(recipe.topCoat));
    }

    setLayers(newLayers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paints]);

  const finalColor = useMemo(() => {
    return layers.reduce(
      (bottomColor, currentLayer) => blendColors(currentLayer, bottomColor),
      baseColor
    );
  }, [layers, baseColor]);
  
  const finalFinish = useMemo(() => {
    if (layers.length === 0) return 'gloss';
    return layers[layers.length - 1].finish || 'gloss';
  }, [layers]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      draggedItemIndex.current = index;
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); 
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      if (draggedItemIndex.current === null) return;
      
      const draggedIndex = draggedItemIndex.current;
      if (draggedIndex === index) return;

      const newLayers = [...layers];
      const [draggedItem] = newLayers.splice(draggedIndex, 1);
      newLayers.splice(index, 0, draggedItem);
      setLayers(newLayers);
      draggedItemIndex.current = null;
  };
  
  const openMixer = (layerId: string) => {
      setMixerState({isOpen: true, layerId});
  };

  const closeMixer = () => {
      setMixerState({isOpen: false, layerId: null});
  };

  const mixingLayer = useMemo(() => {
      if (!mixerState.layerId) return null;
      return layers.find(l => l.id === mixerState.layerId) || null;
  }, [mixerState.layerId, layers]);

  if (isLoadingPaints) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
              <p className="ml-4 text-xl">塗料データベースを読み込み中...</p>
          </div>
      );
  }

  if (paintLoadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
          <div className="max-w-2xl text-center bg-slate-800 p-8 rounded-lg shadow-2xl border border-red-500">
              <h1 className="text-3xl font-bold text-red-400 mb-4">アプリケーションエラー</h1>
              <p className="text-lg text-slate-300 mb-2 whitespace-pre-wrap">{paintLoadingError}</p>
              <p className="mt-6 text-slate-400">開発者の方へ: paints/index.ts および関連する各塗料データファイルが正しく設定されているかご確認ください。</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-600">
            プラモ塗料 重ね塗りシミュレーター
          </h1>
          <p className="mt-2 text-slate-400">エアブラシ塗装のシミュレーション、調色、AIによる色再現レシピ生成が可能です。</p>
          <button 
            onClick={() => setIsManualOpen(true)}
            className="absolute top-0 right-0 flex items-center gap-2 p-2 font-bold text-slate-400 hover:text-sky-400 transition-colors"
            title="ユーザーマニュアルを開く"
          >
            <QuestionMarkCircleIcon className="w-7 h-7" />
            <span className="hidden sm:inline text-sm">マニュアル</span>
          </button>
        </header>

        <ApiKeyManager initialKey={apiKey} onSave={handleSaveApiKey} />
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <ProjectManager 
                projects={savedProjects}
                onSave={handleSaveProject}
                onLoad={handleLoadProject}
                onDelete={handleDeleteProject}
            />

            <ColorReplicator onApplyRecipe={handleRecipeApply} paints={paints} apiKey={apiKey} />

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-slate-300 mb-4">塗装レイヤー設定</h2>
                <div className="flex items-center gap-4 mb-6 p-3 bg-slate-900 rounded-lg">
                    <label htmlFor="base-color" className="font-semibold text-slate-300">下地の色:</label>
                    <input
                        id="base-color"
                        type="color"
                        value={baseColor}
                        onChange={e => setBaseColor(e.target.value)}
                        className="w-10 h-10 p-1 bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
                    />
                    <span className="font-mono text-slate-400">{baseColor}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                    {layers.map((layer, index) => (
                        <LayerItem 
                            key={layer.id} 
                            layer={layer} 
                            index={index}
                            paints={paints}
                            onUpdate={updateLayer} 
                            onRemove={removeLayer}
                            onOpenMixer={openMixer}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>

                <button onClick={addNewLayer} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-sky-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors duration-200 border-2 border-dashed border-slate-600 hover:border-sky-500">
                    <PlusIcon className="w-5 h-5" />
                    新しいレイヤーを追加
                </button>
            </div>
            
            <ColorDisplay color={finalColor} layers={layers} finish={finalFinish} />
          </div>

          <div className="lg:col-span-1">
            <AdvicePanel layers={layers} baseColor={baseColor} paints={paints} apiKey={apiKey} />
          </div>
        </main>
      </div>
      <ColorMixerModal 
        isOpen={mixerState.isOpen}
        onClose={closeMixer}
        onSave={updateLayer}
        layer={mixingLayer}
        paints={paints}
      />
      
      <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      
      {isAdminMode && (
        <>
            <div className="fixed bottom-4 right-4 z-50">
                <button onClick={() => setIsAdminPanelVisible(!isAdminPanelVisible)} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110">
                    <AdminIcon className="w-6 h-6"/>
                </button>
            </div>
            <AdminPanel 
                paints={paints}
                onUpdate={handlePaintsUpdate}
                isVisible={isAdminPanelVisible}
                onClose={() => setIsAdminPanelVisible(false)}
                apiKey={apiKey}
            />
        </>
      )}
    </div>
  );
};

export default App;
