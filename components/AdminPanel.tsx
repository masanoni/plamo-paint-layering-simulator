
import React, { useState, useEffect, useRef } from 'react';
import { Paint, Brand, PaintSystem } from '../types';
import { getNewPaintInfo } from '../services/geminiService';
import { findLowestPriceRakutenLink, sleep } from '../services/rakutenService';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { AFFILIATE_TAGS } from '../constants';

// --- シリーズのメタデータ ---
// エクスポート時のファイル名と変数名を定義します。
const seriesMetadata: Record<string, { fileName: string; varName: string }> = {
  'Mr.カラー': { fileName: 'mr-color.ts', varName: 'mrColorPaints' },
  'Mr.カラーGX': { fileName: 'mr-color-gx.ts', varName: 'mrColorGXPaints' },
  'Mr.クリスタルカラー': { fileName: 'mr-crystal-color.ts', varName: 'mrCrystalColorPaints' },
  'Mr.メタルカラー': { fileName: 'mr-metal-color.ts', varName: 'mrMetalColorPaints' },
  'スーパーメタリック2': { fileName: 'super-metallic-2.ts', varName: 'superMetallic2Paints' },
  'Mr.カラー LASCIVUS': { fileName: 'mr-color-lascivus.ts', varName: 'mrColorLascivusPaints' },
  'ガンダム アッセンブルモデルカラー': { fileName: 'gundam-assemble-model-color.ts', varName: 'gundamAssembleModelColorPaints' },
  '水性ホビーカラー': { fileName: 'hobby-color.ts', varName: 'hobbyColorPaints' },
  '水性ホビーカラー スーパーメタリック': { fileName: 'hobby-color-super-metallic.ts', varName: 'hobbyColorSuperMetallicPaints' },
  '水性ガンダムSEEDカラー': { fileName: 'gundam-seed-color.ts', varName: 'gundamSeedColorPaints' },
  '水性ガンダムカラー 水星の魔女': { fileName: 'gundam-witch-from-mercury-color.ts', varName: 'gundamWitchFromMercuryColorPaints' },
  '水性ガンダムSEED FREEDOMカラー': { fileName: 'gundam-seed-freedom-color.ts', varName: 'gundamSeedFreedomColorPaints' },
  'アクリジョン': { fileName: 'acrysion.ts', varName: 'acrysionPaints' },
  'アクリジョン ベースカラー': { fileName: 'acrysion-base-color.ts', varName: 'acrysionBaseColorPaints' },
  'ガイアカラー': { fileName: 'gaia-color.ts', varName: 'gaiaColorPaints' },
  'ガイアカラー(クリアー)': { fileName: 'gaia-color.ts', varName: 'gaiaColorPaints' },
  'Exシリーズ': { fileName: 'ex-series.ts', varName: 'exSeriesPaints' },
  'スターブライト': { fileName: 'star-bright.ts', varName: 'starBrightPaints' },
  'パールカラー': { fileName: 'pearl-color.ts', varName: 'pearlColorPaints' },
  'プレミアムシリーズ': { fileName: 'premium-series.ts', varName: 'premiumSeriesPaints' },
};


interface AdminPanelProps {
  paints: Paint[];
  onUpdate: (newPaints: Paint[]) => void;
  isVisible: boolean;
  onClose: () => void;
  apiKey: string;
}

type SeriesGroup = Record<string, Paint[]>;
type SystemGroup = Record<string, SeriesGroup>; // PaintSystem enum can be key
type StructuredPaints = Record<string, SystemGroup>; // Brand enum can be key


