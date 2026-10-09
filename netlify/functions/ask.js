const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-latest",
  "claude-sonnet-4-5-20250929",
];

const VISION_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001",
];

const crypto = require("crypto");

// اشتراكات آبل — App Store Server API
const BUNDLE = "com.kashef.altayeb";
const LIMITS = {
  "com.kashef.altayeb.scans20": 20,
  "com.kashef.altayeb.scans50": 50,
  "com.kashef.altayeb.scans100": 100,
};
const BONUS = 5;
const b64u = b => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

function appleJwt() {
  const key = (process.env.APPLE_IAP_KEY || "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: "ES256", kid: process.env.APPLE_IAP_KEY_ID, typ: "JWT" }));
  const p = b64u(JSON.stringify({ iss: process.env.APPLE_ISSUER_ID, iat: now, exp: now + 1200, aud: "appstoreconnect-v1", bid: BUNDLE }));
  const sig = crypto.sign("sha256", Buffer.from(h + "." + p), { key, dsaEncoding: "ieee-p1363" });
  return h + "." + p + "." + b64u(sig);
}

const jwsBody = s => JSON.parse(Buffer.from(String(s).split(".")[1], "base64url").toString("utf8"));

async function subStatus(tx) {
  if (!/^\d{1,30}$/.test(String(tx || ""))) return { code: "no_sub" };
  const token = appleJwt();
  for (const host of ["api.storekit.itunes.apple.com", "api.storekit-sandbox.itunes.apple.com"]) {
    const r = await fetch("https://" + host + "/inApps/v1/subscriptions/" + tx, { headers: { authorization: "Bearer " + token } });
    if (r.status === 404) continue;
    if (!r.ok) throw new Error("storekit " + r.status);
    const d = await r.json();
    let found = null;
    (d.data || []).forEach(g => (g.lastTransactions || []).forEach(t => {
      const info = jwsBody(t.signedTransactionInfo);
      if (!LIMITS[info.productId]) return;
      const active = t.status === 1 || t.status === 4;
      if (active || !found) found = { active, info };
    }));
    if (!found) return { code: "no_sub" };
    if (!found.active) return { code: "expired" };
    return { code: "ok", info: found.info };
  }
  return { code: "no_sub" };
}

async function checkScan(tx, event) {
  const s = await subStatus(tx);
  if (s.code !== "ok") return s;
  const { getStore, connectLambda } = require("@netlify/blobs");
  if (connectLambda) connectLambda(event);
  const store = getStore("scans");
  const k = s.info.originalTransactionId + "_" + (s.info.expiresDate || 0);
  const limit = LIMITS[s.info.productId] + BONUS;
  const used = Number(await store.get(k)) || 0;
  const plan = LIMITS[s.info.productId], expires = s.info.expiresDate || 0;
  if (used >= limit) return { code: "limit", used, limit, plan, expires };
  return { code: "ok", used, limit, plan, expires, use: () => store.set(k, String(used + 1)) };
}

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
- للأصلي نقوش كثيرة: عروق طولية (هندي)، بقع مرقّطة (سيلاني، تراد، فيتنامي)، خطوط شبه متوازية تتبع الألياف (ماليزي). الهندي (السيوفي والجاري) عروقه طولية متقاربة أيضًا، فالخطوط الطولية وحدها لا تكفي للتفريق بين الهندي والماليزي. التوازي وحده ليس غشًّا؛ الغش خطوط متطابقة حادة كالمرسومة أو بالليزر.
- اللمعان الدهني في مواضع الراتنج طبيعي (الكمبودي). الورنيش لمعان زجاجي يغطي القطعة كلها.
- المروكي لا يكون طبيعيًا: إن شابهت العينة المروكي فـ match "محسّن" أو "مغشوش" فقط، وverdict "محسّن، مقبول للمناسبات" أو "مؤشرات ضعيفة".
- القطعة المصقولة المشكّلة باليد (حبة بيضاوية أو مدوّرة ملساء، خرزة، قطعة سطحها ناعم مصقول من كل الجهات) ليست كسرًا خامًا، فلا تكون "طبيعي" أبدًا: match "محسّن" (إن ظهرت العروق تحت الصقل) أو "مغشوش" (إن غطّى اللون العروق)، ونوعها مروكي غالبًا، ولا تكتب لها ماليزي أو هندي. لا علاقة لهذا بحجم القطعة، بل بأنها مصقولة ومشكّلة.
- المحسّن الفاخر (مروكي، تايقر) مصقول ولامع لكن العروق والألياف تظهر تحت السطح. المصبوغ لونه موحّد محبّب يخفي العروق، وحوافه مدوّرة.
- وجها القطعة قد يختلفان لونًا، والتجاويف والعُقد والداخل الفاتح طبيعية.
- الحجم ودرجة الدهن (سوبر، دبل، تربل) لا تغيّر الحكم على الأصالة.

الخطوة ٣ — البنود الثمانية، وكل بند عنصر في reasons بالترتيب:
1) العروق الراتنجية 2) توزيع اللون 3) سطح المقطع والكسر 4) اللمعان 5) الحواف والالتحامات 6) الشكل والبنية 7) المسحوق والشوائب 8) خشب العود نفسه.
البند الذي لا يظهر في الصورة "غير محدد"، ولا تحكم بمريب إلا على شيء تراه فعلًا.

