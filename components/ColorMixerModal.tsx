import React, { useState, useMemo, useEffect } from 'react';
import { PaintLayer, MixedPaintInfo, Paint, PaintType, Brand, PaintTypeDisplay, BrandDisplay } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

// Helper to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

// Helper to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => `0${Math.round(c).toString(16)}`.slice(-2).padStart(2, '0');
  const clamp = (c: number) => Math.max(0, Math.min(255, c));
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
};

interface ColorMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (layerId: string, newLayerData: Partial<PaintLayer>) => void;
  layer: PaintLayer | null;
  paints: Paint[];
}

const ColorMixerModal: React.FC<ColorMixerModalProps> = ({ isOpen, onClose, onSave, layer, paints }) => {
  const [mix, setMix] = useState<MixedPaintInfo[]>([]);

  useEffect(() => {
    if (layer?.mixData?.paints) {
      setMix(layer.mixData.paints);
    } else if (layer) {
      const existingPaint = paints.find(p => p.hex === layer.color && p.name.includes(layer.name.split(' (')[0]));
      if(existingPaint) {
        setMix([{ code: existingPaint.code, ratio: 100 }]);
      } else {
        setMix([]);
      }
    } else {
      setMix([]);
    }
  }, [layer, paints]);

  const { mixedColor, mixedType } = useMemo(() => {
    if (mix.length === 0) return { mixedColor: '#ffffff', mixedType: PaintType.NORMAL };
    
    let totalR = 0, totalG = 0, totalB = 0;
    const totalRatio = mix.reduce((sum, p) => sum + p.ratio, 0);
    if (totalRatio === 0) return { mixedColor: '#ffffff', mixedType: PaintType.NORMAL };
    
    const paintDetails = mix.map(p => ({
        ...p,
        paint: paints.find(pp => pp.code === p.code)
    })).filter(p => p.paint);
    
    for (const { paint, ratio } of paintDetails) {
        const rgb = hexToRgb(paint!.hex);
        if (rgb) {
            totalR += rgb.r * (ratio / totalRatio);
            totalG += rgb.g * (ratio / totalRatio);
            totalB += rgb.b * (ratio / totalRatio);
        }
    }
    
    const finalType = paintDetails.some(p => p.paint?.type === PaintType.PEARL) ? PaintType.PEARL :
                       paintDetails.some(p => p.paint?.type === PaintType.METALLIC) ? PaintType.METALLIC :
                       paintDetails.some(p => p.paint?.type === PaintType.CLEAR) ? PaintType.CLEAR :
                       PaintType.NORMAL;

    return { mixedColor: rgbToHex(totalR, totalG, totalB), mixedType: finalType };
  }, [mix, paints]);

  const addPaint = () => {
    if (paints.length === 0) return;
    const firstPaint = paints[0];
    const newMix = [...mix, { code: firstPaint.code, ratio: 50 }];
    normalizeRatios(newMix);
  };
  
  const removePaint = (index: number) => {
    const newMix = mix.filter((_, i) => i !== index);
    normalizeRatios(newMix);
  };
  
  const updatePaint = (index: number, newCode: string) => {
    const newMix = [...mix];
    newMix[index] = { ...newMix[index], code: newCode };
    setMix(newMix);
  };
  
  const updateRatio = (index: number, newRatio: number) => {
    const newMix = [...mix];
    newMix[index] = { ...newMix[index], ratio: newRatio };
    setMix(newMix);
  };

  const normalizeRatios = (currentMix: MixedPaintInfo[]) => {
    const totalRatio = currentMix.reduce((sum, p) => sum + p.ratio, 0);
    if(totalRatio === 0 || currentMix.length === 0) {
        setMix(currentMix);
        return;
    };
    const scale = 100 / totalRatio;
    setMix(currentMix.map(p => ({ ...p, ratio: Math.round(p.ratio * scale) })));
  };

  const handleSave = () => {
    if (!layer || mix.length === 0) return;
    const total = mix.reduce((sum, p) => sum + p.ratio, 0);
    const finalMix = mix.map(p => ({...p, ratio: Math.round(p.ratio * 100 / total)}));


    const newLayerData: Partial<PaintLayer> = {
        brand: Brand.OTHER,
        name: '調色カラー',
        color: mixedColor,
        type: mixedType,
        mixData: { paints: finalMix },
        series: undefined,
    };
    onSave(layer.id, newLayerData);
    onClose();
  };

  if (!isOpen || !layer) return null;
  
  const groupedPaints = paints.reduce((acc, p) => {
      const groupKey = `${p.brand} - ${p.series || '基本色'}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(p);
      return acc;
  }, {} as Record<string, Paint[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-sky-400">カラーミキサー (調色)</h2>
          <p className="text-slate-400">塗料を混ぜてカスタムカラーを作成します。</p>
        </header>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {mix.map((p, index) => {
            const paintInfo = paints.find(pp => pp.code === p.code);
            return (
              <div key={index} className="flex items-center gap-3 mb-4 bg-slate-700 p-3 rounded-lg">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: paintInfo?.hex || '#000' }}></div>
                <select value={p.code} onChange={e => updatePaint(index, e.target.value)} className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                   {Object.entries(groupedPaints).map(([groupName, paintGroup]) => (
                       <optgroup label={groupName} key={groupName}>
                           {paintGroup.map(paint => (
                               <option key={paint.code} value={paint.code}>{paint.name} ({paint.code})</option>
                           ))}
                       </optgroup>
                   ))}
                </select>
                <input type="range" min="0" max="100" value={p.ratio} onChange={e => updateRatio(index, parseInt(e.target.value))} className="w-32 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer" onMouseUp={() => normalizeRatios(mix)} onTouchEnd={() => normalizeRatios(mix)} />
                <span className="text-sm font-mono text-slate-300 w-12 text-right">{p.ratio}%</span>
                <button onClick={() => removePaint(index)} className="p-1 text-slate-400 hover:text-red-500 rounded-full"><TrashIcon className="w-5 h-5" /></button>
              </div>
            );
          })}
          <button onClick={addPaint} className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 font-bold text-sky-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors duration-200 border-2 border-dashed border-slate-600 hover:border-sky-500">
            <PlusIcon className="w-5 h-5"/>
            混ぜる塗料を追加
          </button>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="font-bold text-slate-300">結果:</span>
                <div className="w-10 h-10 rounded-md border-2 border-slate-600" style={{ backgroundColor: mixedColor }}></div>
                <span className="font-mono text-lg text-white">{mixedColor}</span>
                <span className="px-2 py-1 bg-sky-800 text-sky-200 text-xs font-bold rounded">{PaintTypeDisplay[mixedType]}</span>
            </div>
            <div className="flex gap-4">
                <button onClick={onClose} className="px-4 py-2 font-bold text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">キャンセル</button>
                <button onClick={handleSave} className="px-4 py-2 font-bold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">保存して適用</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ColorMixerModal;
