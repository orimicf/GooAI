import React, { useState } from 'react';
import { 
  Camera, 
  FileText, 
  FileCode,
  Maximize2, 
  Minimize2, 
  Tag, 
  Calendar,
  Layers,
  ChevronDown,
  Check,
  Download
} from 'lucide-react';
import { 
  exportElementAsImage, 
  exportElementAsPdf, 
  exportPageAsHtml,
  exportFullDashboardHtml
} from '../utils/exportUtils';
import { MonthlyRecord } from '../types';

export interface SeriesToggleItem {
  key: string;
  label: string;
  color: string;
  active: boolean;
}

interface ExportToolbarProps {
  chartElementId: string;
  chartTitle: string;
  data: MonthlyRecord[];
  showDataLabels?: boolean;
  onToggleDataLabels?: () => void;
  // Multi-year selection
  selectedYears?: number[];
  onSelectYears?: (years: number[]) => void;
  // Multi-month selection
  selectedMonths?: number[];
  onSelectMonths?: (months: number[]) => void;
  // Backward compatibility
  selectedYear?: number | 'all';
  onSelectYear?: (year: number | 'all') => void;
  // Series visibility toggles
  seriesToggles?: SeriesToggleItem[];
  onToggleSeries?: (key: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  availableYears?: number[];
  // Extra custom controls
  extraControls?: React.ReactNode;
  activeTab?: string;
}

const ALL_MONTHS = [
  { index: 1, name: 'Январь', short: 'Янв' },
  { index: 2, name: 'Февраль', short: 'Фев' },
  { index: 3, name: 'Март', short: 'Мар' },
  { index: 4, name: 'Апрель', short: 'Апр' },
  { index: 5, name: 'Май', short: 'Май' },
  { index: 6, name: 'Июнь', short: 'Июн' },
  { index: 7, name: 'Июль', short: 'Июл' },
  { index: 8, name: 'Август', short: 'Авг' },
  { index: 9, name: 'Сентябрь', short: 'Сен' },
  { index: 10, name: 'Октябрь', short: 'Окт' },
  { index: 11, name: 'Ноябрь', short: 'Ноя' },
  { index: 12, name: 'Декабрь', short: 'Дек' },
];

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  chartElementId,
  chartTitle,
  data,
  showDataLabels = false,
  onToggleDataLabels,
  selectedYears,
  onSelectYears,
  selectedMonths: propSelectedMonths,
  onSelectMonths: propOnSelectMonths,
  selectedYear,
  onSelectYear,
  seriesToggles,
  onToggleSeries,
  isFullscreen,
  onToggleFullscreen,
  availableYears = [2021, 2022, 2023, 2024, 2025, 2026],
  extraControls,
  activeTab,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [intervalMode, setIntervalMode] = useState<'years' | 'months'>('years');
  
