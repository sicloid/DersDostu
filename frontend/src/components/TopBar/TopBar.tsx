import React from 'react';
import { Menu, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface TopBarProps {
    activeTool: string;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTool, brushSize, onBrushSizeChange }) => {
    return (
        <div className="h-14 w-full bg-white border-b border-gray-200 flex items-center px-4 justify-between z-40 shadow-sm/50">

            {/* Left: Menu & Title */}
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-slate-700">
                    <Menu className="w-6 h-6" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-2 select-none">
                    <span className="text-xl font-bold text-blue-600 tracking-tight">AutoDraw</span>
                    <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest hidden sm:block">CLONE</span>
                </div>
            </div>

            {/* Center: AI Suggestions (Placeholder) */}
            <div className="flex-1 flex justify-center items-center px-8">
                {activeTool === "auto-pen" ? (
                    <div className="flex items-center gap-2 overflow-x-auto max-w-lg scrollbar-hide py-1">
                        <span className="text-xs text-slate-400 whitespace-nowrap mr-2">Bunu mu demek istediniz?</span>
                        {/* Mock Suggestions */}
                        <button className="h-8 min-w-[32px] hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded flex items-center justify-center transition-all">
                            <div className="w-5 h-5 border-2 border-slate-800 rounded-full" />
                        </button>
                        <button className="h-8 min-w-[32px] hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded flex items-center justify-center transition-all">
                            <div className="w-5 h-5 border-2 border-slate-800" />
                        </button>
                        <button className="h-8 min-w-[32px] hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded flex items-center justify-center transition-all">
                            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-slate-800" />
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-slate-300 font-medium tracking-wider">Çizim yapmaya başlayın</div>
                )}
            </div>

            {/* Right: Brush Size Slider (Only for Drawing Tools) */}
            <div className="w-48 flex items-center justify-end gap-3">
                {['pencil', 'auto-pen', 'eraser'].includes(activeTool) && (
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={brushSize}
                            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                            className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="w-4 h-4 rounded-full bg-slate-800" />
                    </div>
                )}
            </div>
        </div>
    );
};
