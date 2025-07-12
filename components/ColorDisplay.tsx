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
    const hasMetallic = layers.some(layer => layer.type === PaintType.METALLIC);
    const hasPearl = layers.some(layer => layer.type === PaintType.PEARL);
    return { hasMetallic, hasPearl };
  }, [layers]);

  const sphereStyle = useMemo(() => {
    switch (finish) {
      case 'velvet':
        return {
          background: `radial-gradient(circle at 65% 35%, hsl(0 0% 80% / 0.1), hsl(0 0% 0% / 0.2)),
                       radial-gradient(circle at 65% 35%, ${color} 45%, #222 150%)`,
          boxShadow: `inset -15px -15px 50px rgba(0,0,0,0.3)`,
        };
      case 'gloss':
        return {
          background: `radial-gradient(circle at 65% 35%, hsl(0 0% 100% / 0.4), hsl(0 0% 0% / 0.5)),
                       radial-gradient(circle at 65% 35%, ${color} 5%, #111 150%)`,
          boxShadow: `inset -15px -15px 50px rgba(0,0,0,0.5)`,
        };
      case 'semi-gloss':
        return {
          background: `radial-gradient(circle at 65% 35%, hsl(0 0% 100% / 0.25), hsl(0 0% 0% / 0.4)),
                       radial-gradient(circle at 65% 35%, ${color} 25%, #181818 150%)`,
          boxShadow: `inset -15px -15px 50px rgba(0,0,0,0.45)`,
        };
      case 'matte':
      default:
        return {
          background: `radial-gradient(circle at 65% 35%, hsl(0 0% 100% / 0.2), hsl(0 0% 0% / 0.3)),
                       radial-gradient(circle at 65% 35%, ${color} 40%, #222 150%)`,
          boxShadow: `inset -15px -15px 50px rgba(0,0,0,0.4)`,
        };
    }
  }, [finish, color]);

  const glossHighlightStyle = useMemo(() => {
    const baseStyle = {
      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 40%)',
      transform: 'scale(0.8)',
    };
    switch (finish) {
      case 'velvet': return { ...baseStyle, opacity: 0.4, filter: 'blur(25px)' };
      case 'gloss': return { ...baseStyle, opacity: 0.9, filter: 'blur(10px)' };
      case 'semi-gloss': return { ...baseStyle, opacity: 0.7, filter: 'blur(15px)' };
      case 'matte': return { ...baseStyle, opacity: 0.6, filter: 'blur(20px)' };
      default: return { ...baseStyle, opacity: 0.6, filter: 'blur(20px)' };
    }
  }, [finish]);
  
  const rimLightStyle = useMemo(() => ({
    background: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 30%)',
    opacity: finish === 'gloss' ? 1 : finish === 'semi-gloss' ? 0.5 : 0,
  }), [finish]);

  const matteOverlayStyle: React.CSSProperties = useMemo(() => ({
     background: 'rgba(255, 255, 255, 0.02)',
     mixBlendMode: 'overlay',
     backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')`,
     opacity: finish === 'gloss' ? 0 : finish === 'velvet' ? 0.8 : finish === 'semi-gloss' ? 0.5 : 1,
  }), [finish]);

  const getFinishLabel = () => {
    switch (finish) {
      case 'matte': return 'つや消し';
      case 'velvet': return 'ベルベット';
      case 'semi-gloss': return '半光沢';
      case 'gloss':
      default:
        return '光沢';
    }
  };

  const getFinishLabelClass = () => {
    switch(finish) {
        case 'matte': return 'bg-slate-600 text-slate-300';
        case 'velvet': return 'bg-purple-800 text-purple-200';
        case 'semi-gloss': return 'bg-teal-800 text-teal-200';
        case 'gloss':
        default:
          return 'bg-sky-800 text-sky-200';
    }
  };


  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-slate-300 mb-4">仕上がりプレビュー (3D風)</h2>
      <div className="relative w-64 h-64">
        {/* The main sphere element */}
        <div
          className="w-full h-full rounded-full transition-all duration-300 overflow-hidden relative"
          style={sphereStyle}
        >
           {/* Metallic/Pearl Flake Effects */}
           {(hasMetallic || hasPearl) && (
             <>
             {/* Coarse flakes for metallic */}
             <div 
                className="absolute inset-0 w-full h-full" 
                style={{
                    backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGZpbHRlciBpZD0ibSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjEuMiIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsdGVyPSJ1cmwoI20pIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')`,
                    mixBlendMode: 'color-dodge',
                    opacity: 0.15,
                    transform: 'scale(2)'
                }}
            />
             {/* Fine flakes for pearl/shimmer */}
             <div 
                className="absolute inset-0 w-full h-full" 
                style={{
                    backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48ZmlsdGVyIGlkPSJwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMS41IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbHRlcj0idXJsKCNwKSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')`,
                    mixBlendMode: 'overlay',
                    opacity: hasPearl ? 0.35 : 0.25,
                    animation: hasPearl ? 'sparkle 8s infinite linear, hue-shift 12s infinite linear' : 'sparkle 12s infinite linear',
                }}
            />
            </>
           )}

           {/* Lighting Effects */}
           <div 
             className="absolute top-[10%] left-[20%] w-1/2 h-1/2 rounded-full transition-all duration-300"
             style={glossHighlightStyle}
           />
           <div 
             className="absolute bottom-[5%] right-[5%] w-3/4 h-3/4 rounded-full transition-all duration-300"
             style={rimLightStyle}
           />
            <div 
             className="absolute inset-0 w-full h-full transition-all duration-300"
             style={matteOverlayStyle}
           />
        </div>
      </div>
      {/* CSS for the pearl sparkle animation */}
      <style>
      {`
        @keyframes sparkle {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); opacity: ${hasPearl ? 0.35 : 0.25}; }
          25% { transform: translate(1px, -1px) rotate(5deg) scale(1.05); opacity: ${hasPearl ? 0.3 : 0.2}; }
          50% { transform: translate(-1px, 1px) rotate(-5deg) scale(1); opacity: ${hasPearl ? 0.4 : 0.3}; }
          75% { transform: translate(1px, 1px) rotate(2deg) scale(1.05); opacity: ${hasPearl ? 0.25 : 0.2}; }
        }
        @keyframes hue-shift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(20deg); }
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