import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileCode, 
  Download,
  Upload, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MonthlyRecord } from '../types';
import { exportPageAsHtml, exportFullDashboardHtml } from '../utils/exportUtils';
import * as XLSX from 'xlsx';

interface DataTableProps {
  data: MonthlyRecord[];
  onAddRecord: (record: Omit<MonthlyRecord, 'id'>) => void;
  onUpdateRecord: (id: string, record: Partial<MonthlyRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onResetDefault: () => void;
  onImportData: (records: MonthlyRecord[]) => void;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const MONTH_SHORTS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

type ColumnGroup = 'all' | 'prod' | 'kos' | 'boiler' | 'workshops' | 'costs';

export const DataTable: React.FC<DataTableProps> = ({
  data,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onResetDefault,
  onImportData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [activeGroup, setActiveGroup] = useState<ColumnGroup>('all');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<MonthlyRecord> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered rows in real time by year or month
  const filteredData = useMemo(() => {
    const rawTerm = searchTerm.trim().toLowerCase();
    return data.filter((row) => {
      const matchYear = selectedYear === 'all' || row.year === selectedYear;
      if (!matchYear) return false;
      if (!rawTerm) return true;

      // Allow multiple tokens, e.g. "2026 сен" or "сентябрь 26"
      const tokens = rawTerm.split(/\s+/).filter(Boolean);

      const fullMonth = row.month.toLowerCase(); // "сентябрь 2026"
      const shortMonth = row.monthShort.toLowerCase(); // "сен"
      const monthRu = MONTH_NAMES[row.monthIndex - 1]?.toLowerCase() || ''; // "сентябрь"
      const yearStr = String(row.year); // "2026"
      const yearShort = String(row.year).slice(-2); // "26"
      const monthIdxStr = String(row.monthIndex); // "9"
      const monthIdxPadded = String(row.monthIndex).padStart(2, '0'); // "09"
      const dateIso = `${yearStr}-${monthIdxPadded}`; // "2026-09"
      const dateDot = `${monthIdxPadded}.${yearStr}`; // "09.2026"

      const searchableHaystack = `${fullMonth} ${shortMonth} ${monthRu} ${yearStr} '${yearShort} ${monthIdxStr} ${monthIdxPadded} ${dateIso} ${dateDot}`;

      return tokens.every((token) => searchableHaystack.includes(token));
    });
  }, [data, selectedYear, searchTerm]);

  // Open modal for new record
  const handleOpenNewModal = () => {
    const lastRecord = data[data.length - 1] || {};
    let nextYear = lastRecord.year || 2026;
    let nextMonthIndex = (lastRecord.monthIndex || 7) + 1;
    if (nextMonthIndex > 12) {
      nextMonthIndex = 1;
      nextYear += 1;
    }

    const newRecord: Partial<MonthlyRecord> = {
      year: nextYear,
      monthIndex: nextMonthIndex,
      month: `${MONTH_NAMES[nextMonthIndex - 1]} ${nextYear}`,
      monthShort: MONTH_SHORTS[nextMonthIndex - 1],
      kos_inflow: 14000,
      kos_daily_industrial: 13000,
      kos_discharge: 19000,
      kos_fho: 18000,
      kos_hvs: 350,
      kos_ee: 28,
      boiler_hvs_factory_total: 17000,
      boiler_hvs_boiler: 2300,
      boiler_hours: 1400,
      boiler_ee: 30,
      gas_total: 480000,
      gas_boiler: 310000,
      gas_roasting: 170000,
      ee_tgs: 220,
      ee_crk: 350,
      ee_akc: 670,
      hvs_akc: 1200,
      ee_roasting_czh: 480,
      ee_akc_rk: 1.8,
      hvs_akc_rk: 3.2,
      ee_crk_rk: 0.95,
      pressure_bar: 7.5,
      price_hvs: lastRecord.price_hvs || 71.11,
      price_gas: lastRecord.price_gas || 9.47,
      ee_factory_total: 1870,
      price_ee: lastRecord.price_ee || 8800,
      cost_hvs_total: 0,
      cost_gas_total: 0,
      cost_ee_total: 0,
      cost_hvs_boiler: 0,
      cost_gas_boiler: 0,
      cost_ee_boiler: 0,
      cost_ee_crk: 0,
      cost_ee_akc: 0,
      cost_ee_tgs: 0,
      cost_ee_kos: 0,
      cost_ee_czh_cf: 0,
      cost_total_resources: 0,
      prod_roasted_coffee_ton: 1900,
      prod_instant_coffee_ton: 380,
      prod_spray_dry_kg: 0,
    };

    // Calculate initial costs
    calcCosts(newRecord);

    setEditingRecord(newRecord);
    setIsCreatingNew(true);
    setIsEditModalOpen(true);
  };

  // Open modal for editing record
  const handleOpenEditModal = (record: MonthlyRecord) => {
    setEditingRecord({ ...record });
    setIsCreatingNew(false);
    setIsEditModalOpen(true);
  };

  // Helper auto-calculate costs based on consumption & tariffs
  const calcCosts = (rec: Partial<MonthlyRecord>) => {
    const priceHvs = Number(rec.price_hvs) || 0;
    const priceGas = Number(rec.price_gas) || 0;
    const priceEe = Number(rec.price_ee) || 0;

    const costHvsTotal = Math.round((Number(rec.boiler_hvs_factory_total) || 0) * priceHvs);
    const costGasTotal = Math.round((Number(rec.gas_total) || 0) * priceGas);
    const costEeTotal = Math.round((Number(rec.ee_factory_total) || 0) * priceEe);

    rec.cost_hvs_total = costHvsTotal;
    rec.cost_gas_total = costGasTotal;
    rec.cost_ee_total = costEeTotal;

    rec.cost_hvs_boiler = Math.round((Number(rec.boiler_hvs_boiler) || 0) * priceHvs);
    rec.cost_gas_boiler = Math.round((Number(rec.gas_boiler) || 0) * priceGas);
    rec.cost_ee_boiler = Math.round((Number(rec.boiler_ee) || 0) * priceEe);
    rec.cost_ee_crk = Math.round((Number(rec.ee_crk) || 0) * priceEe);
    rec.cost_ee_akc = Math.round((Number(rec.ee_akc) || 0) * priceEe);
    rec.cost_ee_tgs = Math.round((Number(rec.ee_tgs) || 0) * priceEe);
    rec.cost_ee_kos = Math.round((Number(rec.kos_ee) || 0) * priceEe);
    rec.cost_ee_czh_cf = Math.round((Number(rec.ee_roasting_czh) || 0) * priceEe);

    rec.cost_total_resources = costHvsTotal + costGasTotal + costEeTotal;
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editingRecord.year || !editingRecord.monthIndex) return;

    // Refresh month titles
    const monthTitle = `${MONTH_NAMES[editingRecord.monthIndex - 1]} ${editingRecord.year}`;
    const monthShort = MONTH_SHORTS[editingRecord.monthIndex - 1];

    const finalRecord: MonthlyRecord = {
      id: `${editingRecord.year}-${String(editingRecord.monthIndex).padStart(2, '0')}`,
      month: monthTitle,
      year: Number(editingRecord.year),
      monthIndex: Number(editingRecord.monthIndex),
      monthShort: monthShort,
      kos_inflow: Number(editingRecord.kos_inflow) || 0,
      kos_daily_industrial: Number(editingRecord.kos_daily_industrial) || 0,
      kos_discharge: Number(editingRecord.kos_discharge) || 0,
      kos_fho: Number(editingRecord.kos_fho) || 0,
      kos_hvs: Number(editingRecord.kos_hvs) || 0,
      kos_ee: Number(editingRecord.kos_ee) || 0,
      boiler_hvs_factory_total: Number(editingRecord.boiler_hvs_factory_total) || 0,
      boiler_hvs_boiler: Number(editingRecord.boiler_hvs_boiler) || 0,
      boiler_hours: Number(editingRecord.boiler_hours) || 0,
      boiler_ee: Number(editingRecord.boiler_ee) || 0,
      gas_total: Number(editingRecord.gas_total) || 0,
      gas_boiler: Number(editingRecord.gas_boiler) || 0,
      gas_roasting: Number(editingRecord.gas_roasting) || 0,
      ee_tgs: Number(editingRecord.ee_tgs) || 0,
      ee_crk: Number(editingRecord.ee_crk) || 0,
      ee_akc: Number(editingRecord.ee_akc) || 0,
      hvs_akc: Number(editingRecord.hvs_akc) || 0,
      ee_roasting_czh: Number(editingRecord.ee_roasting_czh) || 0,
      ee_akc_rk: Number(editingRecord.ee_akc_rk) || 0,
      hvs_akc_rk: Number(editingRecord.hvs_akc_rk) || 0,
      ee_crk_rk: Number(editingRecord.ee_crk_rk) || 0,
      pressure_bar: Number(editingRecord.pressure_bar) || 0,
      price_hvs: Number(editingRecord.price_hvs) || 0,
      price_gas: Number(editingRecord.price_gas) || 0,
      ee_factory_total: Number(editingRecord.ee_factory_total) || 0,
      price_ee: Number(editingRecord.price_ee) || 0,
      cost_hvs_total: Number(editingRecord.cost_hvs_total) || 0,
      cost_gas_total: Number(editingRecord.cost_gas_total) || 0,
      cost_ee_total: Number(editingRecord.cost_ee_total) || 0,
      cost_hvs_boiler: Number(editingRecord.cost_hvs_boiler) || 0,
      cost_gas_boiler: Number(editingRecord.cost_gas_boiler) || 0,
      cost_ee_boiler: Number(editingRecord.cost_ee_boiler) || 0,
      cost_ee_crk: Number(editingRecord.cost_ee_crk) || 0,
      cost_ee_akc: Number(editingRecord.cost_ee_akc) || 0,
      cost_ee_tgs: Number(editingRecord.cost_ee_tgs) || 0,
      cost_ee_kos: Number(editingRecord.cost_ee_kos) || 0,
      cost_ee_czh_cf: Number(editingRecord.cost_ee_czh_cf) || 0,
      cost_total_resources: Number(editingRecord.cost_total_resources) || 0,
      prod_roasted_coffee_ton: Number(editingRecord.prod_roasted_coffee_ton) || 0,
      prod_instant_coffee_ton: Number(editingRecord.prod_instant_coffee_ton) || 0,
      prod_spray_dry_kg: Number(editingRecord.prod_spray_dry_kg) || 0,
    };

    if (isCreatingNew) {
      onAddRecord(finalRecord);
      showNotification(`Запись за ${monthTitle} успешно добавлена!`);
    } else {
      onUpdateRecord(finalRecord.id, finalRecord);
      showNotification(`Запись за ${monthTitle} успешно обновлена!`);
    }

    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // Excel / CSV File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json<MonthlyRecord>(ws);

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          onImportData(jsonData);
          showNotification(`Импортировано ${jsonData.length} записей!`);
        }
      } catch (err) {
        alert('Ошибка при чтении файла Excel/CSV. Проверьте структуру данных.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-600 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add New Record Button */}
          <button
            id="btn-add-record"
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Внести новые данные</span>
          </button>

          {/* Search Box by year or month in real-time */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по году или месяцу (напр. 2026, сен, 09)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-amber-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-800 placeholder:text-slate-400 font-medium transition-all"
              title="Фильтрация в реальном времени по году (2026, 2025...) или месяцу (сентябрь, сен, 09...)"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Очистить поиск"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-medium shrink-0"
          >
            <option value="all">Все годы (2021-2026)</option>
            <option value="2026">2026 год</option>
            <option value="2025">2025 год</option>
            <option value="2024">2024 год</option>
            <option value="2023">2023 год</option>
            <option value="2022">2022 год</option>
            <option value="2021">2021 год</option>
          </select>

          {/* Count Badge */}
          <div className="text-xs font-semibold px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 shrink-0">
            {filteredData.length === data.length ? (
              <span>Всего: <b className="text-slate-900">{data.length}</b> записей</span>
            ) : (
              <span>Найдено: <b className="text-amber-700">{filteredData.length}</b> из {data.length}</span>
            )}
          </div>
        </div>

        {/* Import / Export & Reset actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Import file */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-semibold border border-slate-300 transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Импорт Excel/CSV</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Excel (Показатели) */}
          <button
            onClick={() => {
              try {
                const ws = XLSX.utils.json_to_sheet(filteredData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Показатели');
                XLSX.writeFile(wb, 'Показатели.xlsx');
                showNotification('Файл "Показатели.xlsx" успешно скачан!');
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 transition-colors"
            title="Скачать таблицу показателей в формате Excel (Показатели.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Скачать Excel (Показатели)</span>
          </button>

          {/* Export HTML Interactive */}
          <button
            onClick={() => exportPageAsHtml('data-table-container', 'База_данных_энергоресурсы', filteredData)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold border border-purple-300 transition-colors"
            title="Выгрузить данные в интерактивный HTML-отчет"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-600" />
            <span>Экспорт HTML</span>
          </button>

          {/* Export Full Dashboard HTML */}
          <button
            onClick={() => exportFullDashboardHtml(data)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-300 transition-colors"
            title="Выгрузить весь дашборд с вкладками и сохранением данных в HTML"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Весь дашборд (HTML)</span>
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              if (confirm('Сбросить все внесенные изменения к исходным заводским данным?')) {
                onResetDefault();
                showNotification('Данные сброшены к исходным!');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 text-xs transition-colors"
            title="Сброс к исходным значениям"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс</span>
          </button>
        </div>
      </div>

      {/* Column Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium px-1">Группы колонок:</span>
        {[
          { id: 'all', label: 'Все показатели (35+)' },
          { id: 'prod', label: '☕ Производство кофе' },
          { id: 'boiler', label: '🏭 Котельная & Газ' },
          { id: 'kos', label: '💧 КОС (Очистные)' },
          { id: 'workshops', label: '⚡ Электроэнергия цехов' },
          { id: 'costs', label: '💰 Тарифы & Затраты (₽)' },
        ].map((grp) => (
          <button
            key={grp.id}
            onClick={() => setActiveGroup(grp.id as ColumnGroup)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border ${
              activeGroup === grp.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {grp.label}
          </button>
        ))}
      </div>

      {/* Main Table View with horizontal scroll */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 sticky top-0 z-10 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-100 z-20 border-r border-slate-300 min-w-[130px]">Месяц</th>
                <th className="p-2.5 text-center">Действия</th>

                {/* Prod & TGS */}
                {(activeGroup === 'all' || activeGroup === 'prod') && (
                  <>
                    <th className="p-2.5 bg-amber-50/80 text-amber-900 border-l border-slate-300">НК, тонн</th>
                    <th className="p-2.5 bg-amber-50/80 text-amber-900">РК, тонн</th>
                    <th className="p-2.5 bg-amber-50/80 text-amber-900">SprayDry, кг</th>
                    <th className="p-2.5 bg-orange-50/80 text-orange-900">ЭЭ ТГС (МВт/ч)</th>
                  </>
                )}

                {/* Boiler */}
                {(activeGroup === 'all' || activeGroup === 'boiler') && (
                  <>
                    <th className="p-2.5 bg-rose-50/80 text-rose-900 border-l border-slate-300">Газ общий (м³)</th>
                    <th className="p-2.5 bg-rose-50/80 text-rose-900">Газ котельная (м³)</th>
                    <th className="p-2.5 bg-rose-50/80 text-rose-900">Газ цех жарки (м³)</th>
                    <th className="p-2.5 bg-amber-50/80 text-amber-900">Наработка котлов (м/ч)</th>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900">ХВС котельной (м³)</th>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900">ХВС завод (м³)</th>
                    <th className="p-2.5 bg-indigo-50/80 text-indigo-900">ЭЭ котельная (МВт/ч)</th>
                  </>
                )}

                {/* KOS */}
                {(activeGroup === 'all' || activeGroup === 'kos') && (
                  <>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900 border-l border-slate-300">Сток на КОС (м³)</th>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900">Суточный промсток (м³)</th>
                    <th className="p-2.5 bg-emerald-50/80 text-emerald-900">Сброс с КОС (м³)</th>
                    <th className="p-2.5 bg-indigo-50/80 text-indigo-900">На ФХО (м³)</th>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900">ХВС для КОС (м³)</th>
                    <th className="p-2.5 bg-amber-50/80 text-amber-900">ЭЭ КОС (МВт/ч)</th>
                  </>
                )}

                {/* Workshops */}
                {(activeGroup === 'all' || activeGroup === 'workshops') && (
                  <>
                    <th className="p-2.5 bg-blue-50/80 text-blue-900 border-l border-slate-300">ЭЭ ЦРК (МВт/ч)</th>
                    <th className="p-2.5 bg-purple-50/80 text-purple-900">ЭЭ АКЦ (МВт/ч)</th>
                    <th className="p-2.5 bg-sky-50/80 text-sky-900">ХВС для АКЦ (м³)</th>
                    <th className="p-2.5 bg-pink-50/80 text-pink-900">ЭЭ ЦЖ (МВт/ч)</th>
                    <th className="p-2.5 bg-indigo-50/80 text-indigo-900">ЭЭ завод всего (МВт/ч)</th>
                  </>
                )}

                {/* Costs & Tariffs */}
                {(activeGroup === 'all' || activeGroup === 'costs') && (
                  <>
                    <th className="p-2.5 bg-slate-200 text-slate-900 border-l border-slate-300">Цена ЭЭ (₽/МВт)</th>
                    <th className="p-2.5 bg-slate-200 text-slate-900">Цена Газ (₽/м³)</th>
                    <th className="p-2.5 bg-slate-200 text-slate-900">Цена ХВС (₽/м³)</th>
                    <th className="p-2.5 bg-emerald-100 text-emerald-950 font-black">Итого затраты (₽)</th>
                    <th className="p-2.5 bg-yellow-50 text-yellow-900">Затраты ЭЭ (₽)</th>
                    <th className="p-2.5 bg-rose-50 text-rose-900">Затраты Газ (₽)</th>
                    <th className="p-2.5 bg-sky-50 text-sky-900">Затраты ХВС (₽)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={35} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-800">Записи не найдены</p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {searchTerm
                          ? `По запросу «${searchTerm}» ${selectedYear !== 'all' ? `за ${selectedYear} год` : ''} не найдено записей.`
                          : 'Нет записей для выбранного периода.'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Очистить поиск
                          </button>
                        )}
                        {selectedYear !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setSelectedYear('all')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Показать все годы
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Month sticky cell */}
                  <td className="p-3 font-bold sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-300 text-slate-900">
                    {row.month}
                  </td>

                  {/* Actions cell */}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(row)}
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Редактировать запись"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить запись за ${row.month}?`)) {
                            onDeleteRecord(row.id);
                            showNotification(`Запись за ${row.month} удалена.`);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Prod & TGS */}
                  {(activeGroup === 'all' || activeGroup === 'prod') && (
                    <>
                      <td className="p-2.5 font-bold text-amber-900 border-l border-slate-200">{row.prod_roasted_coffee_ton.toLocaleString()}</td>
                      <td className="p-2.5 font-bold text-yellow-900">{row.prod_instant_coffee_ton.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-600">{row.prod_spray_dry_kg}</td>
                      <td className="p-2.5 font-bold text-orange-700">{row.ee_tgs}</td>
                    </>
                  )}

                  {/* Boiler */}
                  {(activeGroup === 'all' || activeGroup === 'boiler') && (
                    <>
                      <td className="p-2.5 font-semibold text-rose-800 border-l border-slate-200">{row.gas_total.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.gas_boiler.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.gas_roasting.toLocaleString()}</td>
                      <td className="p-2.5 font-semibold text-amber-800">{row.boiler_hours.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.boiler_hvs_boiler.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.boiler_hvs_factory_total.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.boiler_ee}</td>
                    </>
                  )}

                  {/* KOS */}
                  {(activeGroup === 'all' || activeGroup === 'kos') && (
                    <>
                      <td className="p-2.5 font-semibold text-sky-800 border-l border-slate-200">{row.kos_inflow.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.kos_daily_industrial.toLocaleString()}</td>
                      <td className="p-2.5 font-semibold text-emerald-800">{row.kos_discharge.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.kos_fho.toLocaleString()}</td>
                      <td className="p-2.5 text-slate-700">{row.kos_hvs}</td>
                      <td className="p-2.5 text-slate-700">{row.kos_ee}</td>
                    </>
                  )}

                  {/* Workshops */}
                  {(activeGroup === 'all' || activeGroup === 'workshops') && (
                    <>
                      <td className="p-2.5 text-blue-700 font-semibold border-l border-slate-200">{row.ee_crk}</td>
                      <td className="p-2.5 text-purple-700 font-semibold">{row.ee_akc}</td>
                      <td className="p-2.5 text-slate-700">{row.hvs_akc.toLocaleString()}</td>
                      <td className="p-2.5 text-pink-700 font-semibold">{row.ee_roasting_czh}</td>
                      <td className="p-2.5 font-bold text-slate-900">{row.ee_factory_total}</td>
                    </>
                  )}

                  {/* Costs */}
                  {(activeGroup === 'all' || activeGroup === 'costs') && (
                    <>
                      <td className="p-2.5 text-slate-700 border-l border-slate-200">{row.price_ee} ₽</td>
                      <td className="p-2.5 text-slate-700">{row.price_gas} ₽</td>
                      <td className="p-2.5 text-slate-700">{row.price_hvs} ₽</td>
                      <td className="p-2.5 font-black text-emerald-700 bg-emerald-50/50">{row.cost_total_resources.toLocaleString()} ₽</td>
                      <td className="p-2.5 text-slate-700">{row.cost_ee_total.toLocaleString()} ₽</td>
                      <td className="p-2.5 text-slate-700">{row.cost_gas_total.toLocaleString()} ₽</td>
                      <td className="p-2.5 text-slate-700">{row.cost_hvs_total.toLocaleString()} ₽</td>
                    </>
                  )}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Edit / Create Modal Dialog */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isCreatingNew ? '➕ Добавление нового месяца' : `✏️ Редактирование записи: ${editingRecord.month}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Заполните показатели расхода энергоресурсов, выпуска продукции и тарифов
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-6">
              {/* Period selection */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Год</label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={editingRecord.year || 2026}
                    onChange={(e) => setEditingRecord({ ...editingRecord, year: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Месяц</label>
                  <select
                    value={editingRecord.monthIndex || 1}
                    onChange={(e) => setEditingRecord({ ...editingRecord, monthIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">НК (Натуральный кофе, т)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingRecord.prod_roasted_coffee_ton || 0}
                    onChange={(e) => setEditingRecord({ ...editingRecord, prod_roasted_coffee_ton: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">РК (Растворимый, т)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingRecord.prod_instant_coffee_ton || 0}
                    onChange={(e) => setEditingRecord({ ...editingRecord, prod_instant_coffee_ton: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-yellow-900"
                  />
                </div>
              </div>

              {/* TGS & Department EE Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Энергоресурсы ТГС и Цеха
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ ТГС (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.ee_tgs || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, ee_tgs: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-orange-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ ЦРК (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.ee_crk || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, ee_crk: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ АКЦ (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.ee_akc || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, ee_akc: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ ЦЖ (Обжарка)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.ee_roasting_czh || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, ee_roasting_czh: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ХВС для АКЦ (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.hvs_akc || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, hvs_akc: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ завод всего (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.ee_factory_total || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, ee_factory_total: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-indigo-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">SprayDry (кг)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.prod_spray_dry_kg || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, prod_spray_dry_kg: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Boiler & Gas Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Котельная и Газ
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1">Газ общий (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.gas_total || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, gas_total: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Газ котельная (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.gas_boiler || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, gas_boiler: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Газ цех жарки (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.gas_roasting || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, gas_roasting: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Наработка котлов (м/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.boiler_hours || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, boiler_hours: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ХВС для котельной (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.boiler_hvs_boiler || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, boiler_hvs_boiler: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ХВС завод общий (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.boiler_hvs_factory_total || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, boiler_hvs_factory_total: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ котельная (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.boiler_ee || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, boiler_ee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* KOS Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  КОС (Очистные сооружения)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1">Сток на КОС (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_inflow || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_inflow: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Суточный промсток (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_daily_industrial || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_daily_industrial: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Сброс с КОС (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_discharge || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_discharge: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">На ФХО (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_fho || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_fho: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ХВС для КОС (м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_hvs || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_hvs: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ЭЭ КОС (МВт/ч)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.kos_ee || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, kos_ee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Tariffs & Costs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Тарифы и Затраты (вводятся без НДС)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ставка НДС для {editingRecord.year || 2026} г.: <b className="text-purple-700">{(editingRecord.year || 2026) >= 2026 ? '22%' : '20%'}</b>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      calcCosts(editingRecord);
                      setEditingRecord({ ...editingRecord });
                    }}
                    className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Пересчитать затраты по тарифам</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1">Тариф ЭЭ без НДС (₽/МВт)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.price_ee || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, price_ee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Тариф Газ без НДС (₽/м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.price_gas || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, price_gas: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-rose-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Тариф ХВС без НДС (₽/м³)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.price_hvs || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, price_hvs: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-sky-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Общие затраты б/НДС (₽)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.cost_total_resources || 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, cost_total_resources: Number(e.target.value) })}
                      className="w-full bg-emerald-50 border border-emerald-300 rounded p-1.5 font-black text-emerald-900"
                    />
                  </div>
                </div>
                {/* VAT Preview Box */}
                <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-950">
                  <span>
                    💡 С учетом НДС (<b>{(editingRecord.year || 2026) >= 2026 ? '22%' : '20%'}</b>):
                  </span>
                  <span className="font-black">
                    ~{Math.round((editingRecord.cost_total_resources || 0) * ((editingRecord.year || 2026) >= 2026 ? 1.22 : 1.20)).toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить запись</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