لا تذكر أسعارًا. لا تستخدم «مغشوش» أو «مزيف» أو «أصلي» جزمًا في نصوص reasons وadvice؛ صف بلغة المؤشرات.

type: نوع العود بكلمة أو كلمتين (هندي، كمبودي، فيتنامي، ماليزي، كلمنتان، مروكي، سيلاني، صيني هاينان…). اكتبه فقط إذا شابهت العينة بوضوح صورة مرجع من النوع نفسه في النقش واللون والسطح معًا. إن ترددت بين نوعين أو لم تجد شبهًا واضحًا فاتركه فارغًا، فالنوع الفارغ أفضل من نوع خاطئ. لا تكتب نوعين.

grade: الدرجة التقديرية من كثافة الراتنج الظاهر:
- "سوبر": عروق داكنة قليلة وأغلب الخشب فاتح.
- "دبل سوبر": عروق ونقاط داكنة كثيرة تغطي قرابة نصف القطعة.
- "تربل سوبر": القطعة مشبعة بالراتنج والخشب الفاتح قليل جدًا.
اقرأ الدكنة من الراتنج نفسه (عروق ونقاط، سطح مطفأ)، لا من لون موحّد. الأنواع الفاتحة بطبيعتها (سيلاني، كلمنتان فاتح) تُقدَّر بكثافة العروق. إن لم تكن الصورة كافية فاتركه فارغًا. لا درجة للمغشوش أو المصبوغ.

أعد JSON فقط، بلا أي نص خارجه وبلا علامات كود:
{"match":"طبيعي" أو "محسّن" أو "مغشوش" أو "لا يشبه", "matchRef":"", "score": رقم من 0 إلى 100, "verdict":"مؤشرات أصالة قوية" أو "محسّن، مقبول للمناسبات" أو "يحتاج فحصًا إضافيًا" أو "مؤشرات ضعيفة" أو "غير واضح", "type":"", "grade":"" أو "سوبر" أو "دبل سوبر" أو "تربل سوبر", "reasons":[{"text":"البند والملاحظة","grade":"طبيعي" أو "مريب" أو "غير محدد","ok":true أو false}], "advice":"سطر واحد: الفحص العملي التالي"}

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

  // الرصيد فقط — بلا فحص وبلا خصم
  if (payload.quota) {
    try {
      const q = await checkScan(payload.tx, event);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ code: q.code, used: q.used, limit: q.limit, plan: q.plan, expires: q.expires }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "quota" }) }; }
  }

  if (payload.image && payload.image.data) {
    // النسخ القديمة (1.1 وما قبلها) لا ترسل v — تبقى مجانية حتى يحدّث المستخدمون
    let sub = null;
    if (payload.v) {
      try { sub = await checkScan(payload.tx, event); }
      catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "تعذّر التحقق من الاشتراك" }) }; }
      if (sub.code !== "ok")
        return { statusCode: 402, headers: CORS, body: JSON.stringify({ code: sub.code, used: sub.used, limit: sub.limit, plan: sub.plan, expires: sub.expires }) };
    }
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
        vision.type = ""; vision.grade = "";
      } else if (ok + bad >= 4) {
        vision.match = "لا يشبه";
        vision.score = base;
        vision.verdict = base >= 85 ? "مؤشرات أصالة قوية" : base >= 50 ? "يحتاج فحصًا إضافيًا" : "مؤشرات ضعيفة";
      } else {
        vision.score = Math.min(vision.score || 0, 24);
        vision.verdict = "غير واضح";
      }
      if (vision.verdict === "غير واضح" || vision.verdict === "مؤشرات ضعيفة") vision.grade = "";
      if (!/^(سوبر|دبل سوبر|تربل سوبر)$/.test(String(vision.grade || "").trim())) vision.grade = "";
    }
    let quota = null;
    if (sub && vision && vision.verdict !== "غير واضح") {
      try { await sub.use(); quota = { used: sub.used + 1, limit: sub.limit, plan: sub.plan, expires: sub.expires }; } catch (e) {}
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ vision, quota, reply: r.text, model: r.model }) };
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
