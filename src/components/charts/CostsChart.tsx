import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MonthlyRecord } from '../../types';
import { ExportToolbar, SeriesToggleItem } from '../ExportToolbar';
import { Percent } from 'lucide-react';

interface CostsChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const CostsChart: React.FC<CostsChartProps> = ({
  data,
  selectedYears: propSelectedYears,
  onSelectYears: propOnSelectYears,
  selectedMonths: propSelectedMonths,
  onSelectMonths: propOnSelectMonths,
}) => {
  const [internalYears, setInternalYears] = useState<number[]>([2021, 2022, 2023, 2024, 2025, 2026]);
  const [internalMonths, setInternalMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const selectedYears = propSelectedYears || internalYears;
  const setSelectedYears = propOnSelectYears || setInternalYears;
  const selectedMonths = propSelectedMonths || internalMonths;
  const setSelectedMonths = propOnSelectMonths || setInternalMonths;

  const [showDataLabels, setShowDataLabels] = useState(true);
  const [includeVat, setIncludeVat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine active VAT label based on currently selected years
  const { vatLabel, vatBadgeTitle, vatKpiTag, has2026Plus, hasBefore2026 } = useMemo(() => {
    const has2026Plus = selectedYears.some((y) => y >= 2026);
    const hasBefore2026 = selectedYears.some((y) => y < 2026);

    let vatLabel = 'Без НДС';
    let vatBadgeTitle = 'Без учета НДС';
    let vatKpiTag = 'б/НДС';

    if (includeVat) {
      if (has2026Plus && !hasBefore2026) {
        vatLabel = 'С НДС (22%)';
        vatBadgeTitle = 'С учетом НДС 22%';
        vatKpiTag = 'с НДС 22%';
      } else if (!has2026Plus && hasBefore2026) {
        vatLabel = 'С НДС (20%)';
        vatBadgeTitle = 'С учетом НДС 20%';
        vatKpiTag = 'с НДС 20%';
      } else {
        vatLabel = 'С НДС (20% / 22%)';
        vatBadgeTitle = 'С учетом НДС (до 2025 г. — 20%, с 2026 г. — 22%)';
        vatKpiTag = 'с НДС';
      }
    }

    return { vatLabel, vatBadgeTitle, vatKpiTag, has2026Plus, hasBefore2026 };
  }, [includeVat, selectedYears]);

  // Series toggles
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
    ee_cost: true,
    gas_cost: true,
    hvs_cost: true,
    total_cost: true,
    ee_price: true,
    gas_price: true,
    hvs_price: true,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter data strictly by selected years and months with year-aware VAT
  const filteredData = useMemo(() => {
    const raw = data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));

    return raw.map((d) => {
      const vatRate = d.year >= 2026 ? 0.22 : 0.20;
      const vatMultiplier = includeVat ? (1 + vatRate) : 1.0;

      return {
        ...d,
        appliedVatRate: vatRate,
        appliedVatPct: Math.round(vatRate * 100),
        cost_total_resources_calc: Math.round(d.cost_total_resources * vatMultiplier),
        cost_ee_total_calc: Math.round(d.cost_ee_total * vatMultiplier),
        cost_gas_total_calc: Math.round(d.cost_gas_total * vatMultiplier),
        cost_hvs_total_calc: Math.round(d.cost_hvs_total * vatMultiplier),
        price_ee_calc: Number((d.price_ee * vatMultiplier).toFixed(2)),
        price_gas_calc: Number((d.price_gas * vatMultiplier).toFixed(2)),
        price_hvs_calc: Number((d.price_hvs * vatMultiplier).toFixed(2)),
        axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`,
      };
    });
  }, [data, selectedYears, selectedMonths, includeVat]);

  // Aggregate stats strictly for the selected filtered period
  const totalSpend = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.cost_total_resources_calc, 0);
  }, [filteredData]);

  const totalEeSpend = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.cost_ee_total_calc, 0);
  }, [filteredData]);

  const totalGasSpend = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.cost_gas_total_calc, 0);
  }, [filteredData]);

  const totalHvsSpend = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.cost_hvs_total_calc, 0);
  }, [filteredData]);

  const avgMonthlySpend = useMemo(() => {
    if (!filteredData.length) return 0;
    return Math.round(totalSpend / filteredData.length);
  }, [totalSpend, filteredData]);

  const pieData = useMemo(() => {
    const total = totalSpend || 1;
    return [
      { name: 'ЭЭ', value: Math.round(totalEeSpend), color: '#eab308', pct: ((totalEeSpend / total) * 100).toFixed(1) },
      { name: 'Газ', value: Math.round(totalGasSpend), color: '#f43f5e', pct: ((totalGasSpend / total) * 100).toFixed(1) },
      { name: 'ХВС', value: Math.round(totalHvsSpend), color: '#38bdf8', pct: ((totalHvsSpend / total) * 100).toFixed(1) },
    ];
  }, [totalSpend, totalEeSpend, totalGasSpend, totalHvsSpend]);

  const seriesToggles: SeriesToggleItem[] = [
    { key: 'ee_cost', label: 'ЭЭ', color: '#eab308', active: seriesVisibility.ee_cost },
    { key: 'gas_cost', label: 'Газ', color: '#f43f5e', active: seriesVisibility.gas_cost },
    { key: 'hvs_cost', label: 'ХВС', color: '#38bdf8', active: seriesVisibility.hvs_cost },
    { key: 'total_cost', label: 'Итого', color: '#15803d', active: seriesVisibility.total_cost },
  ];

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="costs-chart-container"
        chartTitle={`ФИНАНСОВЫЕ_ЗАТРАТЫ_И_ТАРИФЫ_${includeVat ? 'С_НДС' : 'БЕЗ_НДС'}`}
        data={filteredData as any}
        showDataLabels={showDataLabels}
        onToggleDataLabels={() => setShowDataLabels(!showDataLabels)}
        selectedYears={selectedYears}
        onSelectYears={setSelectedYears}
        selectedMonths={selectedMonths}
        onSelectMonths={setSelectedMonths}
        seriesToggles={seriesToggles}
        onToggleSeries={handleToggleSeries}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        extraControls={
          <button
            onClick={() => setIncludeVat(!includeVat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all shadow-2xs ${
              includeVat
                ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Переключение расчета с учетом динамического НДС (20% до 2025 г. / 22% с 2026 г.) или без НДС"
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{vatLabel}</span>
          </button>
        }
      />

      {/* Complete Exportable Container */}
      <div id="costs-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Финансовый учет затрат и динамика тарифов
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                {vatBadgeTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Суммарные финансовые затраты на энергоносители и история изменения тарифов за выбранный период
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
            Покрытие: {filteredData.length} мес.
          </span>
        </div>

        {/* KPI Cards — Dynamically updated for selected years & VAT mode */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Total Spend */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Всего затраты</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                {vatKpiTag}
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {(totalSpend / 1000000).toFixed(2)} <span className="text-sm font-semibold text-emerald-700">млн ₽</span>
            </p>
            <div className="text-xs text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <span>В среднем:</span>
              <b>{(avgMonthlySpend / 1000000).toFixed(2)} млн ₽/мес</b>
            </div>
          </div>

          {/* 2. Electricity Spend */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Электроэнергия (ЭЭ)</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {(totalEeSpend / 1000000).toFixed(2)} <span className="text-sm font-semibold text-amber-700">млн ₽</span>
            </p>
            <div className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span>Доля в бюджете:</span>
              <b className="font-bold text-amber-900">{((totalEeSpend / (totalSpend || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          {/* 3. Gas Spend */}
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-rose-800 font-bold uppercase tracking-wider">Природный газ</p>
            <p className="text-2xl font-black text-rose-950 mt-1">
              {(totalGasSpend / 1000000).toFixed(2)} <span className="text-sm font-semibold text-rose-700">млн ₽</span>
            </p>
            <div className="text-xs text-rose-700 mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
              <span>Доля в бюджете:</span>
              <b className="font-bold text-rose-900">{((totalGasSpend / (totalSpend || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          {/* 4. Water Spend */}
          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-sky-800 font-bold uppercase tracking-wider">ХВС (Водоснабжение)</p>
            <p className="text-2xl font-black text-sky-950 mt-1">
              {(totalHvsSpend / 1000000).toFixed(2)} <span className="text-sm font-semibold text-sky-700">млн ₽</span>
            </p>
            <div className="text-xs text-sky-700 mt-2 pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <span>Доля в бюджете:</span>
              <b className="font-bold text-sky-900">{((totalHvsSpend / (totalSpend || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          {/* 5. Period Coverage */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Охват среза</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {filteredData.length} <span className="text-sm font-semibold text-slate-500">мес.</span>
            </p>
            <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span>Годы:</span>
              <b className="truncate max-w-[120px]">{selectedYears.join(', ')}</b>
            </div>
          </div>
        </div>

        {/* Charts Grid: Main Composed Stacked Bar/Line Chart (2/3 cols) + Circular Donut Chart (1/3 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Main Cost Breakdown Chart */}
          <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Динамика затрат на энергоресурсы (руб/мес)
                </h4>
                <p className="text-xs text-slate-500">
                  Помесячные расходы на электроэнергию, природный газ и ХВС
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Записей: {filteredData.length}
              </span>
            </div>

            <div className="h-[420px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData} margin={{ top: 25, right: 25, left: 10, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="axisLabel" 
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} 
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    name="Затраты (млн ₽)"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const rec = payload[0].payload as any;
                        const recordVatPct = rec.appliedVatPct || (rec.year >= 2026 ? 22 : 20);
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                            <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-slate-700">
                              <p className="font-bold text-emerald-300 text-sm">{rec.month}</p>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                                {includeVat ? `с НДС ${recordVatPct}%` : 'без НДС'}
                              </span>
                            </div>
                            <p className="text-emerald-300 flex justify-between gap-4">
                              <span>Всего затрат:</span> <b className="text-white">{(rec.cost_total_resources_calc).toLocaleString()} ₽</b>
                            </p>
                            <p className="text-amber-300 flex justify-between gap-4">
                              <span>Электроэнергия:</span> <b className="text-white">{(rec.cost_ee_total_calc).toLocaleString()} ₽</b>
                            </p>
                            <p className="text-rose-300 flex justify-between gap-4">
                              <span>Газ:</span> <b className="text-white">{(rec.cost_gas_total_calc).toLocaleString()} ₽</b>
                            </p>
                            <p className="text-sky-300 flex justify-between gap-4">
                              <span>ХВС:</span> <b className="text-white">{(rec.cost_hvs_total_calc).toLocaleString()} ₽</b>
                            </p>
                            {includeVat && (
                              <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                                <span>Без НДС: {(rec.cost_total_resources).toLocaleString()} ₽</span>
                                <span className="text-purple-300">НДС: +{(rec.cost_total_resources_calc - rec.cost_total_resources).toLocaleString()} ₽</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />

                  {seriesVisibility.hvs_cost && (
                    <Bar dataKey="cost_hvs_total_calc" name="ХВС" stackId="cost" fill="#38bdf8" />
                  )}

                  {seriesVisibility.gas_cost && (
                    <Bar dataKey="cost_gas_total_calc" name="Газ" stackId="cost" fill="#f43f5e" />
                  )}

                  {seriesVisibility.ee_cost && (
                    <Bar dataKey="cost_ee_total_calc" name="ЭЭ" stackId="cost" fill="#eab308" radius={[4, 4, 0, 0]}>
                      {showDataLabels && (
                        <LabelList
                          dataKey="cost_total_resources_calc"
                          position="top"
                          formatter={(val: any) => (val > 0 ? `${(val / 1000000).toFixed(2)}M` : '')}
                          style={{ fontSize: '10px', fill: '#15803d', fontWeight: 'bold' }}
                        />
                      )}
                    </Bar>
                  )}

                  {seriesVisibility.total_cost && (
                    <Line 
                      type="monotone" 
                      dataKey="cost_total_resources_calc" 
                      name="Итого" 
                      stroke="#15803d" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#15803d', stroke: '#fff', strokeWidth: 1 }} 
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Shares Circular Donut Chart */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="border-b border-slate-200/80 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Доли затрат по видам ресурсов
              </h4>
              <p className="text-xs text-slate-500">
                Структура финансового бюджета предприятия
              </p>
            </div>

            <div className="h-[260px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val.toLocaleString()} ₽`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-500 font-semibold">Всего затраты</span>
                <span className="text-base font-black text-slate-900">{(totalSpend / 1000000).toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 font-bold">млн ₽</span>
              </div>
            </div>

            {/* Legend list with values and shares */}
            <div className="space-y-1 pt-2 border-t border-slate-200/80 text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {(item.value / 1000000).toFixed(2)}M <span className="text-slate-400 font-normal">({item.pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tariffs Evolution Chart */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Динамика тарифов на ресурсы {includeVat ? `(${vatLabel})` : '(без НДС)'}
              </h4>
              <p className="text-xs text-slate-500">
                Стоимость 1 МВт электроэнергии, 1 м³ природного газа и 1 м³ технологического ХВС
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                ЭЭ: <b>{filteredData[filteredData.length - 1]?.price_ee_calc.toLocaleString()} ₽/МВт</b>
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                Газ: <b>{filteredData[filteredData.length - 1]?.price_gas_calc} ₽/м³</b>
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                ХВС: <b>{filteredData[filteredData.length - 1]?.price_hvs_calc} ₽/м³</b>
              </span>
            </div>
          </div>

          <div className="h-[320px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData} margin={{ top: 25, right: 35, left: 10, bottom: 65 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="axisLabel" 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  yAxisId="ee" 
                  orientation="left" 
                  stroke="#d97706" 
                  tick={{ fontSize: 11, fill: '#d97706', fontWeight: 600 }} 
                  domain={['auto', 'auto']}
                  name="Тариф ЭЭ (₽/МВт)"
                />
                <YAxis 
                  yAxisId="gas_water" 
                  orientation="right" 
                  stroke="#0284c7" 
                  tick={{ fontSize: 11, fill: '#0284c7', fontWeight: 600 }} 
                  domain={['auto', 'auto']}
                  name="Тариф ХВС и Газ (₽/м³)"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rec = payload[0].payload as any;
                      const recordVatPct = rec.appliedVatPct || (rec.year >= 2026 ? 22 : 20);
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                          <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-slate-700">
                            <p className="font-bold text-amber-300 text-sm">{rec.month}</p>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                              {includeVat ? `с НДС ${recordVatPct}%` : 'без НДС'}
                            </span>
                          </div>
                          <p className="text-amber-300 flex justify-between gap-4">
                            <span>Тариф ЭЭ:</span> <b className="text-white">{rec.price_ee_calc.toLocaleString()} ₽/МВт</b>
                          </p>
                          <p className="text-rose-300 flex justify-between gap-4">
                            <span>Тариф ГАЗ:</span> <b className="text-white">{rec.price_gas_calc} ₽/м³</b>
                          </p>
                          <p className="text-sky-300 flex justify-between gap-4">
                            <span>Тариф ХВС:</span> <b className="text-white">{rec.price_hvs_calc} ₽/м³</b>
                          </p>
                          {includeVat && (
                            <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-slate-400">
                              <span>Базовый тариф ЭЭ без НДС: {rec.price_ee.toLocaleString()} ₽</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                {seriesVisibility.ee_price && (
                  <Line 
                    yAxisId="ee" 
                    type="stepAfter" 
                    dataKey="price_ee_calc" 
                    name="Тариф ЭЭ" 
                    stroke="#d97706" 
                    strokeWidth={2.5} 
                    dot={{ r: 2 }}
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="price_ee_calc"
                        position="top"
                        offset={6}
                        formatter={(val: any) => `${Math.round(val)}`}
                        style={{ fontSize: '9px', fill: '#b45309', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}

                {seriesVisibility.hvs_price && (
                  <Line 
                    yAxisId="gas_water" 
                    type="stepAfter" 
                    dataKey="price_hvs_calc" 
                    name="Тариф ХВС" 
                    stroke="#0284c7" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="price_hvs_calc"
                        position="bottom"
                        offset={6}
                        formatter={(val: any) => `${val}`}
                        style={{ fontSize: '9px', fill: '#0369a1', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}

                {seriesVisibility.gas_price && (
                  <Line 
                    yAxisId="gas_water" 
                    type="stepAfter" 
                    dataKey="price_gas_calc" 
                    name="Тариф Газ" 
                    stroke="#e11d48" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="price_gas_calc"
                        position="top"
                        offset={6}
                        formatter={(val: any) => `${val}`}
                        style={{ fontSize: '9px', fill: '#be123c', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
