\
// api/chat.js — STRICT via Actions GPT
// Env:
//  - OPENAI_API_KEY (required)
//  - GPT_MODEL      (required)  e.g., your Custom GPT model ID
//
// Flow:
//  1) Receive { code } from UI
//  2) Call your Actions GPT (Custom GPT) via Chat Completions.
//     The GPT is configured with an Action (OpenAPI) that calls Make to fetch the document.
//  3) Return GPT's JSON response to the UI in OpenAPI format: {status:'success', data:{description, link}}
//
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }
  try {
    const { code } = (req.body || {});
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ status: 'error', message: '\"code\" must be a non-empty string' });
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const GPT_MODEL = process.env.GPT_MODEL;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ status: 'error', message: 'OPENAI_API_KEY is not configured' });
    }
    if (!GPT_MODEL) {
      return res.status(500).json({ status: 'error', message: 'GPT_MODEL is not configured' });
    }

    const system = [
      "Ты — системный агент. Твоя задача: вызвать встроенный Action для поиска документа по коду и вернуть ответ в формате JSON.",
      "Строго возвращай объект JSON вида: {\\\"status\\\":\\\"success\\\",\\\"data\\\":{\\\"description\\\":\\\"...\\\",\\\"link\\\":\\\"...\\\"}}",
      "При ошибке верни {\\\"status\\\":\\\"error\\\",\\\"message\\\":\\\"...\\\"}.",
      "Никакого текста вне JSON."
    ].join(" " );

    const user = `Найди документ по коду и верни JSON по схеме. Код: ${code.trim()}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    const payloadText = await resp.text();
    let payload = null;
    try { payload = JSON.parse(payloadText); } catch {
      return res.status(resp.status || 500).json({ status: 'error', message: 'Non-JSON from OpenAI', raw: payloadText });
    }

    const content = payload?.choices?.[0]?.message?.content || "";
    let out = null;
    try { out = JSON.parse(content); } catch {
      return res.status(502).json({ status: 'error', message: 'GPT returned non-JSON content', raw: content });
    }

    if (out && typeof out === "object") {
      if (out.status === "success" && out.data && typeof out.data.description === "string") {
        return res.status(200).json(out);
      }
      if (out.status === "error") {
        return res.status(400).json(out);
      }
    }
    return res.status(502).json({ status: 'error', message: 'Invalid schema returned by GPT', raw: out });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err?.message || String(err) });
  }
}
