
import { GoogleGenAI, Type } from "@google/genai";
import { PaintLayer, Paint, PaintFinish, RecipeConditions, ParsedRecipe, PaintType, ParsedLayer, Brand, PaintSystem } from '../types';


// --- Mappings and Enums for AI Communication ---

// Mappings from English (for AI schema) back to Japanese (for app state)
const mapBrandEnToJa = (brand: string): Brand => {
    if (brand === 'GSI Creos') return Brand.CREOS;
    if (brand === 'Gaia Notes') return Brand.GAIA;
    return Brand.OTHER;
};
const mapPaintTypeEnToJa = (type: string): PaintType => {
    if (type === 'Normal') return PaintType.NORMAL;
    if (type === 'Metallic') return PaintType.METALLIC;
    if (type === 'Pearl') return PaintType.PEARL;
    if (type === 'Clear') return PaintType.CLEAR;
    return PaintType.NORMAL; // Fallback
};
const mapPaintSystemEnToJa = (system: string): PaintSystem => {
    if (system === 'Lacquer') return PaintSystem.LACQUER;
    if (system === 'Water-based') return PaintSystem.WATER_BASED;
    if (system === 'Acrysion') return PaintSystem.ACRYSION;
    return PaintSystem.LACQUER; // Fallback
};

// English-only enum values for AI Schema to prevent encoding errors
const BRAND_ENUM_EN = ['GSI Creos', 'Gaia Notes', 'Other'];
const PAINT_TYPE_ENUM_EN = ['Normal', 'Metallic', 'Pearl', 'Clear'];
const PAINT_SYSTEM_ENUM_EN = ['Lacquer', 'Water-based', 'Acrysion'];
const PAINT_FINISH_ENUM_EN: PaintFinish[] = ['gloss', 'matte', 'semi-gloss', 'velvet'];

const getFinishText = (finish: PaintFinish): string => {
  switch (finish) {
    case 'gloss': return '光沢';
    case 'matte': return 'つや消し';
    case 'semi-gloss': return '半光沢';
    case 'velvet': return 'ベルベット調';
    default: return finish;
  }
};

const getMixDetails = (layer: PaintLayer, availablePaints: Paint[]): string => {
    if (!layer.mixData || layer.mixData.paints.length === 0) {
        return `${layer.brand} ${layer.series ? `(${layer.series})` : ''} - ${layer.name}`;
    }
    const mixString = layer.mixData.paints.map(p => {
        const paintInfo = availablePaints.find(pp => pp.code === p.code);
        return `${paintInfo ? `${paintInfo.name}(${paintInfo.code})` : p.code} ${p.ratio}%`;
    }).join(' + ');
    return `調色カラー (${mixString})`;
};


