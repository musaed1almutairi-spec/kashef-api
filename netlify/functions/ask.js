const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-latest",
  "claude-sonnet-4-5-20250929",
];

const VISION_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001",
];

let REFS = [];
try { REFS = require("./refs.json"); } catch (e) { REFS = []; }

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

const VISION = `أنت فاحص بصري خبير في العود والبخور، عملك تقدير أصالة قطعة العود من صورة واحدة. افحص بعناية قبل أي حكم.

مرفق قبل صورة العينة مرجع من صور حقيقية مؤكدة لأشهر أنواع العود في الخليج، وكل صورة مكتوب قبلها حالتها: طبيعي أو محسّن أو مغشوش.

الخطوة ١ — تحقّق من الصورة:
إن لم تكن عودًا أو بخورًا، أو كانت ضبابية أو مظلمة أو بعيدة جدًا بحيث لا تُقرأ الألياف والعروق، فاجعل verdict "غير واضح" وmatch "لا يشبه" وscore أقل من 25، واذكر في advice ما يلزم لتصوير أفضل.
وهج الفلاش بقعة بيضاء لامعة في اتجاه الضوء، وليس ورنيشًا.

الخطوة ٢ — قارن بالمرجع:
هل تشبه العينة بوضوح إحدى صور المرجع في النقش والعروق واللون والسطح والحواف؟
- إن شابهت صورة طبيعية: match "طبيعي".
- إن شابهت صورة محسّنة: match "محسّن". المحسّن عود مقبول يُستخدم في المناسبات، وليس غشًّا.
- إن شابهت صورة مغشوشة: match "مغشوش".
- إن لم تشبه أيًّا منها بوضوح: match "لا يشبه". هذا طبيعي، فهناك آلاف الأنواع خارج المرجع؛ افحصها عندها بالبنود الثمانية وحدها.
اكتب في matchRef اسم صورة المرجع الأقرب، أو نصًا فارغًا.

قواعد تعلّمناها من المرجع:
- العود الفاتح قد يكون أصليًا (السيلاني الفاخر، الكلمنتان). الفتح وحده ليس ضعفًا.
- الداكن جدًا قد يكون راتنجًا كثيفًا لا صبغًا: الراتنج مطفأ خشن، والصبغ موحّد يغطي العروق.
- للأصلي نقوش كثيرة: عروق طولية (هندي، مروكي)، بقع مرقّطة (سيلاني، تراد، فيتنامي)، خطوط شبه متوازية تتبع الألياف (ماليزي). التوازي وحده ليس غشًّا؛ الغش خطوط متطابقة حادة كالمرسومة أو بالليزر.
- اللمعان الدهني في مواضع الراتنج طبيعي (الكمبودي). الورنيش لمعان زجاجي يغطي القطعة كلها.
- المحسّن الفاخر (مروكي محسّن، تايقر) مصقول ولامع لكن العروق والألياف تظهر تحت السطح. المصبوغ لونه موحّد محبّب يخفي العروق، وحوافه مدوّرة.
- وجها القطعة قد يختلفان لونًا، والتجاويف والعُقد والداخل الفاتح طبيعية.
- الحجم ودرجة الدهن (سوبر، دبل، تربل) لا تغيّر الحكم على الأصالة.

الخطوة ٣ — البنود الثمانية، وكل بند عنصر في reasons بالترتيب:
1) العروق الراتنجية 2) توزيع اللون 3) سطح المقطع والكسر 4) اللمعان 5) الحواف والالتحامات 6) الشكل والبنية 7) المسحوق والشوائب 8) خشب العود نفسه.
البند الذي لا يظهر في الصورة "غير محدد"، ولا تحكم بمريب إلا على شيء تراه فعلًا.

لا تذكر أسعارًا. لا تستخدم «مغشوش» أو «مزيف» أو «أصلي» جزمًا في نصوص reasons وadvice؛ صف بلغة المؤشرات.

type: اتركه فارغًا إلا إذا شابهت العينة صورة مرجع بوضوح، فاكتب نوعها مع «غالبًا».

أعد JSON فقط، بلا أي نص خارجه وبلا علامات كود:
{"match":"طبيعي" أو "محسّن" أو "مغشوش" أو "لا يشبه", "matchRef":"", "score": رقم من 0 إلى 100, "verdict":"مؤشرات أصالة قوية" أو "محسّن، مقبول للمناسبات" أو "يحتاج فحصًا إضافيًا" أو "مؤشرات ضعيفة" أو "غير واضح", "type":"", "reasons":[{"text":"البند والملاحظة","grade":"طبيعي" أو "مريب" أو "غير محدد","ok":true أو false}], "advice":"سطر واحد: الفحص العملي التالي"}

reasons ثمانية عناصر، وكل نص أقل من ثماني كلمات.`;

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
    const content = [];
    if (REFS.length) {
      content.push({ type: "text", text: "المرجع — صور حقيقية مؤكدة:" });
      REFS.forEach((r, i) => {
        content.push({ type: "text", text: "مرجع " + (i + 1) + " (" + r.cls + "): " + r.label });
        content.push({ type: "image", source: { type: "base64", media_type: r.mime || "image/jpeg", data: r.data } });
      });
      content[content.length - 1].cache_control = { type: "ephemeral" };
    }
    content.push({ type: "text", text: "صورة العينة المطلوب فحصها:" });
    content.push({ type: "image", source: { type: "base64", media_type: payload.image.mime || "image/jpeg", data: payload.image.data } });
    content.push({ type: "text", text: "قارن العينة بالمرجع، ثم احكم على البنود الثمانية. أعد JSON فقط." });

    const r = await call(VISION_MODELS, {
      max_tokens: 900, temperature: 0,
      system: [{ type: "text", text: VISION, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    }, key);
    if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: r.error }) };
    let vision = null;
    try { vision = JSON.parse(r.text.replace(/```json|```/g, "").trim()); } catch (e) {}
    if (vision && Array.isArray(vision.reasons) && vision.reasons.length && vision.verdict !== "غير واضح") {
      const na = x => /غير محدد/.test(String(x && x.grade || ""));
      const ok = vision.reasons.filter(x => x && x.ok === true).length;
      const bad = vision.reasons.filter(x => x && x.ok !== true && !na(x)).length;
      const base = ok + bad ? Math.round(ok / (ok + bad) * 100) : 0;
      const m = String(vision.match || "");
      if (m === "طبيعي") {
        vision.score = Math.max(base, 85);
        vision.verdict = "مؤشرات أصالة قوية";
      } else if (m === "محسّن") {
        vision.score = Math.min(84, Math.max(base, 70));
        vision.verdict = "محسّن، مقبول للمناسبات";
        vision.enhanced = true;
      } else if (m === "مغشوش") {
        vision.score = Math.min(base, 45);
        vision.verdict = "مؤشرات ضعيفة";
      } else if (ok + bad >= 4) {
        vision.match = "لا يشبه";
        vision.score = base;
        vision.verdict = base >= 85 ? "مؤشرات أصالة قوية" : base >= 50 ? "يحتاج فحصًا إضافيًا" : "مؤشرات ضعيفة";
      } else {
        vision.score = Math.min(vision.score || 0, 24);
        vision.verdict = "غير واضح";
      }
    }
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
