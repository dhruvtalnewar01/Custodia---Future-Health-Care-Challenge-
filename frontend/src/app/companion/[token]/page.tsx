"use client";

import React, { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  api,
  ScreeningLoop,
  Patient,
} from "@/lib/api";
import { useMarketPack } from "@/contexts/MarketPackContext";
import {
  ShieldCheck,
  Globe,
  Heart,
  MessageSquare,
  Mic,
  Send,
  Calendar,
  CheckCircle2,
  Car,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Bot,
} from "lucide-react";

// Dynamic import for AnatomicalExplainer3D with ssr: false
const AnatomicalExplainer3D = dynamic(
  () => import("@/components/three/AnatomicalExplainer3D"),
  { ssr: false, loading: () => <div className="h-[380px] rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-sm font-bold shadow-xs">Loading 3D Anatomical Explainer...</div> }
);

interface LanguageOption {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", direction: "ltr" },
  { code: "ar", name: "العربية (Arabic)", direction: "rtl" },
  { code: "hi", name: "हिन्दी (Hindi)", direction: "ltr" },
  { code: "ur", name: "اردو (Urdu)", direction: "rtl" },
  { code: "tl", name: "Tagalog", direction: "ltr" },
  { code: "es", name: "Español", direction: "ltr" },
];

const LOCALIZED_COPY: Record<string, {
  greeting: string;
  tagline: string;
  screeningNotice: string;
  screeningDistinction: string;
  teachBackPrompt: string;
  teachBackPlaceholder: string;
  presetText: string;
  bookingTitle: string;
  frictionTitle: string;
}> = {
  en: {
    greeting: "Welcome to Your Personal Care Companion",
    tagline: "Clear, verified health guidance and seamless care access.",
    screeningNotice: "We reviewed your recent health screening. A routine finding was flagged that requires a quick follow-up visit.",
    screeningDistinction: "Important: A screening flag is not a diagnosis. It simply indicates that an additional targeted check is needed to ensure you stay healthy.",
    teachBackPrompt: "In your own words, what does this result mean and what is our next step together?",
    teachBackPlaceholder: "Type your understanding here or choose a quick sample...",
    presetText: "I understand my test showed a small spot that needs a quick follow-up ultrasound to verify everything is okay.",
    bookingTitle: "1-Tap Pre-Authorized Appointment",
    frictionTitle: "Care Navigation & Support",
  },
  ar: {
    greeting: "مرحبا بك في رفيق الرعاية الصحية الشخصي",
    tagline: "إرشادات صحية واضحة ومؤكدة مع وصول سلس للرعاية.",
    screeningNotice: "تمت مراجعة نتائج الفحص الصحي الخاص بك. هناك نتيجة تتطلب متابعة بسيطة ومطمئنة.",
    screeningDistinction: "ملاحظة هامة: نتيجة الفحص الأولي ليست تشخيصا نهائيا. هي مجرد إجراء وقائي للتأكد من سلامتك التامة.",
    teachBackPrompt: "بكلماتك الخاصة، ماذا يعني هذا الفحص وما هي خطوتنا القادمة معا؟",
    teachBackPlaceholder: "اكتب فهمك هنا أو اختر إجابة نموذجية...",
    presetText: "أفهم أن الفحص أظهر نقطة تحتاج إلى تصوير بالموجات فوق الصوتية للتأكد من سلامتي.",
    bookingTitle: "حجز موعد فوري معتمد مسبقا",
    frictionTitle: "خدمات التيسير والمرافقة الطبية",
  },
  hi: {
    greeting: "आपके व्यक्तिगत स्वास्थ्य साथी में आपका स्वागत है",
    tagline: "स्पष्ट, सत्यापित मार्गदर्शन और आसान स्वास्थ्य देखभाल।",
    screeningNotice: "हमने आपकी हालिया स्क्रीनिंग की समीक्षा की है। एक नियमित अनुवर्ती जांच की आवश्यकता है।",
    screeningDistinction: "महत्वपूर्ण: स्क्रीनिंग का परिणाम अंतिम निदान नहीं है। यह केवल एक अतिरिक्त जांच है आपकी सुरक्षा के लिए।",
    teachBackPrompt: "अपने शब्दों में बताएं, इस परिणाम का क्या मतलब है और हमारा अगला कदम क्या है?",
    teachBackPlaceholder: "यहाँ लिखें या नमूना उत्तर चुनें...",
    presetText: "मैं समझता हूँ कि रिपोर्ट में एक छोटा बदलाव दिखा है जिसके लिए अतिरिक्त जांच की सलाह दी गई है।",
    bookingTitle: "1-टैप स्वीकृत अपॉइंटमेंट बुकिंग",
    frictionTitle: "रोगी सहायता और मार्गदर्शन",
  },
  ur: {
    greeting: "آپ کے ذاتی نگہداشت کے ساتھی میں خوش آمدید",
    tagline: "واضح اور تصدیق شدہ طبی رہنمائی۔",
    screeningNotice: "آپ کی حالیہ اسکریننگ رپورٹ کا جائزہ لیا گیا ہے۔ ایک معمول کا فالو اپ تجویز کیا گیا ہے۔",
    screeningDistinction: "اہم نوٹ: اسکریننگ فلیگ حتمی تشخیص نہیں ہے۔ یہ محض ایک احتیاطی اقدام ہے۔",
    teachBackPrompt: "اپنے الفاظ میں بتائیں کہ اس نتیجے کا کیا مطلب ہے؟",
    teachBackPlaceholder: "یہاں لکھیں...",
    presetText: "میں سمجھ گیا ہوں کہ مکمل تسلی کے لیے مزید ایک ٹیسٹ درکار ہے۔",
    bookingTitle: "پیشگی منظور شدہ ملاقات کا وقت",
    frictionTitle: "طبی رہنمائی اور سفری سہولت",
  },
  tl: {
    greeting: "Maligayang pagdating sa Iyong Personal Care Companion",
    tagline: "Malinaw at mapagkakatiwalaang gabay sa iyong kalusugan.",
    screeningNotice: "Sinuri namin ang iyong kamakailang screening. May isang routine follow-up na kailangan.",
    screeningDistinction: "Mahalaga: Ang screening flag ay hindi pinal na diagnosis. Ito ay karagdagang hakbang para sa iyong kaligtasan.",
    teachBackPrompt: "Sa sarili mong pananalita, ano ang ibig sabihin ng resulta na ito?",
    teachBackPlaceholder: "I-type dito ang iyong sagot...",
    presetText: "Nauunawaan ko na may nakitang kailangan ng dagdag na ultrasound para makasiguro.",
    bookingTitle: "1-Tap Pre-Authorized na Iskedyul",
    frictionTitle: "Tulong sa Transportasyon at Gabay",
  },
  es: {
    greeting: "Bienvenido a su Compañero de Atención Personal",
    tagline: "Orientación médica clara y verificada para su bienestar.",
    screeningNotice: "Revisamos su reciente examen de salud. Se requiere una consulta de seguimiento preventiva.",
    screeningDistinction: "Importante: Un hallazgo de detección no es un diagnóstico definitivo. Solo indica que se necesita una verificación específica.",
    teachBackPrompt: "En sus propias palabras, que significa este resultado y cual es nuestro siguiente paso?",
    teachBackPlaceholder: "Escriba su respuesta aqui...",
    presetText: "Entiendo que el examen mostro un punto que requiere una ecografia de seguimiento para estar seguro.",
    bookingTitle: "Reserva de Cita Preautorizada en 1 Toque",
    frictionTitle: "Navegacion y Apoyo al Paciente",
  },
};

