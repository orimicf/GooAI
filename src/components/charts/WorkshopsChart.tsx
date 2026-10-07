import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import { MonthlyRecord } from '../../types';
import { ExportToolbar, SeriesToggleItem } from '../ExportToolbar';

interface WorkshopsChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const WorkshopsChart: React.FC<WorkshopsChartProps> = ({
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
    ee_tgs: true,
    ee_crk: true,
    ee_akc: true,
    ee_roasting_czh: true,
    kos_ee: true,
    boiler_ee: true,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  // Aggregate totals by workshop
  const workshopSums = useMemo(() => {
    return {
      tgs: filteredData.reduce((a, b) => a + b.ee_tgs, 0),
      crk: filteredData.reduce((a, b) => a + b.ee_crk, 0),
      akc: filteredData.reduce((a, b) => a + b.ee_akc, 0),
      czh: filteredData.reduce((a, b) => a + b.ee_roasting_czh, 0),
      kos: filteredData.reduce((a, b) => a + b.kos_ee, 0),
      boiler: filteredData.reduce((a, b) => a + b.boiler_ee, 0),
      total: filteredData.reduce((a, b) => a + b.ee_factory_total, 0),
    };
  }, [filteredData]);

  const pieData = useMemo(() => {
    const list = [
      { key: 'ee_tgs', name: 'ТГС', value: Math.round(workshopSums.tgs), color: '#ea580c' },
      { key: 'ee_crk', name: 'ЦРК', value: Math.round(workshopSums.crk), color: '#2563eb' },
      { key: 'ee_akc', name: 'АКЦ', value: Math.round(workshopSums.akc), color: '#7c3aed' },
      { key: 'ee_roasting_czh', name: 'ЦЖ', value: Math.round(workshopSums.czh), color: '#db2777' },
      { key: 'kos_ee', name: 'КОС', value: Math.round(workshopSums.kos), color: '#10b981' },
      { key: 'boiler_ee', name: 'Котельная', value: Math.round(workshopSums.boiler), color: '#f59e0b' },
    ];
    return list.filter(item => seriesVisibility[item.key]);
  }, [workshopSums, seriesVisibility]);

  const seriesToggles: SeriesToggleItem[] = [
    { key: 'ee_tgs', label: 'ТГС', color: '#ea580c', active: seriesVisibility.ee_tgs },
    { key: 'ee_crk', label: 'ЦРК', color: '#2563eb', active: seriesVisibility.ee_crk },
    { key: 'ee_akc', label: 'АКЦ', color: '#7c3aed', active: seriesVisibility.ee_akc },
    { key: 'ee_roasting_czh', label: 'ЦЖ', color: '#db2777', active: seriesVisibility.ee_roasting_czh },
    { key: 'kos_ee', label: 'КОС', color: '#10b981', active: seriesVisibility.kos_ee },
    { key: 'boiler_ee', label: 'Котельная', color: '#f59e0b', active: seriesVisibility.boiler_ee },
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
        chartElementId="workshops-chart-container"
        chartTitle="БАЛАНС_ЭЛЕКТРОЭНЕРГИИ_ЦЕХОВ"
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
      <div id="workshops-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Баланс электроэнергии по цехам предприятия
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Структура распределения электроэнергии между ТГС, ЦРК, АКЦ, ЦЖ, КОС и котельной
            </p>
          </div>
          <span className="text-xs font-bold text-blue-900 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full">
            Покрытие: {filteredData.length} мес.
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-orange-50/90 border border-orange-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">Электроэнергия ТГС</p>
            <p className="text-2xl font-black text-orange-950 mt-1">
              {workshopSums.tgs.toFixed(1)} <span className="text-sm font-semibold text-orange-700">МВт/ч</span>
            </p>
            <div className="text-xs text-orange-700 mt-2 pt-2 border-t border-orange-200/60 flex items-center justify-between">
              <span>Доля от завода:</span>
              <b>{((workshopSums.tgs / (workshopSums.total || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">ЭЭ ЦРК (Растворимый)</p>
            <p className="text-2xl font-black text-blue-950 mt-1">
              {workshopSums.crk.toFixed(1)} <span className="text-sm font-semibold text-blue-700">МВт/ч</span>
            </p>
            <div className="text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between">
              <span>Доля от завода:</span>
              <b>{((workshopSums.crk / (workshopSums.total || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-purple-800 font-bold uppercase tracking-wider">ЭЭ АКЦ</p>
            <p className="text-2xl font-black text-purple-950 mt-1">
              {workshopSums.akc.toFixed(1)} <span className="text-sm font-semibold text-purple-700">МВт/ч</span>
            </p>
            <div className="text-xs text-purple-700 mt-2 pt-2 border-t border-purple-200/60 flex items-center justify-between">
              <span>Доля от завода:</span>
              <b>{((workshopSums.akc / (workshopSums.total || 1)) * 100).toFixed(1)}%</b>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Всего завод за период</p>
            <p className="text-2xl font-black text-white mt-1">
              {(workshopSums.total / 1000).toFixed(2)} <span className="text-sm font-semibold text-amber-400">тыс. МВт/ч</span>
            </p>
            <div className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
              <span>В среднем:</span>
              <b>{Math.round(workshopSums.total / (filteredData.length || 1))} МВт/мес</b>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Main Stacked Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Помесячное потребление по цехам (МВт/ч)
                </h4>
                <p className="text-xs text-slate-500">
                  Сравнение электропотребления ТГС, ЦРК, АКЦ, ЦЖ, КОС и котельной
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Записей: {filteredData.length}
              </span>
            </div>

            <div className="h-[420px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 25, left: 10, bottom: 65 }}>
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
                    name="МВт/ч"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const rec = payload[0].payload as MonthlyRecord;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                            <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                            <p className="text-orange-300 flex justify-between gap-4">
                              <span>ТГС:</span> <b className="text-white">{rec.ee_tgs} МВт/ч</b>
                            </p>
                            <p className="text-blue-300 flex justify-between gap-4">
                              <span>ЦРК:</span> <b className="text-white">{rec.ee_crk} МВт/ч</b>
                            </p>
                            <p className="text-purple-300 flex justify-between gap-4">
                              <span>АКЦ:</span> <b className="text-white">{rec.ee_akc} МВт/ч</b>
                            </p>
                            <p className="text-pink-300 flex justify-between gap-4">
                              <span>ЦЖ (Обжарка):</span> <b className="text-white">{rec.ee_roasting_czh} МВт/ч</b>
                            </p>
                            <p className="text-emerald-300 flex justify-between gap-4">
                              <span>КОС:</span> <b className="text-white">{rec.kos_ee} МВт/ч</b>
                            </p>
                            <p className="text-amber-300 flex justify-between gap-4">
                              <span>Котельная:</span> <b className="text-white">{rec.boiler_ee} МВт/ч</b>
                            </p>
                            <p className="text-indigo-200 flex justify-between gap-4 pt-1 border-t border-slate-700 font-bold">
                              <span>Всего завод:</span> <b className="text-white">{rec.ee_factory_total} МВт/ч</b>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />

                  {seriesVisibility.ee_tgs && (
                    <Bar dataKey="ee_tgs" name="ТГС" stackId="a" fill="#ea580c" />
                  )}
                  {seriesVisibility.ee_crk && (
                    <Bar dataKey="ee_crk" name="ЦРК" stackId="a" fill="#2563eb" />
                  )}
                  {seriesVisibility.ee_akc && (
                    <Bar dataKey="ee_akc" name="АКЦ" stackId="a" fill="#7c3aed" />
                  )}
                  {seriesVisibility.ee_roasting_czh && (
                    <Bar dataKey="ee_roasting_czh" name="ЦЖ" stackId="a" fill="#db2777" />
                  )}
                  {seriesVisibility.kos_ee && (
                    <Bar dataKey="kos_ee" name="КОС" stackId="a" fill="#10b981" />
                  )}
                  {seriesVisibility.boiler_ee && (
                    <Bar dataKey="boiler_ee" name="Котельная" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                      {showDataLabels && (
                        <LabelList
                          dataKey="ee_factory_total"
                          position="top"
                          formatter={(val: any) => `${val}`}
                          style={{ fontSize: '9.5px', fill: '#0f172a', fontWeight: 'bold' }}
                        />
                      )}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workshop Shares Pie Chart */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="border-b border-slate-200/80 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                Доли цехов в энергобалансе
              </h4>
              <p className="text-xs text-slate-500">
                Структура потребления за период (Всего: {workshopSums.total.toLocaleString()} МВт/ч)
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
                    formatter={(val: any, name: any) => [`${val.toLocaleString()} МВт/ч (${((val / (workshopSums.total || 1)) * 100).toFixed(1)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-500 font-semibold">Всего завод</span>
                <span className="text-base font-black text-slate-900">{Math.round(workshopSums.total).toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-bold">МВт/ч</span>
              </div>
            </div>

            {/* Legend list with values */}
            <div className="space-y-1 pt-2 border-t border-slate-200/80 text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {item.value.toLocaleString()} МВт <span className="text-slate-400 font-normal">({((item.value / (workshopSums.total || 1)) * 100).toFixed(1)}%)</span>
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
