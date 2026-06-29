# AI Smart Well — Архитектурный документ

Документ для разработки. Описывает решения, которые не помещаются в `TechnicalSpec.tsx` (пользовательская спецификация) и не должны теряться в чате.

> Общение и документация — на русском. UI — строго на английском.

---

## 1. Digital Twin

### 1.1 Что это в проекте
Цифровой двойник скважины/месторождения — это не один модуль, а композиция уже существующих:

- **Stage 4 Cumulative Analysis** — Arps-decline модель (b=0.5, экономический предел).
- **Stage 7 Economic Analysis** — Monte Carlo по NPV/ROI на 5 лет.
- **Stage 8 Geophysical** — Timur permeability `k = 0.136·φ⁴·⁴/Swirr²`.
- **Stage 9 EOR** — приоритезация SPT.
- **Realtime** — `LiveWellCard` (демо-телеметрия 2-секундный тик).
- **Automation** — `well_alerts` + `check_well_production_alerts` trigger.

Эти модули вместе образуют **прогнозный слой двойника**. Чего пока нет — **feedback loop** (см. §3).

### 1.2 Что считать "реальным" двойником
- Real-time данные с физического оборудования (SCADA — см. §4).
- Автокалибровка модели по факту (см. §3).
- Замкнутая петля: рекомендация → действие → результат → переобучение.

Без этих трёх элементов это **симулятор**, а не двойник.

---

## 2. Monte Carlo (Stage 7)

### 2.1 Текущая реализация
- **Файлы:** `src/workers/monteCarlo.worker.ts` + `src/components/economic-analysis/MonteCarloSimulation.tsx`.
- **Диапазон:** 1 000 – 50 000 итераций (default 10K).
- **Архитектура:** dedicated Web Worker, UI не блокируется.
- **Память:** `Float64Array` для ROI, transferable objects для нулевого копирования.
- **Прогресс:** ~20 emit-ов на симуляцию, прогресс-бар + elapsed ms.
- **Биннинг:** O(n) линейный по отсортированному массиву (не O(n·bins)).

### 2.2 Модель сэмплирования
Каждая итерация:
1. Сэмплируется начальный дебит `qi`, b, Di (нормальное распределение вокруг исходных значений Arps).
2. Считается накопленная добыча за 60 месяцев.
3. NPV/ROI вычисляется при заданной цене нефти и OPEX.

### 2.3 Ограничения
- Lovable edge functions ограничены по CPU/времени → тяжёлые ML-задачи проксируются на AWS (см. memory `mem://tech/constraints/backend-runtime`).
- Для 50K итераций в браузере — Web Worker обязателен. Для 500K+ — переезд на AWS Lambda/Batch.

---

## 3. Feedback Loop

### 3.1 Принцип (5 шагов)
```text
SENSE  →  MODEL  →  COMPARE  →  DECIDE  →  ACT
  ↑                                          ↓
  └──────────────── new data ────────────────┘
```

1. **SENSE** — телеметрия со SCADA (давление, расход, ЭЦН-параметры).
2. **MODEL** — Twin предсказывает `q(t+Δ)` по Arps.
3. **COMPARE** — `residual = q_actual − q_predicted`.
4. **DECIDE** — две ветви:
   - **A. Калибровка:** Bayesian update коэффициентов Arps (Levenberg-Marquardt / Kalman).
   - **B. Действие:** RL/MPC → команда на изменение режима.
5. **ACT** — команда уходит на SCADA, скважина реагирует, новые данные → цикл замкнулся.

### 3.2 Два уровня
| Уровень | Период | Что регулируется | Где работает |
|--------|--------|------------------|--------------|
| Fast loop | секунды – минуты | Wellbore, ESP, давление | Edge на промысле (AWS Greengrass) |
| Slow loop | дни – недели | Параметры пласта, EOR-стратегия, SPT-планы | AWS + Lovable UI |

### 3.3 Что нужно построить
1. **`production_residuals`** — таблица `(well_id, month, predicted_oil, actual_oil, residual, model_version)`.
2. **Edge Function `calibrate-arps`** — пересчёт коэффициентов при превышении порога residual.
3. **`recommendation_outcomes`** — лог: рекомендация → применена? → результат через N месяцев.
4. **RL-агент на AWS** — обучается на парах `(state, action, reward)`, reward = ΔNPV.
5. **Human-in-the-loop UI** — инженер видит рекомендацию + confidence, кнопки Apply / Reject / Modify; обратная связь идёт в training set.

