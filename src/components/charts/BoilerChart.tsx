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

interface BoilerChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const BoilerChart: React.FC<BoilerChartProps> = ({
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

  // Series visibility state
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
    gas_boiler: true,
    gas_roasting: true,
    boiler_hours: true,
    boiler_hvs_boiler: true,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  // Compute stats strictly for selected period
  const totalGas = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_total, 0);
  }, [filteredData]);

  const totalGasBoiler = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_boiler, 0);
  }, [filteredData]);

  const totalGasRoasting = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.gas_roasting, 0);
  }, [filteredData]);

  const avgBoilerHours = useMemo(() => {
    const valid = filteredData.filter((d) => d.boiler_hours > 0);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((acc, curr) => acc + curr.boiler_hours, 0) / valid.length);
  }, [filteredData]);

  const totalBoilerHvs = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.boiler_hvs_boiler, 0);
  }, [filteredData]);

  const totalBoilerEe = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.boiler_ee, 0);
  }, [filteredData]);

  // Series toggles config (short names)
  const seriesToggles: SeriesToggleItem[] = [
    { key: 'gas_boiler', label: 'Газ котельная', color: '#e11d48', active: seriesVisibility.gas_boiler },
    { key: 'gas_roasting', label: 'Газ обжарка', color: '#fb7185', active: seriesVisibility.gas_roasting },
    { key: 'boiler_hours', label: 'Наработка котлов', color: '#d97706', active: seriesVisibility.boiler_hours },
    { key: 'boiler_hvs_boiler', label: 'ХВС котельная', color: '#0284c7', active: seriesVisibility.boiler_hvs_boiler },
  ];

  // Custom label renderer for bars
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!showDataLabels || !value || value <= 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
        className="pointer-events-none drop-shadow-xs"
      >
        {Math.round(value / 1000)}k
      </text>
    );
  };

  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`
    }));
  }, [filteredData]);

  const periodLabelText = useMemo(() => {
    if (selectedYears.length === 6) return '2021 — 2026 гг.';
    if (selectedYears.length === 1) return `${selectedYears[0]} год`;
    return `${selectedYears.join(', ')} гг.`;
  }, [selectedYears]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="boiler-chart-container"
        chartTitle="КОТЕЛЬНАЯ_И_ПОТРЕБЛЕНИЕ_ГАЗА"
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
      <div id="boiler-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Баланс потребления газа и наработки котельной
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Динамика распределения природного газа между котельной и цехом обжарки, а также наработка котлов
            </p>
          </div>
          <span className="text-xs font-bold text-rose-900 bg-rose-100 border border-rose-200 px-3 py-1 rounded-full">
            Покрытие: {filteredData.length} мес.
          </span>
        </div>

        {/* KPI Cards dynamically computed for the selected period */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Потребление газа всего</p>
            <p className="text-2xl font-black text-rose-950 mt-1">
              {(totalGas / 1000000).toFixed(2)} <span className="text-sm font-semibold text-rose-700">млн м³</span>
            </p>
            <div className="flex items-center justify-between text-xs text-rose-600 mt-2 pt-2 border-t border-rose-200/60">
              <span>Котлы: <b>{Math.round(totalGasBoiler / 1000)} тыс. м³</b></span>
              <span>Обжарка: <b>{Math.round(totalGasRoasting / 1000)} тыс. м³</b></span>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Средняя наработка котлов</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {avgBoilerHours} <span className="text-sm font-semibold text-amber-700">м/ч в мес</span>
            </p>
            <div className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span>Всего за период:</span>
              <b>{filteredData.reduce((a, b) => a + b.boiler_hours, 0).toLocaleString()} м/ч</b>
            </div>
          </div>

          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-sky-700 font-bold uppercase tracking-wider">ХВС для котельной</p>
            <p className="text-2xl font-black text-sky-950 mt-1">
              {totalBoilerHvs.toLocaleString()} <span className="text-sm font-semibold text-sky-700">м³</span>
            </p>
            <div className="text-xs text-sky-700 mt-2 pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <span>Среднее в месяц:</span>
              <b>{Math.round(totalBoilerHvs / (filteredData.length || 1)).toLocaleString()} м³</b>
            </div>
          </div>

          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Электроэнергия котельной</p>
            <p className="text-2xl font-black text-indigo-950 mt-1">
              {totalBoilerEe.toFixed(1)} <span className="text-sm font-semibold text-indigo-700">МВт/ч</span>
            </p>
            <div className="text-xs text-indigo-700 mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between">
              <span>Среднее в месяц:</span>
              <b>{(totalBoilerEe / (filteredData.length || 1)).toFixed(1)} МВт/ч</b>
            </div>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Помесячный расход газа и наработка котлов
              </h4>
              <p className="text-xs text-slate-500">
                Динамика распределения природного газа между котельной и цехом обжарки, а также наработка котлов (м/ч)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Записей: {filteredData.length} мес.
              </span>
            </div>
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
                  stroke="#e11d48"
                  tick={{ fontSize: 11, fill: '#e11d48', fontWeight: 600 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  name="Расход газа (м³)"
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#d97706"
                  tick={{ fontSize: 11, fill: '#d97706', fontWeight: 600 }}
                  name="Наработка котлов (м/ч)"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rec = payload[0].payload as MonthlyRecord;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                          <p className="text-rose-300 flex justify-between gap-4">
                            <span>Газ котельная:</span> <b className="text-white">{rec.gas_boiler.toLocaleString()} м³</b>
                          </p>
                          <p className="text-pink-300 flex justify-between gap-4">
                            <span>Газ цех обжарки:</span> <b className="text-white">{rec.gas_roasting.toLocaleString()} м³</b>
                          </p>
                          <p className="text-amber-300 flex justify-between gap-4">
                            <span>Наработка котлов:</span> <b className="text-white">{rec.boiler_hours} м/ч</b>
                          </p>
                          <p className="text-sky-300 flex justify-between gap-4">
                            <span>ХВС котельной:</span> <b className="text-white">{rec.boiler_hvs_boiler.toLocaleString()} м³</b>
                          </p>
                          <p className="text-indigo-300 flex justify-between gap-4">
                            <span>ЭЭ котельной:</span> <b className="text-white">{rec.boiler_ee} МВт/ч</b>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                {seriesVisibility.gas_boiler && (
                  <Bar 
                    yAxisId="left" 
                    dataKey="gas_boiler" 
                    name="Газ котельная" 
                    stackId="gas" 
                    fill="#e11d48" 
                    label={renderBarLabel} 
                  />
                )}

                {seriesVisibility.gas_roasting && (
                  <Bar 
                    yAxisId="left" 
                    dataKey="gas_roasting" 
                    name="Газ обжарка" 
                    stackId="gas" 
                    fill="#fb7185" 
                    radius={[4, 4, 0, 0]}
                    label={renderBarLabel} 
                  />
                )}

                {seriesVisibility.boiler_hours && (
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="boiler_hours" 
                    name="Наработка котлов" 
                    stroke="#d97706" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#d97706', stroke: '#fff', strokeWidth: 1 }} 
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="boiler_hours"
                        position="top"
                        offset={8}
                        formatter={(val: any) => (val > 0 ? `${val}` : '')}
                        style={{ fontSize: '9.5px', fill: '#b45309', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}

                {seriesVisibility.boiler_hvs_boiler && (
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="boiler_hvs_boiler" 
                    name="ХВС котельная" 
                    stroke="#0284c7" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 2 }} 
                  >
                    {showDataLabels && (
                      <LabelList 
                        dataKey="boiler_hvs_boiler" 
                        position="bottom" 
                        offset={8} 
                        formatter={(val: any) => (val > 0 ? `${Math.round(val / 1000)}k` : '')} 
                        style={{ fontSize: '9px', fill: '#0369a1', fontWeight: '600' }} 
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
