import { GoogleGenAI } from "@google/genai";
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
        case 'おまかせ': return 'AI Recommended';
        default: return type;
    }
}
const mapTopCoatFinishJaToEn = (type: TopCoatFinish): string => {
    switch (type) {
        case '光沢': return 'Gloss';
        case '半光沢': return 'Semi-gloss';
        case 'つや消し': return 'Matte';
        case 'おまかせ': return 'AI Recommended';
        default: return type;
    }
}


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


export const getPaintingAdvice = async (baseColor: string, layers: PaintLayer[], paints: Paint[], apiKey: string) => {
  if (!apiKey) {
    throw new Error("エラー: APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。");
  }

  if (layers.length === 0) {
    throw new Error("アドバイスを得るには、少なくとも1つ以上の塗料レイヤーを追加してください。");
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
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return responseStream;
  } catch (error) {
    console.error("Error fetching advice from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`AIからのアドバイス取得中にエラーが発生しました: ${error.message}`);
    }
    throw new Error("AIからのアドバイス取得中に不明なエラーが発生しました。");
  }
};


export const getReplicationRecipe = async (targetColor: string, conditions: RecipeConditions, paints: Paint[], apiKey: string): Promise<ParsedRecipe> => {
  if (!apiKey) {
      throw new Error("APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。");
  }

  const paintSystemJa: PaintSystem = Object.values(PaintSystem).includes(conditions.paintSystem as PaintSystem)
      ? conditions.paintSystem as PaintSystem
      : mapPaintSystemEnToJa(conditions.paintSystem);

  const filteredPaints = paints.filter(p => p.paintSystem === paintSystemJa);
  if (filteredPaints.length === 0) {
      throw new Error(`選択された塗料系統「${paintSystemJa}」に利用可能な塗料がデータベースにありません。`);
  }

  const paintSystemEn = mapPaintSystemJaToEn(paintSystemJa);
  const finishTypeEn = mapFinishTypeGoalJaToEn(conditions.finishType);
  const topCoatEn = mapTopCoatFinishJaToEn(conditions.topCoat);

  const simplifiedPaintsEn = filteredPaints.map(p => {
    // Japanese names are removed from the prompt to prevent encoding errors.
    // The AI can identify paints by code and look up the name for the output.
    return `- Brand: ${mapBrandJaToEn(p.brand)}, Code: ${p.code}, Type: ${mapPaintTypeJaToEn(p.type)}, Finish: ${p.finish || 'gloss'}, HEX: ${p.hex}`;
  }).join('\n');

  const prompt = `
You are a world-class professional model painter. A user wants to replicate a specific color. Your task is to generate a JSON object containing a painting recipe.

**Your response MUST be ONLY a JSON object enclosed in a single markdown code block (\`\`\`json ... \`\`\`). Do not add any text before or after the JSON block.**

The JSON object must have the following structure:
{
  "baseColorHex": "string (The proposed base color in HEX code format.)",
  "layers": [
    {
      "coats": "integer (Estimated number of coats, 1-10)",
      "type": "string (Enum: 'Normal', 'Metallic', 'Pearl', 'Clear')",
      "paintSystem": "string (Enum: 'Lacquer', 'Water-based', 'Acrysion'. Must match the user's specified system.)",
      "finish": "string (Enum: 'gloss', 'matte', 'semi-gloss', 'velvet')",
      "mixData": {
        "paints": [
          {
            "code": "string (Product code from the available paints list.)",
            "ratio": "integer (Mixing ratio %.)"
          }
        ]
      }
    }
  ],
  "topCoat": { /* same structure as a layer object, or null if not needed */ },
  "products": [
    "string (A list of all product names used in the recipe in Japanese, e.g., 'GSIクレオス Mr.カラー ホワイト (C1)')."
  ],
  "recipeText": "string (A detailed step-by-step painting instruction guide in Japanese.)"
}

**Instructions:**
- If a condition is "AI Recommended", you MUST choose the most suitable option to achieve the target color and describe your choice and reasoning in the "recipeText".

---
# Target Color
- HEX: ${targetColor}

# User's Desired Conditions
- User-specified Base Coat: "${conditions.baseCoat || 'Not specified'}"
- Desired Finish Type: ${finishTypeEn}
- Top Coat Finish: ${topCoatEn}
- Paint System to Use: ${paintSystemEn}

# Your Available Paint List (For "${paintSystemEn}" system)
${simplifiedPaintsEn}
---

Now, generate the JSON object.
`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      let jsonString = response.text;
      const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
          jsonString = match[1];
      }
      
      const rawResult = JSON.parse(jsonString.trim());

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

