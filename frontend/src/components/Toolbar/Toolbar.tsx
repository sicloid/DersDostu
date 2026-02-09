import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Pencil,
    Eraser,
    Shapes,
    Upload,
    Settings,
    Circle, // Undo
    Square, // Prev (Placeholder)
    Triangle, // Next (Placeholder)
    ArrowLeft, ArrowRight, Undo2, // Better icons later
    Video
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ToolbarProps {
    onToolChange: (tool: string) => void;
    onUpload: () => void;
    onUndo: () => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    onToggleRecord: () => void;
    isUploading: boolean;
    isRecording: boolean;
    pageNumber: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    onToolChange,
    onUpload,
    onUndo,
    onNextPage,
    onPrevPage,
    onToggleRecord,
    isUploading,
    isRecording,
    pageNumber
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const tools = [
        { id: 'pencil', icon: Pencil, label: 'Kalem' },
        { id: 'eraser', icon: Eraser, label: 'Silgi' },
        // { id: 'shapes', icon: Shapes, label: 'Otomatik Şekil' }, // Disable Auto-Shape for now if not implemented
        { id: 'undo', icon: Circle, label: 'Geri Al', action: onUndo },
        { id: 'prev', icon: Square, label: 'Önceki', action: onPrevPage },
        { id: 'page-info', icon: () => <span className="font-bold text-lg">{pageNumber}</span>, label: 'Sayfa' }, // Custom icon for page num
        { id: 'next', icon: Triangle, label: 'Sonraki', action: onNextPage },
        { id: 'record', icon: Video, label: isRecording ? 'Durdur' : 'Kaydet', action: onToggleRecord },
        { id: 'upload', icon: Upload, label: 'Bitir', action: onUpload },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-end gap-2 p-2 rounded-2xl bg-neutral-900 border border-white/20 shadow-xl">
                {tools.map((tool, index) => {
                    const isActive = activeIndex === index;

                    return (
                        <motion.button
                            key={tool.id}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200",
                                "hover:bg-white/20 bg-white/5 text-white active:scale-95",
                                tool.id === 'record' && isRecording && "bg-red-500/20 text-red-500 animate-pulse border-red-500/50"
                            )}
                            initial={{ scale: 1 }}
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                y: isActive ? -10 : 0
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            onClick={() => {
                                if (tool.action) tool.action();
                                else onToolChange(tool.id);
                            }}
                        >
                            <tool.icon size={32} strokeWidth={1.5} />

                            {isActive && (
                                <motion.span
                                    className="absolute -top-10 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {tool.label}
                                </motion.span>
                            )}

                            {tool.id === 'upload' && isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
