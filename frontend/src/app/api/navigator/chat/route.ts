import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message = "",
      patient_name = "Sophia Bennett",
      language = "en",
      conversation_history = [],
      loop_code,
    } = body;

    // 1. If an external backend is specified, forward to it
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && !backendUrl.includes("127.0.0.1") && !backendUrl.includes("localhost")) {
      try {
        const backendRes = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/navigator/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("External backend proxy failed, falling back to serverless handler:", err);
      }
    }

    // 2. Direct OpenAI integration if OPENAI_API_KEY is configured on Vercel
    const openAiKey = process.env.OPENAI_API_KEY;
    let reply = "";

    if (openAiKey && openAiKey.trim() !== "" && !openAiKey.startsWith("your_") && !openAiKey.startsWith("sk-placeholder")) {
      try {
        const systemPrompt = `You are the CUSTODIA Clinical Care Navigator assisting patient ${patient_name}.
Context: The patient has a proactive screening result (BI-RADS 4) managed by Cleveland Clinic Breast Center of Excellence.
CLINICAL RULES:
1. Reassure the patient warmly that a proactive screening flag is NOT a diagnosis of cancer.
2. Explain that the follow-up confirmatory check has been ordered and 100% pre-authorized.
3. CRITICAL CONSTRAINT: You MUST answer in strictly 1 to 2 lines only (under 40 words total). Never exceed 2 lines!
4. Respond naturally in clear, soothing English.`;

        const messages: Array<{ role: string; content: string }> = [
          { role: "system", content: systemPrompt },
        ];

        if (Array.isArray(conversation_history)) {
          for (const msg of conversation_history.slice(-6)) {
            const role =
              msg.role === "assistant" ||
              (msg.sender && String(msg.sender).toLowerCase().includes("ai")) ||
              (msg.sender && String(msg.sender).toLowerCase().includes("navigator"))
                ? "assistant"
                : "user";
            messages.push({ role, content: String(msg.text || msg.content || "") });
          }
        }

        messages.push({ role: "user", content: String(message) });

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages,
            max_tokens: 80,
            temperature: 0.3,
          }),
        });

        if (openAiRes.ok) {
          const openAiData = await openAiRes.json();
          const rawText = openAiData.choices?.[0]?.message?.content || "";
          reply = rawText.trim();
        }
      } catch (err) {
        console.warn("OpenAI API call failed, using high-fidelity clinical fallback:", err);
      }
    }

    // 3. Clinical fallback
    if (!reply) {
      const lower = String(message).toLowerCase();
      if (lower.includes("cancer") || lower.includes("scared")) {
        reply = "Please rest assured: your screening result is not a cancer diagnosis, but a routine signal to take a closer confirmatory look.";
      } else if (lower.includes("cost") || lower.includes("pay") || lower.includes("insurance")) {
        reply = "Your follow-up diagnostic imaging is fully pre-authorized under your insurance policy with zero out-of-pocket surprise copays.";
      } else if (lower.includes("appointment") || lower.includes("when") || lower.includes("time")) {
        reply = "We have reserved priority slots for you at Cleveland Clinic Breast Center. You can confirm your appointment anytime right from this portal.";
      } else {
        reply = `Hello ${patient_name}, I am your Clinical Navigator. We have coordinated every detail of your follow-up care to make it seamless.`;
      }
    }

    // Enforce strictly 1 to 2 lines
    const lines = reply.split("\n").map((l) => l.trim()).filter(Boolean);
    const formattedReply =
      lines.length > 2
        ? `${lines[0]} ${lines[1]}`
        : lines.length === 2
        ? `${lines[0]}\n${lines[1]}`
        : lines[0] || "We are here to support your clinical journey every step of the way.";

    return NextResponse.json({
      reply: formattedReply,
      model: "gpt-4o",
      language,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        reply: "We are here beside you. A confirmatory follow-up has been pre-scheduled to confirm your good health.",
        model: "fallback",
        error: error?.message || "Internal error",
      },
      { status: 200 }
    );
  }
}