export const getConceptualRecipe = async (
    baseConcept: string,
    finishConcept: string,
    conditions: RecipeConditions,
    paints: Paint[],
    apiKey: string
): Promise<ParsedRecipe> => {
    if (!apiKey) {
        throw new Error("APIキーが設定されていません。「Google AI APIキー設定」からキーを入力してください。");
    }
    if (!baseConcept.trim() || !finishConcept.trim()) {
        throw new Error("下地の色と完成イメージの両方を入力してください。");
    }

    const paintSystemJa: PaintSystem = Object.values(PaintSystem).includes(conditions.paintSystem as PaintSystem)
        ? conditions.paintSystem as PaintSystem
        : mapPaintSystemEnToJa(conditions.paintSystem);

    const filteredPaints = paints.filter(p => p.paintSystem === paintSystemJa);
    if (filteredPaints.length === 0) {
        throw new Error(`選択された塗料系統「${paintSystemJa}」に利用可能な塗料がデータベースにありません。`);
    }

    const paintSystemEn = mapPaintSystemJaToEn(paintSystemJa);
    const finishTypeEn = mapFinishTypeGoalJaToEn(conditions.finishType);
    const topCoatEn = mapTopCoatFinishJaToEn(conditions.topCoat);

    const simplifiedPaintsEn = filteredPaints.map(p => {
        return `- Brand: ${mapBrandJaToEn(p.brand)}, Code: ${p.code}, Type: ${mapPaintTypeJaToEn(p.type)}, Finish: ${p.finish || 'gloss'}, HEX: ${p.hex}`;
    }).join('\n');

    const prompt = `
You are a world-class professional model painter. A user wants to achieve a specific look based on a description. Your task is to generate a JSON object containing a painting recipe.

**Your response MUST be ONLY a JSON object enclosed in a single markdown code block (\`\`\`json ... \`\`\`). Do not add any text before or after the JSON block.**

The JSON object must have the following structure:
{
  "baseColorHex": "string (The proposed base color in HEX code format, e.g., '#808080'. This should represent the initial surface color before applying the layers.)",
  "layers": [
    {
      "coats": "integer (Estimated number of coats, 1-10)",
      "type": "string (Enum: 'Normal', 'Metallic', 'Pearl', 'Clear')",
      "paintSystem": "string (Enum: 'Lacquer', 'Water-based', 'Acrysion'. Must match the user's specified system.)",
      "finish": "string (Enum: 'gloss', 'matte', 'semi-gloss', 'velvet')",
      "mixData": {
        "paints": [
          {
            "code": "string (Product code from the available paints list.)",
            "ratio": "integer (Mixing ratio %.)"
          }
        ]
      }
    }
  ],
  "topCoat": { /* same structure as a layer object, or null if not needed */ },
  "products": [
    "string (A list of all product names used in the recipe in Japanese, e.g., 'GSIクレオス Mr.カラー ホワイト (C1)')."
  ],
  "recipeText": "string (A detailed step-by-step painting instruction guide in Japanese. It should explain how to achieve the user's desired finish from their starting point.)"
}

**Instructions:**
- If a condition is "AI Recommended", you MUST choose the most suitable option to achieve the desired appearance and describe your choice and reasoning in the "recipeText".

---
# User's Goal & Conditions

- Starting Point / Base Layer Description: "${baseConcept}"
- Desired Final Appearance Description: "${finishConcept}"
- Desired Finish Style: "${finishTypeEn}"
- Final Top Coat: "${topCoatEn}"
- Paint System to Use: "${paintSystemEn}"

# Your Available Paint List (For "${paintSystemEn}" system)
${simplifiedPaintsEn}
---

Based on the user's descriptions and conditions, devise a practical, multi-step painting process. Interpret their creative request. For example, if they want a 'jewel-like red over a clear red base', you might suggest a silver base, then clear red, then a gloss top coat to achieve the depth and shine. Now, generate the JSON object.
`;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        let jsonString = response.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        const rawResult = JSON.parse(jsonString.trim());

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
        console.error("Error fetching or parsing conceptual recipe from Gemini API:", error);
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

    const prompt = `
You are an expert paint database assistant. A user wants to find detailed information for a paint.
Your response MUST be ONLY a JSON object enclosed in a single markdown code block (\`\`\`json ... \`\`\`). Do not add any text before or after the JSON block.

The JSON object must have the following structure:
{
    "brand": "string (Enum: 'GSI Creos', 'Gaia Notes', 'Other')",
    "series": "string (Product series name in Japanese, e.g., 'Mr.カラーGX'. Null if not applicable.)",
    "name": "string (Official product name in Japanese, e.g., 'クールホワイト')",
    "code": "string (Product code, e.g., 'GX1'. 'N/A' if unknown. Must not be in the list of existing codes below.)",
    "hex": "string (HEX code for the color, e.g., '#f8f8f8')",
    "type": "string (Enum: 'Normal', 'Metallic', 'Pearl', 'Clear')",
    "paintSystem": "string (Enum: 'Lacquer', 'Water-based', 'Acrysion')",
    "finish": "string (Enum: 'gloss', 'matte', 'semi-gloss', 'velvet')"
}

---
# User Query
"${paintNameQuery}"

# Existing Product Codes (Do not use these)
${existingPaintCodes}
---

Search the internet for the most accurate information for the user's query and generate the JSON object.
`;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        let jsonString = response.text;
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        const rawPaintInfo = JSON.parse(jsonString.trim());

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