import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LabelList 
} from 'recharts';
import { MonthlyRecord, MetricDefinition } from '../../types';
import { METRIC_DEFINITIONS } from '../../data/initialData';
import { ExportToolbar, SeriesToggleItem } from '../ExportToolbar';
import { Check, Plus, Sliders, Trash2 } from 'lucide-react';

interface ChartBuilderProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

interface SelectedMetricConfig {
  key: keyof MonthlyRecord;
  name: string;
  unit: string;
  color: string;
  chartType: 'line' | 'bar' | 'area' | 'spline';
  yAxisId: 'left' | 'right';
  visible: boolean;
}

const DEFAULT_METRICS: SelectedMetricConfig[] = [
  { key: 'prod_roasted_coffee_ton', name: 'ЖК', unit: 'тонн', color: '#b91c1c', chartType: 'spline', yAxisId: 'left', visible: true },
  { key: 'prod_instant_coffee_ton', name: 'РК', unit: 'тонн', color: '#a16207', chartType: 'spline', yAxisId: 'left', visible: true },
  { key: 'ee_tgs', name: 'ТГС', unit: 'МВт/час', color: '#ea580c', chartType: 'spline', yAxisId: 'left', visible: true },
  { key: 'pressure_bar', name: 'Давление', unit: 'бар', color: '#ca8a04', chartType: 'spline', yAxisId: 'right', visible: true },
];

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ 
  data,
  selectedYears: propSelectedYears,
  onSelectYears: propOnSelectYears,
  selectedMonths: propSelectedMonths,
  onSelectMonths: propOnSelectMonths,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetricConfig[]>(DEFAULT_METRICS);
  const [internalYears, setInternalYears] = useState<number[]>([2021, 2022, 2023, 2024, 2025, 2026]);
  const [internalMonths, setInternalMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  
  const selectedYears = propSelectedYears || internalYears;
  const setSelectedYears = propOnSelectYears || setInternalYears;
  const selectedMonths = propSelectedMonths || internalMonths;
  const setSelectedMonths = propOnSelectMonths || setInternalMonths;

  const [showDataLabels, setShowDataLabels] = useState(true);
  const [chartCustomTitle, setChartCustomTitle] = useState('ПОЛЬЗОВАТЕЛЬСКИЙ ГРАФИК');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  const chartData = useMemo(() => {
    return filteredData.map((d) => ({
      ...d,
      axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`,
    }));
  }, [filteredData]);

  const handleToggleMetric = (mDef: MetricDefinition) => {
    const exists = selectedMetrics.some((m) => m.key === mDef.key);
    if (exists) {
      setSelectedMetrics((prev) => prev.filter((m) => m.key !== mDef.key));
    } else {
      if (selectedMetrics.length >= 6) {
        alert('Максимум 6 метрик одновременно на одном графике.');
        return;
      }
      setSelectedMetrics((prev) => [
        ...prev,
        {
          key: mDef.key,
          name: mDef.name,
          unit: mDef.unit,
          color: mDef.color,
          chartType: 'spline',
          yAxisId: mDef.defaultYAxis || 'left',
          visible: true,
        },
      ]);
    }
  };

  const handleUpdateConfig = (index: number, updates: Partial<SelectedMetricConfig>) => {
    setSelectedMetrics((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveMetric = (index: number) => {
    setSelectedMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSeries = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.map((m) => (m.key === key ? { ...m, visible: !m.visible } : m))
    );
  };

  // Group metric defs by category
  const categories: Record<string, MetricDefinition[]> = useMemo(() => {
    const cats: Record<string, MetricDefinition[]> = {};
    METRIC_DEFINITIONS.forEach((m) => {
      if (!cats[m.category]) cats[m.category] = [];
      cats[m.category].push(m);
    });
    return cats;
  }, []);

  const seriesToggles: SeriesToggleItem[] = selectedMetrics.map((m) => ({
    key: m.key as string,
    label: m.name,
    color: m.color,
    active: m.visible,
  }));

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="custom-chart-builder-container"
        chartTitle={chartCustomTitle.replace(/\s+/g, '_')}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls Sidebar (1 col) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 max-h-[700px] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Название графика
            </label>
            <input
              type="text"
              value={chartCustomTitle}
              onChange={(e) => setChartCustomTitle(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
            />
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Выбранные показатели ({selectedMetrics.length}/6)
            </h4>
            <div className="space-y-2">
              {selectedMetrics.map((m, idx) => (
                <div key={m.key} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate" title={m.name}>
                      {m.name}
                    </span>
                    <button
                      onClick={() => handleRemoveMetric(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={m.color}
                      onChange={(e) => handleUpdateConfig(idx, { color: e.target.value })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 p-0"
                    />

                    <select
                      value={m.chartType}
                      onChange={(e) => handleUpdateConfig(idx, { chartType: e.target.value as any })}
                      className="bg-slate-100 text-slate-800 rounded px-2 py-1 text-xs border border-slate-300 font-medium"
                    >
                      <option value="spline">Линия (плавная)</option>
                      <option value="line">Линия (прямая)</option>
                      <option value="bar">Столбцы</option>
                      <option value="area">Область</option>
                    </select>

                    <select
                      value={m.yAxisId}
                      onChange={(e) => handleUpdateConfig(idx, { yAxisId: e.target.value as any })}
                      className="bg-slate-100 text-slate-800 rounded px-2 py-1 text-xs border border-slate-300 font-medium"
                    >
                      <option value="left">Ось Y (слева)</option>
                      <option value="right">Ось Y (справа)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Библиотека параметров
            </h4>
            <div className="space-y-3">
              {Object.entries(categories).map(([catName, metrics]) => (
                <div key={catName} className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{catName}</span>
                  <div className="space-y-1">
                    {metrics.map((m) => {
                      const isSelected = selectedMetrics.some((item) => item.key === m.key);
                      return (
                        <button
                          key={m.key}
                          onClick={() => handleToggleMetric(m)}
                          className={`w-full text-left text-xs p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                            isSelected
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate mr-1">{m.name}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chart Area (3 cols) */}
        <div id="custom-chart-builder-container" className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{chartCustomTitle}</h3>
              <p className="text-xs text-slate-500">
                Период: {filteredData.length} мес. • Метрик: {selectedMetrics.filter(m => m.visible).length}
              </p>
            </div>
          </div>

          <div className="h-[520px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 25, right: 35, left: 10, bottom: 65 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                  stroke="#475569" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#ca8a04" 
                  tick={{ fontSize: 11, fill: '#ca8a04', fontWeight: 600 }} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rec = payload[0].payload as MonthlyRecord;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                          {selectedMetrics.filter(m => m.visible).map((m) => (
                            <p key={m.key} className="flex justify-between gap-4" style={{ color: m.color }}>
                              <span>{m.name}:</span>
                              <b className="text-white">{(rec[m.key] as number)?.toLocaleString()} {m.unit}</b>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                {selectedMetrics
                  .filter((m) => m.visible)
                  .map((m) => {
                    if (m.chartType === 'bar') {
                      return (
                        <Bar 
                          key={m.key} 
                          yAxisId={m.yAxisId} 
                          dataKey={m.key} 
                          name={m.name} 
                          fill={m.color} 
                          radius={[4, 4, 0, 0]} 
                        >
                          {showDataLabels && (
                            <LabelList
                              dataKey={m.key}
                              position="top"
                              formatter={(val: any) => `${val}`}
                              style={{ fontSize: '9px', fill: m.color, fontWeight: 'bold' }}
                            />
                          )}
                        </Bar>
                      );
                    }
                    if (m.chartType === 'area') {
                      return (
                        <Area 
                          key={m.key} 
                          yAxisId={m.yAxisId} 
                          type="monotone" 
                          dataKey={m.key} 
                          name={m.name} 
                          fill={m.color} 
                          stroke={m.color} 
                          fillOpacity={0.2} 
                        >
                          {showDataLabels && (
                            <LabelList
                              dataKey={m.key}
                              position="top"
                              formatter={(val: any) => `${val}`}
                              style={{ fontSize: '9px', fill: m.color, fontWeight: 'bold' }}
                            />
                          )}
                        </Area>
                      );
                    }
                    return (
                      <Line 
                        key={m.key} 
                        yAxisId={m.yAxisId} 
                        type={m.chartType === 'spline' ? 'monotone' : 'linear'} 
                        dataKey={m.key} 
                        name={m.name} 
                        stroke={m.color} 
                        strokeWidth={2.5} 
                        dot={{ r: 3, fill: m.color, stroke: '#fff', strokeWidth: 1 }} 
                      >
                        {showDataLabels && (
                          <LabelList
                            dataKey={m.key}
                            position="top"
                            offset={6}
                            formatter={(val: any) => `${val}`}
                            style={{ fontSize: '9px', fill: m.color, fontWeight: 'bold' }}
                          />
                        )}
                      </Line>
                    );
                  })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
