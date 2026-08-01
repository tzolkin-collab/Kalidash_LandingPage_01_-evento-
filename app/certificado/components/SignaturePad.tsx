"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, RotateCcw, Check, PenTool, Type } from "lucide-react";

interface SignaturePadProps {
  userName: string;
  onConfirm: (dataUrl: string, mode: "assinatura" | "rubrica") => void;
}

export default function SignaturePad({ userName, onConfirm }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [useTextSignature, setUseTextSignature] = useState(false);
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
    if (!useTextSignature) {
      initCanvas();
    }
  }, [useTextSignature, initCanvas]);

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
    if (useTextSignature) {
      const textToUse = userName.trim() || "Assinatura Aluno";
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 160;
      const ctx = c.getContext("2d")!;
      ctx.font = "italic 48px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textToUse, 300, 80);
      onConfirm(c.toDataURL("image/png"), "assinatura");
    } else {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onConfirm(canvas.toDataURL("image/png"), "rubrica");
    }
  };

  return (
    <div className="space-y-5 mt-2">
      {/* Option toggle */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setUseTextSignature(false)}
          className={`flex-1 py-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            !useTextSignature
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <PenTool className="w-4 h-4" /> Desenhar Rubrica
        </button>
        <button
          type="button"
          onClick={() => setUseTextSignature(true)}
          className={`flex-1 py-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            useTextSignature
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <Type className="w-4 h-4" /> Usar Meu Nome
        </button>
      </div>

      {/* Workspace */}
      {!useTextSignature ? (
        <div className="space-y-3">
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
              className="w-full h-40 cursor-crosshair touch-none select-none"
              style={{ touchAction: "none" }}
            />
            {/* Guide line */}
            <div className="absolute bottom-8 left-6 right-6 border-b-2 border-slate-200 pointer-events-none" />
            
            {!hasDrawn && (
              <span className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-sm pointer-events-none">
                Desenhe sua rubrica no espaço acima
              </span>
            )}
          </div>

          <div className="flex items-center justify-end px-1">
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
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative bg-[#fafafa] rounded-xl flex flex-col items-center justify-center h-40 shadow-inner border-[3px] border-white/5 overflow-hidden p-4 text-center">
            <span className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              Assinatura impressa
            </span>
            <span 
              className="text-3xl md:text-4xl italic text-slate-900 tracking-tight px-4 leading-normal" 
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {userName.trim() || "Seu Nome"}
            </span>
            <div className="absolute bottom-6 left-6 right-6 border-b-2 border-slate-200 pointer-events-none" />
          </div>
          <p className="text-xs text-white/40 text-center font-light">
            Seu nome preenchido na entrada será formatado como assinatura oficial.
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!useTextSignature && !hasDrawn}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 mt-4 cursor-pointer"
      >
        <Check className="w-5 h-5" />
        Aplicar Assinatura
      </button>
    </div>
  );
}
