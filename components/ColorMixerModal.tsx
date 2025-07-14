import React, { useState, useMemo, useEffect } from 'react';
import { PaintLayer, MixedPaintInfo, Paint, PaintType, Brand, PaintSystem } from '../types';
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

interface ExtendedMixedInfo extends MixedPaintInfo {
    id: string;
    paintSystem: PaintSystem;
    brand: Brand;
    series: string;
}

interface ColorMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (layerId: string, newLayerData: Partial<PaintLayer>) => void;
  layer: PaintLayer | null;
  paints: Paint[];
}

const ColorMixerModal: React.FC<ColorMixerModalProps> = ({ isOpen, onClose, onSave, layer, paints }) => {
  const [mixRows, setMixRows] = useState<ExtendedMixedInfo[]>([]);

  useEffect(() => {
    if (layer) {
        const initialMixData = layer.mixData?.paints || [];
        if (initialMixData.length === 0 && layer.brand !== Brand.OTHER) {
            const paintMatch = paints.find(p => p.hex === layer.color && layer.name.includes(p.name));
            if (paintMatch) {
                initialMixData.push({ code: paintMatch.code, ratio: 100 });
            }
        }

        const newMixRows = initialMixData.map(p => {
            const details = paints.find(paint => paint.code === p.code);
            return {
                id: Math.random().toString(36),
                ...p,
                paintSystem: details?.paintSystem || PaintSystem.LACQUER,
                brand: details?.brand || Brand.CREOS,
                series: details?.series || 'Mr.カラー'
            };
        });
        setMixRows(newMixRows);
    } else {
        setMixRows([]);
    }
  }, [layer, isOpen, paints]);

  const { mixedColor, mixedType } = useMemo(() => {
    if (mixRows.length === 0) return { mixedColor: '#ffffff', mixedType: PaintType.NORMAL };
    
    let totalR = 0, totalG = 0, totalB = 0;
    const totalRatio = mixRows.reduce((sum, p) => sum + p.ratio, 0);
    if (totalRatio === 0) return { mixedColor: '#ffffff', mixedType: PaintType.NORMAL };
    
    const paintDetails = mixRows.map(p => ({
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
  }, [mixRows, paints]);
  
  const updateMixRow = (index: number, newPaint: Paint) => {
    const newMixRows = [...mixRows];
    newMixRows[index] = {
      ...newMixRows[index],
      code: newPaint.code,
      paintSystem: newPaint.paintSystem,
      brand: newPaint.brand,
      series: newPaint.series || '基本色',
    };
    setMixRows(newMixRows);
  };
  
  const handleSystemChange = (index: number, newSystem: PaintSystem) => {
    const defaultPaint = paints.find(p => p.paintSystem === newSystem) || paints[0];
    if (defaultPaint) updateMixRow(index, defaultPaint);
  };
  
  const handleBrandChange = (index: number, newBrand: Brand) => {
    const defaultPaint = paints.find(p => p.paintSystem === mixRows[index].paintSystem && p.brand === newBrand) || paints.find(p => p.paintSystem === mixRows[index].paintSystem) || paints[0];
    if (defaultPaint) updateMixRow(index, defaultPaint);
  };

  const handleSeriesChange = (index: number, newSeries: string) => {
    const defaultPaint = paints.find(p => p.paintSystem === mixRows[index].paintSystem && p.brand === mixRows[index].brand && (p.series || '基本色') === newSeries) || paints[0];
    if (defaultPaint) updateMixRow(index, defaultPaint);
  };

  const handlePaintChange = (index: number, newCode: string) => {
    const selectedPaint = paints.find(p => p.code === newCode && p.brand === mixRows[index].brand && (p.series || '基本色') === mixRows[index].series);
    if(selectedPaint) updateMixRow(index, selectedPaint);
  };

  const addPaint = () => {
    if (paints.length === 0) return;
    const firstPaint = paints[0];
    const newRow: ExtendedMixedInfo = {
        id: Math.random().toString(36),
        code: firstPaint.code,
        ratio: 50,
        paintSystem: firstPaint.paintSystem,
        brand: firstPaint.brand,
        series: firstPaint.series || '基本色',
    };
    const newMix = [...mixRows, newRow];
    normalizeRatios(newMix);
  };
  
  const removePaint = (id: string) => {
    const newMix = mixRows.filter((p) => p.id !== id);
    normalizeRatios(newMix);
  };
  
  const updateRatio = (index: number, newRatio: number) => {
    const newMix = [...mixRows];
    newMix[index] = { ...newMix[index], ratio: newRatio };
    setMixRows(newMix);
  };

  const normalizeRatios = (currentMix: ExtendedMixedInfo[]) => {
    const totalRatio = currentMix.reduce((sum, p) => sum + p.ratio, 0);
    if(totalRatio === 0 || currentMix.length === 0) {
        setMixRows(currentMix);
        return;
    };
    const scale = 100 / totalRatio;
    setMixRows(currentMix.map(p => ({ ...p, ratio: Math.round(p.ratio * scale) })));
  };

  const handleSave = () => {
    if (!layer || mixRows.length === 0) return;
    const total = mixRows.reduce((sum, p) => sum + p.ratio, 0);
    const finalMix = mixRows.map(p => ({ code: p.code, ratio: Math.round(p.ratio * 100 / total) }));
    
    // Use the paint system of the first paint in the mix as the system for the whole layer
    const representativePaint = paints.find(p => p.code === finalMix[0]?.code);

    const newLayerData: Partial<PaintLayer> = {
        brand: Brand.OTHER,
        name: '調色カラー',
        color: mixedColor,
        type: mixedType,
        mixData: { paints: finalMix },
        series: undefined,
        paintSystem: representativePaint?.paintSystem || layer.paintSystem
    };
    onSave(layer.id, newLayerData);
    onClose();
  };

  if (!isOpen || !layer) return null;
  
  const selectClassName = "w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-sky-400">カラーミキサー (調色)</h2>
          <p className="text-slate-400">塗料を混ぜてカスタムカラーを作成します。</p>
        </header>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {mixRows.map((row, index) => {
            const paintInfo = paints.find(p => p.code === row.code);
            const availableSystems = Object.values(PaintSystem);
            const availableBrands = [...new Set(paints.filter(p => p.paintSystem === row.paintSystem).map(p => p.brand))];
            const availableSeries = [...new Set(paints.filter(p => p.paintSystem === row.paintSystem && p.brand === row.brand).map(p => p.series || '基本色'))];
            const paintsInSeries = paints.filter(p => p.paintSystem === row.paintSystem && p.brand === row.brand && (p.series || '基本色') === row.series);
            
            return (
              <div key={row.id} className="flex items-center gap-3 mb-4 bg-slate-700 p-3 rounded-lg">
                <div className="w-8 h-8 rounded flex-shrink-0" style={{ backgroundColor: paintInfo?.hex || '#000' }}></div>
                <div className="flex-grow grid grid-cols-2 gap-2">
                    <select value={row.paintSystem} onChange={e => handleSystemChange(index, e.target.value as PaintSystem)} className={selectClassName}>
                        {availableSystems.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={row.brand} onChange={e => handleBrandChange(index, e.target.value as Brand)} className={selectClassName}>
                        {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={row.series} onChange={e => handleSeriesChange(index, e.target.value)} className={selectClassName}>
                        {availableSeries.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={row.code} onChange={e => handlePaintChange(index, e.target.value)} className={selectClassName}>
                        {paintsInSeries.map(p => (
                            <option key={p.code} value={p.code}>{`${p.name} (${p.code})`}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <input type="range" min="0" max="100" value={row.ratio} onChange={e => updateRatio(index, parseInt(e.target.value))} className="w-24 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer" onMouseUp={() => normalizeRatios(mixRows)} onTouchEnd={() => normalizeRatios(mixRows)} />
                    <span className="text-sm font-mono text-slate-300 w-12 text-right">{row.ratio}%</span>
                    <button onClick={() => removePaint(row.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                </div>
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
                <span className="px-2 py-1 bg-sky-800 text-sky-200 text-xs font-bold rounded">{mixedType}</span>
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
