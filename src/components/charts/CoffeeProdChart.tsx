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
  LabelList
} from 'recharts';
import { MonthlyRecord } from '../../types';
import { ExportToolbar, SeriesToggleItem } from '../ExportToolbar';
import { Coffee, Flame, Droplets, Zap } from 'lucide-react';

interface CoffeeProdChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const CoffeeProdChart: React.FC<CoffeeProdChartProps> = ({
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

  const [showDataLabels, setShowDataLabels] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Series visibility state for Coffee Output & Resources:
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
    roasted: true,
    instant: true,
    ee_factory_total: true,
    gas_total: true,
    water_total: false,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter data by selected years and months
  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  // Aggregate KPI metrics for selected period
  const totalRoasted = useMemo(() => filteredData.reduce((a, b) => a + b.prod_roasted_coffee_ton, 0), [filteredData]);
  const totalInstant = useMemo(() => filteredData.reduce((a, b) => a + b.prod_instant_coffee_ton, 0), [filteredData]);
  const totalEeFactory = useMemo(() => filteredData.reduce((a, b) => a + b.ee_factory_total, 0), [filteredData]);
  const totalGas = useMemo(() => filteredData.reduce((a, b) => a + b.gas_total, 0), [filteredData]);
  const totalWater = useMemo(() => filteredData.reduce((a, b) => a + b.boiler_hvs_factory_total, 0), [filteredData]);

  // Series toggles for toolbar (Clean labels without parens)
  const seriesToggles: SeriesToggleItem[] = [
    { key: 'roasted', label: 'НК', color: '#b45309', active: seriesVisibility.roasted },
    { key: 'instant', label: 'РК', color: '#0284c7', active: seriesVisibility.instant },
    { key: 'ee_factory_total', label: 'ЭЭ Завод', color: '#16a34a', active: seriesVisibility.ee_factory_total },
    { key: 'gas_total', label: 'Газ', color: '#ea580c', active: seriesVisibility.gas_total },
    { key: 'water_total', label: 'ХВС', color: '#06b6d4', active: seriesVisibility.water_total },
  ];

  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`,
    }));
  }, [filteredData]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="coffee-prod-chart-container"
        chartTitle="ПРОИЗВОДСТВО_КОФЕ_И_РЕСУРСЫ"
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
      <div id="coffee-prod-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Производство кофе и потребление энергоресурсов
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Выпуск продукции (натуральный и растворимый кофе) и потребление основных ресурсов (электроэнергия, газ и вода)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
              Покрытие: {filteredData.length} мес.
            </span>
          </div>
        </div>

        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Натуральный кофе (НК)</p>
              <Coffee className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-2xl font-black text-amber-950">
              {totalRoasted.toLocaleString()} <span className="text-sm font-semibold text-amber-700">тонн</span>
            </p>
            <div className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span>В среднем в мес:</span>
              <b>{Math.round(totalRoasted / (filteredData.length || 1)).toLocaleString()} т</b>
            </div>
          </div>

          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-sky-800 font-bold uppercase tracking-wider">Растворимый кофе (РК)</p>
              <Coffee className="w-4 h-4 text-sky-700" />
            </div>
            <p className="text-2xl font-black text-sky-950">
              {totalInstant.toLocaleString()} <span className="text-sm font-semibold text-sky-700">тонн</span>
            </p>
            <div className="text-xs text-sky-700 mt-2 pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <span>В среднем в мес:</span>
              <b>{Math.round(totalInstant / (filteredData.length || 1)).toLocaleString()} т</b>
            </div>
          </div>

          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Электроэнергия завод</p>
              <Zap className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-2xl font-black text-emerald-950">
              {(totalEeFactory / 1000).toFixed(2)} <span className="text-sm font-semibold text-emerald-700">тыс. МВт/ч</span>
            </p>
            <div className="text-xs text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <span>Всего за период:</span>
              <b>{totalEeFactory.toLocaleString()} МВт/ч</b>
            </div>
          </div>

          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-rose-800 font-bold uppercase tracking-wider">Потребление газа</p>
              <Flame className="w-4 h-4 text-rose-700" />
            </div>
            <p className="text-2xl font-black text-rose-950">
              {(totalGas / 1000000).toFixed(2)} <span className="text-sm font-semibold text-rose-700">млн м³</span>
            </p>
            <div className="text-xs text-rose-700 mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
              <span>ХВС завод:</span>
              <b>{(totalWater / 1000).toFixed(1)} тыс. м³</b>
            </div>
          </div>
        </div>

        {/* Main Composed Chart */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Динамика выпуска кофе и потребления ресурсов
              </h4>
              <p className="text-xs text-slate-500">
                Сопоставление объемов выработки (т) с электроэнергией (МВт/ч) и природным газом (м³)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              Записей: {filteredData.length} мес.
            </span>
          </div>

          <div className="h-[460px] w-full pt-2">
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
                  stroke="#b45309"
                  tick={{ fontSize: 11, fill: '#b45309', fontWeight: 600 }}
                  name="Выпуск кофе (т)"
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#16a34a"
                  tick={{ fontSize: 11, fill: '#16a34a', fontWeight: 600 }}
                  name="Ресурсы (МВт/ч / тыс. м³)"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rec = payload[0].payload as MonthlyRecord;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                          <p className="text-amber-300 flex justify-between gap-4">
                            <span>Натуральный кофе (НК):</span> <b className="text-white">{rec.prod_roasted_coffee_ton} т</b>
                          </p>
                          <p className="text-sky-300 flex justify-between gap-4">
                            <span>Растворимый кофе (РК):</span> <b className="text-white">{rec.prod_instant_coffee_ton} т</b>
                          </p>
                          <p className="text-emerald-300 flex justify-between gap-4">
                            <span>ЭЭ завод всего:</span> <b className="text-white">{rec.ee_factory_total} МВт/ч</b>
                          </p>
                          <p className="text-blue-300 flex justify-between gap-4">
                            <span>ЭЭ ТК (ЦРК):</span> <b className="text-white">{rec.ee_crk} МВт/ч</b>
                          </p>
                          <p className="text-purple-300 flex justify-between gap-4">
                            <span>ЭЭ АКТ (АКЦ):</span> <b className="text-white">{rec.ee_akc} МВт/ч</b>
                          </p>
                          <p className="text-orange-300 flex justify-between gap-4">
                            <span>Газ общий:</span> <b className="text-white">{rec.gas_total.toLocaleString()} м³</b>
                          </p>
                          <p className="text-cyan-300 flex justify-between gap-4">
                            <span>ХВС завод:</span> <b className="text-white">{rec.boiler_hvs_factory_total.toLocaleString()} м³</b>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                {/* Roasted Coffee Bar */}
                {seriesVisibility.roasted && (
                  <Bar 
                    yAxisId="left" 
                    dataKey="prod_roasted_coffee_ton" 
                    name="НК" 
                    fill="#b45309" 
                    radius={[4, 4, 0, 0]}
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="prod_roasted_coffee_ton"
                        position="top"
                        formatter={(val: any) => (val > 0 ? `${val}` : '')}
                        style={{ fontSize: '9px', fill: '#b45309', fontWeight: 'bold' }}
                      />
                    )}
                  </Bar>
                )}

                {/* Instant Coffee Bar */}
                {seriesVisibility.instant && (
                  <Bar 
                    yAxisId="left" 
                    dataKey="prod_instant_coffee_ton" 
                    name="РК" 
                    fill="#0284c7" 
                    radius={[4, 4, 0, 0]}
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="prod_instant_coffee_ton"
                        position="top"
                        formatter={(val: any) => (val > 0 ? `${val}` : '')}
                        style={{ fontSize: '9px', fill: '#0284c7', fontWeight: 'bold' }}
                      />
                    )}
                  </Bar>
                )}

                {/* EE Factory Total Line */}
                {seriesVisibility.ee_factory_total && (
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="ee_factory_total" 
                    name="ЭЭ Завод" 
                    stroke="#16a34a" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#16a34a', stroke: '#fff', strokeWidth: 1 }} 
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="ee_factory_total"
                        position="top"
                        offset={8}
                        formatter={(val: any) => `${val}`}
                        style={{ fontSize: '9px', fill: '#15803d', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}

                {/* Gas Total Line */}
                {seriesVisibility.gas_total && (
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="gas_total" 
                    name="Газ" 
                    stroke="#ea580c" 
                    strokeWidth={2} 
                    dot={false}
                  />
                )}

                {/* Water Total Line */}
                {seriesVisibility.water_total && (
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="boiler_hvs_factory_total" 
                    name="ХВС" 
                    stroke="#06b6d4" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
