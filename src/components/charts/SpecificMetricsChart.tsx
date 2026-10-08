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

interface SpecificMetricsProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const SpecificMetricsChart: React.FC<SpecificMetricsProps> = ({
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
    specific_ee: true,
    specific_gas: true,
    specific_cost: true,
  });

  const handleToggleSeries = (key: string) => {
    setSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const enrichedData = useMemo(() => {
    const raw = data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
    return raw.map((d) => {
      const totalCoffeeTon = (d.prod_roasted_coffee_ton + d.prod_instant_coffee_ton) || 1;
      const roastedTon = d.prod_roasted_coffee_ton || 1;
      const instantTon = d.prod_instant_coffee_ton || 1;

      return {
        ...d,
        // Удельный расход ЭЭ завода на тонну всей продукции (кВт*ч / т)
        specific_ee_factory_kwh_per_ton: Math.round((d.ee_factory_total * 1000) / totalCoffeeTon),
        // Удельный расход газа цеха жарки на 1 тонну натурального кофе (м3 / т)
        specific_gas_roast_m3_per_ton: Number((d.gas_roasting / roastedTon).toFixed(1)),
        // Удельный расход газа котельной на 1 тонну растворимого кофе (м3 / т)
        specific_gas_boiler_m3_per_ton: Number((d.gas_boiler / instantTon).toFixed(1)),
        // Удельный расход ХВС на 1 тонну всей продукции (м3 / т)
        specific_hvs_factory_m3_per_ton: Number((d.boiler_hvs_factory_total / totalCoffeeTon).toFixed(2)),
        // Себестоимость энергоресурсов на 1 тонну всей продукции (руб / т)
        specific_cost_per_ton_rub: Math.round(d.cost_total_resources / totalCoffeeTon),
        axisLabel: `${d.monthShort} '${String(d.year).slice(-2)}`,
      };
    });
  }, [data, selectedYears, selectedMonths]);

  // Aggregate averages for KPI tiles
  const avgSpecificEe = useMemo(() => {
    if (!enrichedData.length) return 0;
    return Math.round(enrichedData.reduce((a, b) => a + b.specific_ee_factory_kwh_per_ton, 0) / enrichedData.length);
  }, [enrichedData]);

  const avgSpecificGas = useMemo(() => {
    if (!enrichedData.length) return 0;
    return (enrichedData.reduce((a, b) => a + b.specific_gas_roast_m3_per_ton, 0) / enrichedData.length).toFixed(1);
  }, [enrichedData]);

  const avgSpecificCost = useMemo(() => {
    if (!enrichedData.length) return 0;
    return Math.round(enrichedData.reduce((a, b) => a + b.specific_cost_per_ton_rub, 0) / enrichedData.length);
  }, [enrichedData]);

  const seriesToggles: SeriesToggleItem[] = [
    { key: 'specific_ee', label: 'Уд. ЭЭ', color: '#f97316', active: seriesVisibility.specific_ee },
    { key: 'specific_gas', label: 'Уд. Газ обжарка', color: '#e11d48', active: seriesVisibility.specific_gas },
    { key: 'specific_cost', label: 'Уд. Себестоимость', color: '#15803d', active: seriesVisibility.specific_cost },
  ];

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="specific-metrics-container"
        chartTitle="УДЕЛЬНЫЕ_ПОКАЗАТЕЛИ_РЕСУРСОВ_НА_ТОННУ"
        data={enrichedData}
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
      <div id="specific-metrics-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Удельные показатели расхода ресурсов на 1 тонну продукции
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Энергоэффективность производства: потребление электроэнергии, газа и себестоимость энергоресурсов
            </p>
          </div>
          <span className="text-xs font-bold text-orange-900 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full">
            Покрытие: {enrichedData.length} мес.
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-orange-50/90 border border-orange-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">Удельный расход ЭЭ</p>
            <p className="text-2xl font-black text-orange-950 mt-1">
              {avgSpecificEe} <span className="text-sm font-semibold text-orange-700">кВт·ч/т</span>
            </p>
            <div className="text-xs text-orange-700 mt-2 pt-2 border-t border-orange-200/60 flex items-center justify-between">
              <span>На тонну всей продукции:</span>
              <b>среднее за период</b>
            </div>
          </div>

          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-rose-800 font-bold uppercase tracking-wider">Удельный газ на обжарку</p>
            <p className="text-2xl font-black text-rose-950 mt-1">
              {avgSpecificGas} <span className="text-sm font-semibold text-rose-700">м³/т</span>
            </p>
            <div className="text-xs text-rose-700 mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
              <span>Цех обжарки кофе:</span>
              <b>среднее за период</b>
            </div>
          </div>

          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Себестоимость энергии</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {avgSpecificCost.toLocaleString()} <span className="text-sm font-semibold text-emerald-700">₽ / т</span>
            </p>
            <div className="text-xs text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <span>Затраты на ресурсы / т:</span>
              <b>среднее за период</b>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Охват анализа</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {enrichedData.length} <span className="text-sm font-semibold text-slate-500">мес.</span>
            </p>
            <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span>Период:</span>
              <b className="truncate max-w-[120px]">{selectedYears.join(', ')}</b>
            </div>
          </div>
        </div>

        {/* Specific Energy and Gas Chart */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Удельный расход газа на обжарку и электроэнергии завода
              </h4>
              <p className="text-xs text-slate-500">
                Удельное потребление энергоресурсов в расчете на 1 тонну выпускаемой готовой продукции
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              Записей: {enrichedData.length} мес.
            </span>
          </div>

          <div className="h-[400px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedData} margin={{ top: 25, right: 35, left: 10, bottom: 65 }}>
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
                  stroke="#ea580c" 
                  tick={{ fontSize: 11, fill: '#ea580c', fontWeight: 600 }} 
                  name="кВт·ч / т продукции"
                />
                <YAxis 
                  yAxisId="gas" 
                  orientation="right" 
                  stroke="#e11d48" 
                  tick={{ fontSize: 11, fill: '#e11d48', fontWeight: 600 }} 
                  name="м³ газа / т кофе"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const rec = payload[0].payload as any;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">{rec.month}</p>
                          <p className="text-orange-300 flex justify-between gap-4">
                            <span>Уд. расход ЭЭ:</span> <b className="text-white">{rec.specific_ee_factory_kwh_per_ton} кВт·ч/т</b>
                          </p>
                          <p className="text-rose-300 flex justify-between gap-4">
                            <span>Уд. расход газа обжарки:</span> <b className="text-white">{rec.specific_gas_roast_m3_per_ton} м³/т</b>
                          </p>
                          <p className="text-sky-300 flex justify-between gap-4">
                            <span>Уд. расход ХВС завода:</span> <b className="text-white">{rec.specific_hvs_factory_m3_per_ton} м³/т</b>
                          </p>
                          <p className="text-emerald-300 flex justify-between gap-4">
                            <span>Затраты на тонну:</span> <b className="text-white">{rec.specific_cost_per_ton_rub.toLocaleString()} ₽/т</b>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                {seriesVisibility.specific_ee && (
                  <Bar 
                    yAxisId="ee" 
                    dataKey="specific_ee_factory_kwh_per_ton" 
                    name="Уд. ЭЭ" 
                    fill="#f97316" 
                    radius={[4, 4, 0, 0]} 
                    opacity={0.85} 
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="specific_ee_factory_kwh_per_ton"
                        position="top"
                        formatter={(val: any) => `${val}`}
                        style={{ fontSize: '9px', fill: '#c2410c', fontWeight: 'bold' }}
                      />
                    )}
                  </Bar>
                )}

                {seriesVisibility.specific_gas && (
                  <Line 
                    yAxisId="gas" 
                    type="monotone" 
                    dataKey="specific_gas_roast_m3_per_ton" 
                    name="Уд. Газ обжарка" 
                    stroke="#e11d48" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#e11d48', stroke: '#fff', strokeWidth: 1 }} 
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="specific_gas_roast_m3_per_ton"
                        position="top"
                        offset={6}
                        formatter={(val: any) => `${val}`}
                        style={{ fontSize: '9px', fill: '#9f1239', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specific Resource Cost Per Ton */}
        {seriesVisibility.specific_cost && (
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Энергетическая себестоимость 1 тонны продукции (₽/т)
                </h4>
                <p className="text-xs text-slate-500">
                  Затраты на все энергоресурсы (ЭЭ + Газ + Вода) на каждую тонну готового кофе
                </p>
              </div>
            </div>

            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedData} margin={{ top: 25, right: 25, left: 10, bottom: 65 }}>
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
                    name="₽/т"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const rec = payload[0].payload as any;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700">
                            <p className="font-bold text-emerald-300 mb-1">{rec.month}</p>
                            <p className="text-slate-200">Себестоимость энергии: <b className="text-white">{rec.specific_cost_per_ton_rub.toLocaleString()} ₽/т</b></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />

                  <Line 
                    type="monotone" 
                    dataKey="specific_cost_per_ton_rub" 
                    name="Уд. Себестоимость" 
                    stroke="#15803d" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#15803d', stroke: '#fff', strokeWidth: 1 }} 
                  >
                    {showDataLabels && (
                      <LabelList
                        dataKey="specific_cost_per_ton_rub"
                        position="top"
                        offset={6}
                        formatter={(val: any) => `${Math.round(val / 1000)}k`}
                        style={{ fontSize: '9px', fill: '#15803d', fontWeight: 'bold' }}
                      />
                    )}
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
