import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { EventsOn } from '../../../wailsjs/runtime/runtime';
import { StartDictation, StopDictation } from '../../../wailsjs/go/speech/SpeechService';

interface CanvasProps {
    activeTool: string;
    brushColor?: string;
    brushSize?: number;
}

interface Selection {
    x: number;
    y: number;
    width: number;
    height: number;
    imageData: ImageData | null;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

interface TextInput {
    x: number;
    y: number;
    text: string;
    color: string;
    fontSize: number;
}

interface TextBox {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    color: string;
    fontSize: number;
}

export interface CanvasHandle {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    getDataUrl: () => string;
    loadDataUrl: (url: string) => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ activeTool, brushColor = '#000000', brushSize = 4 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // For selection UI
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // History management for undo/redo
    const [historyStack, setHistoryStack] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const maxHistoryDepth = 30; // Optimized for 4GB RAM systems

    // Selection tool state
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [isDraggingSelection, setIsDraggingSelection] = useState(false);
    const [isResizingSelection, setIsResizingSelection] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasBackground, setCanvasBackground] = useState<ImageData | null>(null); // Store canvas state without selection
    const handleSize = 20; // Touch-friendly handle size (increased for easier clicking)

    // Text tool state - Paint-style textbox
    const [isDrawingTextBox, setIsDrawingTextBox] = useState(false);
    const [textBoxStart, setTextBoxStart] = useState({ x: 0, y: 0 });
    const [textBox, setTextBox] = useState<TextBox | null>(null);
    const textBoxRef = useRef<HTMLTextAreaElement>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Legacy single-line text (keeping for reference, will be replaced)
    const [textInput, setTextInput] = useState<TextInput | null>(null);
    const textInputRef = useRef<HTMLInputElement>(null);



    // Save current canvas state to history
    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');

        setHistoryStack(prev => {
            // Remove any "future" history if we're not at the end
            const newStack = prev.slice(0, historyIndex + 1);

            // Add current state
            newStack.push(dataUrl);

            // Limit history depth
            if (newStack.length > maxHistoryDepth) {
                newStack.shift(); // Remove oldest
                return newStack;
            }

            return newStack;
        });

