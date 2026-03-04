import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileSpreadsheet, ArrowLeft, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const REQUIRED_HEADERS = [
  "номер_скважины", "название_скважины", "оператор", "месторождение", "страна",
];

const OPTIONAL_HEADERS = [
  "тип_скважины", "статус", "район", "широта", "долгота",
  "пласт", "общая_глубина_м", "дебит_нефти_тсут", "дебит_газа_тм3сут",
  "обводненность_проц", "дата_бурения", "дата_ввода",
];

const MAPPING_TABLE = [
  { ru: "номер_скважины", en: "api_number", desc: "Уникальный идентификатор скважины", example: "KZ-MNG-001", required: true },
  { ru: "название_скважины", en: "well_name", desc: "Название или номер скважины", example: "Тенгиз-4521", required: true },
  { ru: "оператор", en: "operator", desc: "Компания-оператор", example: "КазМунайГаз", required: true },
  { ru: "месторождение", en: "formation", desc: "Название месторождения", example: "Тенгиз", required: true },
  { ru: "страна", en: "state", desc: "Код страны", example: "KZ", required: true },
  { ru: "тип_скважины", en: "well_type", desc: "НЕФТЬ / ГАЗ / НАГНЕТАТЕЛЬНАЯ", example: "НЕФТЬ", required: false },
  { ru: "статус", en: "status", desc: "ДЕЙСТВУЮЩАЯ / БЕЗДЕЙСТВУЮЩАЯ / В КОНСЕРВАЦИИ", example: "ДЕЙСТВУЮЩАЯ", required: false },
  { ru: "район", en: "county", desc: "Область или район", example: "Атырауская обл.", required: false },
  { ru: "широта", en: "latitude", desc: "Широта (десятичные градусы)", example: "46.1512", required: false },
  { ru: "долгота", en: "longitude", desc: "Долгота (десятичные градусы)", example: "53.3402", required: false },
  { ru: "пласт", en: "formation", desc: "Продуктивный горизонт / пласт", example: "ПК1", required: false },
  { ru: "общая_глубина_м", en: "total_depth", desc: "Глубина забоя в метрах", example: "5200", required: false },
  { ru: "дебит_нефти_тсут", en: "production_oil", desc: "Дебит нефти, тонн/сутки", example: "12.5", required: false },
  { ru: "дебит_газа_тм3сут", en: "production_gas", desc: "Дебит газа, тыс. м³/сутки", example: "45.0", required: false },
  { ru: "обводненность_проц", en: "water_cut", desc: "Обводнённость, %", example: "32", required: false },
  { ru: "дата_бурения", en: "spud_date", desc: "Дата начала бурения (ГГГГ-ММ-ДД)", example: "2019-03-15", required: false },
  { ru: "дата_ввода", en: "completion_date", desc: "Дата ввода в эксплуатацию (ГГГГ-ММ-ДД)", example: "2019-08-20", required: false },
];

const SAMPLE_ROWS = [
  ["KZ-MNG-001", "Тенгиз-4521", "ТенгизШевроил", "Тенгиз", "KZ", "НЕФТЬ", "ДЕЙСТВУЮЩАЯ", "Атырауская обл.", "46.1512", "53.3402", "ПК1", "5200", "12.5", "45.0", "32", "2019-03-15", "2019-08-20"],
  ["KZ-MNG-002", "Кашаган-Восток-12", "NCOC", "Кашаган", "KZ", "НЕФТЬ", "ДЕЙСТВУЮЩАЯ", "Атырауская обл.", "46.3201", "51.8734", "Карбонатный", "4800", "18.3", "120.0", "15", "2016-06-10", "2017-01-22"],
  ["KZ-MNG-003", "Карачаганак-G78", "КПО", "Карачаганак", "KZ", "ГАЗ", "ДЕЙСТВУЮЩАЯ", "ЗКО", "50.0678", "51.7890", "Девон", "5500", "2.1", "350.0", "8", "2012-11-01", "2013-05-15"],
  ["KZ-MNG-004", "Узень-1205", "ОзенМунайГаз", "Узень", "KZ", "НЕФТЬ", "БЕЗДЕЙСТВУЮЩАЯ", "Мангистауская обл.", "43.2345", "53.1567", "Юра-XIII", "2100", "0", "0", "95", "1975-04-20", "1975-09-10"],
  ["KZ-MNG-005", "Жанажол-А45", "CNPC-AI", "Жанажол", "KZ", "НЕФТЬ", "ДЕЙСТВУЮЩАЯ", "Актобинская обл.", "48.5678", "57.1234", "КТ-II", "3800", "8.7", "25.0", "42", "2005-08-12", "2006-02-28"],
];