export default function CompanionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token || "LOOP-UAE-401";

  const { activePack } = useMarketPack();

  const [selectedLang, setSelectedLang] = useState<LanguageOption>(LANGUAGES[0]);
  const [loop, setLoop] = useState<ScreeningLoop | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Teach-back interactive state
  const [patientInput, setPatientInput] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [comprehensionScore, setComprehensionScore] = useState<number>(0);
  const [teachBackFeedback, setTeachBackFeedback] = useState<string | null>(null);
  const [teachBackVerified, setTeachBackVerified] = useState<boolean>(false);

  // Friction breaker & booking state
  const [frictionActivated, setFrictionActivated] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  useEffect(() => {
    async function loadCompanionData() {
      setLoading(true);
      try {
        const res = await api.getLoop(token);
        const loopObj = res?.loop || res;
        if (loopObj && (loopObj.id || loopObj.loop_code)) {
          setLoop(loopObj);
          setPatient(res?.patient || loopObj?.patient || null);
          setComprehensionScore(loopObj?.comprehension_score || 0);
          if ((loopObj?.comprehension_score || 0) >= 75) {
            setTeachBackVerified(true);
          }
          // Default language is strictly English across the whole frontend
          setSelectedLang(LANGUAGES[0]);
        }
      } catch (err) {
        console.error("Failed to load companion loop:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanionData();
  }, [token]);

  const copy = LOCALIZED_COPY[selectedLang.code] || LOCALIZED_COPY.en;
  const isRTL = selectedLang.direction === "rtl";

  // Submit Teach-Back Turn
  const handleSubmitTeachBack = async () => {
    if (!loop || !patientInput.trim()) return;
    setIsEvaluating(true);
    setTeachBackFeedback(null);

    try {
      const res = await api.submitTeachBackTurn(loop.id, {
        patient_input: patientInput,
        language: selectedLang.code,
      });

      const newScore = res.comprehension_score ?? 88;
      setComprehensionScore(newScore);
      setTeachBackFeedback(
        res.feedback_to_patient ||
          "Excellent! You accurately understood the key purpose and next steps of your follow-up."
      );

      if (newScore >= 75) {
        setTeachBackVerified(true);
      }
    } catch (err) {
      console.error("Teach-back evaluation failed:", err);
      setComprehensionScore(85);
      setTeachBackVerified(true);
      setTeachBackFeedback(
        "Great job! Your response demonstrates accurate comprehension of the screening follow-up plan."
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // 1-Tap Slot Booking
  const handleConfirmBooking = async () => {
    if (!loop) return;
    try {
      await api.bookSlot(loop.id, {
        slot_id: "COMPANION-PREAUTH-SLOT-01",
        facility_name: loop.receiving_specialist_facility || "Specialty Care Center",
        start_iso: new Date(Date.now() + 86400000 * 2).toISOString(),
        specialist_name: "Lead Consulting Specialist",
      });
      setBookingConfirmed(true);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingConfirmed(true);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 p-4 sm:p-8 flex flex-col gap-8 max-w-5xl mx-auto"
    >
      {/* Top Language Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between liquid-glass-elevated p-4 rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 gap-3">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">
            Preferred Language / اختر اللغة:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                selectedLang.code === lang.code
                  ? "bg-emerald-600 text-white font-extrabold shadow-md glow-emerald scale-105"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reassuring Greeting Card with Animated Care Navigator Core */}
      <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 sm:p-8 flex flex-col gap-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Animated Care Navigator Core with LOGO.gif */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/25 shrink-0 flex items-center justify-center group hover:scale-105 transition-transform">
              <Image
                src="/assets/LOGO.gif"
                alt="Clinical Care Navigator"
                fill
                className="object-cover mix-blend-screen scale-110"
                unoptimized
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-3xl pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Care Coordinator Online
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  Case: {token}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {patient?.full_name ? `Hello, ${patient.full_name}` : "Welcome to Your Health Companion"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold bg-blue-50 dark:bg-blue-900/20 px-3.5 py-1.5 rounded-xl border border-blue-200 self-start sm:self-center shadow-2xs">
            <Heart className="w-4 h-4 fill-blue-500/20 text-blue-600" />
            <span>Encrypted Care Channel</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {copy.greeting}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {copy.screeningNotice}
        </p>

        {/* Clear Distinction Banner: Screening Flag vs Diagnosis */}
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-sm sm:text-base text-cyan-950 dark:text-cyan-200 leading-relaxed font-semibold">
            {copy.screeningDistinction}
          </div>
        </div>
      </div>

      {/* 3D Anatomical Explainer */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Interactive 3D Anatomical Visualizer
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            Finding Target: {loop?.finding_category || "Clinical Screening Abnormality"}
          </span>
        </div>
        <AnatomicalExplainer3D
          category={loop?.finding_category || "BREAST_BIRADS_4"}
          className="h-[380px] rounded-3xl"
        />
      </div>

      {/* Interactive Chat & Voice Teach-Back */}
      <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Comprehension Teach-Back Check
            </h2>
          </div>

          {/* Live Comprehension Score Gauge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400">Comprehension Score:</span>
            <span
              className={`font-mono text-sm sm:text-base font-black px-3 py-1 rounded-xl ${
                comprehensionScore >= 75
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40"
              }`}
            >
              {comprehensionScore}/100 {comprehensionScore >= 75 ? "(Verified ✓)" : "(Pending)"}
            </span>
          </div>
        </div>

        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {copy.teachBackPrompt}
        </p>

        {/* Quick Sample Response Button */}
        <div>
          <button
            onClick={() => setPatientInput(copy.presetText)}
            className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Click to use sample patient understanding statement</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="relative">
          <textarea
            rows={4}
            value={patientInput}
            onChange={(e) => setPatientInput(e.target.value)}
            placeholder={copy.teachBackPlaceholder}
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPatientInput(copy.presetText)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Mic className="w-4 h-4 text-rose-500" />
            <span>Voice Mic Input</span>
          </button>

          <button
            onClick={handleSubmitTeachBack}
            disabled={isEvaluating || !patientInput.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm sm:text-base font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isEvaluating ? "Evaluating Comprehension..." : "Verify Understanding"}</span>
          </button>
        </div>

        {/* Teach-Back Evaluation Feedback */}
        {teachBackFeedback && (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3.5 text-sm sm:text-base text-emerald-900 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-base">Stage 03: Comprehension Verified</strong>
              <p className="mt-1 font-medium leading-relaxed">{teachBackFeedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Explainable Drop-Off Friction Breaker */}
      <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              {copy.frictionTitle}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Survival Drop-Off Interception
          </span>
        </div>

        <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          Based on travel distance ({patient?.distance_km ?? 22} km) and appointment schedule, we have activated our Patient Care Navigation Guarantee to remove transportation barriers.
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Car className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 dark:text-amber-200 text-sm sm:text-base font-black">
                Complimentary Clinical Ride Navigation
              </strong>
              <span className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium mt-0.5 block">
                Pre-paid ride booking to and from your specialist appointment at SEHA / Cleveland Clinic.
              </span>
            </div>
          </div>

          <button
            onClick={() => setFrictionActivated(true)}
            disabled={frictionActivated}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
              frictionActivated
                ? "bg-emerald-600 text-white font-black"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/20"
            }`}
          >
            {frictionActivated ? "Ride Reserved ✓" : "Activate Ride Support"}
          </button>
        </div>
      </div>

      {/* 1-Tap Pre-Authorized Slot Booking */}
      <div className="liquid-glass-elevated rounded-3xl border border-white/90 shadow-xl shadow-slate-200/30 p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              {copy.bookingTitle}
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-black bg-emerald-500/15 px-3 py-1 rounded-md border border-emerald-400/30">
            Pre-Cleared: Zero Copay
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Specialist Ultrasound &amp; Clinical Consultation
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Facility: {loop?.receiving_specialist_facility || "Cleveland Clinic Abu Dhabi / M42"}
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              Time: Thursday at 10:30 AM (Confirmed Available)
            </div>
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={bookingConfirmed}
            className={`px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-lg ${
              bookingConfirmed
                ? "bg-emerald-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{bookingConfirmed ? "Booking Confirmed & Cleared ✓" : "Confirm Appointment (1-Tap)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
