
import { GoogleGenAI, Type } from "@google/genai";
import { PaintLayer, Paint, PaintFinish, RecipeConditions, ParsedRecipe, PaintType, ParsedLayer, Brand, PaintSystem, FinishTypeGoal, TopCoatFinish } from '../types';


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

// Mappings from Japanese to English for AI prompt
const mapPaintSystemJaToEn = (system: PaintSystem): string => {
    if (system === PaintSystem.LACQUER) return 'Lacquer';
    if (system === PaintSystem.WATER_BASED) return 'Water-based';
    if (system === PaintSystem.ACRYSION) return 'Acrysion';
    return 'Lacquer';
};
const mapBrandJaToEn = (brand: Brand): string => {
    if (brand === Brand.CREOS) return 'GSI Creos';
    if (brand === Brand.GAIA) return 'Gaia Notes';
    return 'Other';
};
const mapPaintTypeJaToEn = (type: PaintType): string => {
    if (type === PaintType.NORMAL) return 'Normal';
    if (type === PaintType.METALLIC) return 'Metallic';
    if (type === PaintType.PEARL) return 'Pearl';
    if (type === PaintType.CLEAR) return 'Clear';
    return 'Normal';
};
const mapFinishTypeGoalJaToEn = (type: FinishTypeGoal): string => {
    switch (type) {
        case '通常': return 'Normal Finish';
        case 'メタリック': return 'Metallic Finish';
        case 'キャンディ': return 'Candy Finish';
        case '偏光塗装': return 'Prismatic/Color-shift Finish';
        default: return type;
    }
}
const mapTopCoatFinishJaToEn = (type: TopCoatFinish): string => {
    switch (type) {
        case '光沢': return 'Gloss';
        case '半光沢': return 'Semi-gloss';
        case 'つや消し': return 'Matte';
        default: return type;
    }
}


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

  // 1. Normalize paint system from conditions to Japanese to filter paints.
  const paintSystemJa: PaintSystem = Object.values(PaintSystem).includes(conditions.paintSystem as PaintSystem)
      ? conditions.paintSystem as PaintSystem
      : mapPaintSystemEnToJa(conditions.paintSystem);

  const filteredPaints = paints.filter(p => p.paintSystem === paintSystemJa);
  if (filteredPaints.length === 0) {
      throw new Error(`選択された塗料系統「${paintSystemJa}」に利用可能な塗料がデータベースにありません。`);
  }

  // 2. Convert all conditions and paint data to English for the AI prompt to avoid encoding errors.
  const paintSystemEn = mapPaintSystemJaToEn(paintSystemJa);
  const finishTypeEn = mapFinishTypeGoalJaToEn(conditions.finishType);
  const topCoatEn = mapTopCoatFinishJaToEn(conditions.topCoat);

  const simplifiedPaintsEn = filteredPaints.map(p => {
    // REMOVED 'Name' to prevent encoding errors. The AI must use the code. Added HEX for color reference.
    return `- Brand: ${mapBrandJaToEn(p.brand)}, Code: ${p.code}, Type: ${mapPaintTypeJaToEn(p.type)}, Finish: ${p.finish || 'gloss'}, HEX: ${p.hex}`;
  }).join('\n');

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
                type: { type: Type.STRING, enum: ['Clear'], description: "Top coat must be a 'Clear' type." },
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
            description: "A list of all product names used in the recipe (e.g., 'GSIクレオス Mr.カラー ホワイト (C1)'). Infer the full Japanese name from the code.",
            items: { type: Type.STRING }
        },
        recipeText: {
            type: Type.STRING,
            description: "A detailed step-by-step painting instruction guide in JAPANESE for human readers. Use newlines appropriately, no HTML tags."
        }
    },
    required: ["baseColorHex", "layers", "topCoat", "products", "recipeText"]
  };

  const prompt = `
You are a world-class professional model painter with deep knowledge of paint mixing and layering.
A user wants to replicate a specific color (HEX: ${targetColor}) under the following conditions.
From the provided list of available paints, create a concrete painting recipe to achieve this goal.
Your output must strictly follow the specified JSON schema.

# Target Color
- HEX: ${targetColor}

# User's Desired Conditions
- User-specified Base Coat: "${conditions.baseCoat || 'Not specified'}" (This is a user input, interpret it as a modeler would, e.g., 'black surfacer', 'silver undercoat').
- Desired Finish Type: ${finishTypeEn}
- Top Coat Finish: ${topCoatEn}
- **Paint System to Use: ${paintSystemEn}** (You must only use paints from this system.)

# Your Available Paint List (Only from the specified "${paintSystemEn}" system)
${simplifiedPaintsEn}

# Instructions
1.  **Formulate Recipe**: Prioritizing the user's conditions, create the most effective recipe to replicate the target color and texture. Use the provided paint list.
2.  **JSON Output**: Strictly structure the recipe as a JSON object according to the provided schema.
    - 'mixData' must accurately contain the 'code' and 'ratio' for the paints used.
    - 'paintSystem' and 'type' fields must use the English enum values from the schema.
    - In the 'products' field, list the full, original Japanese names of the products used (e.g., 'GSIクレオス Mr.カラー ホワイト (C1)'). You can infer the name from the code by matching it to the available paints list you were given.
3.  **Create Description in Japanese**: In the 'recipeText' field, provide a step-by-step guide in **JAPANESE** for a human reader. Explain professionally yet simply why you chose this recipe, key points for each step, and any precautions.
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
          layers: rawResult.layers.map(mapLayer).filter((l): l is ParsedLayer => l !== null),
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

    const existingPaintCodes = availablePaints.map(p => p.code).join(', ');

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
    You are an expert paint database assistant. A user wants to find detailed information for a paint with the following query: "${paintNameQuery}".
    Search the internet for the most accurate information and return it as a JSON object that strictly follows the provided schema.
    Accuracy for 'code', 'hex', and 'paintSystem' is critical.

    Important: The product 'code' you find must NOT be in the following list of existing codes: ${existingPaintCodes}

    Another important point: For the 'brand', 'type', and 'paintSystem' fields in the JSON output, you MUST use the English keywords defined in the schema (e.g., 'GSI Creos', 'Normal', 'Lacquer'). However, the 'name' and 'series' fields should be the official JAPANESE names if they exist.
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
