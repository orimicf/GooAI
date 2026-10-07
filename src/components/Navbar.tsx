import React from 'react';
import { 
  BarChart2, 
  Coffee, 
  Flame, 
  Droplets, 
  Zap, 
  Coins, 
  Activity, 
  Layers, 
  Database,
  Factory,
  Download
} from 'lucide-react';
import { ViewTab } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  recordCount: number;
  onExportDashboard?: () => void;
}

const TABS: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Обзор', icon: BarChart2 },
  { id: 'chart-tgs', label: 'Производство кофе', icon: Coffee },
  { id: 'chart-boiler', label: 'Котельная и Газ', icon: Flame },
  { id: 'chart-kos', label: 'КОС (Очистные)', icon: Droplets },
  { id: 'chart-workshops', label: 'Цеха (Электроэнергия)', icon: Zap },
  { id: 'chart-costs', label: 'Затраты и Тарифы', icon: Coins },
  { id: 'chart-specific', label: 'Удельные нормы', icon: Activity },
  { id: 'chart-builder', label: 'Конструктор графиков', icon: Layers },
  { id: 'data-table', label: 'Показатели', icon: Database },
];

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, recordCount, onExportDashboard }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Brand and Status row */}
        <div className="flex items-center justify-between h-16 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-sm font-black">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Энергоресурсы & Производство
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                  Analytics v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Мониторинг энергоносителей, КОС, котельной, цехов обжарки и растворимого кофе
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportDashboard && (
              <button
                id="btn-navbar-export-html"
                onClick={onExportDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                title="Скачать весь интерактивный дашборд со всеми вкладками в один HTML файл с сохранением данных"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Выгрузить дашборд (HTML)</span>
                <span className="sm:hidden">HTML</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('data-table')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>База: {recordCount} мес.</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-semibold">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
