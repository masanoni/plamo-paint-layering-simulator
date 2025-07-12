
import { GoogleGenAI, Type } from "@google/genai";
import { PaintLayer, Paint, PaintFinish, RecipeConditions, ParsedRecipe, PaintType, ParsedLayer, Brand, PaintSystem } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder for the build-time check.
  // The environment variable should be set in the actual environment.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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


export const getPaintingAdvice = async (baseColor: string, layers: PaintLayer[], paints: Paint[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "エラー: APIキーが設定されていません。";
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


export const getReplicationRecipe = async (targetColor: string, conditions: RecipeConditions, paints: Paint[]): Promise<ParsedRecipe> => {
  if (!process.env.API_KEY) {
      throw new Error("APIキーが設定されていません。");
  }

  const filteredPaints = paints.filter(p => p.paintSystem === conditions.paintSystem);
  if (filteredPaints.length === 0) {
      throw new Error(`選択された塗料系統「${conditions.paintSystem}」に利用可能な塗料がデータベースにありません。`);
  }

  const simplifiedPaints = filteredPaints.map(p => `- ${p.brand} ${p.series ? `(${p.series})` : ''} ${p.name} (${p.code}) [種類: ${p.type}, 仕上がり: ${getFinishText(p.finish || 'gloss')}]`).join('\n');

  const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        baseColorHex: {
            type: Type.STRING,
            description: "提案する下地の色。HEXコード形式で指定。",
        },
        layers: {
            type: Type.ARRAY,
            description: "本塗装のレイヤー。下から順番に重ねる。",
            items: {
                type: Type.OBJECT,
                properties: {
                    coats: { type: Type.INTEGER, description: "吹付回数の目安 (1-10)。" },
                    type: { type: Type.STRING, enum: Object.values(PaintType), description: "レイヤーの塗料タイプ。" },
                    paintSystem: { type: Type.STRING, enum: Object.values(PaintSystem), description: "レイヤーの塗料系統。ユーザー指定の系統と一致させること。" },
                    finish: { type: Type.STRING, enum: ['gloss', 'matte', 'semi-gloss', 'velvet'], description: "レイヤーの塗料の仕上がり。" },
                    mixData: {
                        type: Type.OBJECT,
                        properties: {
                            paints: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        code: { type: Type.STRING, description: "利用可能な塗料リストにある製品コード。" },
                                        ratio: { type: Type.INTEGER, description: "混合比率(%)。合計で100になるように調整。" }
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
            description: "最終仕上げのトップコートレイヤー。不要な場合はnull。",
            nullable: true,
            properties: {
                coats: { type: Type.INTEGER, description: "吹付回数の目安 (1-10)。" },
                type: { type: Type.STRING, enum: [PaintType.CLEAR], description: "トップコートは必ずクリアータイプ。" },
                paintSystem: { type: Type.STRING, enum: Object.values(PaintSystem), description: "トップコートの塗料系統。ユーザー指定の系統と一致させること。" },
                finish: { type: Type.STRING, enum: ['gloss', 'matte', 'semi-gloss'], description: "ユーザーが指定したトップコートの仕上がり。" },
                mixData: {
                    type: Type.OBJECT,
                    properties: {
                         paints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    code: { type: Type.STRING, description: "利用可能な塗料リストにある製品コード。" },
                                    ratio: { type: Type.INTEGER, description: "100%単体で使用。" }
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
            description: "レシピで使用したすべての商品名（例: GSIクレオス 水性ホビーカラー ホワイト (H1)）のリスト。",
            items: { type: Type.STRING }
        },
        recipeText: {
            type: Type.STRING,
            description: "人間が読むための、ステップバイステップの詳細な日本語の塗装手順解説。HTMLタグは含めないプレーンテキストで、改行を適切に使用すること。"
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
- **使用する塗料系統: ${conditions.paintSystem}** (この系統の塗料のみを使用してください)

# あなたが利用可能な塗料リスト (指定された「${conditions.paintSystem}」系統のみ)
${simplifiedPaints}

# 指示
1. **レシピの考案**: ユーザーの希望条件を最優先し、目標の色と質感を再現する最も効果的なレシピを構築してください。下地の色から始まり、本塗装の各レイヤー（調色が必要な場合はその比率も）、そして最終的なトップコートまでを考慮します。
2. **JSON出力**: 考案したレシピを、指定されたJSONスキーマに厳密に従って構造化データとして出力してください。特に'mixData'には、使用する塗料の'code'と'ratio'を正確に含めてください。'paintSystem'は必ずユーザー指定の「${conditions.paintSystem}」にしてください。
3. **解説文の作成**: 'recipeText'には、なぜそのレシピを提案したのか、各工程のポイント、注意点などを、専門的かつ初心者にも分かりやすく解説してください。
`;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        },
      });

      const parsedResult: ParsedRecipe = JSON.parse(response.text.trim());
      return parsedResult;
  } catch (error) {
    console.error("Error fetching or parsing recipe from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`AIからのレシピ取得または解析中にエラーが発生しました: ${error.message}`);
    }
    throw new Error("AIからのレシピ取得中に不明なエラーが発生しました。");
  }
};

export const getNewPaintInfo = async (paintNameQuery: string, availablePaints: Paint[]): Promise<Omit<Paint, 'amazonUrl' | 'rakutenUrl'>> => {
    if (!process.env.API_KEY) {
        throw new Error("APIキーが設定されていません。");
    }

    const simplifiedPaints = availablePaints.map(p => `${p.name} (${p.code})`).join(', ');

    const paintInfoSchema = {
        type: Type.OBJECT,
        properties: {
            brand: { type: Type.STRING, enum: Object.values(Brand), description: "塗料のブランド名 (例: GSIクレオス, ガイアノーツ)" },
            series: { type: Type.STRING, description: "製品シリーズ名 (例: Mr.カラーGX, 水性ホビーカラー)。該当しない場合はnull", nullable: true },
            name: { type: Type.STRING, description: "塗料の正式な製品名 (例: クールホワイト, Ex-クリアー)" },
            code: { type: Type.STRING, description: "製品コード (例: GX1, H1, N1)。不明な場合は'N/A'とする。" },
            hex: { type: Type.STRING, description: "塗料の色を表すHEXコード (例: #ffffff)。クリアー系の場合は#ffffffとする。" },
            type: { type: Type.STRING, enum: Object.values(PaintType), description: "塗料のタイプ (通常色, メタリック, パール, クリアー)。" },
            paintSystem: { type: Type.STRING, enum: Object.values(PaintSystem), description: "塗料の系統 (ラッカー, 水性, アクリジョン)。" },
            finish: { type: Type.STRING, enum: ['gloss', 'matte', 'semi-gloss', 'velvet'], description: "塗料のデフォルトの仕上がり (光沢, つや消し, 半光沢, ベルベット)。" },
        },
        required: ["brand", "series", "name", "code", "hex", "type", "paintSystem", "finish"]
    };

    const prompt = `
    あなたは塗料データベースのエキスパートです。ユーザーが入力した塗料名「${paintNameQuery}」について、その詳細情報を調べて、指定されたJSONスキーマに従って出力してください。
    インターネット上の情報を検索し、最も正確な情報を返してください。特に製品コード、HEX値、塗料系統は正確性が重要です。
    ただし、既存の塗料リストにある製品コードと重複しないようにしてください。
    既存の塗料リスト: ${simplifiedPaints}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: paintInfoSchema,
            },
        });
        
        const paintInfo = JSON.parse(response.text.trim());
        // Gemini may return null for series, ensure it's converted to undefined
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
