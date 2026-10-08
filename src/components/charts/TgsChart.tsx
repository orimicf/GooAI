import React, { useState, useMemo, useRef } from 'react';
import { MonthlyRecord } from '../../types';
import { ExportToolbar, SeriesToggleItem } from '../ExportToolbar';
import { TrendingUp, Coffee, Zap, Gauge } from 'lucide-react';

interface TgsChartProps {
  data: MonthlyRecord[];
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
}

export const TgsChart: React.FC<TgsChartProps> = ({
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
  const [activeSeries, setActiveSeries] = useState({
    roasted: true,
    instant: true,
    ee_tgs: true,
    pressure: true,
  });
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; record: MonthlyRecord; x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter data by selected years and months
  const filteredData = useMemo(() => {
    return data.filter((d) => selectedYears.includes(d.year) && selectedMonths.includes(d.monthIndex));
  }, [data, selectedYears, selectedMonths]);

  // Series toggles for toolbar
  const seriesToggles: SeriesToggleItem[] = [
    { key: 'roasted', label: 'НК', color: '#b91c1c', active: activeSeries.roasted },
    { key: 'instant', label: 'РК', color: '#a16207', active: activeSeries.instant },
    { key: 'ee_tgs', label: 'ТГС', color: '#ea580c', active: activeSeries.ee_tgs },
    { key: 'pressure', label: 'Давление', color: '#ca8a04', active: activeSeries.pressure },
  ];

  const handleToggleSeries = (key: string) => {
    setActiveSeries((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group years for bottom axis
  const yearSpans = useMemo(() => {
    const spans: { year: number; startIndex: number; count: number }[] = [];
    let currentYear: number | null = null;
    let startIndex = 0;
    let count = 0;

    filteredData.forEach((d, idx) => {
      if (d.year !== currentYear) {
        if (currentYear !== null) {
          spans.push({ year: currentYear, startIndex, count });
        }
        currentYear = d.year;
        startIndex = idx;
        count = 1;
      } else {
        count++;
      }
    });

    if (currentYear !== null) {
      spans.push({ year: currentYear, startIndex, count });
    }

    return spans;
  }, [filteredData]);

  // Dimensions & Coordinate scales for SVG Chart
  const margin = { top: 90, right: 40, bottom: 90, left: 40 };
  const pointSpacing = filteredData.length > 30 ? 36 : filteredData.length > 15 ? 48 : 65;
  const chartWidth = Math.max(920, filteredData.length * pointSpacing + margin.left + margin.right);
  const chartHeight = 520;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Scales
  const getY = (val: number, type: 'roasted' | 'instant' | 'ee' | 'pressure') => {
    if (type === 'roasted') {
      const min = 1000;
      const max = 2900;
      const pct = (val - min) / (max - min);
      return margin.top + innerHeight * (0.34 - pct * 0.28);
    }
    if (type === 'instant') {
      const min = 260;
      const max = 460;
      const pct = (val - min) / (max - min);
      return margin.top + innerHeight * (0.58 - pct * 0.16);
    }
    if (type === 'ee') {
      const min = 100;
      const max = 300;
      const pct = (val - min) / (max - min);
      return margin.top + innerHeight * (0.78 - pct * 0.15);
    }
    const min = 5;
    const max = 12;
    const pct = (val - min) / (max - min);
    return margin.top + innerHeight * (0.96 - pct * 0.09);
  };

  const getX = (index: number) => {
    if (filteredData.length <= 1) return margin.left + innerWidth / 2;
    return margin.left + (index / (filteredData.length - 1)) * innerWidth;
  };

  const makeSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const seriesData = useMemo(() => {
    const roastedPoints = filteredData.map((d, i) => ({ x: getX(i), y: getY(d.prod_roasted_coffee_ton, 'roasted'), val: d.prod_roasted_coffee_ton }));
    const instantPoints = filteredData.map((d, i) => ({ x: getX(i), y: getY(d.prod_instant_coffee_ton, 'instant'), val: d.prod_instant_coffee_ton }));
    const eePoints = filteredData.map((d, i) => ({ x: getX(i), y: getY(d.ee_tgs, 'ee'), val: d.ee_tgs }));
    const pressurePoints = filteredData.map((d, i) => ({ x: getX(i), y: getY(d.pressure_bar, 'pressure'), val: d.pressure_bar }));

    return {
      roasted: { points: roastedPoints, path: makeSmoothPath(roastedPoints) },
      instant: { points: instantPoints, path: makeSmoothPath(instantPoints) },
      ee: { points: eePoints, path: makeSmoothPath(eePoints) },
      pressure: { points: pressurePoints, path: makeSmoothPath(pressurePoints) },
    };
  }, [filteredData, activeSeries]);

  // Aggregate KPI metrics for selected period
  const totalRoasted = useMemo(() => filteredData.reduce((a, b) => a + b.prod_roasted_coffee_ton, 0), [filteredData]);
  const totalInstant = useMemo(() => filteredData.reduce((a, b) => a + b.prod_instant_coffee_ton, 0), [filteredData]);
  const totalEeTgs = useMemo(() => filteredData.reduce((a, b) => a + b.ee_tgs, 0), [filteredData]);
  const avgPressure = useMemo(() => {
    if (!filteredData.length) return 0;
    return (filteredData.reduce((a, b) => a + b.pressure_bar, 0) / filteredData.length).toFixed(1);
  }, [filteredData]);

  const periodLabelText = useMemo(() => {
    if (selectedYears.length === 6) return '2021 — 2026 гг.';
    if (selectedYears.length === 1) return `${selectedYears[0]} год`;
    return `${selectedYears.join(', ')} гг.`;
  }, [selectedYears]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      <ExportToolbar
        chartElementId="tgs-chart-container"
        chartTitle="ПОКАЗАТЕЛИ_ТГС_ПРОИЗВОДСТВО"
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
      <div id="tgs-chart-container" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header with Title and Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Производственные показатели: Выпуск кофе и ресурсы
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Сопоставление выработки натурального и растворимого кофе, электроэнергии и давления
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
              Покрытие: {filteredData.length} мес.
            </span>
          </div>
        </div>

        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-red-700 font-bold uppercase tracking-wider">Натуральный кофе</p>
            <p className="text-2xl font-black text-red-950 mt-1">
              {totalRoasted.toLocaleString()} <span className="text-sm font-semibold text-red-700">тонн</span>
            </p>
            <div className="text-xs text-red-700 mt-2 pt-2 border-t border-red-200/60 flex items-center justify-between">
              <span>В среднем в мес:</span>
              <b>{Math.round(totalRoasted / (filteredData.length || 1))} т</b>
            </div>
          </div>

          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Растворимый кофе</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {totalInstant.toLocaleString()} <span className="text-sm font-semibold text-amber-700">тонн</span>
            </p>
            <div className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span>В среднем в мес:</span>
              <b>{Math.round(totalInstant / (filteredData.length || 1))} т</b>
            </div>
          </div>

          <div className="bg-orange-50/90 border border-orange-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">Электроэнергия ТГС</p>
            <p className="text-2xl font-black text-orange-950 mt-1">
              {totalEeTgs.toFixed(1)} <span className="text-sm font-semibold text-orange-700">МВт/ч</span>
            </p>
            <div className="text-xs text-orange-700 mt-2 pt-2 border-t border-orange-200/60 flex items-center justify-between">
              <span>В среднем в мес:</span>
              <b>{(totalEeTgs / (filteredData.length || 1)).toFixed(1)} МВт/ч</b>
            </div>
          </div>

          <div className="bg-yellow-50/90 border border-yellow-200 rounded-2xl p-4 shadow-2xs">
            <p className="text-xs text-yellow-800 font-bold uppercase tracking-wider">Рабочее давление ТГС</p>
            <p className="text-2xl font-black text-yellow-950 mt-1">
              {avgPressure} <span className="text-sm font-semibold text-yellow-700">бар</span>
            </p>
            <div className="text-xs text-yellow-700 mt-2 pt-2 border-t border-yellow-200/60 flex items-center justify-between">
              <span>Статус:</span>
              <b className="text-emerald-700 font-bold">Норма (6.0 — 8.5)</b>
            </div>
          </div>
        </div>

        {/* Clear Visual Legend Bar without parentheses */}
        <div className="flex items-center justify-center flex-wrap gap-4 py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Легенда:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#b91c1c] border-2 border-white shadow-xs"></span>
            <span className="font-bold text-slate-800">НК</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#a16207] border-2 border-white shadow-xs"></span>
            <span className="font-bold text-slate-800">РК</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#ea580c] border-2 border-white shadow-xs"></span>
            <span className="font-bold text-slate-800">ЭЭ ТГС</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-[#ca8a04]"></span>
            <span className="font-bold text-slate-800">Давление</span>
          </div>
        </div>

        {/* Main SVG Chart */}
        <div 
          ref={containerRef}
          className="overflow-x-auto relative pt-1"
        >
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Background Grid Lines */}
            <g className="grid-lines" stroke="#f1f5f9" strokeWidth="1">
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95].map((p, i) => (
                <line 
                  key={`h-grid-${i}`}
                  x1={margin.left} 
                  y1={margin.top + innerHeight * p} 
                  x2={margin.left + innerWidth} 
                  y2={margin.top + innerHeight * p} 
                />
              ))}
            </g>

            {/* Vertical grid & month lines */}
            <g className="v-lines" stroke="#f8fafc" strokeWidth="1">
              {filteredData.map((_, i) => (
                <line 
                  key={`v-grid-${i}`}
                  x1={getX(i)} 
                  y1={margin.top} 
                  x2={getX(i)} 
                  y2={margin.top + innerHeight} 
                />
              ))}
            </g>

            {/* Paths */}
            {activeSeries.roasted && (
              <path
                d={seriesData.roasted.path}
                fill="none"
                stroke="#b91c1c"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
            )}

            {activeSeries.instant && (
              <path
                d={seriesData.instant.path}
                fill="none"
                stroke="#a16207"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
            )}

            {activeSeries.ee_tgs && (
              <path
                d={seriesData.ee.path}
                fill="none"
                stroke="#ea580c"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
            )}

            {activeSeries.pressure && (
              <path
                d={seriesData.pressure.path}
                fill="none"
                stroke="#ca8a04"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="transition-all duration-300"
              />
            )}

            {/* Points & Data Labels */}
            {filteredData.map((d, i) => {
              const x = getX(i);
              const roastedY = getY(d.prod_roasted_coffee_ton, 'roasted');
              const instantY = getY(d.prod_instant_coffee_ton, 'instant');
              const eeY = getY(d.ee_tgs, 'ee');
              const pressureY = getY(d.pressure_bar, 'pressure');

              return (
                <g key={`points-${i}`}>
                  {/* Roasted Point & Label */}
                  {activeSeries.roasted && (
                    <g>
                      <circle cx={x} cy={roastedY} r={3.5} fill="#b91c1c" stroke="#fff" strokeWidth={1.5} />
                      {showDataLabels && (
                        <text
                          x={x}
                          y={roastedY - 8}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#b91c1c"
                          className="pointer-events-none"
                        >
                          {d.prod_roasted_coffee_ton}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Instant Point & Label */}
                  {activeSeries.instant && (
                    <g>
                      <circle cx={x} cy={instantY} r={3.5} fill="#a16207" stroke="#fff" strokeWidth={1.5} />
                      {showDataLabels && (
                        <text
                          x={x}
                          y={instantY - 8}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#a16207"
                          className="pointer-events-none"
                        >
                          {d.prod_instant_coffee_ton}
                        </text>
                      )}
                    </g>
                  )}

                  {/* EE TGS Point & Label */}
                  {activeSeries.ee_tgs && (
                    <g>
                      <circle cx={x} cy={eeY} r={3.5} fill="#ea580c" stroke="#fff" strokeWidth={1.5} />
                      {showDataLabels && (
                        <text
                          x={x}
                          y={eeY - 8}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#ea580c"
                          className="pointer-events-none"
                        >
                          {d.ee_tgs}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Pressure Point & Label */}
                  {activeSeries.pressure && (
                    <g>
                      <circle cx={x} cy={pressureY} r={3} fill="#ca8a04" stroke="#fff" strokeWidth={1.5} />
                      {showDataLabels && (
                        <text
                          x={x}
                          y={pressureY + 12}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="700"
                          fill="#a16207"
                          className="pointer-events-none"
                        >
                          {d.pressure_bar}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Month Label on X Axis */}
                  <text
                    x={x}
                    y={margin.top + innerHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#475569"
                  >
                    {d.monthShort} '{String(d.year).slice(-2)}
                  </text>

                  {/* Invisible Hover Trigger Column */}
                  <rect
                    x={x - pointSpacing / 2}
                    y={margin.top}
                    width={pointSpacing}
                    height={innerHeight + 30}
                    fill="transparent"
                    className="cursor-pointer hover:fill-amber-500/5 transition-colors"
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setHoveredPoint({
                        index: i,
                        record: d,
                        x: e.clientX - (rect?.left || 0),
                        y: e.clientY - (rect?.top || 0),
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}

            {/* Year Brackets Bottom */}
            <g className="year-brackets">
              {yearSpans.map((span, idx) => {
                const startX = getX(span.startIndex) - (filteredData.length > 1 ? pointSpacing / 2.5 : 30);
                const endX = getX(span.startIndex + span.count - 1) + (filteredData.length > 1 ? pointSpacing / 2.5 : 30);
                const midX = (startX + endX) / 2;
                const bracketY = margin.top + innerHeight + 42;

                return (
                  <g key={`year-span-${idx}`}>
                    {/* Line & ticks */}
                    <line x1={startX + 4} y1={bracketY} x2={endX - 4} y2={bracketY} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={startX + 4} y1={bracketY - 4} x2={startX + 4} y2={bracketY + 4} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={endX - 4} y1={bracketY - 4} x2={endX - 4} y2={bracketY + 4} stroke="#94a3b8" strokeWidth="1.5" />

                    {/* Year badge */}
                    <rect
                      x={midX - 26}
                      y={bracketY + 6}
                      width={52}
                      height={20}
                      rx={4}
                      fill="#0f172a"
                    />
                    <text
                      x={midX}
                      y={bracketY + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      {span.year}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            className="absolute z-40 pointer-events-none bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-xs min-w-[210px]"
            style={{
              left: Math.min(Math.max(10, hoveredPoint.x - 100), (containerRef.current?.clientWidth || 900) - 230),
              top: Math.max(10, hoveredPoint.y - 140),
            }}
          >
            <p className="font-bold text-amber-300 text-sm mb-1 pb-1 border-b border-slate-700">
              {hoveredPoint.record.month}
            </p>
            <div className="space-y-1">
              <p className="text-red-300 flex justify-between">
                <span>Натуральный кофе (НК):</span> <b className="text-white">{hoveredPoint.record.prod_roasted_coffee_ton} т</b>
              </p>
              <p className="text-yellow-300 flex justify-between">
                <span>Растворимый (РК):</span> <b className="text-white">{hoveredPoint.record.prod_instant_coffee_ton} т</b>
              </p>
              <p className="text-orange-300 flex justify-between">
                <span>ЭЭ ТГС:</span> <b className="text-white">{hoveredPoint.record.ee_tgs} МВт/ч</b>
              </p>
              <p className="text-amber-200 flex justify-between">
                <span>Давление ТГС:</span> <b className="text-white">{hoveredPoint.record.pressure_bar} бар</b>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
