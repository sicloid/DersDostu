import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useEffect } from 'react';
import { Canvas, CanvasHandle } from './components/Canvas/Canvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { UploadLesson, StartRecording, StopRecording } from '../wailsjs/go/main/App';
import { jsPDF } from 'jspdf';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
    const [activeTool, setActiveTool] = useState('pencil');
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEndLessonModal, setShowEndLessonModal] = useState(false);

    // Drawing tool states
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(6);

    // Pagination
    const [pages, setPages] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);

    const canvasRef = useRef<CanvasHandle>(null);

    const saveCurrentPage = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.getDataUrl();
            setPages(prev => {
                const newPages = [...prev];
                newPages[currentPage] = dataUrl;
                return newPages;
            });
        }
    };

    const loadPage = (pageIndex: number) => {
        // Synchronously capture current page data BEFORE any state changes
        if (canvasRef.current) {
            const currentData = canvasRef.current.getDataUrl();
            const updatedPages = [...pages];
            updatedPages[currentPage] = currentData;

            // Update state with saved data
            setPages(updatedPages);
            setCurrentPage(pageIndex);

            // Clear and load target page
            canvasRef.current.clear();

            setTimeout(() => {
                if (updatedPages[pageIndex]) {
                    canvasRef.current?.loadDataUrl(updatedPages[pageIndex]);
                } else {
                    canvasRef.current?.clear();
                }
            }, 10);
        }
    };

    const handleNextPage = () => {
        loadPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            loadPage(currentPage - 1);
        }
    };

    const handleEndLesson = async () => {
        setShowEndLessonModal(true);
        setIsUploading(true);
        setUploadProgress(10); // Start

        // Save current page
        saveCurrentPage();
        const currentData = canvasRef.current?.getDataUrl() || '';
        const finalPages = [...pages];
        finalPages[currentPage] = currentData;

        try {
            // 1. Generate PDF
            setUploadProgress(30);
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [window.innerWidth, window.innerHeight]
            });

            finalPages.forEach((pageData, index) => {
                if (index > 0) doc.addPage();
                doc.addImage(pageData, 'PNG', 0, 0, window.innerWidth, window.innerHeight);
            });

            setUploadProgress(60);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `ders-${timestamp}.pdf`;

            // 2. Call Backend Mailer
            // We use UploadLesson for now, which we will update in Backend to trigger Mailer.
            await UploadLesson(filename, pdfBase64);

            setUploadProgress(100);
            setTimeout(() => {
                setShowEndLessonModal(false);
                setIsUploading(false);
                setUploadProgress(0);
                // Notification handled by modal state
            }, 1500);

        } catch (err) {
            console.error(err);
            alert("Hata: " + err);
            setShowEndLessonModal(false);
            setIsUploading(false);
        }
    };

    const handleToggleRecord = async () => {
        if (isRecording) {
            try {
                await StopRecording();
                setIsRecording(false);
            } catch (e) {
                console.error(e);
                alert("Kayıt durdurulamadı: " + e);
            }
        } else {
            try {
                await StartRecording();
                setIsRecording(true);
            } catch (e) {
                console.error(e);
                alert("Kayıt başlatılamadı: " + e);
            }
        }
    };

    const handleToggleAttendance = () => {
        alert("Yoklama Modülü (Sonraki Aşamada Eklenecek)");
    };

    const handleColorClick = () => {
        // Now handled by Sidebar/DrawingPanel interaction if needed
        // For now, we can toggle to a specific tool or just focus
    };

    const handleToolChange = (tool: string) => {
        setActiveTool(tool);
    }

    const handleUndo = () => {
        canvasRef.current?.undo();
    };

    const handleRedo = () => {
        canvasRef.current?.redo();
    };

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z or Cmd+Z for Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for Redo
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    return (
        <TooltipProvider>
            <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
                {/* Left Sidebar */}
                {/* Left Sidebar */}
                <Sidebar
                    activeTool={activeTool}
                    onToolChange={handleToolChange}
                    onToggleAttendance={handleToggleAttendance}
                    onEndLesson={handleEndLesson}
                    isUploading={isUploading}
                    color={brushColor}
                    onColorChange={setBrushColor}
                    brushSize={brushSize}
                    onBrushSizeChange={setBrushSize}
                    isRecording={isRecording}
                    onToggleRecord={handleToggleRecord}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative">

                    {/* Canvas Area */}
                    <div className="flex-1 relative bg-white m-0 shadow-inner overflow-hidden cursor-crosshair">
                        <Canvas
                            ref={canvasRef}
                            activeTool={activeTool === 'color-picker' ? 'pencil' : activeTool}
                            brushColor={brushColor}
                            brushSize={brushSize}
                        />

                        {/* Pagination Controls - Floating Bottom Left Center */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background px-6 py-3 rounded-full shadow-md border border-border transition-all hover:scale-105">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 0}
                                        className="rounded-full hover:bg-accent disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Previous Page</TooltipContent>
                            </Tooltip>

                            <div className="flex flex-col items-center min-w-[3rem]">
                                <span className="text-sm font-bold text-foreground">Sayfa</span>
                                <span className="text-xs text-muted-foreground font-medium">{currentPage + 1}</span>
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNextPage}
                                        className="rounded-full hover:bg-accent"
                                    >
                                        <ChevronRight className="w-6 h-6 text-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Next Page</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* End Lesson Modal */}
                <AnimatePresence>
                    {showEndLessonModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-card p-8 rounded-3xl w-full max-w-md text-center shadow-2xl border border-border relative overflow-hidden"
                            >
                                {/* Background Pattern */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent" />

                                <div className="mb-6 flex justify-center">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500",
                                        uploadProgress === 100 ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                                    )}>
                                        {uploadProgress === 100 ? (
                                            <CheckCircle2 className="w-8 h-8" />
                                        ) : (
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold mb-2 text-card-foreground">
                                    {uploadProgress === 100 ? "İşlem Tamamlandı!" : "Ders Bitiriliyor"}
                                </h2>
                                <p className="text-muted-foreground mb-8">
                                    {uploadProgress < 40 && "Ders notları PDF'e dönüştürülüyor..."}
                                    {uploadProgress >= 40 && uploadProgress < 80 && "E-postalar velilere gönderiliyor..."}
                                    {uploadProgress >= 80 && uploadProgress < 100 && "Son kontroller yapılıyor..."}
                                    {uploadProgress === 100 && "Ders başarıyla sonlandırıldı."}
                                </p>

                                <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        className="h-full bg-primary rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                                    <span>İşleniyor</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    );
}

export default App;
