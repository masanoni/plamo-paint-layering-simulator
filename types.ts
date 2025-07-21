
export enum PaintType {
  NORMAL = '通常色',
  METALLIC = 'メタリック',
  PEARL = 'パール',
  CLEAR = 'クリアー',
}

export enum Brand {
  CREOS = "GSIクレオス",
  GAIA = "ガイアノーツ",
  OTHER = "その他",
}

export enum PaintSystem {
  LACQUER = 'ラッカー',
  WATER_BASED = '水性',
  ACRYSION = 'アクリジョン',
}

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
export type FinishTypeGoal = '通常' | 'メタリック' | 'キャンディ' | '偏光塗装' | 'おまかせ';
export type TopCoatFinish = '光沢' | '半光沢' | 'つや消し' | 'おまかせ';

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

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  baseColor: string;
  layers: PaintLayer[];
}