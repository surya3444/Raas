import React from 'react';
import { MousePointer2, Square, PenTool, Upload, Trash2 } from 'lucide-react';

const MapToolbar = ({ tool, setTool, onUpload, selectedId, onDelete }) => {
    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'box', icon: Square, label: 'Box Tool' },
        { id: 'pen', icon: PenTool, label: 'Poly Tool' },
    ];

    return (
        <div className="flex flex-col gap-2 bg-[#121214]/90 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
            {/* Draw Tools */}
            {tools.map(t => (
                <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center ${
                        tool === t.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105' 
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={t.label}
                >
                    <t.icon size={20} />
                    <span className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-white/10 z-50">
                        {t.label}
                    </span>
                </button>
            ))}

            {/* Divider */}
            <div className="h-px w-full bg-white/10 my-1" />

            {/* Delete Action (Only visible when something is selected) */}
            <button
                onClick={onDelete}
                disabled={!selectedId}
                className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center ${
                    selectedId 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer' 
                    : 'text-gray-600 cursor-not-allowed opacity-50'
                }`}
                title="Delete Selected"
            >
                <Trash2 size={20} />
                <span className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-white/10 z-50">
                    Delete Selection (Del)
                </span>
            </button>

            {/* Upload Action */}
            <label className="p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer">
                <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={onUpload} 
                />
                <Upload size={20} />
                <span className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none border border-white/10 z-50">
                    Upload Map
                </span>
            </label>
        </div>
    );
};

export default MapToolbar;