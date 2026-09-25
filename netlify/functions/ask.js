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

const VISION = `أنت فاحص بصري خبير في العود والبخور، عملك تقدير أصالة قطعة العود من صورة واحدة. خذ وقتك، وافحص الصورة بعناية قبل أي حكم. لا تستعجل، ولا تحكم من الانطباع الأول.

الخطوة ١ — تحقّق من الصورة:
- هل هي فعلًا عود أو بخور أو دهن عود؟ إن لم تكن، أو كانت ضبابية أو مظلمة أو بعيدة جدًا بحيث لا تُقرأ الألياف والعروق، فاجعل verdict "غير واضح" وscore أقل من 25، واذكر في advice ما يلزم لتصوير أفضل (اقترب، شغّل الفلاش، خلفية فاتحة، صوّر المقطع المكسور).
- انتبه: وهج الفلاش يصنع بقعة بيضاء لامعة على السطح. لا تعتبرها ورنيشًا أو طلاءً. الورنيش لمعان زجاجي موحّد يغطي القطعة كلها، أما وهج الفلاش فبقعة واحدة في اتجاه الضوء.

الخطوة ٢ — لاحظ قبل أن تحكم:
اكتب في observations من ٤ إلى ٦ جمل قصيرة تصف ما تراه فعلًا في الصورة: اللون وتدرّجه، شكل العروق وعمقها، سطح الكسر، اللمعان، الحواف، الشكل، أي شوائب. صف فقط، دون حكم. ارجع إلى أجزاء الصورة المختلفة: الوسط والأطراف والمقطع إن ظهر.

الخطوة ٣ — افحص البنود الثمانية بالترتيب، مستندًا إلى ملاحظاتك، وكل بند عنصر في reasons:
1) العروق الراتنجية: الأصلي فيه عروق داكنة غير منتظمة تتفاوت سماكتها وتخترق جسم القطعة. المغشوش عروقه متوازية أو متكررة بنمط واحد، أو تقف عند السطح، أو تبدو مرسومة محددة الحواف.
2) توزيع اللون: الأصلي متدرّج، فيه مناطق أغمق وأفتح وانتقال ناعم بينها. الصبغ يعطي لونًا موحدًا مسطحًا، أو يتجمع في الشقوق والحفر أغمق مما حولها.
3) سطح المقطع والكسر: الأصلي خشن ليفي غير مستوٍ تظهر فيه ألياف الخشب. المضغوط أو الملصق أملس مستوٍ أو حبيبي متجانس كالنشارة.
4) اللمعان: الأصلي مطفأ أو دهني خفيف موضعي عند الراتنج. الغش الزيتي أو الورنيش لمعان زجاجي موحّد على كامل السطح، أو قطرات وطبقة مرئية. (تذكّر: وهج الفلاش ليس ورنيشًا.)
5) الحواف والالتحامات: خطوط لصق مستقيمة، فروق لون حادة بين جزأين، بقايا صمغ لامعة عند الحواف، قطعة داكنة ملصقة على خشب فاتح.
6) الشكل والبنية: الأصلي غير منتظم، فيه تجاويف وانحناءات وتفاوت في السماكة. القطع المتطابقة أو المستقيمة الأضلاع أو ذات الزوايا الحادة المتكررة مؤشر تصنيع أو قص آلي.
7) المسحوق والشوائب: غبار أو نشارة بلون مختلف، حبيبات لامعة، أو حشو ظاهر في التجاويف (رمل، برادة معدن، صمغ).
8) خشب العود نفسه: هل يبدو خشب عود فعلًا (ألياف طولية دقيقة، كثافة، راتنج داخل الخشب)؟ أم خشبًا عاديًا أو أبلكاش أو خطوطًا بالليزر؟

قواعد الحكم:
- إذا كان البند لا يظهر في الصورة، فاجعله "غير محدد"، ولا تخمّن.
- إذا تردّدت بين طبيعي ومريب، فارجع إلى ملاحظاتك: لا تحكم بمريب إلا على شيء تراه فعلًا.
- لا تذكر أسعارًا.
- لا تستخدم كلمة «مغشوش» أو «مزيف» أو «أصلي» جزمًا في أي نص. صف ما تراه بلغة المؤشرات، مثل «لون موحّد يشبه الصبغ» بدل «مصبوغ».

إن كانت هناك صور مرجعية مرفقة قبل صورة العينة، فقارن العينة بها صراحةً في البنود المتأثرة.

رجّح النوع من المظهر في type، بكلمتين على الأكثر وقبله «غالبًا»، مثل «غالبًا هندي» أو «غالبًا مروكي» أو «غالبًا كلمنتان» أو «غالبًا ماليزي» أو «غالبًا كمبودي». إن بدا محسّنًا أو مضغوطًا فاذكر ذلك. إن لم تستطع الترجيح فاجعله نصًا فارغًا.

أعد JSON فقط، بلا أي نص خارجه وبلا علامات كود:
{"observations":["جملة","جملة"], "score": رقم من 0 إلى 100, "verdict": "مؤشرات أصالة قوية" أو "يحتاج فحصًا إضافيًا" أو "مؤشرات ضعيفة" أو "غير واضح", "type":"النوع المرجّح أو نص فارغ", "reasons": [{"text":"البند والملاحظة عليه","grade":"طبيعي" أو "مريب" أو "غير محدد","ok":true أو false}], "advice":"سطران بالعربية"}

ok=true لكل بند طبيعي، وok=false لكل بند مريب أو غير محدد. reasons ثمانية عناصر بترتيب البنود، وكل نص أقل من اثنتي عشرة كلمة.

في advice اذكر الفحص العملي التالي الأنسب لهذه القطعة تحديدًا (الماء، الجمر، الحك، الكسر).`;

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
    content.push({ type: "text", text: "افحص هذه العينة بعناية: تحقّق من الصورة، ثم اكتب ملاحظاتك، ثم احكم على البنود الثمانية. أعد JSON فقط." });

    const r = await call(VISION_MODELS, { max_tokens: 1800, temperature: 0, system: VISION, messages: [{ role: "user", content }] }, key);
    if (!r.ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: r.error }) };
    let vision = null;
    try { vision = JSON.parse(r.text.replace(/```json|```/g, "").trim()); } catch (e) {}
    if (vision && Array.isArray(vision.reasons) && vision.reasons.length && vision.verdict !== "غير واضح") {
      const na = x => /غير محدد/.test(String(x && x.grade || ""));
      const ok = vision.reasons.filter(x => x && x.ok === true).length;
      const bad = vision.reasons.filter(x => x && x.ok !== true && !na(x)).length;
      if (ok + bad >= 4) {
        vision.score = Math.round(ok / (ok + bad) * 100);
        vision.verdict = vision.score >= 85 ? "مؤشرات أصالة قوية" : vision.score >= 50 ? "يحتاج فحصًا إضافيًا" : "مؤشرات ضعيفة";
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