export const getPaintingAdvice = async (baseColor: string, layers: PaintLayer[], paints: Paint[], apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "エラー: APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。";
  }

  if (layers.length === 0) {
    return "アドバイスを得るには、少なくとも1つ以上の塗料レイヤーを追加してください。";
  }

  const layerDescriptions = layers.map((layer, index) => 
    `${index + 1}層目: ${getMixDetails(layer, paints)} [塗料系統: ${layer.paintSystem}, 種類: ${layer.type}, 仕上がり: ${getFinishText(layer.finish)}] を 吹付回数 ${layer.coats}回 で塗装`
  ).join('\n');

  const prompt = `
あなたはプロの模型製作者（モデラー）です。以下のプラスチックモデルの塗装プランについて、専門的なアドバイスを日本語で提供してください。

塗装プラン：
- ベース（下地）の色: ${baseColor}
- 重ね塗りする塗料の順番と設定:
${layerDescriptions}

アドバイスのポイント：
1.  **発色と質感**: 下地の色と重ねる色の相性を評価してください。最終的にどのような発色や質感（光沢、つや消し、ベルベット調など）になるか、予想される結果を具体的に説明してください。特に、パール、メタリック、クリアーカラーなどの特殊な塗料や、調色された色の効果、吹付回数による色の乗り方の違い、最終的な仕上がりについても言及してください。
2.  **塗料の相性**: 各レイヤーの塗料系統（ラッカー、水性、アクリジョン）を考慮し、塗装の順番に問題がないか指摘してください。一般的に、ラッカーの上に水性やアクリジョンは塗装可能ですが、その逆は塗膜を侵すリスクがあるため注意が必要です。
3.  **塗装の難易度**: この塗装プランの難易度はどのくらいですか？初心者が気をつけるべき点や、より良い結果を得るためのコツ（例：塗料の希釈率、乾燥時間、特殊な質感の塗料の扱い方など）を教えてください。
4.  **改善案**: もし、より良い発色や仕上がりが期待できる代替案（別の塗料の組み合わせや塗装手順）があれば提案してください。

以上の点を踏まえて、丁寧かつ分かりやすく解説してください。
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching advice from Gemini API:", error);
    if (error instanceof Error) {
        return `AIからのアドバイス取得中にエラーが発生しました: ${error.message}`;
    }
    return "AIからのアドバイス取得中に不明なエラーが発生しました。";
  }
};


export const getReplicationRecipe = async (targetColor: string, conditions: RecipeConditions, paints: Paint[], apiKey: string): Promise<ParsedRecipe> => {
  if (!apiKey) {
      throw new Error("APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。");
  }

  // 1. Normalize the paint system from conditions to Japanese.
  // This handles cases where the input might be English ('Acrysion') or Japanese ('アクリジョン').
  let paintSystemJa: PaintSystem;
  if (Object.values(PaintSystem).includes(conditions.paintSystem as PaintSystem)) {
      paintSystemJa = conditions.paintSystem as PaintSystem;
  } else {
      // Assume it's an English value that needs mapping.
      paintSystemJa = mapPaintSystemEnToJa(conditions.paintSystem);
  }

  // 2. Filter paints using the normalized Japanese paint system name.
  const filteredPaints = paints.filter(p => p.paintSystem === paintSystemJa);
  if (filteredPaints.length === 0) {
      throw new Error(`選択された塗料系統「${paintSystemJa}」に利用可能な塗料がデータベースにありません。`);
  }
  
  // 3. Create English version for the AI prompt schema.
  const mapPaintSystemJaToEn = (system: PaintSystem): string => {
      if (system === PaintSystem.LACQUER) return 'Lacquer';
      if (system === PaintSystem.WATER_BASED) return 'Water-based';
      if (system === PaintSystem.ACRYSION) return 'Acrysion';
      return 'Lacquer';
  };
  const paintSystemEn = mapPaintSystemJaToEn(paintSystemJa);

  const simplifiedPaints = filteredPaints.map(p => `- ${p.brand} ${p.series ? `(${p.series})` : ''} ${p.name} (${p.code}) [種類: ${p.type}, 仕上がり: ${getFinishText(p.finish || 'gloss')}]`).join('\n');

  const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        baseColorHex: {
            type: Type.STRING,
            description: "The proposed base color in HEX code format.",
        },
        layers: {
            type: Type.ARRAY,
            description: "The main paint layers, applied in order from bottom to top.",
            items: {
                type: Type.OBJECT,
                properties: {
                    coats: { type: Type.INTEGER, description: "Estimated number of coats (1-10)." },
                    type: { type: Type.STRING, enum: PAINT_TYPE_ENUM_EN, description: "The paint type for the layer. Use English values." },
                    paintSystem: { type: Type.STRING, enum: PAINT_SYSTEM_ENUM_EN, description: "The paint system for the layer. Use English values. Must match the user's specified system." },
                    finish: { type: Type.STRING, enum: PAINT_FINISH_ENUM_EN, description: "The paint finish for the layer." },
                    mixData: {
                        type: Type.OBJECT,
                        properties: {
                            paints: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        code: { type: Type.STRING, description: "Product code from the available paints list." },
                                        ratio: { type: Type.INTEGER, description: "Mixing ratio (%). Should be adjusted to total 100%." }
                                    },
                                    required: ["code", "ratio"]
                                }
                            }
                        },
                         required: ["paints"]
                    }
                },
                required: ["coats", "type", "paintSystem", "finish", "mixData"]
            }
        },
        topCoat: {
            type: Type.OBJECT,
            description: "The final top coat layer. Null if not needed.",
            nullable: true,
            properties: {
                coats: { type: Type.INTEGER, description: "Estimated number of coats (1-10)." },
                type: { type: Type.STRING, enum: [PaintType.CLEAR], description: "Top coat must be a 'Clear' type." },
                paintSystem: { type: Type.STRING, enum: PAINT_SYSTEM_ENUM_EN, description: "The paint system for the top coat. Use English values. Must match the user's specified system." },
                finish: { type: Type.STRING, enum: ['gloss', 'matte', 'semi-gloss'], description: "The user-specified finish for the top coat." },
                mixData: {
                    type: Type.OBJECT,
                    properties: {
                         paints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    code: { type: Type.STRING, description: "Product code from the available paints list." },
                                    ratio: { type: Type.INTEGER, description: "Used as a single paint (100%)." }
                                },
                                required: ["code", "ratio"]
                            }
                        }
                    },
                    required: ["paints"]
                }
            },
             required: ["coats", "type", "paintSystem", "finish", "mixData"]
        },
        products: {
            type: Type.ARRAY,
            description: "A list of all product names used in the recipe (e.g., GSI Creos Aqueous Hobby Color White (H1)).",
            items: { type: Type.STRING }
        },
        recipeText: {
            type: Type.STRING,
            description: "A detailed step-by-step painting instruction guide in Japanese for human readers. Use newlines appropriately, no HTML tags."
        }
    },
    required: ["baseColorHex", "layers", "topCoat", "products", "recipeText"]
  };

  const prompt = `
