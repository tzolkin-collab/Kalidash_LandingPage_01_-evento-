"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, RotateCcw, Check, User } from "lucide-react";

interface SignaturePadProps {
  initialName?: string;
  onConfirm: (data: { name: string; signatureUrl: string }) => void;
}

export default function SignaturePad({ initialName = "", onConfirm }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fullName, setFullName] = useState(initialName);
  const [enableRubric, setEnableRubric] = useState(false);
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
    if (enableRubric) {
      initCanvas();
    }
  }, [enableRubric, initCanvas]);

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
    if (!fullName.trim()) return;
    const canvas = canvasRef.current;
    const sigUrl = (enableRubric && hasDrawn && canvas) ? canvas.toDataURL("image/png") : "";
    onConfirm({
      name: fullName.trim(),
      signatureUrl: sigUrl,
    });
  };

  const isFormValid = fullName.trim().length >= 3;

  return (
    <div className="space-y-4">
      {/* Nome Completo Input (Mandatory) */}
      <div>
        <label htmlFor="sig-fullname" className="block text-xs font-medium text-white/70 mb-1.5 ml-0.5">
          Nome Completo <span className="text-purple-400">*</span>
        </label>
        <div className="relative">
          <input
            id="sig-fullname"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Como aparecerá no certificado"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all pl-10"
          />
          <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        </div>
      </div>

      {/* Checkbox for Rubric */}
      <div className="pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-white/80">
          <input
            type="checkbox"
            checked={enableRubric}
            onChange={(e) => setEnableRubric(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
          />
          Incluir rubrica / assinatura desenhada
        </label>
      </div>

      {/* Signature Canvas (Shown only when checkbox is checked) */}
      {enableRubric && (
        <div className="space-y-2 pt-1 transition-all">
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
              className="w-full h-36 cursor-crosshair touch-none select-none"
              style={{ touchAction: "none" }}
            />
            <div className="absolute bottom-6 left-6 right-6 border-b-2 border-slate-200 pointer-events-none" />

            {!hasDrawn && (
              <span className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium text-xs md:text-sm pointer-events-none px-4 text-center">
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
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!isFormValid}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 mt-3 cursor-pointer"
      >
        <Check className="w-5 h-5" />
        Aplicar no Certificado
      </button>
    </div>
  );
}
