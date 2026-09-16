const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-latest",
  "claude-sonnet-4-5-20250929",
];

const VISION_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const SYSTEM = `أنت خبير في العود والبخور والطيب فقط.

نطاقك: أنواع العود ومناطقه وتمييز الأصلي من المغشوش، الدهن والبخور والمباخر، طرق الاختبار والحرق والتخزين، وأسعار العود والبخور ومؤشرات القيمة السوقية.

أي سؤال خارج هذا النطاق — مهما كان — ترد عليه بسطر واحد فقط: «أنا مختص بالعود والبخور والطيب فقط.» ولا تضف شيئًا آخر.

أسلوبك: نثر عربي عادي مبسط، بحد أقصى خمسة أسطر قصيرة. ممنوع تمامًا: العناوين، رموز # و ** و - ، القوائم النقطية، الإيموجي، المقدمات والمجاملات.

في الأسعار اذكر نطاقًا تقريبيًا ووضّح أنه يتغيّر بحسب الجودة والمصدر. لا تجزم بأصالة قطعة لم ترها.`;

const VISION = `أنت خبير بصري في فحص العود والبخور. تفحص صورة قطعة وتقيّم مؤشرات الأصالة الظاهرة فيها فقط.

ما تنظر إليه: انتظام اللون (اللون الموحّد جدًا مؤشر صبغ)، شكل العروق الراتنجية وطبيعيتها، لمعان السطح (اللمعان الزائد مؤشر تلميع أو حقن)، تجانس الملمس، وجود آثار دهن مضاف، شكل القطع والكسر، تناسق الحبيبات.

أعد جوابك بصيغة JSON فقط، بلا أي نص خارجها وبلا علامات كود:
{"score": رقم من 0 إلى 100, "verdict": "أصلي" أو "مشكوك" أو "مغشوش", "reasons": [{"text":"الملاحظة","grade":"طبيعي" أو "مريب","ok":true أو false}], "advice":"سطر أو سطران بالعربية"}

اجعل reasons من أربع إلى ست ملاحظات قصيرة بالعربية، كل واحدة أقل من ثمان كلمات.

كن متحفظًا: الصورة وحدها لا تكفي للجزم. إن كانت الصورة غير واضحة أو لا تحتوي عودًا أو بخورًا، أعد score صفرًا وverdict "غير واضح" وaddvice يشرح السبب.

في advice ذكّر دائمًا بأن التأكد النهائي يحتاج تجربة الحرق والرائحة.`;

async function call(models, body, key) {
  let lastErr = "خطأ من الخدمة";
  for (const model of models) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(Object.assign({ model }, body)),
      });
      const data = await res.json();
      if (res.ok) {
        const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
        return { ok: true, text, model };
      }
      lastErr = (data.error && data.error.message) || lastErr;
      if (res.status !== 404) break;
    } catch (e) {
      lastErr = "تعذّر الاتصال بالخدمة";
    }
  }
  return { ok: false, error: lastErr };
}

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

  if (payload.image && payload.image.data) {
    const content = [
      { type: "image", source: { type: "base64", media_type: payload.image.mime || "image/jpeg", data: payload.image.data } },
      { type: "text", text: "افحص هذه العينة وأعد JSON فقط." },
    ];
    const r = await call(VISION_MODELS, { max_tokens: 700, system: VISION, messages: [{ role: "user", content }] }, key);
    if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: r.error }) };
    let vision = null;
    try { vision = JSON.parse(r.text.replace(/```json|```/g, "").trim()); } catch (e) {}
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ vision, reply: r.text, model: r.model }) };
  }

  const messages = Array.isArray(payload.messages) && payload.messages.length
    ? payload.messages.slice(-12)
    : [{ role: "user", content: String(payload.prompt || "").slice(0, 4000) }];

  if (!messages[0] || !messages[messages.length - 1].content)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "لا يوجد سؤال" }) };

  const r = await call(MODELS, { max_tokens: 400, system: SYSTEM, messages }, key);
  if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: r.error }) };
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply: r.text, model: r.model }) };
};
