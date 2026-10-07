import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
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

interface KosChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const KosChart: React.FC<KosChartProps> = ({
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Series visibility
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
    kos_inflow: true,
    kos_discharge: true,
    kos_fho: true,
    kos_ee: true,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  const totalInflow = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.kos_inflow, 0);
  }, [filteredData]);

  const totalDischarge = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.kos_discharge, 0);
  }, [filteredData]);

  const totalKosHvs = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.kos_hvs, 0);
  }, [filteredData]);

  const totalKosFho = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.kos_fho, 0);
  }, [filteredData]);

  const totalKosEe = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.kos_ee, 0);
  }, [filteredData]);

  // Pie chart breakdown for water balance
  const pieData = useMemo(() => {
    const totalOut = totalDischarge + totalKosFho + totalKosHvs || 1;
    return [
      { name: 'Сброс', value: Math.round(totalDischarge), color: '#10b981', pct: ((totalDischarge / totalOut) * 100).toFixed(1) },
      { name: 'ФХО', value: Math.round(totalKosFho), color: '#6366f1', pct: ((totalKosFho / totalOut) * 100).toFixed(1) },
      { name: 'ХВС', value: Math.round(totalKosHvs), color: '#0284c7', pct: ((totalKosHvs / totalOut) * 100).toFixed(1) },
    ];
  }, [totalDischarge, totalKosFho, totalKosHvs]);

  const seriesToggles: SeriesToggleItem[] = [
    { key: 'kos_inflow', label: 'Приток стока', color: '#0284c7', active: seriesVisibility.kos_inflow },
    { key: 'kos_discharge', label: 'Сброс с КОС', color: '#10b981', active: seriesVisibility.kos_discharge },
    { key: 'kos_fho', label: 'ФХО', color: '#6366f1', active: seriesVisibility.kos_fho },
    { key: 'kos_ee', label: 'ЭЭ КОС', color: '#f59e0b', active: seriesVisibility.kos_ee },
  ];

  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`
    }));
  }, [filteredData]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="kos-chart-container"
        chartTitle="ПОКАЗАТЕЛИ_КОС_ОЧИСТНЫЕ"
        data={filteredData}
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
      />

      {/* Complete Exportable Container */}
      <div id="kos-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Баланс сточных вод и очистных сооружений (КОС)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Приток стоков, сброс очищенной воды, подача на ФХО и расход электроэнергии
            </p>
          </div>
          <span className="text-xs font-bold text-sky-900 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full">
            Покрытие: {filteredData.length} мес.
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-sky-700 font-bold uppercase tracking-wider">Поступивший сток всего</p>
            <p className="text-2xl font-black text-sky-950 mt-1">
              {(totalInflow / 1000).toFixed(1)} <span className="text-sm font-semibold text-sky-700">тыс. м³</span>
            </p>
            <div className="text-xs text-sky-600 mt-2 pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <span>В среднем:</span>
              <b>{Math.round(totalInflow / (filteredData.length || 1)).toLocaleString()} м³/мес</b>
            </div>
          </div>

          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Сброс с КОС (очищенный)</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {(totalDischarge / 1000).toFixed(1)} <span className="text-sm font-semibold text-emerald-700">тыс. м³</span>
            </p>
            <div className="text-xs text-emerald-600 mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <span>Эффективность очистки:</span>
              <b className="text-emerald-700 font-bold">{((totalDischarge / (totalInflow || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Расход ХВС для КОС</p>
            <p className="text-2xl font-black text-indigo-950 mt-1">
              {totalKosHvs.toLocaleString()} <span className="text-sm font-semibold text-indigo-700">м³</span>
            </p>
            <div className="text-xs text-indigo-600 mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between">
              <span>В среднем:</span>
              <b>{Math.round(totalKosHvs / (filteredData.length || 1)).toLocaleString()} м³/мес</b>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Электроэнергия КОС</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {totalKosEe.toFixed(1)} <span className="text-sm font-semibold text-amber-700">МВт/ч</span>
            </p>
            <div className="text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span>В среднем:</span>
              <b>{(totalKosEe / (filteredData.length || 1)).toFixed(1)} МВт/ч/мес</b>
            </div>
          </div>
        </div>

        {/* Charts Grid: Main Composed Chart (2/3 cols) + Circular Donut Chart (1/3 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Main Composed Chart */}
          <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Динамика объемов стоков и сброса
                </h4>
                <p className="text-xs text-slate-500">
                  Помесячный баланс поступления стоков, сброса воды и расхода электроэнергии
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Записей: {filteredData.length}
              </span>
            </div>

            <div className="h-[420px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 25, right: 35, left: 10, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="axisLabel" 
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} 
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#0284c7"
                    tick={{ fontSize: 11, fill: '#0284c7', fontWeight: 600 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    name="Объем воды (м³)"
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#f59e0b"
                    tick={{ fontSize: 11, fill: '#f59e0b', fontWeight: 600 }}
                    name="ЭЭ КОС (МВт/ч)"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const rec = payload[0].payload as MonthlyRecord;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                            <p className="font-bold text-sky-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                            <p className="text-sky-300 flex justify-between gap-4">
                              <span>Поступило на КОС:</span> <b className="text-white">{rec.kos_inflow.toLocaleString()} м³</b>
                            </p>
                            <p className="text-cyan-300 flex justify-between gap-4">
                              <span>Суточный промсток:</span> <b className="text-white">{rec.kos_daily_industrial.toLocaleString()} м³</b>
                            </p>
                            <p className="text-emerald-300 flex justify-between gap-4">
                              <span>Сброс с КОС:</span> <b className="text-white">{rec.kos_discharge.toLocaleString()} м³</b>
                            </p>
                            <p className="text-indigo-300 flex justify-between gap-4">
                              <span>На ФХО:</span> <b className="text-white">{rec.kos_fho.toLocaleString()} м³</b>
                            </p>
                            <p className="text-blue-300 flex justify-between gap-4">
                              <span>ХВС для КОС:</span> <b className="text-white">{rec.kos_hvs.toLocaleString()} м³</b>
                            </p>
                            <p className="text-amber-300 flex justify-between gap-4">
                              <span>ЭЭ КОС:</span> <b className="text-white">{rec.kos_ee} МВт/ч</b>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />

                  {seriesVisibility.kos_inflow && (
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="kos_inflow" 
                      name="Приток стока" 
                      fill="#e0f2fe" 
                      stroke="#0284c7" 
                      strokeWidth={2} 
                    >
                      {showDataLabels && (
                        <LabelList
                          dataKey="kos_inflow"
                          position="top"
                          formatter={(val: any) => (val > 0 ? `${Math.round(val / 1000)}k` : '')}
                          style={{ fontSize: '9px', fill: '#0369a1', fontWeight: 'bold' }}
                        />
                      )}
                    </Area>
                  )}

                  {seriesVisibility.kos_discharge && (
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="kos_discharge" 
                      name="Сброс с КОС" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 1 }} 
                    >
                      {showDataLabels && (
                        <LabelList
                          dataKey="kos_discharge"
                          position="bottom"
                          offset={6}
                          formatter={(val: any) => (val > 0 ? `${Math.round(val / 1000)}k` : '')}
                          style={{ fontSize: '9px', fill: '#047857', fontWeight: 'bold' }}
                        />
                      )}
                    </Line>
                  )}

                  {seriesVisibility.kos_fho && (
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="kos_fho" 
                      name="ФХО" 
                      stroke="#6366f1" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3" 
                      dot={false} 
                    />
                  )}

                  {seriesVisibility.kos_ee && (
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="kos_ee" 
                      name="ЭЭ КОС" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1 }} 
                    >
                      {showDataLabels && (
                        <LabelList
                          dataKey="kos_ee"
                          position="top"
                          offset={8}
                          formatter={(val: any) => `${val}`}
                          style={{ fontSize: '9px', fill: '#b45309', fontWeight: 'bold' }}
                        />
                      )}
                    </Line>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Distribution Pie / Donut Chart */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="border-b border-slate-200/80 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Структура потоков очистных (КОС)
              </h4>
              <p className="text-xs text-slate-500">
                Соотношение объемов сброса, ФХО и технологического расхода ХВС
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
                    formatter={(val: any, name: any) => [`${val.toLocaleString()} м³`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-500 font-semibold">Всего сток</span>
                <span className="text-base font-black text-slate-900">{(totalInflow / 1000).toFixed(1)}k</span>
                <span className="text-[10px] text-slate-400 font-bold">м³</span>
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
                    {item.value.toLocaleString()} м³ <span className="text-slate-400 font-normal">({item.pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
