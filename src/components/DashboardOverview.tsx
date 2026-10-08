import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Droplets, 
  Zap, 
  Coins, 
  Coffee, 
  ArrowRight,
  BarChart3,
  Calendar,
  Activity,
  Layers
} from 'lucide-react';
import { MonthlyRecord, ViewTab } from '../types';
import { CoffeeProdChart } from './charts/CoffeeProdChart';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface DashboardOverviewProps {
  data: MonthlyRecord[];
  onNavigate: (tab: ViewTab) => void;
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  onNavigate,
  selectedYears = [2021, 2022, 2023, 2024, 2025, 2026],
  onSelectYears,
  selectedMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  onSelectMonths,
}) => {
  // Filtered data for the active period
  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  const totalMonths = filteredData.length || 1;
  const latest = filteredData[filteredData.length - 1] || data[data.length - 1] || ({} as MonthlyRecord);

  // Aggregate metrics for selected period
  const totalSpendAll = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.cost_total_resources, 0);
  }, [filteredData]);

  const totalRoastedTon = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.prod_roasted_coffee_ton, 0);
  }, [filteredData]);

  const totalInstantTon = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.prod_instant_coffee_ton, 0);
  }, [filteredData]);

  const totalGasM3 = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_total, 0);
  }, [filteredData]);

  const totalEeMWh = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.ee_factory_total, 0);
  }, [filteredData]);

  const totalEeTgs = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.ee_tgs, 0);
  }, [filteredData]);

  const totalGasBoiler = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_boiler, 0);
  }, [filteredData]);

  const totalGasRoasting = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_roasting, 0);
  }, [filteredData]);

  // Last 12 months slice for quick mini widgets
  const recentSlice = useMemo(() => {
    return filteredData.slice(-12);
  }, [filteredData]);

  const periodBadgeText = useMemo(() => {
    if (selectedYears.length === 6) return '2021 — 2026 гг.';
    if (selectedYears.length === 1) return `${selectedYears[0]} год`;
    return `${selectedYears.join(', ')} гг.`;
  }, [selectedYears]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Период: {periodBadgeText} ({filteredData.length} мес.)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Актуально: {latest.month}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Система аналитики производства и энергоресурсов
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Комплексный мониторинг выработки кофе (натуральный и растворимый), баланса энергоносителей (газ, электроэнергия, водоснабжение, КОС, котельная) с детализацией по цехам и затратам.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('data-table')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition-all shadow-sm text-sm"
            >
              <span>Редактировать данные</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI metric cards - Dynamically calculated for active selected period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Coffee Output */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Выпуск кофе всего</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {((totalRoastedTon + totalInstantTon) / 1000).toFixed(1)}k <span className="text-sm font-semibold text-slate-500">тонн</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>НК: <b>{totalRoastedTon.toLocaleString()} т</b></span>
            <span>РК: <b>{totalInstantTon.toLocaleString()} т</b></span>
          </div>
        </div>

        {/* 2. Electricity total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Электроэнергия завод</span>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {(totalEeMWh / 1000).toFixed(2)}k <span className="text-sm font-semibold text-slate-500">МВт/ч</span>
          </p>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>ТГС доля: <b>{totalEeMWh > 0 ? ((totalEeTgs / totalEeMWh) * 100).toFixed(1) : 0}%</b></span>
            <span>Посл. мес: <b>{latest.ee_factory_total} МВт</b></span>
          </div>
        </div>

        {/* 3. Gas Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Потребление газа</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {(totalGasM3 / 1000000).toFixed(2)} <span className="text-sm font-semibold text-slate-500">млн м³</span>
          </p>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Котельная: <b>{totalGasM3 > 0 ? ((totalGasBoiler / totalGasM3) * 100).toFixed(0) : 0}%</b></span>
            <span>Обжарка: <b>{totalGasM3 > 0 ? ((totalGasRoasting / totalGasM3) * 100).toFixed(0) : 0}%</b></span>
          </div>
        </div>

        {/* 4. Total Financial Spend */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Затраты на ресурсы</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900">
            {(totalSpendAll / 1000000).toFixed(1)} <span className="text-sm font-semibold text-emerald-700">млн ₽</span>
          </p>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>В среднем: <b>{(totalSpendAll / totalMonths / 1000000).toFixed(1)} млн/мес</b></span>
            <span className="text-emerald-700 font-bold">100% учет</span>
          </div>
        </div>
      </div>

      {/* Featured Chart Section: Coffee Production Overview Preview */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Основной производственный график: Выпуск кофе и ресурсы
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Сопоставление выработки натурального (НК), растворимого (РК) кофе, расхода электроэнергии (завод, цеха), газа и воды
            </p>
          </div>
          <button
            onClick={() => onNavigate('chart-tgs')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 self-start transition-colors"
          >
            <span>Открыть отдельную страницу графика</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chart View with shared period filter */}
        <CoffeeProdChart
          data={data}
          selectedYears={selectedYears}
          onSelectYears={onSelectYears}
          selectedMonths={selectedMonths}
          onSelectMonths={onSelectMonths}
        />
      </div>

      {/* Subsystem Chart Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Котельная и Газ Card */}
        <div 
          onClick={() => onNavigate('chart-boiler')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                Котельная и Газ
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Баланс природного газа, наработка котлов (м/ч), расход пара и ХВС котельной.
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentSlice}>
                <Area type="monotone" dataKey="gas_total" stroke="#e11d48" fill="#ffe4e6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. КОС Очистные Card */}
        <div 
          onClick={() => onNavigate('chart-kos')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-100 transition-colors">
                <Droplets className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Очистные сооружения (КОС)
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Поступивший сток, суточный промсток, сброс с КОС, подача на ФХО и электроэнергия.
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentSlice}>
                <Area type="monotone" dataKey="kos_inflow" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Электроэнергия цехов Card */}
        <div 
          onClick={() => onNavigate('chart-workshops')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Баланс цехов (ТГС, ЦРК, АКЦ)
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Детализация электропотребления по подразделениям фабрики и долевой энергобаланс.
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentSlice}>
                <Bar dataKey="ee_tgs" stackId="a" fill="#ea580c" />
                <Bar dataKey="ee_crk" stackId="a" fill="#2563eb" />
                <Bar dataKey="ee_akc" stackId="a" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Затраты и Тарифы Card */}
        <div 
          onClick={() => onNavigate('chart-costs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Финансовые затраты и тарифы
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Общие расходы на энергоресурсы (млн руб), динамика тарифов за 1 МВт, 1 м³ газа и ХВС.
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentSlice}>
                <Area type="monotone" dataKey="cost_total_resources" stroke="#15803d" fill="#dcfce7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Удельные показатели на тонну Card */}
        <div 
          onClick={() => onNavigate('chart-specific')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Удельные показатели на тонну
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            кВт·ч на 1 т кофе, м³ газа на 1 т обжарки, энергосебестоимость на тонну продукции.
          </p>
          <div className="h-28 w-full flex items-center justify-center bg-slate-50 rounded-xl text-xs font-semibold text-slate-600">
            📊 Аналитика удельных норм
          </div>
        </div>

        {/* 6. Конструктор графиков Card */}
        <div 
          onClick={() => onNavigate('chart-builder')}
          className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                Конструктор графиков
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Создайте индивидуальный график с любым сочетанием из 35+ показателей фабрики.
          </p>
          <div className="h-28 w-full flex items-center justify-center bg-slate-800/80 rounded-xl text-xs font-semibold text-amber-300">
            🛠️ Произвольное комбинирование метрик
          </div>
        </div>
      </div>
    </div>
  );
};
