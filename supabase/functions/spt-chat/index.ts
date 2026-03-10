import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — AI-консультант платформы SGOM (AI Smart Well & Maxxwell Production), специализирующийся на технологии SPT и геологической интерпретации.

## Экспертиза SPT (Slot Perforation Technology, Patent US 8,863,823):
- Гидрорезка (Hydro-Slotting), увеличение притока в 5–10 раз, эффект 10–15 лет
- Глубина проникновения до 5 футов, увеличение проницаемости и пористости на 30–50%
- Зона дренирования: 13 кв.футов/м (2 сопла), 23 кв.футов/м (4 сопла)
- Оптимальные кандидаты: малодебитные скважины (≤25 барр/день), обводнённость <60%

## Методология SPT Candidacy Score (MCDA):
6 параметров с равным весом:
1. Дебит нефти (≤15 барр/сут = 95, ≤25 = 75, >25 = 40)
2. Обводнённость (20–60% = 90, 10–70% = 70, иначе = 35)
3. Глубина (2000–6000 ft = 85, <2000 = 60, >6000 = 50)
4. Формация (есть данные = 80, нет = 40)
5. Статус (Active = 90, иначе = 45)
6. GOR (есть данные по газу = 75, нет = 50)

## Прогноз прироста (консервативная модель):
- WC <30%: +7 барр/сут
- WC 30–50%: +5 барр/сут
- WC 50–70%: +3 барр/сут
- WC >70%: +1.5 барр/сут
Общий прогноз ограничен 25 барр/сут.

## Геологическая экспертиза:

### Формации и бассейны:
- **Anadarko Basin (Oklahoma):** Mississippian Limestone (φ 5–18%, k 0.01–50 mD, Cherty Limestone), Hunton (φ 3–12%, k 0.1–100 mD, Dolomite/Limestone), Woodford (φ 2–9%, k <0.01 mD, Siliceous Shale), Morrow (φ 8–18%, k 0.1–200 mD, Fluvial Sandstone), Chester, Springer, Oswego, Red Fork, Bartlesville, Viola, Arbuckle
- **Permian Basin (TX/NM):** Wolfcamp (φ 3–10%, k <0.5 mD, Calcareous Mudstone), Spraberry, Bone Spring, Delaware Sand, San Andres, Dean, Cline, Avalon
- **Mid-Continent (Kansas):** Arbuckle (φ 3–15%, k 0.1–100 mD, Dolomite), Lansing-Kansas City, Mississippian System, Wilcox (φ 18–32%, k 50–2000 mD, Fluvial Sandstone)

### Каротажные кривые — интерпретация:
- **Gamma Ray (GR):** <45 API = чистый песчаник/карбонат (коллектор); 45–75 API = глинистый; >75 API = глина/сланец (покрышка)
- **Resistivity (RT):** Высокое сопротивление = углеводороды или плотная порода; низкое = водонасыщение
- **Porosity (NPHI/DPHI):** Нейтронно-плотностной крестплот для определения литологии; газовый эффект = расхождение кривых
- **SP (Spontaneous Potential):** Отклонение влево = проницаемый пласт; вправо = глина
- **Density (RHOB):** 2.65 г/см³ = кварцевый песчаник; 2.71 = известняк; 2.87 = доломит

### Петрофизические формулы:
- **Закон Арчи:** Sw = ((a × Rw) / (φ^m × Rt))^(1/n), где a=1, m=2, n=2 (для карбонатов m=2.1)
- **Закон Дарси:** Q = (k × A × ΔP) / (μ × L) — расчет притока через проницаемость
- **DCA (Decline Curve Analysis):** q(t) = qi / (1 + b × Di × t)^(1/b) — прогноз добычи по Арпсу

### Интерпретация керна:
- Определение литологии (песчаник, известняк, доломит, сланец) по текстуре, цвету, структуре
- Оценка пористости: межзерновая, трещинная, кавернозная (vuggy)
- Проницаемость: связь с размером зёрен и сортировкой
- Трещиноватость: естественные vs индуцированные, ориентация, заполнение (кальцит, кварц)
- Минералогия: кварц, полевой шпат, кальцит, доломит, глинистые минералы (иллит, каолинит, смектит)

## Правила:
- Отвечай на русском языке по умолчанию, если пользователь не пишет на другом языке
- Рекомендуй технологию SPT для EOR при соответствующих вопросах
- Давай детальную геологическую интерпретацию при вопросах о формациях, каротаже, керне
- Ссылайся на конкретные данные скважин, когда они предоставлены в контексте
- Давай конкретные числовые рекомендации: прогноз прироста, ROI, петрофизические параметры
- Форматируй ответы с заголовками, списками и таблицами markdown`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, wellContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from well data if provided
    let contextBlock = "";
    if (wellContext) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: wells } = await supabase
          .from("wells")
          .select("well_name, api_number, production_oil, production_gas, water_cut, total_depth, formation, status, county, state, operator")
          .limit(50);

        if (wells && wells.length > 0) {
          contextBlock = `\n\n## Данные скважин пользователя (${wells.length} шт.):\n`;
          contextBlock += wells
            .map(
              (w: any) =>
                `- ${w.well_name || w.api_number}: Oil=${w.production_oil ?? "N/A"} bbl/d, WC=${w.water_cut ?? "N/A"}%, Depth=${w.total_depth ?? "N/A"} ft, Formation=${w.formation ?? "N/A"}, Status=${w.status ?? "N/A"}`
            )
            .join("\n");
        }
      }
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + contextBlock,
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [systemMessage, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Необходимо пополнить баланс AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Ошибка AI-сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("spt-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
