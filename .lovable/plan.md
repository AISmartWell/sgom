# Reserves Estimation — расширение (Stage 4 / Cumulative)

Сейчас оценка запасов держится на одной ветке: Havlena–Odeh (нефть) и P/Z (газ) в `src/lib/material-balance.ts`. Это честно, но узко: нет объёмного расчёта, нет диагностики режима залежи, нет вероятностной оценки и нет сверки трёх независимых методов. Предлагаю добавить полноценный блок «Reserves Estimation».

## 1. Volumetric OOIP/OGIP (независимая оценка)

Новый `src/lib/reserves-volumetric.ts`:
- OOIP = 7758 · A · h · φ · (1 − Sw) / Boi (STB, imperial, acres/ft)
- OGIP = 43560 · A · h · φ · (1 − Sw) / Bgi
- Входы φ, Sw, h(net pay) берутся автоматически из Petrophysical Solver (`src/lib/petrophysics.ts`), Boi/Bgi — из PVT snapshot (`src/lib/pvt.ts`), A — из дренажного радиуса или полигона на Reserves Map.
- Recovery Factor по типу привода (solution gas 5–30%, gas cap 20–40%, water drive 35–60%) → EUR.

## 2. Диагностика режима залежи (drive mechanism)

В `material-balance.ts` добавить:
- **Campbell plot** — F/Eo vs We/Eo: горизонтальная линия = замкнутая залежь, растущая = приток воды.
- **Havlena–Odeh с газовой шапкой**: F/Eo = N + m·N·(Eg/Eo) — оценка m и N одновременно.
- **Приток воды We** по Fetkovich (упрощённый tank-модель аквифера) с подбором параметров аквифера по минимуму невязки.
- Вывод: доля вклада каждого механизма (drive indices: DDI, SDI, WDI) — стековая диаграмма по времени.

## 3. Вероятностные запасы P10/P50/P90

`src/lib/reserves-probabilistic.ts` + переиспользование воркера Monte Carlo (`src/workers/monteCarlo.worker.ts`):
- Распределения на A, h, φ, Sw, Boi, RF (нормальное/логнормальное/треугольное, задаётся в UI).
- 50k итераций → гистограмма и кривая накопленной вероятности, значения P90 (proved), P50 (probable), P10 (possible) по классификации SPE-PRMS.
- Tornado-диаграмма чувствительности: какой параметр даёт наибольший разброс запасов.

## 4. Reserves Reconciliation — сверка трёх методов

Новый компонент `src/components/reserves/ReservesReconciliation.tsx`:
- Три независимые оценки в одной таблице/бар-чарте: Volumetric, Material Balance, DCA EUR (из Bayesian DCA Monitor).
- Расхождение в % + автоматический вердикт («MB ниже volumetric на 35% → вероятен низкий охват дренированием / компартментализация»).
- Бейджи достоверности REAL DATA / FORMATION-BASED / SYNTHETIC на каждом входе — по действующему правилу платформы.

## 5. Remaining reserves и связка со Stage 7/9

- Remaining = EUR − Np, время до economic limit из существующей экономики (`src/lib/economics-config.ts`).
- Передача remaining reserves и RF-uplift в SPT Advisor как вход для RPS (потенциал восстановления = f(остаточные запасы, дренируемость)).

## 6. UI и экспорт

- Новая вкладка **Reserves** в `src/pages/modules/ReservoirPressure.tsx` (или отдельная страница `/dashboard/reserves` с записью в SGOM Task Map).
- Карточки: Volumetric | MB | DCA | Probabilistic; графики Campbell, drive indices, гистограмма P10/P50/P90, tornado.
- Экспорт XLSX/PDF по образцу `src/lib/profitability-export.ts`.
- Интерфейс — строго на английском, тёмная тема, бейдж Stage 4.

## Технические детали

- Все расчёты клиентские, чистые функции в `src/lib/*`, покрытые юнит-тестами (vitest) на референсных примерах из Craft & Hawkins.
- Единицы: imperial (ft, acres, STB, scf, psia).
- Сохранение результатов — таблица `well_reserves` в Cloud с `company_id`, RLS + GRANT, чтобы оценки переиспользовались модулями Stage 7 и Stage 9.

## Порядок работ

1. Volumetric + Reconciliation UI (быстрый видимый результат).
2. Probabilistic Monte Carlo + tornado.
3. Drive-mechanism диагностика (Campbell, gas cap, We).
4. Персистентность в Cloud и связка с SPT Advisor.
