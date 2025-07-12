import React from 'react';

interface GeneratedRecipeProps {
    recipeText: string | null;
    isLoading: boolean;
    error: string | null;
}

const GeneratedRecipe: React.FC<GeneratedRecipeProps> = ({ recipeText, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-md text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
                <p className="text-slate-300">AIが最適なレシピを考案中です。少々お待ちください...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded-md">
                <p className="font-bold">エラー</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (!recipeText) {
        return null; // Don't render anything if there's no recipe yet
    }

    return (
        <div className="p-4 bg-slate-900 rounded-md prose prose-invert prose-p:my-1.5 prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-sky-400 max-w-none">
            <h3 className="text-lg font-bold text-sky-400">AIによる塗装レシピ提案</h3>
            <div className="whitespace-pre-wrap">{recipeText}</div>
        </div>
    );
};

export default GeneratedRecipe;