const AdminPanel: React.FC<AdminPanelProps> = ({ paints, onUpdate, isVisible, onClose, apiKey }) => {
  const [structuredPaints, setStructuredPaints] = useState<StructuredPaints>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [newPaintQuery, setNewPaintQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [individualLoading, setIndividualLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVisible && paints.length > 0) {
      const newStructuredPaints = paints.reduce<StructuredPaints>((acc, paint) => {
        const { brand, paintSystem, series } = paint;
        const seriesName = series || '基本色';

        if (!acc[brand]) acc[brand] = {};
        if (!acc[brand][paintSystem]) acc[brand][paintSystem] = {};
        if (!acc[brand][paintSystem][seriesName]) acc[brand][paintSystem][seriesName] = [];
        
        acc[brand][paintSystem][seriesName].push(paint);
        return acc;
      }, {});
      setStructuredPaints(newStructuredPaints);
    }
  }, [paints, isVisible]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const flattenPaints = (structured: StructuredPaints): Paint[] => {
    return Object.values(structured)
        .flatMap(systemGroup => Object.values(systemGroup))
        .flatMap(seriesGroup => Object.values(seriesGroup))
        .flat();
  };

  const updateStructuredPaints = (updater: (draft: StructuredPaints) => void) => {
    setStructuredPaints(currentStructuredPaints => {
      const draft = JSON.parse(JSON.stringify(currentStructuredPaints));
      updater(draft);
      return draft;
    });
  };

  const handleLinkChange = (code: string, field: 'amazonUrl' | 'rakutenUrl', value: string) => {
    updateStructuredPaints(draft => {
      for (const systemGroup of Object.values(draft)) {
        for (const seriesGroup of Object.values(systemGroup)) {
          for (const paintsInSeries of Object.values(seriesGroup)) {
            const paint = paintsInSeries.find(p => p.code === code);
            if (paint) {
              (paint as any)[field] = value;
              return;
            }
          }
        }
      }
    });
  };

  const generateAmazonLink = (paint: Paint): string => {
    const productName = `${paint.brand} ${paint.series || ''} ${paint.name} (${paint.code})`.replace(/\s+/g, ' ').trim();
    if (paint.amazonUrl && paint.amazonUrl.includes('/dp/')) {
        const url = new URL(paint.amazonUrl);
        if (AFFILIATE_TAGS.amazon) url.searchParams.set('tag', AFFILIATE_TAGS.amazon);
        return url.toString();
    }
    const url = new URL('https://www.amazon.co.jp/s');
    url.searchParams.set('k', productName);
    url.searchParams.set('rh', 'p_6:AN1VRQENFRJN5,p_76:2227292051');
    if (AFFILIATE_TAGS.amazon) url.searchParams.set('tag', AFFILIATE_TAGS.amazon);
    return url.toString();
  };
  
  const handleGenerateAndApplyLinks = async (paint: Paint) => {
    setIndividualLoading(prev => new Set(prev).add(paint.code));
    const productName = `${paint.brand} ${paint.series || ''} ${paint.name} (${paint.code})`.replace(/\s+/g, ' ').trim();
    const newAmazonUrl = generateAmazonLink(paint);
    const newRakutenUrl = await findLowestPriceRakutenLink(productName);
    
    updateStructuredPaints(draft => {
       for (const systemGroup of Object.values(draft)) {
        for (const seriesGroup of Object.values(systemGroup)) {
          for (const paintsInSeries of Object.values(seriesGroup)) {
            const p = paintsInSeries.find(p => p.code === paint.code);
            if (p) {
              p.amazonUrl = newAmazonUrl;
              p.rakutenUrl = newRakutenUrl ?? p.rakutenUrl;
              return;
            }
          }
        }
      }
    });
    setIndividualLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(paint.code);
      return newSet;
    });
  };

  const handleSaveChanges = () => {
    onUpdate(flattenPaints(structuredPaints));
    alert('変更がローカルストレージに保存されました。');
  };
  
  const handleExportSeries = (seriesName: string, paintsInSeries: Paint[]) => {
    const meta = seriesMetadata[seriesName] || seriesMetadata[seriesName.replace('(クリアー)', '')];
    if (!meta) {
      alert(`エラー: シリーズ "${seriesName}" のエクスポート設定が見つかりません。`);
      return;
    }
    const jsonString = JSON.stringify(paintsInSeries, null, 2);
    const tsContent = `import { Paint, Brand, PaintType, PaintSystem } from '../../../types';\n\nexport const ${meta.varName}: Paint[] = ${jsonString};`;

    const blob = new Blob([tsContent], { type: 'application/typescript;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = meta.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const handleDeletePaint = (code: string) => {
    if (!window.confirm(`塗料コード "${code}" を本当に削除しますか？`)) return;
    updateStructuredPaints(draft => {
       for (const brand in draft) {
        for (const system in draft[brand]) {
          for (const series in draft[brand][system]) {
            const initialLength = draft[brand][system][series].length;
            draft[brand][system][series] = draft[brand][system][series].filter(p => p.code !== code);
            if (draft[brand][system][series].length < initialLength) return;
          }
        }
      }
    });
  };

  const handleAiAddPaint = async () => {
    if (!newPaintQuery.trim()) { setError('登録したい塗料の名前を入力してください。'); return; }
    if (!apiKey) { setError('AI機能を利用するには、まずAPIキーを設定してください。'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const newPaintInfo = await getNewPaintInfo(newPaintQuery, flattenPaints(structuredPaints), apiKey);
      
      const newPaintEntry: Paint = {
        ...newPaintInfo,
        amazonUrl: '',
        rakutenUrl: '',
      };
      
      updateStructuredPaints(draft => {
        const { brand, paintSystem, series } = newPaintEntry;
        const seriesName = series || '基本色';
        if (!draft[brand]) draft[brand] = {};
        if (!draft[brand][paintSystem]) draft[brand][paintSystem] = {};
        if (!draft[brand][paintSystem][seriesName]) draft[brand][paintSystem][seriesName] = [];
        draft[brand][paintSystem][seriesName].push(newPaintEntry);
      });
      setNewPaintQuery('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AIによる登録中に不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 h-4/5 bg-slate-900 border-t-2 border-indigo-500 shadow-2xl rounded-t-lg flex flex-col transform transition-transform duration-300 ease-in-out"
        style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-indigo-400">管理者パネル</h2>
          <button onClick={handleSaveChanges} className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
            ローカルに変更を保存
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto">
           {/* AI Paint Registration */}
          <div className="bg-slate-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-slate-200 mb-2">AIによる塗料の自動登録</h3>
            <div className="flex gap-2">
              <input
                type="text" value={newPaintQuery} onChange={e => setNewPaintQuery(e.target.value)}
                placeholder="例: ガイアノーツ Ex-フラットクリアープレミアム"
                className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                disabled={isLoading} />
              <button onClick={handleAiAddPaint} disabled={isLoading || !apiKey} className="px-4 py-2 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-600">
                {isLoading ? '登録中...' : 'AIで登録'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="space-y-4">
            {Object.entries(structuredPaints).map(([brand, systemGroup]) => (
              <div key={brand}>
                <h3 className="text-xl font-bold text-sky-400 mb-2">{brand}</h3>
                {Object.entries(systemGroup).map(([system, seriesGroup]) => (
                  <div key={system} className="ml-4">
                    <h4 className="text-lg font-semibold text-teal-400 mb-2">{system}</h4>
                    {Object.entries(seriesGroup).map(([seriesName, paintsInSeries]) => (
                      <div key={seriesName} className="bg-slate-800 rounded-lg mb-3 ml-4">
                        <button
                          className="w-full flex justify-between items-center p-3 text-left"
                          onClick={() => toggleSection(`${brand}-${system}-${seriesName}`)}
                        >
                          <span className="font-bold text-slate-300">{seriesName} ({paintsInSeries.length}件)</span>
                          <div className='flex items-center gap-2'>
                              <button onClick={(e) => { e.stopPropagation(); handleExportSeries(seriesName, paintsInSeries); }} className="px-3 py-1 text-xs font-semibold text-sky-200 bg-sky-800 rounded-md hover:bg-sky-700 transition-colors">
                                TSをエクスポート
                              </button>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${openSections[`${brand}-${system}-${seriesName}`] ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {openSections[`${brand}-${system}-${seriesName}`] && (
                          <div className="p-3 border-t border-slate-700 space-y-3">
                            {paintsInSeries.map(paint => {
                              const isLoadingIndividual = individualLoading.has(paint.code);
                              return (
                                <div key={paint.code} className="bg-slate-900 p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-slate-300">{paint.name} ({paint.code})</p>
                                    <button onClick={() => handleDeletePaint(paint.code)} className="p-1 text-slate-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input type="text" placeholder="Amazon URL" value={paint.amazonUrl || ''} onChange={e => handleLinkChange(paint.code, 'amazonUrl', e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-yellow-500"/>
                                    <input type="text" placeholder="Rakuten URL" value={paint.rakutenUrl || ''} onChange={e => handleLinkChange(paint.code, 'rakutenUrl', e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500"/>
                                    <button onClick={() => handleGenerateAndApplyLinks(paint)} className="px-3 py-1 text-xs font-bold text-white bg-teal-600 rounded-md hover:bg-teal-700 w-20 text-center disabled:bg-slate-500" disabled={isLoadingIndividual}>
                                      {isLoadingIndividual ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'リンク生成'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
