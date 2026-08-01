"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  onConfirm: (dataUrl: string) => void;
}

export default function SignaturePad({ onConfirm }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    setHasDrawn(false);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) e.stopPropagation();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && "touches" in e) e.stopPropagation();
    setIsDrawing(false);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || historyRef.current.length === 0) return;
    const last = historyRef.current.pop()!;
    ctx.putImageData(last, 0, 0);
    if (historyRef.current.length === 0) setHasDrawn(false);
  };

  const clear = () => initCanvas();

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    onConfirm(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-4">
      {/* Workspace */}
      <div className="relative bg-[#fafafa] rounded-xl overflow-hidden shadow-inner border-[3px] border-white/5">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-44 cursor-crosshair touch-none select-none"
          style={{ touchAction: "none" }}
        />
        {/* Guide line */}
        <div className="absolute bottom-8 left-6 right-6 border-b-2 border-slate-200 pointer-events-none" />

        {!hasDrawn && (
          <span className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-sm pointer-events-none px-4 text-center">
            Desenhe sua rubrica / assinatura no espaço acima
          </span>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-white/40 font-light">
          Desenho obrigatório
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={undo}
            disabled={!hasDrawn}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Desfazer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Desfazer
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasDrawn}
            className="text-white/40 hover:text-rose-400 disabled:opacity-20 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Limpar"
          >
            <Eraser className="w-3.5 h-3.5" /> Limpar
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!hasDrawn}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 mt-4 cursor-pointer"
      >
        <Check className="w-5 h-5" />
        Aplicar Assinatura
      </button>
    </div>
  );
}
