
import React, { useState } from 'react';
import { SavedProject } from '../types';
import SaveIcon from './icons/SaveIcon';
import LoadIcon from './icons/LoadIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ProjectManagerProps {
    projects: SavedProject[];
    onSave: (name: string) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onSave, onLoad, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [newProjectName, setNewProjectName] = useState('');
    
    const handleSaveClick = () => {
        onSave(newProjectName);
        setNewProjectName('');
    };

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg">
            <button 
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <h2 className="text-xl font-bold text-slate-300">プロジェクト管理 (保存/読込)</h2>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
                <div className="p-6 pt-0 space-y-6">
                    {/* Save Section */}
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h3 className="text-md font-bold text-slate-200 mb-3">現在のレイヤー構成を保存</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="プロジェクト名を入力 (例: シャア専用ザク)"
                                className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button 
                                onClick={handleSaveClick}
                                disabled={!newProjectName.trim()}
                                className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                <SaveIcon className="w-5 h-5"/>
                                保存
                            </button>
                        </div>
                    </div>

                    {/* Load Section */}
                    <div className="space-y-3">
                        <h3 className="text-md font-bold text-slate-200">保存済みプロジェクト</h3>
                        {projects.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {projects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => (
                                    <li key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-700 p-3 rounded-md">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-200">{project.name}</p>
                                            <p className="text-xs text-slate-400">
                                                保存日時: {new Date(project.createdAt).toLocaleString('ja-JP')}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                            <button onClick={() => onLoad(project.id)} className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-teal-200 bg-teal-800 rounded-md hover:bg-teal-700 transition-colors" title="読み込む">
                                                <LoadIcon className="w-4 h-4" />
                                                読込
                                            </button>
                                            <button onClick={() => onDelete(project.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="削除">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-4 text-slate-500 bg-slate-900/50 rounded-lg">
                                <p>保存されたプロジェクトはありません。</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;
