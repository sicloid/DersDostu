"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    MousePointer2,
    Pen,
    PenTool,
    Eraser,
    Square,
    Palette,
    UserCheck,
    CheckCircle,
    Circle,
    Video,
    StopCircle,
    Undo2,
    Redo2,
    Type,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    type: "tool" | "action";
}

interface SidebarProps {
    activeTool: string;
    onToolChange: (tool: string) => void;
    onToggleAttendance: () => void;
    onEndLesson: () => void;
    isUploading: boolean;
    color: string;
    onColorChange: (color: string) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    isRecording: boolean;
    onToggleRecord: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export const Sidebar = React.memo(({
    activeTool,
    onToolChange,
    onToggleAttendance,
    onEndLesson,
    color,
    onColorChange,
    brushSize,
    onBrushSizeChange,
    isRecording,
    onToggleRecord,
    onUndo,
    onRedo,
}: SidebarProps) => {
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const [showSizePicker, setShowSizePicker] = React.useState(false);

    const tools: ToolbarItem[] = [
        {
            id: "select",
            label: "Seç",
            icon: MousePointer2,
            type: "tool",
        },
        {
            id: "pencil",
            label: "Kalem",
            icon: Pen,
            type: "tool",
        },
        {
            id: "auto-pen",
            label: "Otomatik Kalem",
            icon: PenTool,
            type: "tool",
        },
        {
            id: "eraser",
            label: "Silgi",
            icon: Eraser,
            type: "tool",
        },
        {
            id: "text",
            label: "Metin",
            icon: Type,
            type: "tool",
        },
        { id: "shapes", label: "Şekiller", icon: Square, type: "tool" },
    ];

    const colors = [
        { hex: '#EF4444', label: 'Kırmızı' },
        { hex: '#000000', label: 'Siyah' },
        { hex: '#3B82F6', label: 'Mavi' },
        { hex: '#10B981', label: 'Yeşil' },
    ];

    const brushSizes = [
        { size: 2, label: 'S' },
        { size: 6, label: 'M' },
        { size: 12, label: 'L' }
    ];

    const handleToolClick = (toolId: string) => {
        onToolChange(toolId);
    };

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "fixed left-4 top-4 z-50",
                    "bg-background border border-border rounded-xl shadow-md",
                    "flex flex-col p-2 gap-2",
                )}
            >
                {/* Tools Section */}
                <div className="flex flex-col gap-1">
                    {tools.map((tool) => (
                        <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={activeTool === (tool.id === 'pen' ? 'pencil' : tool.id) ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 transition-all duration-200",
                                        activeTool === (tool.id === 'pen' ? 'pencil' : tool.id)
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                    onClick={() => handleToolClick(tool.id)}
                                >
                                    <tool.icon className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{tool.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>

                <Separator className="bg-border" />

                {/* Attributes Section (Color & Size) */}
                <div className="flex flex-col gap-1 relative">
                    {/* Color Picker */}
                    <div className="relative">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 relative overflow-hidden hover:bg-sidebar-accent"
                                    onClick={() => {
                                        setShowColorPicker(!showColorPicker);
                                        setShowSizePicker(false);
                                    }}
                                >
                                    <Palette className="h-5 w-5" />
                                    <div
                                        className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-background shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Renk</p></TooltipContent>
                        </Tooltip>

                        <AnimatePresence>
                            {showColorPicker && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                    className="absolute left-full top-0 ml-3 p-2 bg-popover border border-border rounded-xl shadow-xl flex gap-2 z-[60]"
                                >
                                    {colors.map((c) => (
                                        <Tooltip key={c.hex}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => {
                                                        onColorChange(c.hex);
                                                        setShowColorPicker(false);
                                                    }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all duration-200 border border-border hover:scale-110",
                                                        color === c.hex ? "ring-2 ring-primary ring-offset-2" : ""
                                                    )}
                                                    style={{ backgroundColor: c.hex }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="top"><p>{c.label}</p></TooltipContent>
                                        </Tooltip>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Brush Size */}
                    <div className="relative">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 hover:bg-sidebar-accent"
                                    onClick={() => {
                                        setShowSizePicker(!showSizePicker);
                                        setShowColorPicker(false);
                                    }}
                                >
                                    <Circle className="h-5 w-5" style={{ strokeWidth: Math.max(1.5, brushSize / 2) }} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Kalınlık</p></TooltipContent>
                        </Tooltip>

                        <AnimatePresence>
                            {showSizePicker && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                    className="absolute left-full top-0 ml-3 p-2 bg-popover border border-border rounded-xl shadow-xl flex gap-2 items-center z-[60]"
                                >
                                    {brushSizes.map((b) => (
                                        <Tooltip key={b.size}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => {
                                                        onBrushSizeChange(b.size);
                                                        setShowSizePicker(false);
                                                    }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-accent",
                                                        brushSize === b.size ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <div
                                                        className="rounded-full bg-current"
                                                        style={{ width: b.size, height: b.size }}
                                                    />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top"><p>{b.label}</p></TooltipContent>
                                        </Tooltip>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <Separator className="bg-border" />

                {/* Undo/Redo Section */}
                <div className="flex flex-col gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-sidebar-accent"
                                onClick={() => onUndo?.()}
                            >
                                <Undo2 className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Geri Al (Ctrl+Z)</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-sidebar-accent"
                                onClick={() => onRedo?.()}
                            >
                                <Redo2 className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>İleri Al (Ctrl+Y)</p></TooltipContent>
                    </Tooltip>
                </div>

                <Separator className="bg-border" />

                {/* Actions Section */}
                <div className="flex flex-col gap-1">
                    {/* Record Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-10 w-10 transition-all duration-200",
                                    isRecording
                                        ? "text-destructive hover:bg-destructive/10 animate-pulse"
                                        : "hover:bg-sidebar-accent"
                                )}
                                onClick={onToggleRecord}
                            >
                                {isRecording ? <StopCircle className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>{isRecording ? "Kaydı Durdur" : "Kaydı Başlat"}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Attendance */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-sidebar-accent"
                                onClick={onToggleAttendance}
                            >
                                <UserCheck className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Yoklama</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Finish Lesson */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-sidebar-accent text-destructive hover:text-destructive"
                                onClick={onEndLesson}
                            >
                                <CheckCircle className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Dersi Bitir</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </motion.div>
        </TooltipProvider>
    );
});
