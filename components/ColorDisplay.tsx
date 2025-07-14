import React, { useMemo } from 'react';
import { PaintLayer, PaintType, PaintFinish } from '../types';

interface ColorDisplayProps {
  color: string;
  layers: PaintLayer[];
  finish: PaintFinish;
}

const ColorDisplay: React.FC<ColorDisplayProps> = ({ color, layers, finish }) => {
    
  const { hasMetallic, hasPearl } = useMemo(() => {
    if (layers.length === 0) {
      return { hasMetallic: false, hasPearl: false };
    }
    const hasMetallic = layers.some(l => l.type === PaintType.METALLIC);
    const hasPearl = layers.some(l => l.type === PaintType.PEARL);
    
    return { hasMetallic, hasPearl };
  }, [layers]);

  const getFinishLabel = () => {
    switch (finish) {
      case 'matte': return 'つや消し';
      case 'velvet': return 'ベルベット';
      case 'semi-gloss': return '半光沢';
      case 'gloss': default: return '光沢';
    }
  };

  const getFinishLabelClass = () => {
    switch(finish) {
        case 'matte': return 'bg-slate-600 text-slate-300';
        case 'velvet': return 'bg-purple-800 text-purple-200';
        case 'semi-gloss': return 'bg-teal-800 text-teal-200';
        case 'gloss': default: return 'bg-sky-800 text-sky-200';
    }
  };
  
  // Base64 encoded SVG for noise textures
  const noiseSVGCoarse = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNiIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=`;
  const noiseSVGFine = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjEuNSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=`;
  const matteTextureSVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=`;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-slate-300 mb-4">仕上がりプレビュー (3D風)</h2>
      <div className="relative w-64 h-64">
        {/* We use a container to correctly center all absolute layers */}
        <div className="relative w-full h-full">
            {/* 1. Base color sphere */}
            <div 
                className="absolute inset-0 rounded-full" 
                style={{ backgroundColor: color }}
            />

            {/* 2. Metallic and Pearl Effects */}
            {hasMetallic && 
                <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                        backgroundImage: `url(${noiseSVGCoarse})`,
                        mixBlendMode: 'color-dodge',
                        opacity: 0.1,
                        transform: 'scale(1.5)',
                        animation: 'sparkle 15s infinite linear',
                    }}
                />
            }
            {hasPearl && 
                <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                        backgroundImage: `url(${noiseSVGFine})`,
                        mixBlendMode: 'overlay',
                        opacity: 0.2,
                        animation: 'sparkle 8s infinite linear, hue-shift 12s infinite ease-in-out',
                    }}
                />
            }

            {/* 3. Lighting and Finish Effects */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{
                    // Main fill/ambient light
                    background: `radial-gradient(circle at 70% 30%, hsla(0,0%,100%,0.1), hsla(0,0%,0%,0.3) 100%)`,
                    // Shadow
                    boxShadow: `inset -15px -15px 50px hsla(0,0%,0%,0.4)`
                }}
            />

            {/* Key light (specular highlight) */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle at 65% 35%, hsla(0,0%,100%,1) 0%, hsla(0,0%,100%,0) 25%)`,
                    opacity: finish === 'gloss' ? 0.6 : (finish === 'semi-gloss' || finish === 'velvet') ? 0.3 : 0.1,
                    filter: `blur(${finish === 'gloss' ? '10px' : finish === 'semi-gloss' ? '18px' : finish === 'velvet' ? '25px' : '30px'})`,
                    transform: `scale(${finish === 'gloss' ? 0.8 : 1.0})`,
                    mixBlendMode: 'plus-lighter'
                }}
            />
            
            {/* Rim light */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle at 25% 85%, hsla(0,0%,100%,1) 0%, hsla(0,0%,100%,0) 30%)`,
                    opacity: finish === 'gloss' ? 0.15 : finish === 'semi-gloss' ? 0.1 : 0,
                    filter: 'blur(5px)',
                    mixBlendMode: 'plus-lighter',
                }}
            />

            {/* Matte surface texture overlay */}
             <div 
                className="absolute inset-0 rounded-full"
                style={{
                    backgroundImage: `url(${matteTextureSVG})`,
                    mixBlendMode: 'overlay',
                    opacity: finish === 'matte' ? 0.7 : finish === 'velvet' ? 0.4 : finish === 'semi-gloss' ? 0.2 : 0,
                }}
            />
        </div>
      </div>

      <style>
      {`
        @keyframes sparkle {
          0%, 100% { transform: translate(0px, 0px) scale(${hasMetallic ? 1.5 : 1}); }
          25% { transform: translate(1px, -1px) scale(${hasMetallic ? 1.55 : 1.05}); }
          50% { transform: translate(-1px, 1px) scale(${hasMetallic ? 1.45 : 0.95}); }
          75% { transform: translate(1px, 1px) scale(${hasMetallic ? 1.55 : 1.05}); }
        }
        @keyframes hue-shift {
          0%, 100% { filter: hue-rotate(-5deg); }
          50% { filter: hue-rotate(5deg); }
        }
      `}
      </style>

      <div className="mt-4 flex items-center gap-4">
        <span className="font-mono text-lg bg-slate-900 px-3 py-1 rounded">{color}</span>
        <span className={`px-3 py-1 text-sm font-bold rounded-full transition-colors duration-200 ${getFinishLabelClass()}`}>
          {getFinishLabel()}
        </span>
      </div>
    </div>
  );
};

export default ColorDisplay;