あなたは世界クラスのプロモデラーで、塗料の調色と重ね塗りに関する深い知識を持っています。
ユーザーが画像から特定の色（HEX: ${targetColor}）を、以下の条件で再現したいと考えています。
あなたが利用可能な塗料リストの中から最適なものを選択・調色し、この目標を達成するための具体的な塗装レシピを考案してください。
出力は、必ず指定されたJSONスキーマに従ってください。

# 目標の色
HEX: ${targetColor}

# ユーザーの希望条件
- 下地: ${conditions.baseCoat || '指定なし'}
- 仕上がりの種類: ${conditions.finishType}
- トップコート: ${conditions.topCoat}
- **使用する塗料系統: ${paintSystemJa}** (この系統の塗料のみを使用してください)

# あなたが利用可能な塗料リスト (指定された「${paintSystemJa}」系統のみ)
${simplifiedPaints}

# 指示
1. **レシピの考案**: ユーザーの希望条件を最優先し、目標の色と質感を再現する最も効果的なレシピを構築してください。下地の色から始まり、本塗装の各レイヤー（調色が必要な場合はその比率も）、そして最終的なトップコートまでを考慮します。
2. **JSON出力**: 考案したレシピを、指定されたJSONスキーマに厳密に従って構造化データとして出力してください。
   - 'mixData'には、使用する塗料の'code'と'ratio'を正確に含めてください。
   - **重要**: 'paintSystem'フィールドには、ユーザーが指定した系統に対応する英語の値、つまり「${paintSystemEn}」を使用してください。
   - **重要**: 'type'フィールドにも、スキーマで定義されている英語の値（例: 'Normal', 'Metallic'）を使用してください。
