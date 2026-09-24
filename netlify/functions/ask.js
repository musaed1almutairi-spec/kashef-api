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

const VISION = `أنت فاحص بصري متخصص في العود والبخور. تفحص صورة عينة واحدة وتعطي تقديرًا استرشاديًا لأصالتها.

قبل الحكم تأكد أن الصورة فعلًا لعود أو بخور أو دهن. إن كانت لشيء آخر، أو ضبابية، أو مظلمة، أو بعيدة بحيث لا تُقرأ التفاصيل، فاجعل score أقل من 25 وverdict "غير واضح" واشرح في reasons ما ينقص الصورة.

المرجع البصري — افحص هذه البنود الثمانية بالترتيب، وكل بند يصبح عنصرًا في reasons:

1) العروق الراتنجية: الأصلي فيه عروق داكنة غير منتظمة تتفاوت سماكتها وتخترق جسم القطعة بعمق. المغشوش عروقه متوازية أو متكررة بنمط واحد، أو تقف عند السطح فقط، أو تبدو مرسومة ومحددة الحواف.
2) توزيع اللون: الأصلي متدرج، فيه مناطق أغمق وأفتح داخل القطعة الواحدة وانتقال ناعم بينها. الصبغ يعطي لونًا موحدًا مسطحًا، أو يتجمع في الشقوق والحفر أغمق مما حولها.
3) سطح المقطع والكسر: الوجه المكسور في الأصلي خشن وليفي وغير مستوٍ وتظهر فيه ألياف الخشب. المضغوط أو الملصق يعطي مقطعًا أملس مستويًا أو حبيبيًا متجانسًا كالنشارة.
4) اللمعان: الأصلي مطفأ أو لمعان دهني خفيف موضعي عند مواضع الراتنج. الغش الزيتي يعطي لمعانًا زجاجيًا موحدًا على كامل السطح، وأحيانًا قطرات أو طبقة مرئية.
5) الحواف والالتحامات: ابحث عن خطوط لصق مستقيمة، أو فروق لون حادة بين جزأين من القطعة، أو بقايا صمغ لامعة عند الحواف، أو قطعة صغيرة داكنة ملصقة على خشب فاتح.
6) الشكل والبنية: الأصلي غير منتظم الشكل، فيه تجاويف وانحناءات وتفاوت في السماكة. القطع المتطابقة الحجم أو المستقيمة الأضلاع أو ذات الزوايا الحادة المتكررة مؤشر تصنيع.
7) المسحوق والشوائب: غبار أو نشارة ملتصقة بالسطح بلون مختلف، أو حبيبات لامعة، أو مادة حشو ظاهرة في التجاويف — كلها مؤشرات خلط أو حشو لزيادة الوزن.
8) السياق والعرض: التغليف والملصقات وطريقة العرض لا تثبت شيئًا عن الأصالة، لكن التفاوت بين ما يُدّعى وما يظهر في القطعة يُذكر كملاحظة.

إن كانت هناك صور مرجعية مرفقة قبل صورة العينة، فقارن العينة بها صراحةً واذكر وجه الشبه أو الاختلاف في البنود المتأثرة.

قواعد الحكم: لا تجزم، وعبارتك دائمًا احتمالية. الصورة وحدها لا تكفي للقطع. لا تذكر أسعارًا.

مع الحكم، رجّح نوع العود من مظهره: هندي أو كمبودي أو ماليزي أو إندونيسي أو تايلندي أو فيتنامي أو لاوسي أو بورمي أو صناعي أو مضغوط. اكتبه في type كلمتين على الأكثر، وأضف «غالبًا» قبله، مثل «غالبًا هندي». إن كانت القطعة صناعية أو مضغوطة فاذكر ذلك. إن لم تستطع الترجيح فاجعل type نصًا فارغًا.

أعد جوابك بصيغة JSON فقط، بلا أي نص خارجها وبلا علامات كود:
{"score": رقم من 0 إلى 100, "verdict": "أصلي" أو "مشكوك" أو "مغشوش" أو "غير واضح", "type":"النوع المرجّح أو نص فارغ", "reasons": [{"text":"البند والملاحظة عليه","grade":"طبيعي" أو "مريب" أو "غير محدد","ok":true أو false}], "advice":"سطران بالعربية"}

اجعل ok=true لكل بند طبيعي وok=false لكل بند مريب أو غير محدد؛ الدرجة تُحسب من البنود المقروءة: إن لم يكن فيها بند مريب فالدرجة ١٠٠.

reasons يجب أن تحتوي ثمانية عناصر بترتيب البنود أعلاه، كل نص أقل من اثنتي عشرة كلمة. إن تعذّرت قراءة بند من الصورة فاجعل grade "غير محدد" وok=false واذكر السبب.

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
    const content = [];

    const refs = Array.isArray(payload.refs) ? payload.refs.slice(0, 6) : [];
    if (refs.length) {
      content.push({ type: "text", text: "صور مرجعية للمقارنة:" });
      for (const r of refs) {
        if (!r || !r.data) continue;
        if (r.label) content.push({ type: "text", text: String(r.label).slice(0, 120) });
        content.push({ type: "image", source: { type: "base64", media_type: r.mime || "image/jpeg", data: r.data } });
      }
      content.push({ type: "text", text: "صورة العينة المطلوب فحصها:" });
    }

    content.push({ type: "image", source: { type: "base64", media_type: payload.image.mime || "image/jpeg", data: payload.image.data } });
    content.push({ type: "text", text: "افحص هذه العينة حسب البنود الثمانية وأعد JSON فقط." });

    const r = await call(VISION_MODELS, { max_tokens: 1400, temperature: 0, system: VISION, messages: [{ role: "user", content }] }, key);
    if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: r.error }) };
    let vision = null;
    try { vision = JSON.parse(r.text.replace(/```json|```/g, "").trim()); } catch (e) {}
    if (vision && Array.isArray(vision.reasons) && vision.reasons.length && vision.verdict !== "غير واضح") {
      const na = x => /غير محدد/.test(String(x && x.grade || ""));
      const ok = vision.reasons.filter(x => x && x.ok === true).length;
      const bad = vision.reasons.filter(x => x && x.ok !== true && !na(x)).length;
      if (ok + bad >= 4) {
        vision.score = Math.round(ok / (ok + bad) * 100);
        vision.verdict = vision.score >= 85 ? "أصلي" : vision.score >= 50 ? "مشكوك" : "مغشوش";
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
