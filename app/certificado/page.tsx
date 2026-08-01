"use client";

import React, { useState, useRef, useCallback, lazy, Suspense } from "react";
import Image from "next/image";
import { Download, PenTool, X, Eye, EyeOff } from "lucide-react";
import SignaturePad from "./components/SignaturePad";
import { jsPDF } from "jspdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DotField = lazy(() => import("@/components/DotField") as any);

/* ─── Certificate dimensions & positions ───────────────────── */
const CERT_W = 2000;
const CERT_H = 1414;
const NAME_Y_PCT = 0.435;
const SIG_Y_PCT = 0.815;
const SIG_X_PCT = 0.5;

/* ─── Page ─────────────────────────────────────────────────── */
export default function CertificadoPage() {
  const [step, setStep] = useState<"form" | "cert">("form");

  // Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  // Signature
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showSigModal, setShowSigModal] = useState(false);

  /* ─── phone mask ───────────────────────────────────────── */
  const formatPhone = (val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) return;
    setStep("cert");
  };

  const handleSignatureConfirm = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    setShowSigModal(false);
  };

  /* ─── Export PDF ───────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = CERT_W;
    canvas.height = CERT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw template
    const tpl = new window.Image();
    tpl.crossOrigin = "anonymous";
    tpl.src = "/certificado-template.png";
    await new Promise<void>((r) => { tpl.onload = () => r(); tpl.onerror = () => r(); });
    ctx.drawImage(tpl, 0, 0, CERT_W, CERT_H);

    // 2. Student name
    ctx.fillStyle = "#1a1423";
    const nameLength = name.trim().length;
    let canvasFontSize = 32;
    if (nameLength > 24) canvasFontSize = 26;
    if (nameLength > 34) canvasFontSize = 22;
    ctx.font = `700 ${canvasFontSize}px 'Montserrat', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.toUpperCase(), CERT_W / 2, CERT_H * NAME_Y_PCT);

    // 3. Student signature
    if (signatureUrl) {
      const sig = new window.Image();
      sig.crossOrigin = "anonymous";
      sig.src = signatureUrl;
      await new Promise<void>((r) => { sig.onload = () => r(); sig.onerror = () => r(); });
      const sw = 220, sh = 70;
      ctx.drawImage(sig, CERT_W * SIG_X_PCT - sw / 2, CERT_H * SIG_Y_PCT - sh / 2, sw, sh);
      ctx.fillStyle = "#4c1d95";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText(
        "Assinatura do Aluno",
        CERT_W * SIG_X_PCT,
        CERT_H * SIG_Y_PCT + sh / 2 + 20
      );
    }

    // 4. Create PDF and add Canvas image
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificado_Kalidash_${name.replace(/\s+/g, "_")}.pdf`);
  }, [name, signatureUrl]);

  /* ═══════════════════════════════════════════════════════════
     STEP 1 — Login (layout Asaas: hero left + form right)
     ═══════════════════════════════════════════════════════════ */
  if (step === "form") {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-white">
        {/* ── Left hero panel ── */}
        <div className="relative w-full lg:w-[48%] min-h-[220px] lg:min-h-screen bg-[#0c0818] overflow-hidden flex flex-col justify-end p-6 lg:p-12">
          {/* Background image — robot hand */}
          <div className="absolute inset-0">
            <Image
              src="/0177_nobg.webp"
              alt="AI Kalidash"
              fill
              className="object-cover object-[center_30%] opacity-40"
              sizes="(max-width: 1024px) 100vw, 48vw"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0818] via-[#0c0818]/70 to-transparent" />
          </div>

          {/* Hero text */}
          <div className="relative z-10 space-y-2 lg:space-y-3 max-w-md">
            <Image
              src="/kalidash_logo_header_branca.webp"
              alt="Kalidash"
              width={140}
              height={36}
              className="mb-4 lg:mb-6 w-24 lg:w-[140px] h-auto"
            />
            <h2 className="text-white text-xl lg:text-3xl font-bold leading-tight">
              Certificado de Conclusão<br />
              <span className="text-purple-400">Treinamento In-Company</span>
            </h2>
            <p className="text-white/50 text-xs lg:text-sm leading-relaxed">
              Acesse seu certificado oficial do Treinamento Corporativo de Inteligência Artificial Aplicada promovido pela Kalidash.
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-[400px] space-y-6 lg:space-y-8">
            {/* Logo (mobile shows here too since hero is smaller) */}
            <div>
              <Image
                src="/kalidash_symbol.svg"
                alt="Kalidash"
                width={44}
                height={44}
                className="mb-4 lg:mb-6 bg-black p-1.5 rounded-lg w-10 h-10 lg:w-11 lg:h-11"
              />
              <h1 className="text-lg lg:text-xl font-bold text-slate-900">
                Acesse seu certificado
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              <div>
                <label htmlFor="cert-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  id="cert-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como aparecerá no certificado"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-base md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="cert-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    id="cert-phone"
                    type={showPhone ? "text" : "password"}
                    required
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // When type=password, user types digits; when text, we format
                      if (showPhone) {
                        setPhone(formatPhone(raw));
                      } else {
                        // Only keep digits from password input
                        const digits = raw.replace(/\D/g, "").slice(0, 11);
                        setPhone(formatPhone(digits));
                      }
                    }}
                    placeholder="(31) 99999-9999"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-base md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhone(!showPhone)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim() || phone.replace(/\D/g, "").length < 10}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Acessar certificado
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     STEP 2 — Certificate viewer + DotField background
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-[#0c0818] flex flex-col items-center overflow-hidden">
      {/* DotField background (lazy loaded, behind everything) */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <DotField
          dotRadius={1.2}
          dotSpacing={18}
          cursorRadius={400}
          bulgeStrength={50}
          glowRadius={140}
          sparkle={true}
          gradientFrom="rgba(168, 85, 247, 0.45)"
          gradientTo="rgba(100, 80, 160, 0.25)"
          glowColor="transparent"
        />
      </div>

      {/* Top Bar (Back button) */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between">
        <button
          onClick={() => setStep("form")}
          className="text-white/50 text-sm font-medium hover:text-white transition-colors flex items-center gap-2"
        >
          ← Voltar
        </button>
      </div>

      {/* Content (above DotField) */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-6 pt-20 pb-32">

        {/* Elegant typography message */}
        <div className="text-center mb-8 max-w-lg mt-8 lg:mt-0">
          <h2 className="text-2xl md:text-4xl font-serif text-white/90 mb-3 tracking-wide">
            Sua Jornada Continua
          </h2>
          <p className="text-white/50 text-sm md:text-base font-light px-4">
            Confirme sua assinatura para emitir e validar seu certificado oficial do Treinamento In-Company.
          </p>
        </div>

        {/* Certificate (Centered and scaled) */}
        <div className="@container w-full max-w-[840px] relative rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-white/10 ring-1 ring-white/5">
          {/* Template image */}
          <img
            src="/certificado-template.png"
            alt="Certificado Kalidash"
            className="w-full h-auto block"
            draggable={false}
          />

          {/* Student name overlay */}
          <div
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none px-4"
            style={{ top: `${NAME_Y_PCT * 100}%`, transform: "translateY(-50%)" }}
          >
            <span
              className="font-bold text-[#1a1423] tracking-wide uppercase whitespace-nowrap"
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: name.trim().length > 34 ? "max(9px, 1.1cqw)" : name.trim().length > 24 ? "max(10px, 1.3cqw)" : "max(11px, 1.6cqw)",
              }}
            >
              {name}
            </span>
          </div>

          {/* Student signature overlay */}
          {signatureUrl && (
            <div
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: `${SIG_X_PCT * 100}%`,
                top: `${SIG_Y_PCT * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                src={signatureUrl}
                alt="Assinatura do aluno"
                className="object-contain"
                style={{ width: "11cqw", height: "3.5cqw", minWidth: "40px" }}
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA (Payment style) */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0c0818]/80 backdrop-blur-xl border-t border-white/5 p-4 md:p-6 z-30 flex justify-center pb-safe">
        <div className="w-full max-w-[840px]">
          {!signatureUrl ? (
            <button
              onClick={() => setShowSigModal(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <PenTool className="w-5 h-5" />
              Assinar Certificado
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowSigModal(true)}
                className="w-1/3 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold border border-white/10 transition-colors"
              >
                Alterar
              </button>
              <button
                onClick={handleDownload}
                className="w-2/3 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Certificado
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Signature modal */}
      {
        showSigModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-[#130e22] border border-white/10 rounded-2xl p-5 shadow-2xl">
              <button
                onClick={() => setShowSigModal(false)}
                className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-semibold text-white mb-4">Assinar certificado</h2>
              <SignaturePad onConfirm={handleSignatureConfirm} />
            </div>
          </div>
        )
      }
    </div >
  );
}
