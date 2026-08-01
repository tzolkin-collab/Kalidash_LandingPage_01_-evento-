"use client";

import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import Image from "next/image";
import { Download, PenTool, X, CheckCircle2, Mail, Phone, ArrowLeft, ArrowRight } from "lucide-react";
import SignaturePad from "./components/SignaturePad";
import { jsPDF } from "jspdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DotField = lazy(() => import("@/components/DotField") as any);

const Ballpit = lazy(() => import("@/components/Ballpit"));

/* ─── Certificate dimensions & positions ───────────────────── */
const CERT_W = 2000;
const CERT_H = 1414;
const NAME_Y_PCT = 0.435;
const SIG_Y_PCT = 0.815;
const SIG_X_PCT = 0.5;

/* ─── Page ─────────────────────────────────────────────────── */
export default function CertificadoPage() {
  const [step, setStep] = useState<"form" | "cert" | "thanks">("form");

  // Form (Step 1)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Signature
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* ─── Phone mask helper ─────────────────────────────────── */
  const formatPhone = (val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || phone.replace(/\D/g, "").length < 10) return;
    setStep("cert");
  };

  const handleSignatureConfirm = (data: { name: string; signatureUrl: string }) => {
    setName(data.name);
    setSignatureUrl(data.signatureUrl);
    setHasSigned(true);
    setShowSigModal(false);
  };

  /* ─── Unified Certificate Engine ─────────────────────────── */
  const generateCertificate = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    try {
      await document.fonts.ready;
    } catch {
      // fallback if fonts API unavailable
    }
    const canvas = document.createElement("canvas");
    canvas.width = CERT_W;
    canvas.height = CERT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Draw template
    const tpl = new window.Image();
    tpl.crossOrigin = "anonymous";
    tpl.src = "/certificado-template.png";
    await new Promise<void>((r) => { tpl.onload = () => r(); tpl.onerror = () => r(); });
    ctx.drawImage(tpl, 0, 0, CERT_W, CERT_H);

    // 2. Student name
    if (name.trim()) {
      ctx.fillStyle = "#1a1423";
      const nameLength = name.trim().length;
      let canvasFontSize = 27;
      if (nameLength > 24) canvasFontSize = 22;
      if (nameLength > 34) canvasFontSize = 18;
      ctx.font = `700 ${canvasFontSize}px 'Montserrat', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name.toUpperCase(), CERT_W / 2, CERT_H * NAME_Y_PCT);
    }

    // 3. Student signature
    if (signatureUrl) {
      const sig = new window.Image();
      sig.crossOrigin = "anonymous";
      sig.src = signatureUrl;
      await new Promise<void>((r) => { sig.onload = () => r(); sig.onerror = () => r(); });
      const sw = 220, sh = 70;
      ctx.drawImage(sig, CERT_W * SIG_X_PCT - sw / 2, CERT_H * SIG_Y_PCT - sh / 2, sw, sh);
      ctx.fillStyle = "#000000";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText(
        "Assinatura do Aluno",
        CERT_W * SIG_X_PCT,
        CERT_H * SIG_Y_PCT + sh / 2 + 20
      );
    }

    const dataUrl = canvas.toDataURL("image/png");
    setPreviewUrl(dataUrl);
    return dataUrl;
  }, [name, signatureUrl]);

  useEffect(() => {
    if (step === "cert" || step === "thanks") {
      generateCertificate();
    }
  }, [step, generateCertificate]);

  /* ─── Export PDF ───────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    let imgData = previewUrl;
    if (!imgData) {
      imgData = await generateCertificate();
    }
    if (!imgData) return;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificado_Kalidash_${name.replace(/\s+/g, "_")}.pdf`);

    // Transition to thank you page after downloading
    setStep("thanks");
  }, [name, previewUrl, generateCertificate]);

  const handleDownloadAgain = useCallback(async () => {
    let imgData = previewUrl;
    if (!imgData) {
      imgData = await generateCertificate();
    }
    if (!imgData) return;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Certificado_Kalidash_${name.replace(/\s+/g, "_")}.pdf`);
  }, [name, previewUrl, generateCertificate]);

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
            {/* Logo */}
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
                <label htmlFor="cert-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    id="cert-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-base md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pl-10"
                  />
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="cert-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    id="cert-phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(31) 99999-9999"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-base md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all pl-10"
                  />
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!email.includes("@") || phone.replace(/\D/g, "").length < 10}
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
     STEP 3 — Thank You / Post-Download Page
     ═══════════════════════════════════════════════════════════ */
  if (step === "thanks") {
    return (
      <div className="relative min-h-screen bg-[#0c0818] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background Ballpit */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <Ballpit count={65} gravity={0.03} followCursor={true} />
          </Suspense>
        </div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-6 my-auto py-12">
          {/* Heading */}
          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Obrigado{name.trim() ? `, ${name.split(" ")[0]}` : ""}! 🎉
            </h1>
            <p className="text-white/60 text-base md:text-lg font-light">
              Seu certificado oficial do <span className="text-purple-400 font-medium">Treinamento In-Company Kalidash</span> foi gerado e baixado com sucesso!
            </p>
          </div>

          {/* Certificate Image Preview Card */}
          <div className="w-full max-w-[640px] relative rounded-xl overflow-hidden shadow-2xl shadow-purple-900/40 border border-white/10 ring-1 ring-white/10 my-4 bg-[#130e22]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Certificado Kalidash"
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full aspect-[2000/1414] bg-white/5 animate-pulse flex items-center justify-center text-white/40 text-sm font-medium">
                Gerando certificado...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="w-full max-w-md pt-2">
            <button
              onClick={handleDownloadAgain}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Baixar novamente
            </button>
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
      {/* DotField background (lazy loaded, behind everything, disabled when modal open) */}
      {!showSigModal && (
        <div className="fixed inset-0 z-0 pointer-events-none">
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
      )}

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

        {/* Certificate (Single Engine Canvas Preview) */}
        <div className="w-full max-w-[840px] relative rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-white/10 ring-1 ring-white/5 bg-[#130e22]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Certificado Kalidash"
              className="w-full h-auto block"
              draggable={false}
            />
          ) : (
            <div className="w-full aspect-[2000/1414] bg-white/5 animate-pulse flex items-center justify-center text-white/40 text-sm font-medium">
              Gerando certificado...
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA (Payment style) */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0c0818]/80 backdrop-blur-xl border-t border-white/5 p-4 md:p-6 z-30 flex justify-center pb-safe">
        <div className="w-full max-w-[840px]">
          {!hasSigned ? (
            <button
              onClick={() => setShowSigModal(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PenTool className="w-5 h-5" />
              Assinar Certificado
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowSigModal(true)}
                className="w-1/3 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Alterar
              </button>
              <button
                onClick={handleDownload}
                className="w-2/3 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
                Confirmar e Avançar
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
              <SignaturePad initialName={name} onConfirm={handleSignatureConfirm} />
            </div>
          </div>
        )
      }
    </div >
  );
}