const downloadCSV = () => {
  const headers = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].join(",");
  const rows = SAMPLE_ROWS.map((r) => r.join(",")).join("\n");
  const csv = `${headers}\n${rows}\n`;
  const bom = "\uFEFF"; // BOM for Excel Cyrillic support
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "шаблон_импорта_скважин_KZ.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const downloadInstructions = () => {
  const text = `ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ ШАБЛОНА ИМПОРТА СКВАЖИН
==================================================

Платформа: SGOM AI — интеллектуальная аналитика нефтегазовых активов
Версия шаблона: 1.0 (Казахстан, метрическая система)

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (без них импорт невозможен):
- номер_скважины — уникальный идентификатор (например: KZ-MNG-001)
- название_скважины — название или номер скважины в вашей системе
- оператор — название компании-оператора
- месторождение — название месторождения
- страна — код страны (KZ для Казахстана)

ЕДИНИЦЫ ИЗМЕРЕНИЯ:
- Глубина: метры (м)
- Дебит нефти: тонн/сутки (т/сут)
- Дебит газа: тыс. м³/сутки (тыс.м³/сут)
- Обводнённость: процент (%)
- Координаты: десятичные градусы (WGS84)
- Даты: формат ГГГГ-ММ-ДД (например: 2019-03-15)

РЕКОМЕНДАЦИИ:
1. Заполните минимум 10-20 скважин для качественного анализа
2. Чем больше данных о добыче — тем точнее прогнозы AI
3. Для AI-анализа керна подготовьте фотографии отдельно (JPG/PNG)
4. При наличии каротажных данных (GR, Neutron, Resistivity) — свяжитесь с нами

ПОДДЕРЖКА: info@sgom.ai
`;
  const bom = "\uFEFF";
  const blob = new Blob([bom + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "инструкция_заполнения_шаблона.txt";
  a.click();
  URL.revokeObjectURL(url);
};

const KazakhstanTemplate = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              Шаблон импорта скважин — Казахстан
            </h1>
            <p className="text-muted-foreground mt-1">
              CSV-файл с метрической системой и русскими подписями колонок для отправки казахстанским операторам
            </p>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadCSV} size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Скачать CSV-шаблон
          </Button>
          <Button onClick={downloadInstructions} variant="outline" size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Скачать инструкцию
          </Button>
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-primary/30">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">17</p>
              <p className="text-sm text-muted-foreground mt-1">Полей в шаблоне</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground mt-1">Обязательных полей</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-primary">Метрическая</p>
              <p className="text-sm text-muted-foreground mt-1">Система единиц</p>
            </CardContent>
          </Card>
        </div>

        {/* Column mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Описание колонок
            </CardTitle>
            <CardDescription>
              Маппинг русских названий колонок на внутренние поля платформы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left">Колонка (RU)</th>
                    <th className="px-3 py-2 text-left">Поле в системе</th>
                    <th className="px-3 py-2 text-left">Описание</th>
                    <th className="px-3 py-2 text-left">Пример</th>
                    <th className="px-3 py-2 text-center">Обяз.</th>
                  </tr>
                </thead>
                <tbody>
                  {MAPPING_TABLE.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                      <td className="px-3 py-2 font-mono text-xs">{row.ru}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.en}</td>
                      <td className="px-3 py-2 text-xs">{row.desc}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.example}</td>
                      <td className="px-3 py-2 text-center">
                        {row.required ? (
                          <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Предварительный просмотр шаблона</CardTitle>
            <CardDescription>5 примеров скважин крупнейших месторождений Казахстана</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b bg-muted/20">
                    {[...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].map((h) => (
                      <th
                        key={h}
                        className={`px-2 py-1.5 text-left whitespace-nowrap ${
                          REQUIRED_HEADERS.includes(h) ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {h}
                        {REQUIRED_HEADERS.includes(h) && <span className="text-destructive ml-0.5">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Units note */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Важно: единицы измерения</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Глубина</strong> — метры (м), не футы</li>
                  <li>• <strong>Дебит нефти</strong> — тонн/сутки (т/сут), не баррели</li>
                  <li>• <strong>Дебит газа</strong> — тыс. м³/сутки (тыс.м³/сут), не MCF</li>
                  <li>• <strong>Обводнённость</strong> — проценты (%)</li>
                  <li>• <strong>Координаты</strong> — десятичные градусы WGS84</li>
                  <li>• <strong>Даты</strong> — ГГГГ-ММ-ДД (ISO 8601)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minimum requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Минимальные требования для пилота</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">Обязательно</Badge>
                <ul className="text-sm space-y-1 text-muted-foreground mt-2">
                  <li>✅ 10–20 скважин с паспортными данными</li>
                  <li>✅ Координаты (широта, долгота)</li>
                  <li>✅ Текущие дебиты нефти/газа</li>
                  <li>✅ Обводнённость</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Желательно</Badge>
                <ul className="text-sm space-y-1 text-muted-foreground mt-2">
                  <li>📸 Фотографии керна (JPG/PNG) — для AI-анализа</li>
                  <li>📊 Каротажные диаграммы (LAS/CSV)</li>
                  <li>📈 Помесячная история добычи (1–2 года)</li>
                  <li>💰 OPEX на скважину, стоимость ГТМ</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KazakhstanTemplate;