  // Local month state fallback if not controlled from parent
  const [localMonths, setLocalMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const currentMonths = propSelectedMonths || localMonths;
  const setMonths = propOnSelectMonths || setLocalMonths;

  // Normalize selected years array
  const currentYears: number[] = React.useMemo(() => {
    if (selectedYears && selectedYears.length > 0) {
      return selectedYears;
    }
    if (selectedYear !== undefined) {
      if (selectedYear === 'all') return availableYears;
      return [Number(selectedYear)];
    }
    return availableYears;
  }, [selectedYears, selectedYear, availableYears]);

  const isAllYearsSelected = currentYears.length === availableYears.length;
  const isAllMonthsSelected = currentMonths.length === 12;

  const handleSelectAll = () => {
    if (onSelectYears) {
      onSelectYears(availableYears);
    } else if (onSelectYear) {
      onSelectYear('all');
    }
    setMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleToggleMonth = (monthIdx: number) => {
    let nextMonths: number[];
    if (currentMonths.includes(monthIdx)) {
      if (currentMonths.length > 1) {
        nextMonths = currentMonths.filter((m) => m !== monthIdx);
      } else {
        nextMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      }
    } else {
      nextMonths = [...currentMonths, monthIdx].sort((a, b) => a - b);
    }
    setMonths(nextMonths);
  };

  const handleSelectMonthPreset = (months: number[]) => {
    setMonths(months);
    setShowRangeDropdown(false);
  };

  const handleToggleYear = (yr: number, e: React.MouseEvent) => {
    if (e.shiftKey || e.altKey) {
      // Direct single select
      if (onSelectYears) {
        onSelectYears([yr]);
      } else if (onSelectYear) {
        onSelectYear(yr);
      }
      return;
    }

    if (onSelectYears) {
      if (isAllYearsSelected) {
        // If all were selected and user clicks one, select just that one
        onSelectYears([yr]);
      } else if (currentYears.includes(yr)) {
        // Remove year if not the only one left
        if (currentYears.length > 1) {
          onSelectYears(currentYears.filter((y) => y !== yr));
        } else {
          // If only one left, restore all
          onSelectYears(availableYears);
        }
      } else {
        // Add year
        onSelectYears([...currentYears, yr].sort((a, b) => a - b));
      }
    } else if (onSelectYear) {
      onSelectYear(yr);
    }
  };

  const handleSelectPreset = (years: number[]) => {
    if (onSelectYears) {
      onSelectYears(years);
    } else if (onSelectYear) {
      if (years.length === 1) onSelectYear(years[0]);
      else if (years.length === availableYears.length) onSelectYear('all');
      else onSelectYear(years[0]);
    }
    setShowRangeDropdown(false);
  };

  const handleRangeChange = (fromYear: number, toYear: number) => {
    const min = Math.min(fromYear, toYear);
    const max = Math.max(fromYear, toYear);
    const range = availableYears.filter((y) => y >= min && y <= max);
    if (onSelectYears) {
      onSelectYears(range);
    } else if (onSelectYear) {
      if (range.length === availableYears.length) onSelectYear('all');
      else onSelectYear(min);
    }
  };

  // Period label for headers & exports
  const periodLabel = React.useMemo(() => {
    let yrText = isAllYearsSelected 
      ? `Все годы (${availableYears[0]} — ${availableYears[availableYears.length - 1]})`
      : currentYears.length === 1 
        ? `${currentYears[0]} г.`
        : `${currentYears.join(', ')} гг.`;

    if (!isAllMonthsSelected) {
      if (currentMonths.length === 1) {
        const m = ALL_MONTHS.find(x => x.index === currentMonths[0]);
        yrText += ` (${m?.name || ''})`;
      } else if (currentMonths.length <= 4) {
        const mNames = currentMonths.map(idx => ALL_MONTHS.find(x => x.index === idx)?.short).filter(Boolean);
        yrText += ` (${mNames.join(', ')})`;
      } else {
        yrText += ` (${currentMonths.length} мес.)`;
      }
    }
    return yrText;
  }, [isAllYearsSelected, availableYears, currentYears, isAllMonthsSelected, currentMonths]);

  // Export handlers
  const handleExportJpeg = async () => {
    try {
      setIsExporting(true);
      await exportElementAsImage(chartElementId, `${chartTitle}_${currentYears.join('-')}`, 'jpeg');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportElementAsPdf(chartElementId, `${chartTitle} (${periodLabel})`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = async () => {
    try {
      setIsExporting(true);
      await exportPageAsHtml(chartElementId, chartTitle, data, periodLabel);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFullDashboard = () => {
    try {
      exportFullDashboardHtml(data, activeTab);
    } catch (e) {
      console.error(e);
    }
  };

  const [fromSelect, setFromSelect] = useState<number>(availableYears[0]);
  const [toSelect, setToSelect] = useState<number>(availableYears[availableYears.length - 1]);

  return (
    <div id="export-toolbar" className="space-y-2 mb-4">
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs sm:text-sm">
        
        {/* Left: Flexible Period Selector */}
        {(onSelectYears || onSelectYear) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-600 font-bold flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              Период:
            </span>

            {/* Quick All Button */}
            <button
              id="filter-year-all"
              onClick={handleSelectAll}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shadow-2xs ${
                isAllYearsSelected && isAllMonthsSelected
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Выбрать все годы и все месяцы (2021-2026)"
            >
              Все годы
            </button>

            {/* Multi-Select Year Pills */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex-wrap">
              {availableYears.map((yr) => {
                const isSelected = currentYears.includes(yr);
                return (
                  <button
                    key={yr}
                    id={`filter-year-${yr}`}
                    onClick={(e) => handleToggleYear(yr, e)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                    title={`Клик: включить/выключить ${yr} г. | Shift+клик: выбрать только ${yr}`}
                  >
                    {isSelected && !isAllYearsSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{yr}</span>
                  </button>
                );
              })}
            </div>

            {/* Range & Month Presets Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                  !isAllMonthsSelected
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
                title="Быстрый выбор диапазона по годам или месяцам"
              >
                <span>Интервал {!isAllMonthsSelected && `(${currentMonths.length} мес.)`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showRangeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="text-xs font-bold text-slate-800">
                      Интервал выборки:
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIntervalMode('years')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          intervalMode === 'years' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        По годам
                      </button>
                      <button
                        onClick={() => setIntervalMode('months')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          intervalMode === 'months' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        По месяцам
                      </button>
                    </div>
                  </div>

                  {intervalMode === 'years' ? (
                    <>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleSelectPreset([2021, 2022])}
                          className="px-2 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-md text-xs font-medium text-left"
                        >
                          2021 — 2022
                        </button>
                        <button
                          onClick={() => handleSelectPreset([2021, 2022, 2023, 2024])}
                          className="px-2 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-md text-xs font-medium text-left"
                        >
                          2021 — 2024
                        </button>
                        <button
                          onClick={() => handleSelectPreset([2024, 2025, 2026])}
                          className="px-2 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-md text-xs font-medium text-left"
                        >
                          2024 — 2026
                        </button>
                        <button
                          onClick={() => handleSelectPreset([2025, 2026])}
                          className="px-2 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded-md text-xs font-medium text-left"
                        >
                          2025 — 2026
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-2 space-y-2">
                        <div className="text-xs font-bold text-slate-800">Выбрать от и до (годы):</div>
                        <div className="flex items-center gap-2">
                          <select
                            value={fromSelect}
                            onChange={(e) => setFromSelect(Number(e.target.value))}
                            className="bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-xs font-medium flex-1"
                          >
                            {availableYears.map((y) => (
                              <option key={`from-${y}`} value={y}>{y}</option>
                            ))}
                          </select>
                          <span className="text-slate-400 font-bold">—</span>
                          <select
                            value={toSelect}
                            onChange={(e) => setToSelect(Number(e.target.value))}
                            className="bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-xs font-medium flex-1"
                          >
                            {availableYears.map((y) => (
                              <option key={`to-${y}`} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            handleRangeChange(fromSelect, toSelect);
                            setShowRangeDropdown(false);
                          }}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          Применить диапазон лет
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Fast Month Presets */}
                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        <button
                          onClick={() => handleSelectMonthPreset([1, 2, 3])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          Q1 (Янв-Мар)
                        </button>
                        <button
                          onClick={() => handleSelectMonthPreset([4, 5, 6])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          Q2 (Апр-Июн)
                        </button>
                        <button
                          onClick={() => handleSelectMonthPreset([7, 8, 9])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          Q3 (Июл-Сен)
                        </button>
                        <button
                          onClick={() => handleSelectMonthPreset([10, 11, 12])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          Q4 (Окт-Дек)
                        </button>
                        <button
                          onClick={() => handleSelectMonthPreset([1, 2, 3, 4, 5, 6])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          1-е полугодие
                        </button>
                        <button
                          onClick={() => handleSelectMonthPreset([7, 8, 9, 10, 11, 12])}
                          className="px-1.5 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 rounded font-medium text-center"
                        >
                          2-е полугодие
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-800 pt-1 border-t border-slate-100">
                        Выбор конкретных месяцев:
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {ALL_MONTHS.map((m) => {
                          const isSel = currentMonths.includes(m.index);
                          return (
                            <button
                              key={`month-select-${m.index}`}
                              onClick={() => handleToggleMonth(m.index)}
                              className={`px-1.5 py-1.5 text-[11px] rounded-lg font-bold border transition-all ${
                                isSel
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {m.short}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleSelectMonthPreset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Все месяцы
                        </button>
                        <button
                          onClick={() => setShowRangeDropdown(false)}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          Применить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Indicator of active period */}
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded-md hidden md:inline-block">
              Выбрано: <b className="text-slate-800">{periodLabel}</b> ({data.length} мес.)
            </span>
          </div>
        )}

        {/* Right: Labels toggle & Export actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {extraControls}

          {/* Data Labels Toggle Button */}
          {onToggleDataLabels && (
            <button
              id="btn-toggle-labels"
              onClick={onToggleDataLabels}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs sm:text-sm transition-all shadow-2xs ${
                showDataLabels
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Показать или скрыть точные числовые подписи над графиками и столбцами"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Значения: {showDataLabels ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>
          )}

          {/* Export Formats Group: JPEG, PDF, HTML, Full Dashboard */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs flex-wrap">
            <button
              id="btn-export-jpeg"
              disabled={isExporting}
              onClick={handleExportJpeg}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-amber-50 hover:text-amber-800 rounded-md font-semibold text-xs transition-colors disabled:opacity-50"
              title="Сохранить график как изображение JPEG (.jpeg)"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Сохранить в JPEG</span>
            </button>

            <button
              id="btn-export-pdf"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-rose-50 hover:text-rose-800 rounded-md font-semibold text-xs transition-colors disabled:opacity-50 border-l border-slate-200"
              title="Экспорт страницы и графика в PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>

            <button
              id="btn-export-html"
              disabled={isExporting}
              onClick={handleExportHtml}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-purple-50 hover:text-purple-800 rounded-md font-semibold text-xs transition-colors disabled:opacity-50 border-l border-slate-200"
              title="Сохранить график в автономный интерактивный HTML файл"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Сохранить в HTML</span>
            </button>

            <button
              id="btn-export-full-dashboard"
              onClick={handleExportFullDashboard}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md font-bold text-xs transition-colors border-l border-slate-200"
              title="Выгрузить весь дашборд со всеми вкладками в автономный HTML"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Весь дашборд (HTML)</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              id="btn-toggle-fullscreen"
              onClick={onToggleFullscreen}
              className="p-1.5 text-slate-700 hover:bg-slate-100 border border-slate-300 bg-white rounded-lg transition-colors shadow-2xs"
              title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Развернуть на весь экран'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Series Include/Exclude Row if Provided */}
      {seriesToggles && seriesToggles.length > 0 && onToggleSeries && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-wrap text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Отображение рядов (вкл/выкл):
          </span>
          {seriesToggles.map((item) => (
            <button
              key={item.key}
              onClick={() => onToggleSeries(item.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all border ${
                item.active
                  ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-200/70 border-slate-200 text-slate-400 line-through'
              }`}
              title={`Клик: ${item.active ? 'Скрыть' : 'Показать'} ряд "${item.label}"`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block" 
                style={{ backgroundColor: item.active ? item.color : '#94a3b8' }} 
              />
              <span>{item.label}</span>
              <span className={`text-[10px] px-1 rounded ${item.active ? 'bg-slate-100 text-slate-700' : 'bg-slate-300 text-slate-500'}`}>
                {item.active ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