### 3.4 Текущие пробелы в коде
- `check_well_production_alerts` (DB trigger) — только алерты, не запускает действия.
- `well_alerts` — нет связи с рекомендациями.
- `MonteCarloSimulation` — не пересчитывается по факту автоматически.
- `SPTRecoveryPlan` — не обновляется по прошлым результатам.

---

## 4. SCADA Integration

### 4.1 Что такое SCADA в нефтегазе
Система сбора данных с физического оборудования: датчики давления (устье/забой/линия), расходомеры (нефть/газ/вода), ЭЦН-телеметрия (ток, частота, температура), уровни в сепараторах, положение задвижек. На промысле — PLC (Allen-Bradley / Siemens S7 / Schneider) + RTU на каждой скважине.

### 4.2 Стек подключения (де-факто стандарт)
| Слой | Протокол | Латентность | Безопасность |
|------|----------|-------------|--------------|
| PLC ↔ датчик | Modbus / Profibus | <100 ms | минимальная |
| PLC ↔ ИТ-системы | **OPC UA** | <1 s | TLS + X.509 |
| Edge ↔ Cloud | **MQTT** | 1–5 s | TLS + JWT |
| Cloud polling | HTTPS REST | 1–5 min | OAuth2 |

**Для AI Smart Well:** OPC UA на промысле → AWS IoT Greengrass (edge) → MQTT через TLS → AWS IoT Core → Lambda → Lovable Cloud (`ingest-telemetry` edge function) → PostgreSQL.

### 4.3 Планируемый контракт
**Таблица `well_telemetry`** (multi-tenant, RLS по `company_id`):
```text
well_id        uuid
company_id     uuid
ts             timestamptz   -- момент измерения на промысле
oil_rate       double precision  -- bbl/d
gas_rate       double precision  -- mcf/d
water_rate     double precision  -- bbl/d
wh_pressure    double precision  -- psi (wellhead)
bh_pressure    double precision  -- psi (bottomhole, если есть)
esp_freq       double precision  -- Hz
esp_current    double precision  -- A
esp_temp       double precision  -- °F
source         text              -- 'opcua' | 'mqtt' | 'manual' | 'demo'
```

Индексы: `(well_id, ts DESC)`, `(company_id, ts DESC)`.

**Edge Function `ingest-telemetry`:**
- Принимает batch payload (MQTT bridge на AWS отправляет каждые 5 с).
- Валидирует HMAC-подпись (секрет на скважину).
- Zod-валидация структуры.
- Insert batch'ем (до 1000 строк).
- Триггерит `check_well_production_alerts` (расширенный — на основе телеметрии, не только helpdesk-полей wells).

### 4.4 Демо-источник
`src/components/realtime/LiveWellCard.tsx` — fake 2-секундный поток через `setInterval`. В продакшене заменяется на realtime-подписку:
```ts
supabase.channel('telemetry').on('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'well_telemetry', filter: `well_id=eq.${id}` },
  (payload) => updateChart(payload.new)
).subscribe();
```

### 4.5 Что мешает прямо сейчас
- Нет физического пилота → нет реального OPC UA сервера.
- Нет AWS-аккаунта с IoT Core у клиента → MQTT-bridge не задеплоен.
- Greengrass-агент требует промышленного железа на промысле (industrial PC).

**Минимальный путь к демонстрации:** написать `well_telemetry` + `ingest-telemetry` + поменять `LiveWellCard` на подписку. Telemetry-генератор крутить в отдельном Deno-скрипте, отправлять на edge function — это уже валидный end-to-end pipeline.

---

## 5. Self-learning (Kalman + Bayesian update)

### 5.1 Принцип
Параметры модели (Arps `b`, Arps `Di`, SPT multiplier) больше не «зашиты в код». Они хранятся как **апостериорные распределения** в таблице `model_parameters` и обновляются при каждом новом наблюдении.

Каждый параметр — нормальное распределение `N(μ, σ²)`. При получении новой пары `(predicted, actual)` запускается одномерный байесовский апдейт (математически эквивалентный одномерному Калман-фильтру при стационарной системе):

```text
posterior_μ  = (μ · r² + z · σ²) / (σ² + r²)
posterior_σ² = (σ² · r²) / (σ² + r²)
```

где:
- `μ, σ²` — prior из `model_parameters`
- `z` — наблюдаемое значение параметра, оценённое из факта
- `r²` — дисперсия наблюдения (растёт с MAPE — чем хуже сошлось, тем меньше доверие к точке)

