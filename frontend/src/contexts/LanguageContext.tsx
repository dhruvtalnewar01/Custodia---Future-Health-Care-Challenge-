"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageCode =
  | "en"
  | "ar"
  | "hi"
  | "es"
  | "ur"
  | "tl"
  | "fr"
  | "de"
  | "zh"
  | "ja"
  | "ru"
  | "pt";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "US" },
  { code: "ar", name: "Arabic", nativeName: "Arabic", dir: "ltr", flag: "AE" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", flag: "IN" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "ES" },
  { code: "ur", name: "Urdu", nativeName: "Urdu", dir: "ltr", flag: "PK" },
  { code: "tl", name: "Tagalog", nativeName: "Filipino", dir: "ltr", flag: "PH" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "FR" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "DE" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "CN" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "JP" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "RU" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", flag: "BR" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    system_title: "CUSTODIA",
    system_subtitle: "Autonomous Clinical Custody & Loop-Closure Platform",
    command_center: "Command Center",
    clinical_intake: "Clinical Intake",
    workstation: "Workstation",
    referrals: "Referral Clearinghouse",
    companion: "Patient Companion",
    ledger: "Cryptographic Ledger",
    active_role: "Active Persona",
    market_pack: "Jurisdiction Pack",
    time_warp: "SLA Time Warp",
    live_status: "SYSTEM ACTIVE",
    switch_persona: "Switch Clinical Persona",
    realtime: "Realtime (0h)",
    fast_forward: "Fast Forward",
    active_loops: "Active Custody Loops",
    tier1_critical: "T1 Critical (<2h)",
    sla_breaches: "SLA Breaches",
    closure_rate: "Closure Rate",
    intercept_now: "Intercept Case",
    order_stat: "Order STAT Prerequisite",
    proof_of_closure: "Proof-of-Closure Release",
    verified_chain: "RFC 8785 Immutable Chain",
    language: "Language",
    patient_portal: "Patient Care Portal",
    nurse_navigator: "Nurse Navigator Oversight",
    specialist_inbox: "Specialist Inbound Cards",
    pcp_desk: "Primary Care Intake Desk",
  },
  ar: {
    system_title: "CUSTODIA",
    system_subtitle: "Autonomous Clinical Custody & Care Loop Platform",
    command_center: "Command Center",
    clinical_intake: "Clinical Intake",
    workstation: "Clinical Workstation",
    referrals: "Referral Clearinghouse",
    companion: "Personal Care Companion",
    ledger: "Cryptographic Audit Ledger",
    active_role: "Active Persona",
    market_pack: "Jurisdiction Pack",
    time_warp: "SLA Time Warp Simulator",
    live_status: "SYSTEM ACTIVE",
    switch_persona: "Switch Persona",
    realtime: "Realtime (0h)",
    fast_forward: "Fast Forward",
    active_loops: "Active Custody Loops",
    tier1_critical: "Tier 1 Critical (<2h)",
    sla_breaches: "SLA Breaches",
    closure_rate: "Closure Rate",
    intercept_now: "Intercept Case",
    order_stat: "Order STAT Prerequisite",
    proof_of_closure: "Dual-Key Proof of Closure",
    verified_chain: "RFC 8785 Immutable Chain",
    language: "Language",
    patient_portal: "Patient Care Portal",
    nurse_navigator: "Care Navigator Oversight",
    specialist_inbox: "Specialist Inbound Cards",
    pcp_desk: "Primary Care Desk",
  },
  hi: {
    system_title: "कस्टोडिया",
    system_subtitle: "स्वायत्त नैदानिक हिरासत और देखभाल लूप-समापन प्लेटफॉर्म",
    command_center: "कमांड सेंटर",
    clinical_intake: "क्लिनिकल इंटेक",
    workstation: "क्लिनिकल वर्कस्टेशन",
    referrals: "रेफरल क्लियरिंगहाउस",
    companion: "रोगी साथी",
    ledger: "क्रिप्टोग्राफिक लेज़र",
    active_role: "सक्रिय भूमिका",
    market_pack: "क्षेत्रीय नियम पैक",
    time_warp: "एसएलए टाइम ताना",
    live_status: "सिस्टम सक्रिय है",
    switch_persona: "भूमिका बदलें",
    realtime: "वास्तविक समय (0 घंटे)",
    fast_forward: "फास्ट फॉरवर्ड",
    active_loops: "सक्रिय लूप",
    tier1_critical: "टीयर 1 गंभीर (<2 घंटे)",
    sla_breaches: "समय उल्लंघन",
    closure_rate: "समापन दर",
    intercept_now: "तुरंत हस्तक्षेप करें",
    order_stat: "आवश्यक टेस्ट ऑर्डर करें",
    proof_of_closure: "प्रमाण-आधारित समापन",
    verified_chain: "आरएफसी 8785 अपरिवर्तनीय श्रृंखला",
    language: "भाषा",
    patient_portal: "रोगी देखभाल पोर्टल",
    nurse_navigator: "नर्स नेविगेटर",
    specialist_inbox: "विशेषज्ञ परामर्श",
    pcp_desk: "प्राथमिक देखभाल डेस्क",
  },
  es: {
    system_title: "CUSTODIA",
    system_subtitle: "Plataforma Autónoma de Custodia Clínica y Cierre de Ciclos de Atención",
    command_center: "Centro de Comando",
    clinical_intake: "Admisión Clínica",
    workstation: "Estación de Trabajo",
    referrals: "Cámara de Referencias",
    companion: "Compañero del Paciente",
    ledger: "Libro Criptográfico",
    active_role: "Rol Activo",
    market_pack: "Paquete Jurisdiccional",
    time_warp: "Simulador de Tiempo SLA",
    live_status: "SISTEMA ACTIVO",
    switch_persona: "Cambiar Rol Clínico",
    realtime: "Tiempo Real (0h)",
    fast_forward: "Avance Rápido",
    active_loops: "Casos de Custodia Activos",
    tier1_critical: "Nivel 1 Crítico (<2h)",
    sla_breaches: "Infracciones de SLA",
    closure_rate: "Tasa de Cierre",
    intercept_now: "Interceptar Caso",
    order_stat: "Ordenar Prerrequisito STAT",
    proof_of_closure: "Liberación de Cierre Criptográfico",
    verified_chain: "Cadena Inmutable RFC 8785",
    language: "Idioma",
    patient_portal: "Portal del Paciente",
    nurse_navigator: "Navegación de Enfermería",
    specialist_inbox: "Bandeja del Especialista",
    pcp_desk: "Recepción de Atención Primaria",
  },
  ur: {
    system_title: "CUSTODIA",
    system_subtitle: "Autonomous Clinical Custody & Care Loop Platform",
    command_center: "Command Center",
    clinical_intake: "Clinical Intake",
    workstation: "Clinical Workstation",
    referrals: "Referral Clearinghouse",
    companion: "Personal Care Companion",
    ledger: "Cryptographic Audit Ledger",
    active_role: "Active Persona",
    market_pack: "Jurisdiction Pack",
    time_warp: "SLA Time Warp Simulator",
    live_status: "SYSTEM ACTIVE",
    switch_persona: "Switch Persona",
    realtime: "Realtime (0h)",
    fast_forward: "Fast Forward",
    active_loops: "Active Custody Loops",
    tier1_critical: "Tier 1 Critical (<2h)",
    sla_breaches: "SLA Breaches",
    closure_rate: "Closure Rate",
    intercept_now: "Intercept Case",
    order_stat: "Order STAT Prerequisite",
    proof_of_closure: "Dual-Key Proof of Closure",
    verified_chain: "RFC 8785 Immutable Chain",
    language: "Language",
    patient_portal: "Patient Care Portal",
    nurse_navigator: "Care Navigator Oversight",
    specialist_inbox: "Specialist Inbound Cards",
    pcp_desk: "Primary Care Desk",
  },
  tl: {
    system_title: "CUSTODIA",
    system_subtitle: "Autonomous Clinical Custody & Care Loop-Closure Platform",
    command_center: "Command Center",
    clinical_intake: "Pagtanggap ng Rekord",
    workstation: "Estasyon ng Trabaho",
    referrals: "Clearinghouse ng Referral",
    companion: "Kasama ng Pasyente",
    ledger: "Cryptographic Ledger",
    active_role: "Aktibong Tungkulin",
    market_pack: "Batas ng Rehiyon",
    time_warp: "SLA Time Simulator",
    live_status: "AKTIBO ANG SISTEMA",
    switch_persona: "Palitan ang Tungkulin",
    realtime: "Realtime (0 oras)",
    fast_forward: "Pabilisin ang Oras",
    active_loops: "Aktibong Kaso",
    tier1_critical: "Tier 1 Kritikal (<2h)",
    sla_breaches: "Paglabag sa SLA",
    closure_rate: "Porsyento ng Pagkakasara",
    intercept_now: "Agad na Aksyunan",
    order_stat: "Mag-order ng STAT Test",
    proof_of_closure: "Pagpapatunay ng Pagkakasara",
    verified_chain: "RFC 8785 Blockchain",
    language: "Wika",
    patient_portal: "Portal ng Pasyente",
    nurse_navigator: "Tagapamahala ng Nurse",
    specialist_inbox: "Inbox ng Espesyalista",
    pcp_desk: "Desk ng Pangunahing Pangangalaga",
  },
  fr: {
    system_title: "CUSTODIA",
    system_subtitle: "Système de Custodie Clinique et Clôture Autonome des Soins",
    command_center: "Centre de Commande",
    clinical_intake: "Admission Clinique",
    workstation: "Poste de Travail",
    referrals: "Centre d'Aiguillage",
    companion: "Compagnon Patient",
    ledger: "Registre Cryptographique",
    active_role: "Rôle Actif",
    market_pack: "Pack Juridictionnel",
    time_warp: "Accélérateur Temporel SLA",
    live_status: "SYSTÈME ACTIF",
    switch_persona: "Changer de Rôle",
    realtime: "Temps Réel (0h)",
    fast_forward: "Avance Rapide",
    active_loops: "Boucles Actives",
    tier1_critical: "Niveau 1 Critique (<2h)",
    sla_breaches: "Violations SLA",
    closure_rate: "Taux de Clôture",
    intercept_now: "Intercepter le Dossier",
    order_stat: "Commander Examen Requis",
    proof_of_closure: "Preuve de Clôture Double-Clé",
    verified_chain: "Chaîne Immuable RFC 8785",
    language: "Langue",
    patient_portal: "Portail Patient",
    nurse_navigator: "Navigation Infirmière",
    specialist_inbox: "Boîte du Spécialiste",
    pcp_desk: "Poste de Médecine Générale",
  },
  de: {
    system_title: "CUSTODIA",
    system_subtitle: "Autonomes Klinisches Verwahrungs- und Betreuungsabschluss-Betriebssystem",
    command_center: "Kommandozentrale",
    clinical_intake: "Klinische Aufnahme",
    workstation: "Arbeitsplatz",
    referrals: "Überweisungsstelle",
    companion: "Patientenbegleiter",
    ledger: "Kryptografisches Hauptbuch",
    active_role: "Aktive Rolle",
    market_pack: "Zuständigkeitspaket",
    time_warp: "SLA-Zeitsimulator",
    live_status: "SYSTEM AKTIV",
    switch_persona: "Rolle Wechseln",
    realtime: "Echtzeit (0h)",
    fast_forward: "Zeitraffer",
    active_loops: "Aktive Behandlungszyklen",
    tier1_critical: "Stufe 1 Kritisch (<2h)",
    sla_breaches: "SLA-Verletzungen",
    closure_rate: "Abschlussquote",
    intercept_now: "Fall Abfangen",
    order_stat: "STAT-Untersuchung Anordnen",
    proof_of_closure: "Zwei-Schlüssel-Abschlussnachweis",
    verified_chain: "Unveränderliche Kette RFC 8785",
    language: "Sprache",
    patient_portal: "Patientenportal",
    nurse_navigator: "Pflegekoordination",
    specialist_inbox: "Facharzt-Eingang",
    pcp_desk: "Hausarzt-Schreibtisch",
  },
  zh: {
    system_title: "CUSTODIA",
    system_subtitle: "自主临床闭环与监护闭环操作系统",
    command_center: "临床指挥中心",
    clinical_intake: "临床文档接入",
    workstation: "临床工作台",
    referrals: "转诊清算中心",
    companion: "患者随行助手",
    ledger: "加密审计账本",
    active_role: "当前角色",
    market_pack: "监管规则包",
    time_warp: "SLA时间推进器",
    live_status: "系统实时在线",
    switch_persona: "切换临床角色",
    realtime: "实时 (0小时)",
    fast_forward: "快进模拟",
    active_loops: "活跃闭环案例",
    tier1_critical: "一级紧急 (<2小时)",
    sla_breaches: "SLA超时预警",
    closure_rate: "闭环达成率",
    intercept_now: "立即干预拦截",
    order_stat: "急加必备检查",
    proof_of_closure: "双钥加密闭环认证",
    verified_chain: "RFC 8785不可变区块链",
    language: "界面语言",
    patient_portal: "患者护理门户",
    nurse_navigator: "护士导航总览",
    specialist_inbox: "专科医生收件箱",
    pcp_desk: "全科初级诊疗台",
  },
  ja: {
    system_title: "CUSTODIA",
    system_subtitle: "自律型臨床カストディ＆ケア完了オペレーティングシステム",
    command_center: "コマンドセンター",
    clinical_intake: "臨床ドキュメント受付",
    workstation: "臨床ワークステーション",
    referrals: "紹介ハブ清算所",
    companion: "患者コンパニオン",
    ledger: "暗号化監査台帳",
    active_role: "現在のアクティブロール",
    market_pack: "管轄法規パック",
    time_warp: "SLAタイムワープ",
    live_status: "システム稼働中",
    switch_persona: "ペルソナ切り替え",
    realtime: "リアルタイム (0時間)",
    fast_forward: "時間高速進行",
    active_loops: "稼働中ループ",
    tier1_critical: "ティア1 緊急 (<2時間)",
    sla_breaches: "SLA違反",
    closure_rate: "ループ完了率",
    intercept_now: "即座に介入",
    order_stat: "必須検査の至急オーダー",
    proof_of_closure: "二重鍵完了証明",
    verified_chain: "RFC 8785改ざん防止台帳",
    language: "言語設定",
    patient_portal: "患者ポータル",
    nurse_navigator: "看護ナビゲーター",
    specialist_inbox: "専門医受信トレイ",
    pcp_desk: "総合診療デスク",
  },
  ru: {
    system_title: "CUSTODIA",
    system_subtitle: "Автономная Платформа Клинического Контроля и Завершения Циклов Лечения",
    command_center: "Командный Центр",
    clinical_intake: "Клинический Прием",
    workstation: "Рабочая Станция",
    referrals: "Клиринговая Палата Направлений",
    companion: "Помощник Пациента",
    ledger: "Криптографический Реестр",
    active_role: "Текущая Роль",
    market_pack: "Регуляторный Пакет",
    time_warp: "Симулятор Времени SLA",
    live_status: "СИСТЕМА АКТИВНА",
    switch_persona: "Сменить Роль",
    realtime: "Реальное Время (0ч)",
    fast_forward: "Ускорение Времени",
    active_loops: "Активные Циклы",
    tier1_critical: "Уровень 1 Критический (<2ч)",
    sla_breaches: "Нарушения SLA",
    closure_rate: "Доля Завершения",
    intercept_now: "Перехватить Случай",
    order_stat: "Назначить Срочный Тест",
    proof_of_closure: "Двухключевое Подтверждение Закрытия",
    verified_chain: "Неизменяемый Блокчейн RFC 8785",
    language: "Язык",
    patient_portal: "Портал Пациента",
    nurse_navigator: "Медсестринская Координация",
    specialist_inbox: "Входящие Специалиста",
    pcp_desk: "Стол Первичного Звена",
  },
  pt: {
    system_title: "CUSTODIA",
    system_subtitle: "Plataforma Autônoma de Custódia Clínica e Fechamento de Ciclo de Cuidado",
    command_center: "Centro de Comando",
    clinical_intake: "Admissão Clínica",
    workstation: "Estação de Trabalho",
    referrals: "Câmara de Encaminhamentos",
    companion: "Acompanhante do Paciente",
    ledger: "Livro-Razão Criptográfico",
    active_role: "Função Ativa",
    market_pack: "Pacote de Jurisdição",
    time_warp: "Acelerador de Tempo SLA",
    live_status: "SISTEMA ATIVO",
    switch_persona: "Mudar de Perfil",
    realtime: "Tempo Real (0h)",
    fast_forward: "Avanço Rápido",
    active_loops: "Casos Ativos",
    tier1_critical: "Nível 1 Crítico (<2h)",
    sla_breaches: "Violações de SLA",
    closure_rate: "Taxa de Fechamento",
    intercept_now: "Interceptar Caso",
    order_stat: "Solicitar Pré-requisito STAT",
    proof_of_closure: "Liberação de Fechamento com Chave Dupla",
    verified_chain: "Cadeia Imutável RFC 8785",
    language: "Idioma",
    patient_portal: "Portal do Paciente",
    nurse_navigator: "Navegação de Enfermagem",
    specialist_inbox: "Caixa do Especialista",
    pcp_desk: "Mesa de Atenção Primária",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  direction: "ltr" | "rtl";
  t: (key: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  direction: "ltr",
  t: (k: string) => k,
  languages: SUPPORTED_LANGUAGES,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const saved = localStorage.getItem("custodia-language") as LanguageCode | null;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
      const info = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
      const dir = info?.dir || "ltr";
      setDirection(dir);
      document.documentElement.dir = dir;
      document.documentElement.lang = saved;
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("custodia-language", lang);
    const info = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    const dir = info?.dir || "ltr";
    setDirection(dir);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        direction,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
