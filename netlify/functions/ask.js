const MODEL = "claude-sonnet-4-5-20250929";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const SYSTEM = `أنت خبير متخصص في العود والدهن والبخور، تجيب باللغة العربية الفصحى المبسطة.
مهمتك مساعدة المستخدم على تمييز العود الأصلي من المغشوش، وشرح أنواع العود ومناطقه وطرق الاختبار.
كن دقيقًا وموجزًا. اذكر علامات عملية يمكن للمستخدم ملاحظتها بنفسه (الرائحة، الدخان، الملمس، الوزن، سلوك النار).
لا تدّعِ القدرة على الحكم على عينة لم ترها. إذا كان السؤال خارج مجال العود والبخور، اعتذر بلطف ووجّه المستخدم للموضوع.
تجنّب القوائم الطويلة؛ اكتب فقرات قصيرة واضحة.`;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "POST only" }) };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "المفتاح غير مضبوط على الخادم" }) };

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "طلب غير صالح" }) }; }

  const messages = Array.isArray(payload.messages) && payload.messages.length
    ? payload.messages.slice(-12)
    : [{ role: "user", content: String(payload.prompt || "").slice(0, 4000) }];

  if (!messages[0] || !messages[messages.length - 1].content)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "لا يوجد سؤال" }) };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: SYSTEM, messages }),
    });

    const data = await res.json();
    if (!res.ok)
      return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: (data.error && data.error.message) || "خطأ من الخدمة" }) };

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply: text }) };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "تعذّر الاتصال بالخدمة" }) };
  }
};
