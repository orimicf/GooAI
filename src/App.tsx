import React, { useState } from 'react';
import { useEnergyData } from './utils/dataStore';
import { ViewTab } from './types';
import { exportFullDashboardHtml } from './utils/exportUtils';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { CoffeeProdChart } from './components/charts/CoffeeProdChart';
import { BoilerChart } from './components/charts/BoilerChart';
import { KosChart } from './components/charts/KosChart';
import { WorkshopsChart } from './components/charts/WorkshopsChart';
import { CostsChart } from './components/charts/CostsChart';
import { SpecificMetricsChart } from './components/charts/SpecificMetricsChart';
import { ChartBuilder } from './components/charts/ChartBuilder';
import { DataTable } from './components/DataTable';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [selectedYears, setSelectedYears] = useState<number[]>([2021, 2022, 2023, 2024, 2025, 2026]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const {
    data,
    addRecord,
    updateRecord,
    deleteRecord,
    resetToDefault,
    importData,
  } = useEnergyData();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        recordCount={data.length}
        onExportDashboard={() => exportFullDashboardHtml(data, currentTab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'overview' && (
          <DashboardOverview
            data={data}
            onNavigate={setCurrentTab}
            selectedYears={selectedYears}
            onSelectYears={setSelectedYears}
            selectedMonths={selectedMonths}
            onSelectMonths={setSelectedMonths}
          />
        )}

        {currentTab === 'chart-tgs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Производство кофе и показатели энергоресурсов
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Сопоставление динамики выпуска жареного (ЖК) и растворимого (РК) кофе, расхода электроэнергии (завод, ТК, АКТ), газа и воды
                </p>
              </div>
            </div>
            <CoffeeProdChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-boiler' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Котельная и расход природного газа
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Мониторинг общего расхода газа, работы паровых котлов и технологического ХВС
              </p>
            </div>
            <BoilerChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-kos' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Канализационные очистные сооружения (КОС)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Баланс сточных вод, промстоков, сброса очищенной воды и затрат электроэнергии
              </p>
            </div>
            <KosChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-workshops' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Баланс электроэнергии по цехам
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Структура распределения электроэнергии между ТГС, ЦРК, АКЦ, цехом жарки (ЦЖ) и КОС
              </p>
            </div>
            <WorkshopsChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-costs' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Финансовый учет затрат и динамика тарифов
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Суммарные финансовые затраты на энергоресурсы и история изменения тарифов (2021 — 2026)
              </p>
            </div>
            <CostsChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-specific' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Удельные показатели и энергоемкость на 1 тонну продукции
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Нормы удельного расхода газа, электроэнергии и себестоимость энергоресурсов на тонну кофе
              </p>
            </div>
            <SpecificMetricsChart
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'chart-builder' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Интерактивный конструктор графиков
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Свободный выбор любых метрик из базы данных, настройка осей, типов графиков и экспорт
              </p>
            </div>
            <ChartBuilder
              data={data}
              selectedYears={selectedYears}
              onSelectYears={setSelectedYears}
              selectedMonths={selectedMonths}
              onSelectMonths={setSelectedMonths}
            />
          </div>
        )}

        {currentTab === 'data-table' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Управление данными (Ввод и редактирование)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Просмотр всех столбцов, добавление новых месяцев, редактирование существующих записей и импорт/экспорт
              </p>
            </div>
            <DataTable
              data={data}
              onAddRecord={addRecord}
              onUpdateRecord={updateRecord}
              onDeleteRecord={deleteRecord}
              onResetDefault={resetToDefault}
              onImportData={importData}
            />
          </div>
        )}
      </main>

      {/* Clean industrial footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Система аналитики энергоресурсов фабрики • Версия 2.4</span>
          <span>Экспорт: JPEG • PDF • Интерактивный HTML • Полный автономный Дашборд HTML</span>
        </div>
      </footer>
    </div>
  );
}