### 5.2 Оценка наблюдений `z`
- **SPT multiplier:** `z_spt = spt_multiplier_used · (actual_qoil / predicted_qoil)`
- **Arps b:** если есть накопленная добыча — `z_b = b_used · (1 + (actual_cum/predicted_cum − 1) · 0.6)`, иначе оценка через ratio дебитов. Клипуется в `[0.05, 1.5]`.
- **Arps Di:** пока обновляется только μ (без переоценки), т.к. одного замера недостаточно для разделения вклада `b` и `Di`. План — совместная оценка по ≥3 точкам через Levenberg-Marquardt.

### 5.3 Scope fallback
Параметры ищутся в иерархии: `well → formation → global`. Это даёт холодный старт: до первой калибровки скважина наследует глобальный prior (`b=0.5`, `SPT=1.45`, conf=50%), после — переходит на собственное распределение.

### 5.4 Confidence
```text
conf = 100 · (1 − mean(σ/μ для b и SPT))    clamped [5, 99.5]
```

Чем уже posterior, тем выше confidence. Бейдж `Auto-calibrated` (`src/components/digital-twin/AutoCalibratedBadge.tsx`) красится по порогам: ≥85 зелёный, ≥65 жёлтый, <65 красный.

### 5.5 API
```text
POST /functions/v1/ingest-restoration
Authorization: Bearer <user_jwt>

{
  "scope_key": "BRW-10",          // или well_id / well_external_ref
  "scope_type": "well",            // well | formation | global
  "predicted_qoil": 40,            // bbl/d (требуется)
  "actual_qoil":    46,            // bbl/d (требуется)
  "predicted_cum":  12000,         // bbl, опционально (улучшает оценку b)
  "actual_cum":     13800,
  "arps_b_used":    0.5,           // что использовала модель в прогнозе
  "arps_di_used":   0.00018,
  "spt_multiplier_used": 1.45,
  "spt_depth_ft":   4,
  "oil_price":      75,
  "payload": { ... raw ... }       // произвольный JSON, сохраняется как есть
}
```

Ответ содержит `before / after / residual / mape` и id записи в `calibration_audit`.

### 5.6 Таблицы

| Таблица | Назначение | Ключевые поля |
|--------|------------|---------------|
| `well_restorations` | Сырые входы: что предсказали, что получили | predicted/actual qoil+cum, использованные параметры, payload, processed |
| `model_parameters` | Текущее апостериорное состояние per scope | μ и σ² для b/Di/SPT, confidence, sample_count, model_version |
| `calibration_audit` | Журнал всех апдейтов | before_state, after_state, input_summary, residual, mape, confidence_delta |

RLS по `company_id` через `user_companies`. Global prior (`company_id IS NULL`) виден всем аутентифицированным.

### 5.7 Что НЕ делает self-learning (честно)
- **Не «AI».** Это ML-калибровка по фиксированной формуле Bayesian 1D — не агент, не планировщик, не объясняющий блок.
- **Не переобучает структуру модели.** Закон Арпса остаётся законом Арпса; меняются только его коэффициенты.
- **Не делает joint-update b+Di.** Требует ≥3 точек и нелинейной регрессии (LM/PINN) — план Phase 3 на AWS.
- **Не валидирует физичность входов.** Если прислать `actual_qoil=0`, posterior уползёт. Нужен outlier-фильтр (план: Mahalanobis distance + Tukey fence).

### 5.8 Roadmap
| Phase | Что | Где работает |
|-------|-----|--------------|
| **1 (сделано)** | 1-D Bayesian per parameter, scope fallback, audit log, UI badge | Supabase Edge |
| 2 | Outlier-фильтр, joint LM-fit `(b, Di)` по ≥3 точкам, дрейф σ² во времени (forgetting factor) | Supabase Edge |
| 3 | PINN-калибровка с физическими ограничениями (давление, PVT), reservoir-wide ensemble Kalman | AWS GPU (Modulus) |
| 4 | RL-агент: action=изменение режима, reward=ΔNPV, обучение в shadow mode | AWS + human-in-the-loop UI |

---



## 5. Где жить документации

| Документ | Назначение | Аудитория |
|----------|------------|-----------|
| `src/pages/TechnicalSpec.tsx` | Спецификация платформы | Клиенты, инвесторы, новые разработчики |
| `src/pages/MVPScope.tsx` | Скоуп MVP | Стейкхолдеры |
| `docs/ARCHITECTURE.md` (этот файл) | Архитектурные решения, гэпы, будущие миграции | Разработка |
| `.lovable/plan.md` | Рабочий план текущих задач | Внутренний |
| `mem://` | Persistent правила для AI-агента | Lovable AI |
