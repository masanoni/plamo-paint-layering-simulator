import React, { useMemo } from 'react';
import { Brand, Paint, PaintLayer, PaintType, PaintSystem } from '../types';
import TrashIcon from './icons/TrashIcon';
import DragHandleIcon from './icons/DragHandleIcon';
import MixerIcon from './icons/MixerIcon';

interface LayerItemProps {
  layer: PaintLayer;
  index: number;
  paints: Paint[];
  onUpdate: (id: string, newLayer: Partial<PaintLayer>) => void;
  onRemove: (id:string) => void;
  onOpenMixer: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ layer, index, paints, onUpdate, onRemove, onOpenMixer, onDragStart, onDragOver, onDrop }) => {

  const handlePaintDataUpdate = (paint: Paint) => {
    onUpdate(layer.id, {
        brand: paint.brand,
        paintSystem: paint.paintSystem,
        series: paint.series,
        name: `${paint.name} (${paint.code})`,
        color: paint.hex,
        type: paint.type,
        finish: paint.finish || 'gloss',
        mixData: undefined,
    });
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSystem = e.target.value as PaintSystem;
    const defaultPaint = paints.find(p => p.paintSystem === newSystem) || paints[0];
    if (defaultPaint) {
      handlePaintDataUpdate(defaultPaint);
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newBrand = e.target.value as Brand;
      if (newBrand === Brand.OTHER) {
          onUpdate(layer.id, {
              brand: newBrand,
              color: '#ffffff',
              name: 'カスタムカラー',
              series: undefined,
              type: PaintType.NORMAL,
              finish: 'gloss',
              mixData: undefined,
              // Keep the paintSystem consistent
              paintSystem: layer.paintSystem
          });
          return;
      }
      const defaultPaint = paints.find(p => p.paintSystem === layer.paintSystem && p.brand === newBrand) || paints[0];
      if (defaultPaint) {
          handlePaintDataUpdate(defaultPaint);
      }
  };

  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeries = e.target.value;
    const defaultPaint = paints.find(p => p.paintSystem === layer.paintSystem && p.brand === layer.brand && (p.series || '基本色') === newSeries) || paints[0];
    if (defaultPaint) {
        handlePaintDataUpdate(defaultPaint);
    }
  };

  const handlePaintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPaintCode = e.target.value;
    const selectedPaint = paints.find(p => p.code === selectedPaintCode && p.brand === layer.brand && (p.series || '基本色') === (layer.series || '基本色'));
    if (selectedPaint) {
      handlePaintDataUpdate(selectedPaint);
    }
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(layer.id, { color: e.target.value, name: 'カスタムカラー', series: undefined, type: PaintType.NORMAL, finish: 'gloss', mixData: undefined });
  };

  const handleCoatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(layer.id, { coats: parseInt(e.target.value, 10) });
  };
  
  // Memoized options for cascading dropdowns
  const availableSystems = useMemo(() => Object.values(PaintSystem), []);

  const availableBrands = useMemo(() => {
    const brandsInSystem = [...new Set(paints.filter(p => p.paintSystem === layer.paintSystem).map(p => p.brand))];
    // Ensure "Other" is always an option
    if (!brandsInSystem.includes(Brand.OTHER)) {
        return [...brandsInSystem, Brand.OTHER];
    }
    return brandsInSystem;
  }, [paints, layer.paintSystem]);

  const availableSeries = useMemo(() => {
    if (layer.brand === Brand.OTHER) return [];
    return [...new Set(paints
        .filter(p => p.paintSystem === layer.paintSystem && p.brand === layer.brand)
        .map(p => p.series || '基本色'))];
  }, [paints, layer.paintSystem, layer.brand]);

  const paintsInSeries = useMemo(() => {
    if (layer.brand === Brand.OTHER) return [];
    const currentSeries = layer.series || '基本色';
    return paints.filter(p => p.paintSystem === layer.paintSystem && p.brand === layer.brand && (p.series || '基本色') === currentSeries);
  }, [paints, layer.paintSystem, layer.brand, layer.series]);


  const selectedPaintCode = useMemo(() => {
      if (layer.mixData) return 'mixed';
      const match = layer.name.match(/\(([^)]+)\)$/);
      const code = match ? match[1] : '';
      const paintExists = paints.some(p => p.code === code && p.name === layer.name.split(' (')[0]);
      return paintExists ? code : 'custom';
  }, [layer, paints]);


  const mixDetailsTooltip = useMemo(() => {
    if (!layer.mixData) return '';
    return layer.mixData.paints.map(p => {
        const paintInfo = paints.find(pi => pi.code === p.code);
        return `${paintInfo?.name || p.code}: ${p.ratio}%`;
    }).join('\n');
  }, [layer.mixData, paints]);

  const selectClassName = "w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-700 disabled:opacity-70 transition-colors";

  return (
    <div 
      className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg mb-2 shadow-md"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
        <div className="cursor-grab text-slate-400 hover:text-slate-200 pt-2">
            <DragHandleIcon className="w-6 h-6"/>
        </div>
        <div className="flex-grow space-y-2">
            {layer.mixData ? (
                 <div className="flex items-center justify-center h-full bg-slate-800 border border-slate-600 rounded-md p-4">
                    <span className="text-slate-300 font-bold" title={mixDetailsTooltip}>
                        調色カラー
                    </span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                    <select value={layer.paintSystem} onChange={handleSystemChange} className={selectClassName}>
                        {availableSystems.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={layer.brand} onChange={handleBrandChange} className={selectClassName}>
                        {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    
                    {layer.brand !== Brand.OTHER ? (
                        <>
                            <select value={layer.series || '基本色'} onChange={handleSeriesChange} className={selectClassName}>
                                {availableSeries.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={selectedPaintCode} onChange={handlePaintChange} className={selectClassName}>
                                {paintsInSeries.map(p => (
                                    <option key={p.code} value={p.code}>{`${p.name} (${p.code})`}</option>
                                ))}
                            </select>
                        </>
                    ) : (
                         <div className="col-span-2 flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-sky-500">
                            <input 
                                type="color" 
                                value={layer.color} 
                                onChange={handleColorChange} 
                                className="w-7 h-7 p-0 border-none rounded bg-transparent cursor-pointer"
                                aria-label="カラー選択"
                            />
                            <span className="text-slate-300 font-mono flex-1">カスタムカラー</span>
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-3">
                <label htmlFor={`coats-${layer.id}`} className="text-sm text-slate-400 whitespace-nowrap">吹付回数:</label>
                <input 
                    id={`coats-${layer.id}`}
                    type="range" 
                    min="1" 
                    max="10" 
                    value={layer.coats} 
                    onChange={handleCoatsChange}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-slate-300 w-10 text-right">{layer.coats}回</span>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <button onClick={() => onOpenMixer(layer.id)} className="p-2 text-slate-400 hover:text-sky-400 rounded-full transition-colors duration-200" aria-label="このレイヤーで調色する">
                <MixerIcon className="w-6 h-6"/>
            </button>
            <button onClick={() => onRemove(layer.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors duration-200" aria-label="レイヤーを削除">
                <TrashIcon className="w-6 h-6"/>
            </button>
        </div>
    </div>
  );
};

export default LayerItem;