3. **解説文の作成**: 'recipeText'には、なぜそのレシピを提案したのか、各工程のポイント、注意点などを、専門的かつ初心者にも分かりやすく解説してください。
`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        },
      });
      
      const rawResult = JSON.parse(response.text.trim());

      const mapLayer = (layer: any): ParsedLayer | null => {
          if (!layer) return null;
          return {
              ...layer,
              type: mapPaintTypeEnToJa(layer.type),
              paintSystem: mapPaintSystemEnToJa(layer.paintSystem),
          };
      };

      const parsedResult: ParsedRecipe = {
          ...rawResult,
          layers: rawResult.layers.map(mapLayer).filter(Boolean),
          topCoat: mapLayer(rawResult.topCoat),
      };

      return parsedResult;
  } catch (error) {
    console.error("Error fetching or parsing recipe from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`AIからのレシピ取得または解析中にエラーが発生しました: ${error.message}`);
    }
    throw new Error("AIからのレシピ取得中に不明なエラーが発生しました。");
  }
};

export const getNewPaintInfo = async (paintNameQuery: string, availablePaints: Paint[], apiKey: string): Promise<Omit<Paint, 'amazonUrl' | 'rakutenUrl'>> => {
    if (!apiKey) {
        throw new Error("APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。");
    }

    const simplifiedPaints = availablePaints.map(p => `${p.name} (${p.code})`).join(', ');

    const paintInfoSchema = {
        type: Type.OBJECT,
        properties: {
            brand: { type: Type.STRING, enum: BRAND_ENUM_EN, description: "Paint brand name (e.g., 'GSI Creos')." },
            series: { type: Type.STRING, description: "Product series name (e.g., Mr.Color GX, Aqueous Hobby Color). Null if not applicable.", nullable: true },
            name: { type: Type.STRING, description: "Official product name of the paint (e.g., Cool White, Ex-Clear)." },
            code: { type: Type.STRING, description: "Product code (e.g., GX1, H1, N1). 'N/A' if unknown." },
            hex: { type: Type.STRING, description: "HEX code representing the paint color (e.g., #ffffff). Use #ffffff for clear paints." },
            type: { type: Type.STRING, enum: PAINT_TYPE_ENUM_EN, description: "The type of paint. Use English values (e.g., 'Normal')." },
            paintSystem: { type: Type.STRING, enum: PAINT_SYSTEM_ENUM_EN, description: "The paint system. Use English values (e.g., 'Lacquer')." },
            finish: { type: Type.STRING, enum: PAINT_FINISH_ENUM_EN, description: "The default finish of the paint (gloss, matte, semi-gloss, velvet)." },
        },
        required: ["brand", "series", "name", "code", "hex", "type", "paintSystem", "finish"]
    };

    const prompt = `
    あなたは塗料データベースのエキスパートです。ユーザーが入力した塗料名「${paintNameQuery}」について、その詳細情報を調べて、指定されたJSONスキーマに従って出力してください。
    インターネット上の情報を検索し、最も正確な情報を返してください。特に製品コード、HEX値、塗料系統は正確性が重要です。
    ただし、既存の塗料リストにある製品コードと重複しないようにしてください。

    既存の塗料リスト: ${simplifiedPaints}

    重要: JSONを出力する際、'brand', 'type', 'paintSystem' の各フィールドには、スキーマで定義されている英語のキーワード（例: 'GSI Creos', 'Normal', 'Lacquer'）を必ず使用してください。
    `;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: paintInfoSchema,
            },
        });
        
        const rawPaintInfo = JSON.parse(response.text.trim());

        const paintInfo = {
            ...rawPaintInfo,
            brand: mapBrandEnToJa(rawPaintInfo.brand),
            type: mapPaintTypeEnToJa(rawPaintInfo.type),
            paintSystem: mapPaintSystemEnToJa(rawPaintInfo.paintSystem),
        };

        if (paintInfo.series === null) {
            paintInfo.series = undefined;
        }

        return paintInfo as Omit<Paint, 'amazonUrl' | 'rakutenUrl'>;

    } catch (error) {
        console.error("Error fetching new paint info from Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`AIからの塗料情報取得中にエラーが発生しました: ${error.message}`);
        }
        throw new Error("AIからの塗料情報取得中に不明なエラーが発生しました。");
    }
};
