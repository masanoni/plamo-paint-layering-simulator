import React, { useMemo } from 'react';
import { Brand, Paint, PaintLayer, PaintType, BrandDisplay } from '../types';
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

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value as Brand;
    const defaultPaintForBrand = paints.find(p => p.brand === newBrand) || paints[0];
    
    if (newBrand === Brand.OTHER) {
         onUpdate(layer.id, {
            brand: newBrand,
            color: '#ffffff',
            name: 'カスタムカラー',
            series: undefined,
            type: PaintType.NORMAL,
            finish: 'gloss',
            mixData: undefined,
        });
    } else if (defaultPaintForBrand) {
        onUpdate(layer.id, {
            brand: newBrand,
            color: defaultPaintForBrand.hex,
            name: `${defaultPaintForBrand.name} (${defaultPaintForBrand.code})`,
            series: defaultPaintForBrand.series,
            type: defaultPaintForBrand.type,
            finish: defaultPaintForBrand.finish || 'gloss',
            mixData: undefined,
        });
    }
  };

  const handlePaintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPaintCode = e.target.value;
    const selectedPaint = paints.find(p => p.code === selectedPaintCode);
    
    if (selectedPaint) {
      onUpdate(layer.id, { 
        color: selectedPaint.hex,
        name: `${selectedPaint.name} (${selectedPaint.code})`,
        series: selectedPaint.series,
        type: selectedPaint.type,
        finish: selectedPaint.finish || 'gloss',
        mixData: undefined,
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(layer.id, { color: e.target.value, name: 'カスタムカラー', series: undefined, type: PaintType.NORMAL, finish: 'gloss', mixData: undefined });
  };

  const handleCoatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(layer.id, { coats: parseInt(e.target.value, 10) });
  };
  
  const groupedPaints = useMemo(() => {
    const groups: { [key: string]: Paint[] } = {};
    const availablePaints = paints.filter(p => p.brand === layer.brand);
    
    for (const paint of availablePaints) {
      const seriesKey = paint.series || '基本色';
      if (!groups[seriesKey]) {
        groups[seriesKey] = [];
      }
      groups[seriesKey].push(paint);
    }
    return groups;
  }, [layer.brand, paints]);

  const selectedPaintCode = useMemo(() => {
      if (layer.mixData) return 'mixed';
      const paint = paints.find(p => p.hex === layer.color && p.name.startsWith(layer.name.split(' (')[0]));
      return paint ? paint.code : 'custom';
  }, [layer, paints]);


  const mixDetailsTooltip = useMemo(() => {
    if (!layer.mixData) return '';
    return layer.mixData.paints.map(p => {
        const paintInfo = paints.find(pi => pi.code === p.code);
        return `${paintInfo?.name || p.code}: ${p.ratio}%`;
    }).join('\n');
  }, [layer.mixData, paints]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 <select value={layer.brand} onChange={handleBrandChange} disabled={!!layer.mixData} className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-700 disabled:opacity-70">
                    {Object.values(Brand).map(b => <option key={b} value={b}>{BrandDisplay[b]}</option>)}
                </select>
                
                {layer.brand !== Brand.OTHER && !layer.mixData ? (
                    <select value={selectedPaintCode} onChange={handlePaintChange} className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none appearance-none">
                        <option value={selectedPaintCode} disabled>{layer.name}</option>
                        {Object.entries(groupedPaints).map(([series, paintGroup]) => (
                            <optgroup label={series} key={series}>
                                {paintGroup.map(p => (
                                    <option key={`${p.brand}-${p.code}`} value={p.code}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                ) : (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-sky-500">
                        <input 
                            type="color" 
                            value={layer.color} 
                            onChange={handleColorChange} 
                            className="w-7 h-7 p-0 border-none rounded bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            aria-label="カラー選択"
                            disabled={!!layer.mixData}
                        />
                         <span className="text-slate-300 font-mono flex-1" title={mixDetailsTooltip}>
                            {layer.mixData ? '調色カラー' : 'カスタムカラー'}
                        </span>
                    </div>
                )}
            </div>
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
