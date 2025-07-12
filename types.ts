export enum PaintType {
  NORMAL = 'NORMAL',
  METALLIC = 'METALLIC',
  PEARL = 'PEARL',
  CLEAR = 'CLEAR',
}

export enum Brand {
  CREOS = "CREOS",
  GAIA = "GAIA",
  OTHER = "OTHER",
}

export enum PaintSystem {
  LACQUER = 'LACQUER',
  WATER_BASED = 'WATER_BASED',
  ACRYSION = 'ACRYSION',
}

// Display mappings for Japanese text
export const PaintTypeDisplay = {
  [PaintType.NORMAL]: '通常色',
  [PaintType.METALLIC]: 'メタリック',
  [PaintType.PEARL]: 'パール',
  [PaintType.CLEAR]: 'クリアー',
} as const;

export const BrandDisplay = {
  [Brand.CREOS]: "GSIクレオス",
  [Brand.GAIA]: "ガイアノーツ",
  [Brand.OTHER]: "その他",
} as const;

export const PaintSystemDisplay = {
  [PaintSystem.LACQUER]: 'ラッカー',
  [PaintSystem.WATER_BASED]: '水性',
  [PaintSystem.ACRYSION]: 'アクリジョン',
} as const;

export type PaintFinish = 'gloss' | 'matte' | 'semi-gloss' | 'velvet';

export interface Paint {
  brand: Brand;
  series?: string;
  name: string;
  code: string;
  hex: string;
  type: PaintType;
  paintSystem: PaintSystem;
  finish?: PaintFinish;
  amazonUrl?: string;
  rakutenUrl?: string;
}

export interface MixedPaintInfo {
  code: string; // unique paint code
  ratio: number; // percentage
}

export interface PaintLayer {
  id: string;
  brand: Brand;
  series?: string;
  name:string;
  color: string; // HEX color
  coats: number; // 1-10 (吹付回数)
  type: PaintType;
  paintSystem: PaintSystem;
  finish: PaintFinish;
  mixData?: {
    paints: MixedPaintInfo[];
  };
}

// New types for Color Replicator conditions
export type FinishTypeGoal = '通常' | 'メタリック' | 'キャンディ' | '偏光塗装';
export type TopCoatFinish = '光沢' | '半光沢' | 'つや消し';

export interface RecipeConditions {
  baseCoat: string;
  finishType: FinishTypeGoal;
  topCoat: TopCoatFinish;
  paintSystem: PaintSystem;
}

// For parsing AI recipe output
export interface ParsedMix {
  code: string;
  ratio: number;
}

export interface ParsedLayer {
  coats: number;
  type: PaintType;
  paintSystem: PaintSystem;
  finish: PaintFinish;
  mixData: {
    paints: ParsedMix[];
  };
}

export interface ParsedRecipe {
  baseColorHex: string;
  layers: ParsedLayer[];
  topCoat: ParsedLayer | null;
  products: string[];
  recipeText: string;
}