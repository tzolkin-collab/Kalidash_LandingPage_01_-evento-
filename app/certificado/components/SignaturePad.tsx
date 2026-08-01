"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, RotateCcw, Check, PenTool, Type } from "lucide-react";

interface SignaturePadProps {
  onConfirm: (dataUrl: string, mode: "assinatura" | "rubrica") => void;
}

export default function SignaturePad({ onConfirm }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [method, setMethod] = useState<"draw" | "type">("draw");
  const [penColor] = useState("#000000");
  const [typedText, setTypedText] = useState("");
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

  useEffect(() => { initCanvas(); }, [method, initCanvas]);

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
    ctx.strokeStyle = penColor;
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
    if (method === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onConfirm(canvas.toDataURL("image/png"), "assinatura");
    } else {
      if (!typedText.trim()) return;
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 160;
      const ctx = c.getContext("2d")!;
      ctx.font = "italic 52px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = penColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, 300, 80);
      onConfirm(c.toDataURL("image/png"), "assinatura");
    }
  };

  return (
    <div className="space-y-6 mt-2">
      {/* Method toggle - Cleaner Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setMethod("draw")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            method === "draw"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <PenTool className="w-4 h-4" /> Desenhar
        </button>
        <button
          onClick={() => setMethod("type")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            method === "type"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <Type className="w-4 h-4" /> Digitar
        </button>
      </div>

      {/* Workspace */}
      {method === "draw" ? (
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
                Assine no espaço acima
              </span>
            )}
          </div>

          <div className="flex items-center justify-end px-1">
            <div className="flex gap-3">
              <button onClick={undo} disabled={!hasDrawn} className="text-white/40 hover:text-white disabled:opacity-20 transition-colors flex items-center gap-1.5 text-xs font-medium" title="Desfazer">
                <RotateCcw className="w-3.5 h-3.5" /> Desfazer
              </button>
              <button onClick={clear} disabled={!hasDrawn} className="text-white/40 hover:text-rose-400 disabled:opacity-20 transition-colors flex items-center gap-1.5 text-xs font-medium" title="Limpar">
                <Eraser className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Seu nome para assinatura</label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-white/20"
            />
          </div>
          
          <div className="relative bg-[#fafafa] rounded-xl flex items-center justify-center h-32 shadow-inner border-[3px] border-white/5 overflow-hidden">
            {!typedText ? (
              <span className="text-slate-300 text-sm font-medium">Pré-visualização</span>
            ) : (
              <span 
                className="text-4xl italic text-center px-4 break-words" 
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#000000" }}
              >
                {typedText}
              </span>
            )}
            <div className="absolute bottom-6 left-6 right-6 border-b-2 border-slate-200 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={method === "draw" ? !hasDrawn : !typedText.trim()}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 mt-4"
      >
        <Check className="w-5 h-5" />
        Aplicar Assinatura
      </button>
    </div>
  );
}