        setHistoryIndex(prev => {
            const newIndex = prev + 1;
            return newIndex >= maxHistoryDepth ? maxHistoryDepth - 1 : newIndex;
        });
    };

    useImperativeHandle(ref, () => ({
        undo: () => {
            if (historyIndex <= 0) return; // Nothing to undo

            const prevIndex = historyIndex - 1;
            const prevState = historyStack[prevIndex];

            if (prevState && canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    const img = new Image();
                    img.src = prevState;
                    img.onload = () => {
                        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                        context.fillStyle = '#ffffff';
                        context.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                        context.drawImage(img, 0, 0);
                    };
                }
            }

            setHistoryIndex(prevIndex);
        },
        redo: () => {
            if (historyIndex >= historyStack.length - 1) return; // Nothing to redo

            const nextIndex = historyIndex + 1;
            const nextState = historyStack[nextIndex];

            if (nextState && canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    const img = new Image();
                    img.src = nextState;
                    img.onload = () => {
                        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                        context.fillStyle = '#ffffff';
                        context.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                        context.drawImage(img, 0, 0);
                    };
                }
            }

            setHistoryIndex(nextIndex);
        },
        clear: () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            if (canvas && context) {
                saveToHistory(); // Save before clearing
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
        },
        getDataUrl: () => canvasRef.current?.toDataURL('image/png') || '',
        loadDataUrl: (url: string) => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            if (canvas && context) {
                saveToHistory(); // Save before loading
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(img, 0, 0);
                };
            }
        }
    }));

    // Initialize canvas ONLY on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        if (!canvas || !overlayCanvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerHeight;

        const context = canvas.getContext('2d');
        if (context) {
            // Fill white background ONLY on initial mount
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.lineCap = 'round';
            contextRef.current = context;
        }

        const handleResize = () => {
            // On resize, preserve existing content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.drawImage(canvas, 0, 0);

                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                overlayCanvas.width = window.innerWidth;
                overlayCanvas.height = window.innerHeight;

                const context = canvas.getContext('2d');
                if (context) {
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(tempCanvas, 0, 0);
                    context.lineCap = 'round';
                    contextRef.current = context;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Run only once on mount

    // Separate effect for updating brush properties without clearing canvas
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.lineWidth = brushSize;
            contextRef.current.strokeStyle = brushColor;
        }
    }, [brushSize, brushColor]);

    // Helper: Get resize handle at position
    const getResizeHandleAtPos = (x: number, y: number, sel: Selection): ResizeHandle => {
        if (!sel) return null;
        const handles = [
            { type: 'nw' as ResizeHandle, x: sel.x, y: sel.y },
            { type: 'n' as ResizeHandle, x: sel.x + sel.width / 2, y: sel.y },
            { type: 'ne' as ResizeHandle, x: sel.x + sel.width, y: sel.y },
            { type: 'e' as ResizeHandle, x: sel.x + sel.width, y: sel.y + sel.height / 2 },
            { type: 'se' as ResizeHandle, x: sel.x + sel.width, y: sel.y + sel.height },
            { type: 's' as ResizeHandle, x: sel.x + sel.width / 2, y: sel.y + sel.height },
            { type: 'sw' as ResizeHandle, x: sel.x, y: sel.y + sel.height },
            { type: 'w' as ResizeHandle, x: sel.x, y: sel.y + sel.height / 2 },
        ];

        for (const handle of handles) {
            if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
                return handle.type;
            }
        }
        return null;
    };

    // Helper: Check if point is inside selection
    const isPointInSelection = (x: number, y: number, sel: Selection | null): boolean => {
        if (!sel) return false;
        return x >= sel.x && x <= sel.x + sel.width && y >= sel.y && y <= sel.y + sel.height;
    };

    // Helper: Draw selection UI on overlay canvas
    const drawSelection = (sel: Selection | null) => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext('2d');
        if (!ctx) return;

        // ALWAYS clear the overlay first!
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (!sel) return; // Nothing to draw

        ctx.save();

        // Draw dashed border
        ctx.strokeStyle = '#3B82F6'; // Blue
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);
        ctx.setLineDash([]);

        // Draw resize handles (larger for touch)
        const handleDisplaySize = 20; // Larger visual size
        const handles = [
            { x: sel.x, y: sel.y },
            { x: sel.x + sel.width / 2, y: sel.y },
            { x: sel.x + sel.width, y: sel.y },
            { x: sel.x + sel.width, y: sel.y + sel.height / 2 },
            { x: sel.x + sel.width, y: sel.y + sel.height },
            { x: sel.x + sel.width / 2, y: sel.y + sel.height },
            { x: sel.x, y: sel.y + sel.height },
            { x: sel.x, y: sel.y + sel.height / 2 },
        ];

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        handles.forEach(h => {
            ctx.fillRect(h.x - handleDisplaySize / 2, h.y - handleDisplaySize / 2, handleDisplaySize, handleDisplaySize);
            ctx.strokeRect(h.x - handleDisplaySize / 2, h.y - handleDisplaySize / 2, handleDisplaySize, handleDisplaySize);
        });

        ctx.restore();
    };

    // Helper: Update main canvas with background + selection imageData
    const updateMainCanvas = (sel: Selection | null, bg: ImageData | null) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        if (!bg) return; // No background to draw

        // Clear and draw background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(bg, 0, 0);

        // Draw selection imageData if present
        if (sel && sel.imageData) {
            ctx.putImageData(sel.imageData, sel.x, sel.y);
        }
    };

    // Redraw selection UI when selection changes
    useEffect(() => {
        drawSelection(selection);
        // Also update main canvas to show the imageData
        if (selection && canvasBackground) {
            updateMainCanvas(selection, canvasBackground);
        }
    }, [selection]);

    // Auto-focus text input when created
    useEffect(() => {
        if (textInput && textInputRef.current) {
            console.log('🔍 Forcing focus on text input');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                textInputRef.current?.focus();
            }, 10);
        }
    }, [textInput]);

    // Auto-focus textbox when created
    useEffect(() => {
        if (textBox && textBoxRef.current) {
            console.log('🔍 Focusing textbox textarea');
            setTimeout(() => textBoxRef.current?.focus(), 10);
        }
    }, [textBox]);

    // Initialize Offline STT (Vosk) via Wails Events
    useEffect(() => {
        // Listen for final transcription result
        const offSpeechText = EventsOn('speech-text', (text: string) => {
            console.log('🎤 Vosk Final Received:', text);
            setTextBox(prev => {
                if (!prev) {
                    console.warn('⚠️ Vosk Final: No active textbox to update!');
                    return prev;
                }
                console.log('📝 Updating textbox text. Current length:', prev.text.length);
                // Check if current text already ends with a space
                const separator = prev.text.endsWith(' ') || prev.text === '' ? '' : ' ';
                return { ...prev, text: prev.text + separator + text };
            });
        });

        // Listen for backend start signal
        const offSpeechStarted = EventsOn('speech-started', () => {
            console.log('🎤 STT Backend started, syncing state');
            setIsListening(true);
        });

        // Listen for partial transcription update
        const offSpeechPartial = EventsOn('speech-partial', (partial: string) => {
            console.log('🎤 Vosk Partial:', partial);
        });

        // Listen for Voice Commands
        const offVoiceCommand = EventsOn('voice-command', (data: any) => {
            console.log('🗣️ Voice Command received:', data);

            if (data.action === 'canvas-clear') {
                const canvas = canvasRef.current;
                const ctx = contextRef.current;
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    saveToHistory();
                }
            }
        });

        // Listen for backend stop signal (auto-sync state)
        const offSpeechStopped = EventsOn('speech-stopped', () => {
            console.log('🛑 STT Backend stopped, syncing state');
            setIsListening(false);
        });

        return () => {
            offSpeechText();
            offSpeechPartial();
            offVoiceCommand();
            offSpeechStopped();
            offSpeechStarted();
        };
    }, []); // Register once, use functional updates

    // Helper: Render text to canvas
    const renderTextToCanvas = (textData: TextInput) => {
        const ctx = contextRef.current;
        if (!ctx || !textData.text.trim()) return;

        ctx.save();
        ctx.font = `${textData.fontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.fillStyle = textData.color;
        ctx.textBaseline = 'top';
        ctx.fillText(textData.text, textData.x, textData.y);
        ctx.restore();

        saveToHistory();
        // Note: setTextInput(null) is now handled by the input's event handlers
    };

    // Helper: Render multi-line textbox to canvas
    const renderTextBoxToCanvas = (box: TextBox) => {
        const ctx = contextRef.current;
        if (!ctx || !box.text.trim()) return;

        console.log('🎨 Rendering textbox to canvas:', box.text);

        const lines = box.text.split('\n');
        const lineHeight = box.fontSize * 1.3;

        ctx.save();
        ctx.font = `${box.fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = box.color;
        ctx.textBaseline = 'top';

        lines.forEach((line, i) => {
            const y = box.y + (i * lineHeight);
            // Only render lines that fit within box height
            if (y + lineHeight <= box.y + box.height) {
                ctx.fillText(line, box.x, y);
            }
        });

        ctx.restore();
        saveToHistory();
    };


    const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
        const { offsetX, offsetY } = nativeEvent;

        if (activeTool === 'select') {
            // Selection tool logic
            if (selection) {
                // Check if clicking on resize handle
                const handle = getResizeHandleAtPos(offsetX, offsetY, selection);
                if (handle) {
                    setIsResizingSelection(true);
                    setResizeHandle(handle);
                    return;
                }

                // Check if clicking inside selection to drag
                if (isPointInSelection(offsetX, offsetY, selection)) {
                    setIsDraggingSelection(true);
                    setDragOffset({
                        x: offsetX - selection.x,
                        y: offsetY - selection.y
                    });
                    return;
                }

                // Clicking outside selection - deselect and paste
                if (selection.imageData) {
                    const ctx = contextRef.current;
                    if (ctx) {
                        ctx.putImageData(selection.imageData, selection.x, selection.y);
                    }
                }
                setSelection(null);
            }

            // Start new selection
            setIsSelecting(true);
            setSelectionStart({ x: offsetX, y: offsetY });
            return;
        }

        if (activeTool === 'text') {
            // Paint-style textbox: Start dragging to define box dimensions
            console.log('🎨 Starting textbox drag at:', offsetX, offsetY);
            setIsDrawingTextBox(true);
            setTextBoxStart({ x: offsetX, y: offsetY });
            setLastMousePos({ x: offsetX, y: offsetY });
            return;
        }

        // Regular drawing tools
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        // Text tool: Create textarea with dragged dimensions
        if (activeTool === 'text' && isDrawingTextBox) {
            setIsDrawingTextBox(false);

            const width = Math.abs(lastMousePos.x - textBoxStart.x);
            const height = Math.abs(lastMousePos.y - textBoxStart.y);
            const x = Math.min(textBoxStart.x, lastMousePos.x);
            const y = Math.min(textBoxStart.y, lastMousePos.y);

            // Minimum size check
            if (width > 30 && height > 20) {
                console.log('📦 Creating textbox:', { x, y, width, height });
                setTextBox({
                    x,
                    y,
                    width,
                    height,
                    text: '',
                    color: brushColor,
                    fontSize: brushSize * 4
                });
            } else {
                console.log('⚠️ Textbox too small, cancelled');
            }

            // Clear overlay preview
            const overlayCtx = overlayCanvasRef.current?.getContext('2d');
            if (overlayCtx && overlayCanvasRef.current) {
                overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
            }

            return;
        }

        if (activeTool === 'select') {
            if (isSelecting) {
                // Finalize selection - extract image data
                const canvas = canvasRef.current;
                const ctx = contextRef.current;
                if (!canvas || !ctx) {
                    setIsSelecting(false);
                    return;
                }

                const width = Math.abs(selectionStart.x - lastMousePos.x);
                const height = Math.abs(selectionStart.y - lastMousePos.y);
                const x = Math.min(selectionStart.x, lastMousePos.x);
                const y = Math.min(selectionStart.y, lastMousePos.y);

                if (width > 5 && height > 5) { // Minimum selection size
                    // Extract image data from selected area
                    const imageData = ctx.getImageData(x, y, width, height);

                    // Clear the selected area (cut operation)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, y, width, height);

                    // Store background (canvas after cut)
                    setCanvasBackground(ctx.getImageData(0, 0, canvas.width, canvas.height));

                    // Store selection
                    setSelection({
                        x,
                        y,
                        width,
                        height,
                        imageData
                    });
                }

                setIsSelecting(false);
                return;
            }

            if (isDraggingSelection && selection) {
                // Finish dragging - paste image at final location and clear selection
                const ctx = contextRef.current;
                const canvas = canvasRef.current;

                if (selection.imageData && ctx && canvas && canvasBackground) {
                    // Clear everything
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw background
                    ctx.putImageData(canvasBackground, 0, 0);

                    // Paste selection at final position
                    ctx.putImageData(selection.imageData, selection.x, selection.y);

                    // Save to history
                    saveToHistory();
                }

                setIsDraggingSelection(false);
                setSelection(null);
                setCanvasBackground(null);
                return;
            }

            if (isResizingSelection && selection) {
                // Finish resizing - paste image at final size
                const ctx = contextRef.current;
                const canvas = canvasRef.current;

                if (selection.imageData && ctx && canvas && canvasBackground) {
                    // Clear everything
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw background
                    ctx.putImageData(canvasBackground, 0, 0);

                    // Paste selection (for now at original size, scaling TODO)
                    ctx.putImageData(selection.imageData, selection.x, selection.y);

                    // Save to history
                    saveToHistory();
                }

                setIsResizingSelection(false);
                setResizeHandle(null);
                setSelection(null);
                setCanvasBackground(null);
                return;
            }
            return;
        }

        // Regular drawing
        contextRef.current?.closePath();
        setIsDrawing(false);

        // Save to history after drawing action completes
        saveToHistory();
    };

    // Helper: Convert touch event to mouse-like coordinates
    const getTouchPos = (touch: React.Touch): { offsetX: number; offsetY: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        };
    };

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling/zooming
        if (e.touches.length !== 1) return; // Only single touch

        const touch = e.touches[0];
        const pos = getTouchPos(touch);

        // Create synthetic mouse event
        const syntheticEvent = {
            nativeEvent: {
                offsetX: pos.offsetX,
                offsetY: pos.offsetY
            }
        } as React.MouseEvent;

        startDrawing(syntheticEvent);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        const pos = getTouchPos(touch);

        const syntheticEvent = {
            nativeEvent: {
                offsetX: pos.offsetX,
                offsetY: pos.offsetY
            }
        } as React.MouseEvent;

        draw(syntheticEvent);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        finishDrawing();
    };

    const draw = ({ nativeEvent }: React.MouseEvent) => {
        const { offsetX, offsetY } = nativeEvent;

        // Text tool: Draw textbox rectangle preview while dragging
        if (activeTool === 'text' && isDrawingTextBox) {
            setLastMousePos({ x: offsetX, y: offsetY });

            const overlayCtx = overlayCanvasRef.current?.getContext('2d');
            if (!overlayCtx || !overlayCanvasRef.current) return;

            // Clear overlay
            overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

            // Draw dashed rectangle preview
            const width = offsetX - textBoxStart.x;
            const height = offsetY - textBoxStart.y;

            overlayCtx.save();
            overlayCtx.strokeStyle = '#3B82F6';
            overlayCtx.lineWidth = 2;
            overlayCtx.setLineDash([5, 5]);
            overlayCtx.strokeRect(textBoxStart.x, textBoxStart.y, width, height);
            overlayCtx.restore();

            console.log('📐 Textbox preview:', { width, height });
            return;
        }

        if (activeTool === 'select') {
            setLastMousePos({ x: offsetX, y: offsetY }); // Track mouse position

            const ctx = contextRef.current;
            const canvas = canvasRef.current;
            if (!ctx || !canvas) return;

            if (isSelecting) {
                // Just track position, we'll create selection on mouse up
                return;
            }

            if (isDraggingSelection && selection && canvasBackground) {
                // Redraw: background + selection at new position
                const newX = offsetX - dragOffset.x;
                const newY = offsetY - dragOffset.y;

                const updatedSelection = {
                    ...selection,
                    x: newX,
                    y: newY
                };

                // Update main canvas
                updateMainCanvas(updatedSelection, canvasBackground);

                // Update state (this will trigger overlay redraw)
                setSelection(updatedSelection);
                return;
            }

            if (isResizingSelection && selection && resizeHandle && canvasBackground) {
                // Update selection dimensions based on resize handle
                let newSelection = { ...selection };

                switch (resizeHandle) {
                    case 'nw':
                        newSelection.width += newSelection.x - offsetX;
                        newSelection.height += newSelection.y - offsetY;
                        newSelection.x = offsetX;
                        newSelection.y = offsetY;
                        break;
                    case 'n':
                        newSelection.height += newSelection.y - offsetY;
                        newSelection.y = offsetY;
                        break;
                    case 'ne':
                        newSelection.width = offsetX - newSelection.x;
                        newSelection.height += newSelection.y - offsetY;
                        newSelection.y = offsetY;
                        break;
                    case 'e':
                        newSelection.width = offsetX - newSelection.x;
                        break;
                    case 'se':
                        newSelection.width = offsetX - newSelection.x;
                        newSelection.height = offsetY - newSelection.y;
                        break;
                    case 's':
                        newSelection.height = offsetY - newSelection.y;
                        break;
                    case 'sw':
                        newSelection.width += newSelection.x - offsetX;
                        newSelection.x = offsetX;
                        newSelection.height = offsetY - newSelection.y;
                        break;
                    case 'w':
                        newSelection.width += newSelection.x - offsetX;
                        newSelection.x = offsetX;
                        break;
                }

                // Update main canvas with resized bounds (imageData stays same size for now)
                updateMainCanvas(newSelection, canvasBackground);

                setSelection(newSelection);
                return;
            }

            return;
        }

        // Regular drawing logic
        if (!isDrawing) return;

        if (activeTool === 'eraser') {
            contextRef.current!.globalCompositeOperation = 'destination-out';
            contextRef.current!.lineWidth = brushSize * 3; // Eraser is bigger
        } else if (activeTool === 'auto-pen') {
            // Auto-pen: smoother, calligraphy-style strokes
            contextRef.current!.globalCompositeOperation = 'source-over';
            contextRef.current!.lineWidth = brushSize * 0.8; // Slightly thinner
            contextRef.current!.strokeStyle = brushColor;
            contextRef.current!.lineCap = 'round';
            contextRef.current!.lineJoin = 'round';
            // Use quadratic curves for smoother lines
            const currentPos = contextRef.current!.getTransform();
            contextRef.current?.quadraticCurveTo(
                currentPos.e || offsetX,
                currentPos.f || offsetY,
                offsetX,
                offsetY
            );
        } else {
            // Regular pencil and other tools
            contextRef.current!.globalCompositeOperation = 'source-over';
            contextRef.current!.lineWidth = brushSize;
            contextRef.current!.strokeStyle = brushColor;
        }

        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{
                    cursor: activeTool === 'auto-pen' ? 'crosshair' : 'default',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    touchAction: 'none', // Disable browser touch gestures
                }}
            />
            <canvas
                ref={overlayCanvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none', // Let mouse events pass through to main canvas
                }}
            />
            {/* Paint-style Textbox */}
            {textBox && (
                <>
                    {/* Control Buttons */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${textBox.x}px`,
                            top: `${textBox.y - 42}px`,
                            display: 'flex',
                            gap: '8px',
                            zIndex: 10000,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                console.log('✅ Done button clicked - stopping STT');
                                if (textBox.text.trim()) {
                                    renderTextBoxToCanvas(textBox);
                                }
                                if (isListening) {
                                    StopDictation().catch(console.warn);
                                    setIsListening(false);
                                }
                                setTextBox(null);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}
                        >
                            ✓ Tamam
                        </button>
                        <button
                            onClick={() => {
                                console.log('❌ Cancel button clicked - stopping STT');
                                if (isListening) {
                                    StopDictation().catch(console.warn);
                                    setIsListening(false);
                                }
                                setTextBox(null);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}
                        >
                            ✕ İptal
                        </button>
                        <button
                            onClick={async () => {
                                if (isListening) {
                                    console.log('🛑 Stopping Offline STT');
                                    setIsListening(false); // Immediate feedback
                                    try {
                                        await StopDictation();
                                    } catch (err) {
                                        console.warn('⚠️ StopDictation warning:', err);
                                    }
                                } else {
                                    console.log('🎤 Starting Offline STT');
                                    try {
                                        await StartDictation();
                                        setIsListening(true);
                                    } catch (err) {
                                        console.error('❌ Failed to start STT:', err);
                                        alert('Mikrofon başlatılamadı veya Vosk hatası oluştu.');
                                        setIsListening(false);
                                    }
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: isListening ? '#10B981' : '#6B7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxShadow: isListening
                                    ? '0 2px 8px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)'
                                    : '0 2px 8px rgba(107, 114, 128, 0.4)',
                                fontFamily: 'Inter, system-ui, sans-serif',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                            }}
                        >
                            🎤 {isListening ? 'Dinleniyor...' : 'Konuş'}
                        </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textBoxRef}
                        key={`textbox-${textBox.x}-${textBox.y}`}
                        value={textBox.text}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            console.log('✍️ Typing in textbox');
                            setTextBox({ ...textBox, text: e.target.value });
                        }}
                        onKeyDown={(e) => {
                            // Ctrl+Enter or Cmd+Enter to render (for desktop users)
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                console.log('✅ Ctrl+Enter - rendering textbox');
                                console.log('✅ Finishing textbox and stopping STT');
                                renderTextBoxToCanvas(textBox);
                                if (isListening) {
                                    StopDictation().catch(console.warn);
                                    setIsListening(false);
                                }
                                setTextBox(null);
                            } else if (e.key === 'Escape') {
                                console.log('❌ Escape - canceled and stopping STT');
                                if (isListening) {
                                    StopDictation().catch(console.warn);
                                    setIsListening(false);
                                }
                                setTextBox(null);
                            }
                        }}
                        onFocus={() => console.log('🎯 Textbox focused!')}
                        placeholder="Yazın..."
                        style={{
                            position: 'absolute',
                            left: `${textBox.x}px`,
                            top: `${textBox.y}px`,
                            width: `${textBox.width}px`,
                            height: `${textBox.height}px`,
                            fontSize: `${textBox.fontSize}px`,
                            color: textBox.color,
                            backgroundColor: '#FFFFFF',
                            border: '3px solid #3B82F6',
                            borderRadius: '4px',
                            padding: '8px',
                            outline: 'none',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                            zIndex: 9999,
                            resize: 'both', // Allow users to resize textbox
                            overflow: 'auto',
                            lineHeight: '1.3',
                            minWidth: '50px',
                            minHeight: '30px',
                        }}
                    />
                </>
            )}
        </div>
    );
});
