import { MonthlyRecord } from '../types';

export function generateFullDashboardHtml(data: MonthlyRecord[], initialTab: string = 'overview'): string {
  const jsonEncodedData = JSON.stringify(data);

  // Map applet tab ID to dashboard tab ID
  let activeTabId = 'overview';
  if (initialTab === 'chart-tgs') activeTabId = 'tgs';
  else if (initialTab === 'chart-boiler') activeTabId = 'boiler';
  else if (initialTab === 'chart-kos') activeTabId = 'kos';
  else if (initialTab === 'chart-workshops') activeTabId = 'workshops';
  else if (initialTab === 'chart-costs') activeTabId = 'costs';
  else if (initialTab === 'chart-specific') activeTabId = 'specific';
  else if (initialTab === 'chart-builder') activeTabId = 'builder';
  else if (initialTab === 'data-table') activeTabId = 'table';
  else if (initialTab) activeTabId = initialTab.replace('chart-', '');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Энергоресурсы & Производство — Автономный Дашборд</title>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
  <!-- Direct Image & PDF Generation Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    :root {
      --primary: #d97706;
      --primary-dark: #b45309;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --ring: #d97706;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-top {
      max-width: 1440px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f59e0b, #b45309);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      font-weight: 900;
      box-shadow: 0 2px 6px rgba(180, 83, 9, 0.2);
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--muted);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    /* Navigation bar */
    .nav-bar {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 20px 8px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
    }
    .nav-tab {
      background: none;
      border: 1px solid transparent;
      padding: 8px 14px;
      font-size: 12.5px;
      font-weight: 600;
      color: #475569;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-tab:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .nav-tab.active {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    main {
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;
      padding: 20px;
      flex: 1;
    }
    /* Shared Toolbar */
    .toolbar-box {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .btn-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .btn-amber {
      background: #d97706;
      color: #ffffff;
      border-color: #d97706;
    }
    .btn-amber:hover {
      background: #b45309;
      border-color: #b45309;
    }
    .btn-emerald {
      background: #059669;
      color: #ffffff;
      border-color: #059669;
    }
    .btn-emerald:hover { background: #047857; }
    /* Grid & Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .kpi-card .label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-card .val {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .kpi-card .sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .card-box {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .card-subtitle {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 14px;
    }
    .chart-box {
      position: relative;
      height: 480px;
      width: 100%;
    }
    .series-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
      align-items: center;
    }
    .series-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .series-chip:hover {
      border-color: #94a3b8;
      background: #f1f5f9;
    }
    .series-chip.inactive {
      opacity: 0.45;
      text-decoration: line-through;
      background: #e2e8f0;
      border-color: #cbd5e1;
    }
    .series-chip .badge-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    /* Table styles */
    .table-container {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }
    .table-toolbar {
      padding: 14px 18px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .table-search {
      padding: 7px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      width: 240px;
    }
    .table-scroll {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    th {
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      padding: 10px 12px;
      position: sticky;
      top: 0;
      z-index: 10;
      white-space: nowrap;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      white-space: nowrap;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    tr:hover td { background: #fef3c7; }
    .action-btn {
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      cursor: pointer;
      margin-right: 4px;
    }
    .action-btn.edit:hover { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
    .action-btn.delete:hover { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .modal-header h3 { font-size: 18px; font-weight: 800; }
    .form-section {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .form-section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }
    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 3px;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      background: #fff;
    }
    .persist-banner {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    footer {
      background: #ffffff;
      border-top: 1px solid var(--border);
      padding: 16px 20px;
      text-align: center;
      font-size: 12px;
      color: var(--muted);
      margin-top: auto;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header>
    <div class="header-top">
      <div class="brand">
        <div class="brand-icon">🏭</div>
        <div>
          <div class="brand-title">Энергоресурсы & Производство — Полный Дашборд</div>
          <div class="brand-sub">Автономное интерактивное веб-приложение • Все разделы, графики и учет данных</div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-emerald" onclick="openNewRecordModal()">
          ➕ Внести новые данные
        </button>
        <button class="btn" onclick="saveUpdatedHtmlFile()" title="Скачать свежий файл HTML с зашитыми изменениями">
          💾 Скачать обновленный HTML
        </button>
        <button class="btn" onclick="exportJsonData()" title="Выгрузить данные в формате JSON">
          📤 Экспорт JSON
        </button>
        <label class="btn" style="cursor: pointer;" title="Загрузить сохраненный JSON">
          📥 Импорт JSON
          <input type="file" accept=".json" onchange="importJsonFile(event)" style="display:none;" />
        </label>
        <button class="btn" onclick="resetToFactoryDefault()" title="Вернуться к заводским исходным данным">
          🔄 Сброс базы
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="nav-bar">
      <button class="nav-tab active" onclick="switchTab('overview')">📊 Обзор</button>
      <button class="nav-tab" onclick="switchTab('tgs')">☕ Производство кофе</button>
      <button class="nav-tab" onclick="switchTab('boiler')">🔥 Котельная и Газ</button>
      <button class="nav-tab" onclick="switchTab('kos')">💧 КОС (Очистные)</button>
      <button class="nav-tab" onclick="switchTab('workshops')">⚡ Цеха (ЭЭ)</button>
      <button class="nav-tab" onclick="switchTab('costs')">💰 Затраты и Тарифы</button>
      <button class="nav-tab" onclick="switchTab('specific')">🎯 Удельные нормы</button>
      <button class="nav-tab" onclick="switchTab('builder')">🧩 Конструктор графиков</button>
      <button class="nav-tab" onclick="switchTab('table')">🗄️ Таблица показателей (<span id="record-count-badge">0</span>)</button>
    </div>
  </header>

  <!-- Main Views Container -->
  <main>
    <!-- Persistence Notice -->
    <div class="persist-banner" id="persist-banner">
      <span>💾 <b>Локальное сохранение активно:</b> все новые и измененные записи сохраняются в памяти вашего браузера (LocalStorage) и не пропадут при закрытии страницы.</span>
    </div>

    <!-- Shared Period Filter Bar -->
    <div class="toolbar-box">
      <div class="btn-group">
        <span style="font-size:12px; font-weight:700; color:#475569; margin-right:4px;">Годы:</span>
        <button class="btn active" id="filter-all" onclick="setPeriod('all')">Все годы (2021—2026)</button>
        <button class="btn" id="filter-2021" onclick="toggleFilterYear(2021)">2021</button>
        <button class="btn" id="filter-2022" onclick="toggleFilterYear(2022)">2022</button>
        <button class="btn" id="filter-2023" onclick="toggleFilterYear(2023)">2023</button>
        <button class="btn" id="filter-2024" onclick="toggleFilterYear(2024)">2024</button>
        <button class="btn" id="filter-2025" onclick="toggleFilterYear(2025)">2025</button>
        <button class="btn" id="filter-2026" onclick="toggleFilterYear(2026)">2026</button>
      </div>
      <div class="btn-group">
        <button class="btn btn-amber" id="btn-toggle-labels" onclick="toggleLabels()">
          🏷️ Значения на графике: <span id="labels-state" style="font-weight:700;">ВКЛ</span>
        </button>
        <button class="btn" style="background:#047857; color:#fff; border-color:#047857;" onclick="saveDashboardAsJpeg()">
          🖼️ Скачать JPEG
        </button>
        <button class="btn" style="background:#4338ca; color:#fff; border-color:#4338ca;" onclick="saveDashboardAsPdf()">
          📄 Скачать PDF
        </button>
      </div>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div id="tab-overview" class="tab-content">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="label">Общие затраты на ресурсы</div>
          <div class="val" id="ov-cost">-</div>
          <div class="sub">ЭЭ, Газ, ХВС</div>
        </div>
        <div class="kpi-card">
          <div class="label">Потребление электроэнергии</div>
          <div class="val" id="ov-ee">-</div>
          <div class="sub">Завод суммарно</div>
        </div>
        <div class="kpi-card">
          <div class="label">Расход природного газа</div>
          <div class="val" id="ov-gas">-</div>
          <div class="sub">Котельная + обжарка</div>
        </div>
        <div class="kpi-card">
          <div class="label">Водоснабжение (ХВС)</div>
          <div class="val" id="ov-water">-</div>
          <div class="sub">Технологическое ХВС</div>
        </div>
        <div class="kpi-card">
          <div class="label">Жареный кофе (ЖК)</div>
          <div class="val" id="ov-roasted">-</div>
          <div class="sub">Выпуск продукции</div>
        </div>
        <div class="kpi-card">
          <div class="label">Растворимый кофе (РК)</div>
          <div class="val" id="ov-instant">-</div>
          <div class="sub">Выпуск продукции</div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-title">Динамика энергозатрат и объемов производства</div>
        <div class="card-subtitle">Сопоставление ежемесячных расходов с выпуском жареного и растворимого кофе</div>
        <div class="series-row" id="overview-series-row"></div>
        <div class="chart-box">
          <canvas id="overviewChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 2: COFFEE PRODUCTION -->
    <div id="tab-tgs" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Производство кофе и основные энергоресурсы</div>
        <div class="card-subtitle">Выпуск продукции (ЖК, РК), электроэнергия завод и цеха ТК/АКТ, потребление газа и воды</div>
        <div class="series-row" id="tgs-series-row"></div>
        <div class="chart-box">
          <canvas id="tgsChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 3: BOILER -->
    <div id="tab-boiler" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Котельная и расход природного газа</div>
        <div class="card-subtitle">Общий газ, газ котельной, газ обжарки, наработка котлов и ХВС</div>
        <div class="series-row" id="boiler-series-row"></div>
        <div class="chart-box">
          <canvas id="boilerChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 4: KOS -->
    <div id="tab-kos" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Канализационные очистные сооружения (КОС)</div>
        <div class="card-subtitle">Баланс сточных вод, промсток, сброс с КОС, ФХО и расход электроэнергии</div>
        <div class="series-row" id="kos-series-row"></div>
        <div class="chart-box">
          <canvas id="kosChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 5: WORKSHOPS -->
    <div id="tab-workshops" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Баланс электроэнергии по цехам</div>
        <div class="card-subtitle">Распределение электропотребления: ТГС, ЦРК, АКЦ, ЦЖ (обжарка) и КОС</div>
        <div class="series-row" id="workshops-series-row"></div>
        <div class="chart-box">
          <canvas id="workshopsChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 6: COSTS & TARIFFS -->
    <div id="tab-costs" class="tab-content" style="display:none;">
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div class="card-title">Финансовые затраты и история тарифов</div>
            <div class="card-subtitle" id="costs-vat-subtitle">Распределение расходов по энергоносителям и динамика стоимости ресурсов</div>
          </div>
          <div class="btn-group">
            <button class="btn active" id="btn-vat-no" onclick="setVatMode(false)">Без НДС</button>
            <button class="btn" id="btn-vat-yes" onclick="setVatMode(true)">С учетом НДС</button>
          </div>
        </div>
        <div class="series-row" id="costs-series-row" style="margin-top:14px;"></div>
        <div class="chart-box">
          <canvas id="costsChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 7: SPECIFIC METRICS -->
    <div id="tab-specific" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Удельные нормы расхода на 1 тонну кофе</div>
        <div class="card-subtitle">Удельный газ (м³/т), электроэнергия (кВт·ч/т) и себестоимость энергоресурсов на тонну</div>
        <div class="series-row" id="specific-series-row"></div>
        <div class="chart-box">
          <canvas id="specificChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 8: CHART BUILDER -->
    <div id="tab-builder" class="tab-content" style="display:none;">
      <div class="card-box">
        <div class="card-title">Интерактивный конструктор графиков</div>
        <div class="card-subtitle">Свободный выбор любых показателей для визуализации</div>
        <div style="margin-bottom:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <select id="builder-metric-1" onchange="renderBuilderChart()" style="padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-weight:600; font-size:12px;">
            <option value="prod_roasted_coffee_ton">Жареный кофе (ЖК), т</option>
            <option value="prod_instant_coffee_ton">Растворимый кофе (РК), т</option>
            <option value="gas_total">Газ общий, м³</option>
            <option value="ee_factory_total">ЭЭ Завод общий, МВт/ч</option>
            <option value="cost_total_resources">Затраты на ресурсы, руб</option>
          </select>
          <select id="builder-metric-2" onchange="renderBuilderChart()" style="padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-weight:600; font-size:12px;">
            <option value="ee_tgs">ЭЭ ТГС, МВт/ч</option>
            <option value="gas_boiler">Газ котельная, м³</option>
            <option value="boiler_hours">Наработка котлов, м/ч</option>
            <option value="pressure_bar">Давление, бар</option>
            <option value="kos_inflow">Сток на КОС, м³</option>
          </select>
          <select id="builder-type" onchange="renderBuilderChart()" style="padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-weight:600; font-size:12px;">
            <option value="line">Тип: Линии</option>
            <option value="bar">Тип: Столбцы</option>
          </select>
        </div>
        <div class="chart-box">
          <canvas id="builderChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TAB 9: MAIN DATA TABLE & CRUD -->
    <div id="tab-table" class="tab-content" style="display:none;">
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:800; font-size:15px; color:#0f172a;">
            Журнал учета данных по месяцам (<span id="table-total-count">0</span> записей)
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <input type="text" id="mainTableSearch" class="table-search" placeholder="🔍 Поиск по месяцу..." oninput="renderMainTable()" />
            <button class="btn btn-emerald" onclick="openNewRecordModal()">➕ Добавить строку</button>
          </div>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Действия</th>
                <th>Месяц / Год</th>
                <th>ЖК (т)</th>
                <th>РК (т)</th>
                <th>ЭЭ ТГС (МВт)</th>
                <th>ЭЭ Завод (МВт)</th>
                <th>Газ общий (м³)</th>
                <th>Газ котлы (м³)</th>
                <th>Котлы (м/ч)</th>
                <th>ХВС завод (м³)</th>
                <th>КОС сток (м³)</th>
                <th>Давление (бар)</th>
                <th>Затраты (руб)</th>
              </tr>
            </thead>
            <tbody id="mainTableBody">
              <!-- Populated by JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Edit/Create Modal -->
  <div class="modal-overlay" id="recordModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modalTitle">Редактирование данных</h3>
        <button class="btn" onclick="closeModal()">✕</button>
      </div>
      <form id="recordForm" onsubmit="handleSaveRecord(event)">
        <input type="hidden" id="editRecordId" />

        <!-- Period info -->
        <div class="form-section">
          <div class="form-section-title">📅 Отчетный период</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Год</label>
              <input type="number" id="formYear" min="2020" max="2030" required />
            </div>
            <div class="form-group">
              <label>Месяц (1-12)</label>
              <select id="formMonthIndex" required>
                <option value="1">01 - Январь</option>
                <option value="2">02 - Февраль</option>
                <option value="3">03 - Март</option>
                <option value="4">04 - Апрель</option>
                <option value="5">05 - Май</option>
                <option value="6">06 - Июнь</option>
                <option value="7">07 - Июль</option>
                <option value="8">08 - Август</option>
                <option value="9">09 - Сентябрь</option>
                <option value="10">10 - Октябрь</option>
                <option value="11">11 - Ноябрь</option>
                <option value="12">12 - Декабрь</option>
              </select>
            </div>
            <div class="form-group">
              <label>Жареный кофе ЖК (тонн)</label>
              <input type="number" step="any" id="formProdRoasted" value="1900" required />
            </div>
            <div class="form-group">
              <label>Растворимый кофе РК (тонн)</label>
              <input type="number" step="any" id="formProdInstant" value="380" required />
            </div>
          </div>
        </div>

        <!-- Gas & Boiler -->
        <div class="form-section">
          <div class="form-section-title">🔥 Котельная и Природный Газ</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Газ общий (м³)</label>
              <input type="number" step="any" id="formGasTotal" value="480000" required />
            </div>
            <div class="form-group">
              <label>Газ котельная (м³)</label>
              <input type="number" step="any" id="formGasBoiler" value="310000" />
            </div>
            <div class="form-group">
              <label>Газ обжарка (м³)</label>
              <input type="number" step="any" id="formGasRoasting" value="170000" />
            </div>
            <div class="form-group">
              <label>Наработка котлов (м/ч)</label>
              <input type="number" step="any" id="formBoilerHours" value="1400" />
            </div>
            <div class="form-group">
              <label>ХВС завод общий (м³)</label>
              <input type="number" step="any" id="formBoilerHvsFactory" value="17000" />
            </div>
          </div>
        </div>

        <!-- Electricity & Workshops -->
        <div class="form-section">
          <div class="form-section-title">⚡ Электроэнергия по цехам (МВт/ч)</div>
          <div class="form-grid">
            <div class="form-group">
              <label>ЭЭ Завод общий (МВт)</label>
              <input type="number" step="any" id="formEeTotal" value="1870" required />
            </div>
            <div class="form-group">
              <label>ЭЭ ТГС (МВт)</label>
              <input type="number" step="any" id="formEeTgs" value="220" />
            </div>
            <div class="form-group">
              <label>ЭЭ ЦРК (МВт)</label>
              <input type="number" step="any" id="formEeCrk" value="350" />
            </div>
            <div class="form-group">
              <label>ЭЭ АКЦ (МВт)</label>
              <input type="number" step="any" id="formEeAkc" value="670" />
            </div>
            <div class="form-group">
              <label>ЭЭ ЦЖ Обжарка (МВт)</label>
              <input type="number" step="any" id="formEeCzh" value="480" />
            </div>
            <div class="form-group">
              <label>Давление (бар)</label>
              <input type="number" step="any" id="formPressure" value="7.5" />
            </div>
          </div>
        </div>

        <!-- KOS -->
        <div class="form-section">
          <div class="form-section-title">💧 КОС (Очистные сооружения)</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Сток на КОС (м³)</label>
              <input type="number" step="any" id="formKosInflow" value="14000" />
            </div>
            <div class="form-group">
              <label>Сброс с КОС (м³)</label>
              <input type="number" step="any" id="formKosDischarge" value="19000" />
            </div>
            <div class="form-group">
              <label>ЭЭ КОС (МВт/ч)</label>
              <input type="number" step="any" id="formKosEe" value="28" />
            </div>
          </div>
        </div>

        <!-- Tariffs -->
        <div class="form-section">
          <div class="form-section-title">💰 Тарифы (б/НДС)</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Тариф ЭЭ (руб/МВт)</label>
              <input type="number" step="any" id="formPriceEe" value="8800" />
            </div>
            <div class="form-group">
              <label>Тариф Газ (руб/м³)</label>
              <input type="number" step="any" id="formPriceGas" value="9.47" />
            </div>
            <div class="form-group">
              <label>Тариф ХВС (руб/м³)</label>
              <input type="number" step="any" id="formPriceHvs" value="71.11" />
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn" onclick="closeModal()">Отмена</button>
          <button type="submit" class="btn btn-amber">💾 Сохранить запись</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <div>Фабрика кофе • Автономный аналитический комплекс учета энергоносителей и производства</div>
    <div style="margin-top:4px;">Все данные сохраняются локально в вашем браузере (LocalStorage)</div>
  </footer>

  <script>
    const INITIAL_DEFAULT_DATA = ${jsonEncodedData};
    const STORAGE_KEY = 'factory_energy_dashboard_saved_data_v2';

    // State
    let APP_DATA = [];
    let currentTab = '${activeTabId}';
    let selectedYears = [2021, 2022, 2023, 2024, 2025, 2026];
    let showLabels = true;
    let isVatWith = false;

    // Series visibility state per tab
    const tabSeriesState = {
      overview: { roasted: true, instant: true, cost: true },
      tgs: { roasted: true, instant: true, ee_factory: true, ee_crk: true, ee_akc: true, gas: true, water: false },
      boiler: { gas_total: true, gas_boiler: true, boiler_hours: true, boiler_hvs: true },
      kos: { kos_inflow: true, kos_discharge: true, kos_ee: true },
      workshops: { ee_tgs: true, ee_crk: true, ee_akc: true, ee_czh: true, ee_total: true },
      costs: { cost_ee: true, cost_gas: true, cost_hvs: true, price_ee: true },
      specific: { gas_per_ton: true, ee_per_ton: true }
    };

    // Series definitions for chips
    const tabSeriesConfigs = {
      overview: [
        { key: 'roasted', label: 'ЖК', color: '#b45309' },
        { key: 'instant', label: 'РК', color: '#0284c7' },
        { key: 'cost', label: 'Затраты на ресурсы', color: '#10b981' }
      ],
      tgs: [
        { key: 'roasted', label: 'ЖК', color: '#b45309' },
        { key: 'instant', label: 'РК', color: '#0284c7' },
        { key: 'ee_factory', label: 'ЭЭ Завод', color: '#16a34a' },
        { key: 'gas', label: 'Газ', color: '#f97316' },
        { key: 'water', label: 'ХВС', color: '#06b6d4' }
      ],
      boiler: [
        { key: 'gas_total', label: 'Газ общий', color: '#f97316' },
        { key: 'gas_boiler', label: 'Газ котельная', color: '#ea580c' },
        { key: 'boiler_hours', label: 'Наработка котлов', color: '#0284c7' },
        { key: 'boiler_hvs', label: 'ХВС котельная', color: '#06b6d4' }
      ],
      kos: [
        { key: 'kos_inflow', label: 'Сток на КОС', color: '#0284c7' },
        { key: 'kos_discharge', label: 'Сброс с КОС', color: '#38bdf8' },
        { key: 'kos_ee', label: 'ЭЭ КОС', color: '#eab308' }
      ],
      workshops: [
        { key: 'ee_tgs', label: 'ТГС', color: '#0ea5e9' },
        { key: 'ee_crk', label: 'ЦРК', color: '#f59e0b' },
        { key: 'ee_akc', label: 'АКЦ', color: '#10b981' },
        { key: 'ee_czh', label: 'ЦЖ', color: '#f43f5e' },
        { key: 'ee_total', label: 'ЭЭ Завод', color: '#475569' }
      ],
      costs: [
        { key: 'cost_ee', label: 'Затраты ЭЭ', color: '#eab308' },
        { key: 'cost_gas', label: 'Затраты Газ', color: '#f97316' },
        { key: 'cost_hvs', label: 'Затраты ХВС', color: '#06b6d4' },
        { key: 'price_ee', label: 'Тариф ЭЭ', color: '#8b5cf6' }
      ],
      specific: [
        { key: 'gas_per_ton', label: 'Уд. Газ', color: '#f97316' },
        { key: 'ee_per_ton', label: 'Уд. ЭЭ', color: '#0284c7' }
      ]
    };

    // Charts instances registry
    const charts = {};

    const MONTH_NAMES = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const MONTH_SHORTS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    // Custom Canvas Plugin for 100% reliable offline data labels on bars & points
    const customDataLabelsPlugin = {
      id: 'customDataLabels',
      afterDatasetsDraw(chart) {
        if (!showLabels) return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.hidden) return;
          
          meta.data.forEach((element, index) => {
            const val = dataset.data[index];
            if (val === null || val === undefined || val === 0) return;
            
            let text = '';
            const num = Number(val);
            if (!isNaN(num)) {
              if (Math.abs(num) >= 1000000) text = (num / 1000000).toFixed(1) + 'M';
              else if (Math.abs(num) >= 10000) text = Math.round(num).toLocaleString('ru-RU');
              else if (Math.abs(num) >= 100) text = Math.round(num).toString();
              else if (Math.abs(num) >= 10) text = num.toFixed(1);
              else text = num.toFixed(2);
            } else {
              text = String(val);
            }
            
            const x = element.x;
            let y = element.y - 3;
            
            // Background pill for crisp contrast
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x - textWidth/2 - 2, y - 11, textWidth + 4, 12);
            
            ctx.fillStyle = dataset.borderColor || dataset.backgroundColor || '#0f172a';
            ctx.fillText(text, x, y);
          });
        });
        ctx.restore();
      }
    };
    Chart.register(customDataLabelsPlugin);

    // Load data from LocalStorage or Default
    function initData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            APP_DATA = parsed;
            return;
          }
        }
      } catch (e) {
        console.error('LocalStorage load failed', e);
      }
      APP_DATA = JSON.parse(JSON.stringify(INITIAL_DEFAULT_DATA));
    }

    function persistData() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_DATA));
      } catch (e) {
        console.error('LocalStorage save failed', e);
      }
      document.getElementById('record-count-badge').innerText = APP_DATA.length + ' мес.';
    }

    function getFilteredData() {
      return APP_DATA.filter(d => selectedYears.includes(d.year));
    }

    // Series Chips Render & Toggle
    function renderSeriesChips(tabId) {
      const container = document.getElementById(tabId + '-series-row');
      if (!container) return;
      const configs = tabSeriesConfigs[tabId];
      if (!configs) {
        container.style.display = 'none';
        return;
      }
      container.style.display = 'flex';
      container.innerHTML = '<span style="font-size:12px; font-weight:700; color:#475569; margin-right:4px;">Ряды данных (вкл/выкл):</span>';

      configs.forEach(cfg => {
        const active = tabSeriesState[tabId]?.[cfg.key] !== false;
        const chip = document.createElement('button');
        chip.className = 'series-chip ' + (active ? '' : 'inactive');
        chip.onclick = () => toggleTabSeries(tabId, cfg.key);
        chip.innerHTML = 
          '<span class="dot" style="background-color:' + (active ? cfg.color : '#94a3b8') + '"></span>' +
          '<span>' + cfg.label + '</span>' +
          '<span class="badge-status" style="background:' + (active ? '#fef3c7' : '#f1f5f9') + '; color:' + (active ? '#92400e' : '#64748b') + ';">' +
            (active ? 'ВКЛ' : 'ВЫКЛ') +
          '</span>';
        container.appendChild(chip);
      });
    }

    function toggleTabSeries(tabId, key) {
      if (!tabSeriesState[tabId]) tabSeriesState[tabId] = {};
      tabSeriesState[tabId][key] = !tabSeriesState[tabId][key];
      renderSeriesChips(tabId);
      renderActiveTab();
    }

    // Switch Tab
    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      const targetBtn = Array.from(document.querySelectorAll('.nav-tab')).find(b => b.getAttribute('onclick')?.includes(tabId));
      if (targetBtn) targetBtn.classList.add('active');

      const targetDiv = document.getElementById('tab-' + tabId);
      if (targetDiv) targetDiv.style.display = 'block';

      renderSeriesChips(tabId);
      renderActiveTab();
    }

    // Filter Periods
    function setPeriod(p) {
      if (p === 'all') {
        selectedYears = [2021, 2022, 2023, 2024, 2025, 2026];
      }
      updatePeriodButtons();
      renderActiveTab();
    }

    function toggleFilterYear(yr) {
      document.getElementById('filter-all').classList.remove('active');
      if (selectedYears.length === 6) {
        selectedYears = [yr];
      } else if (selectedYears.includes(yr)) {
        if (selectedYears.length > 1) selectedYears = selectedYears.filter(y => y !== yr);
        else selectedYears = [2021, 2022, 2023, 2024, 2025, 2026];
      } else {
        selectedYears.push(yr);
        selectedYears.sort((a,b) => a - b);
      }
      updatePeriodButtons();
      renderActiveTab();
    }

    function updatePeriodButtons() {
      const isAll = selectedYears.length === 6;
      document.getElementById('filter-all').className = isAll ? 'btn active' : 'btn';
      [2021, 2022, 2023, 2024, 2025, 2026].forEach(yr => {
        const btn = document.getElementById('filter-' + yr);
        if (btn) btn.className = selectedYears.includes(yr) ? 'btn btn-amber active' : 'btn';
      });
    }

    function toggleLabels() {
      showLabels = !showLabels;
      document.getElementById('labels-state').innerText = showLabels ? 'ВКЛ' : 'ВЫКЛ';
      document.getElementById('btn-toggle-labels').className = showLabels ? 'btn btn-amber' : 'btn';
      renderActiveTab();
    }

    function getVatRate(year) {
      return year >= 2026 ? 0.22 : 0.20;
    }

    function updateVatButtonLabel() {
      const btnYes = document.getElementById('btn-vat-yes');
      const subTitle = document.getElementById('costs-vat-subtitle');
      if (!btnYes) return;

      const has2026Plus = selectedYears.some(y => y >= 2026);
      const hasBefore2026 = selectedYears.some(y => y < 2026);

      let vatText = 'С НДС (20% / 22%)';
      let subText = 'Распределение расходов по энергоносителям и динамика стоимости ресурсов';

      if (has2026Plus && !hasBefore2026) {
        vatText = 'С НДС (22%)';
        subText = 'Расчет с учетом ставки НДС 22% (начиная с 2026 г.)';
      } else if (!has2026Plus && hasBefore2026) {
        vatText = 'С НДС (20%)';
        subText = 'Расчет с учетом ставки НДС 20% (до 2025 г. включительно)';
      } else {
        subText = 'Расчет с учетом ставки НДС 20% (до 2025 г.) и 22% (с 2026 г.)';
      }

      btnYes.innerText = vatText;
      if (subTitle && isVatWith) {
        subTitle.innerText = subText;
      } else if (subTitle) {
        subTitle.innerText = 'Распределение расходов по энергоносителям без учета НДС';
      }
    }

    function setVatMode(vat) {
      isVatWith = vat;
      document.getElementById('btn-vat-no').className = !vat ? 'btn active' : 'btn';
      document.getElementById('btn-vat-yes').className = vat ? 'btn active' : 'btn';
      updateVatButtonLabel();
      renderCostsChart();
    }

    // Universal helper to format Axis Labels with Month + Year (e.g. "янв '21", "фев '21")
    function getAxisLabels(data) {
      return data.map(d => d.monthShort + " '" + String(d.year).slice(-2));
    }

    function getFullLabels(data) {
      return data.map(d => d.month);
    }

    function getBaseTooltip(fullLabels) {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { weight: 'bold', size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: function(context) {
            const idx = context[0].dataIndex;
            return fullLabels[idx] || context[0].label;
          }
        }
      };
    }

    // TAB RENDER ROUTING
    function renderActiveTab() {
      const data = getFilteredData();
      if (currentTab === 'overview') renderOverview(data);
      if (currentTab === 'tgs') renderTgsChart(data);
      if (currentTab === 'boiler') renderBoilerChart(data);
      if (currentTab === 'kos') renderKosChart(data);
      if (currentTab === 'workshops') renderWorkshopsChart(data);
      if (currentTab === 'costs') renderCostsChart(data);
      if (currentTab === 'specific') renderSpecificChart(data);
      if (currentTab === 'builder') renderBuilderChart(data);
      if (currentTab === 'table') renderMainTable(data);
    }

    // OVERVIEW
    function renderOverview(data) {
      if (!data) data = getFilteredData();
      const totalCost = data.reduce((acc, c) => acc + (c.cost_total_resources || 0), 0);
      const totalEe = data.reduce((acc, c) => acc + (c.ee_factory_total || 0), 0);
      const totalGas = data.reduce((acc, c) => acc + (c.gas_total || 0), 0);
      const totalWater = data.reduce((acc, c) => acc + (c.boiler_hvs_factory_total || 0), 0);
      const totalRoasted = data.reduce((acc, c) => acc + (c.prod_roasted_coffee_ton || 0), 0);
      const totalInstant = data.reduce((acc, c) => acc + (c.prod_instant_coffee_ton || 0), 0);

      document.getElementById('ov-cost').innerText = (totalCost / 1000000).toFixed(2) + ' млн ₽';
      document.getElementById('ov-ee').innerText = totalEe.toLocaleString('ru-RU') + ' МВт/ч';
      document.getElementById('ov-gas').innerText = totalGas.toLocaleString('ru-RU') + ' м³';
      document.getElementById('ov-water').innerText = totalWater.toLocaleString('ru-RU') + ' м³';
      document.getElementById('ov-roasted').innerText = totalRoasted.toLocaleString('ru-RU') + ' т';
      document.getElementById('ov-instant').innerText = totalInstant.toLocaleString('ru-RU') + ' т';

      const ctx = document.getElementById('overviewChart').getContext('2d');
      if (charts.overview) charts.overview.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.overview;

      const datasets = [];
      if (st.roasted) {
        datasets.push({
          type: 'bar',
          label: 'ЖК',
          data: data.map(d => d.prod_roasted_coffee_ton),
          backgroundColor: '#b45309cc',
          yAxisID: 'y',
        });
      }
      if (st.instant) {
        datasets.push({
          type: 'bar',
          label: 'РК',
          data: data.map(d => d.prod_instant_coffee_ton),
          backgroundColor: '#0284c7cc',
          yAxisID: 'y',
        });
      }
      if (st.cost) {
        datasets.push({
          type: 'line',
          label: 'Затраты',
          data: data.map(d => (d.cost_total_resources / 1000000).toFixed(2)),
          borderColor: '#10b981',
          backgroundColor: '#10b98133',
          borderWidth: 3,
          yAxisID: 'y1',
          tension: 0.2,
          pointRadius: 4,
        });
      }

      charts.overview = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { position: 'left', title: { display: true, text: 'Выпуск кофе (тонн)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Затраты (млн ₽)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // COFFEE PRODUCTION & RESOURCES (бывший TGS)
    function renderTgsChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('tgsChart').getContext('2d');
      if (charts.tgs) charts.tgs.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.tgs;
      const datasets = [];

      if (st.roasted) {
        datasets.push({ type: 'bar', label: 'ЖК', data: data.map(d => d.prod_roasted_coffee_ton), backgroundColor: '#b45309cc', yAxisID: 'y' });
      }
      if (st.instant) {
        datasets.push({ type: 'bar', label: 'РК', data: data.map(d => d.prod_instant_coffee_ton), backgroundColor: '#0284c7cc', yAxisID: 'y' });
      }
      if (st.ee_factory) {
        datasets.push({ type: 'line', label: 'ЭЭ Завод', data: data.map(d => d.ee_factory_total), borderColor: '#16a34a', borderWidth: 2.5, yAxisID: 'y1', pointRadius: 4 });
      }
      if (st.gas) {
        datasets.push({ type: 'line', label: 'Газ', data: data.map(d => d.gas_total), borderColor: '#f97316', borderWidth: 2, yAxisID: 'y1', pointRadius: 3 });
      }
      if (st.water) {
        datasets.push({ type: 'line', label: 'ХВС', data: data.map(d => d.boiler_hvs_factory_total), borderColor: '#06b6d4', borderWidth: 1.5, borderDash: [3, 3], yAxisID: 'y1', pointRadius: 2 });
      }

      charts.tgs = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: 'Выпуск кофе (тонн)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Ресурсы (МВт/ч / м³)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // BOILER
    function renderBoilerChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('boilerChart').getContext('2d');
      if (charts.boiler) charts.boiler.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.boiler;
      const datasets = [];

      if (st.gas_total) {
        datasets.push({ type: 'bar', label: 'Газ общий', data: data.map(d => d.gas_total), backgroundColor: '#f97316cc', yAxisID: 'y' });
      }
      if (st.gas_boiler) {
        datasets.push({ type: 'bar', label: 'Газ котельная', data: data.map(d => d.gas_boiler), backgroundColor: '#ea580ccc', yAxisID: 'y' });
      }
      if (st.boiler_hours) {
        datasets.push({ type: 'line', label: 'Наработка котлов', data: data.map(d => d.boiler_hours), borderColor: '#0284c7', borderWidth: 2.5, yAxisID: 'y1', pointRadius: 4 });
      }
      if (st.boiler_hvs) {
        datasets.push({ type: 'line', label: 'ХВС котельная', data: data.map(d => d.boiler_hvs_boiler), borderColor: '#06b6d4', borderWidth: 2, yAxisID: 'y1', pointRadius: 4 });
      }

      charts.boiler = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: 'Расход газа (м³)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Часы работы / ХВС', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // KOS
    function renderKosChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('kosChart').getContext('2d');
      if (charts.kos) charts.kos.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.kos;
      const datasets = [];

      if (st.kos_inflow) {
        datasets.push({ type: 'bar', label: 'Сток на КОС', data: data.map(d => d.kos_inflow), backgroundColor: '#0284c7cc', yAxisID: 'y' });
      }
      if (st.kos_discharge) {
        datasets.push({ type: 'bar', label: 'Сброс с КОС', data: data.map(d => d.kos_discharge), backgroundColor: '#38bdf8cc', yAxisID: 'y' });
      }
      if (st.kos_ee) {
        datasets.push({ type: 'line', label: 'ЭЭ КОС', data: data.map(d => d.kos_ee), borderColor: '#eab308', borderWidth: 2.5, yAxisID: 'y1', pointRadius: 4 });
      }

      charts.kos = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: 'Объем сточных вод (м³)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Электроэнергия (МВт/ч)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // WORKSHOPS
    function renderWorkshopsChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('workshopsChart').getContext('2d');
      if (charts.workshops) charts.workshops.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.workshops;
      const datasets = [];

      if (st.ee_tgs) {
        datasets.push({ type: 'bar', label: 'ТГС', data: data.map(d => d.ee_tgs), backgroundColor: '#0ea5e9cc', stack: 'workshops' });
      }
      if (st.ee_crk) {
        datasets.push({ type: 'bar', label: 'ЦРК', data: data.map(d => d.ee_crk), backgroundColor: '#f59e0bcc', stack: 'workshops' });
      }
      if (st.ee_akc) {
        datasets.push({ type: 'bar', label: 'АКЦ', data: data.map(d => d.ee_akc), backgroundColor: '#10b981cc', stack: 'workshops' });
      }
      if (st.ee_czh) {
        datasets.push({ type: 'bar', label: 'ЦЖ', data: data.map(d => d.ee_roasting_czh), backgroundColor: '#f43f5ecc', stack: 'workshops' });
      }
      if (st.ee_total) {
        datasets.push({ type: 'line', label: 'ЭЭ Завод', data: data.map(d => d.ee_factory_total), borderColor: '#475569', borderWidth: 3, pointRadius: 4 });
      }

      charts.workshops = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { stacked: true, title: { display: true, text: 'Электроэнергия (МВт/ч)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // COSTS & TARIFFS
    function renderCostsChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('costsChart').getContext('2d');
      if (charts.costs) charts.costs.destroy();

      updateVatButtonLabel();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.costs;
      const datasets = [];

      if (st.cost_ee) {
        datasets.push({ 
          type: 'bar', 
          label: 'Затраты ЭЭ', 
          data: data.map(d => {
            const mult = isVatWith ? (1 + getVatRate(d.year)) : 1.0;
            return ((d.cost_ee_total * mult) / 1000000).toFixed(2);
          }), 
          backgroundColor: '#eab308cc', 
          yAxisID: 'y' 
        });
      }
      if (st.cost_gas) {
        datasets.push({ 
          type: 'bar', 
          label: 'Затраты Газ', 
          data: data.map(d => {
            const mult = isVatWith ? (1 + getVatRate(d.year)) : 1.0;
            return ((d.cost_gas_total * mult) / 1000000).toFixed(2);
          }), 
          backgroundColor: '#f97316cc', 
          yAxisID: 'y' 
        });
      }
      if (st.cost_hvs) {
        datasets.push({ 
          type: 'bar', 
          label: 'Затраты ХВС', 
          data: data.map(d => {
            const mult = isVatWith ? (1 + getVatRate(d.year)) : 1.0;
            return ((d.cost_hvs_total * mult) / 1000000).toFixed(2);
          }), 
          backgroundColor: '#06b6d4cc', 
          yAxisID: 'y' 
        });
      }
      if (st.price_ee) {
        datasets.push({ 
          type: 'line', 
          label: 'Тариф ЭЭ', 
          data: data.map(d => {
            const mult = isVatWith ? (1 + getVatRate(d.year)) : 1.0;
            return (d.price_ee * mult).toFixed(0);
          }), 
          borderColor: '#8b5cf6', 
          borderWidth: 2, 
          yAxisID: 'y1', 
          pointRadius: 4 
        });
      }

      charts.costs = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: 'Затраты (млн ₽)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Тариф ЭЭ (руб)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // SPECIFIC METRICS
    function renderSpecificChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('specificChart').getContext('2d');
      if (charts.specific) charts.specific.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const st = tabSeriesState.specific;
      const datasets = [];

      const gasPerTon = data.map(d => {
        const totalTon = (d.prod_roasted_coffee_ton || 0) + (d.prod_instant_coffee_ton || 0);
        return totalTon > 0 ? ((d.gas_total || 0) / totalTon).toFixed(1) : 0;
      });

      const eePerTon = data.map(d => {
        const totalTon = (d.prod_roasted_coffee_ton || 0) + (d.prod_instant_coffee_ton || 0);
        return totalTon > 0 ? (((d.ee_factory_total || 0) * 1000) / totalTon).toFixed(1) : 0;
      });

      if (st.gas_per_ton) {
        datasets.push({ type: 'bar', label: 'Уд. Газ', data: gasPerTon, backgroundColor: '#f97316cc', yAxisID: 'y' });
      }
      if (st.ee_per_ton) {
        datasets.push({ type: 'line', label: 'Уд. ЭЭ', data: eePerTon, borderColor: '#0284c7', borderWidth: 3, yAxisID: 'y1', pointRadius: 4 });
      }

      charts.specific = new Chart(ctx, {
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: 'Газ на 1 тонну (м³/т)', font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Электроэнергия на 1 тонну (кВт·ч/т)', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // BUILDER
    function renderBuilderChart(data) {
      if (!data) data = getFilteredData();
      const ctx = document.getElementById('builderChart').getContext('2d');
      if (charts.builder) charts.builder.destroy();

      const labels = getAxisLabels(data);
      const fullLabels = getFullLabels(data);
      const m1 = document.getElementById('builder-metric-1').value;
      const m2 = document.getElementById('builder-metric-2').value;
      const type = document.getElementById('builder-type').value;

      charts.builder = new Chart(ctx, {
        data: {
          labels: labels,
          datasets: [
            { type: type, label: m1, data: data.map(d => d[m1] || 0), backgroundColor: '#f59e0bcc', borderColor: '#d97706', borderWidth: 2, yAxisID: 'y' },
            { type: 'line', label: m2, data: data.map(d => d[m2] || 0), backgroundColor: '#0284c7cc', borderColor: '#0284c7', borderWidth: 2.5, yAxisID: 'y1', pointRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: getBaseTooltip(fullLabels)
          },
          scales: {
            x: { ticks: { font: { size: 10.5, weight: '600' }, color: '#475569', maxRotation: 45 } },
            y: { title: { display: true, text: m1, font: { weight: 'bold' } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: m2, font: { weight: 'bold' } } }
          }
        }
      });
    }

    // MAIN DATA TABLE & CRUD
    function renderMainTable() {
      const data = getFilteredData();
      const term = (document.getElementById('mainTableSearch').value || '').toLowerCase();
      const tbody = document.getElementById('mainTableBody');
      tbody.innerHTML = '';

      const filtered = data.filter(d => d.month.toLowerCase().includes(term));
      document.getElementById('table-total-count').innerText = filtered.length;

      filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = 
          '<td>' +
            '<button class="action-btn edit" onclick="openEditRecordModal(\\'' + d.id + '\\')">✏️ Изм.</button>' +
            '<button class="action-btn delete" onclick="deleteRecord(\\'' + d.id + '\\')">🗑️</button>' +
          '</td>' +
          '<td style="font-weight:700; color:#0f172a;">' + d.month + '</td>' +
          '<td>' + (d.prod_roasted_coffee_ton?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.prod_instant_coffee_ton?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.ee_tgs?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.ee_factory_total?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.gas_total?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.gas_boiler?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.boiler_hours || 0) + '</td>' +
          '<td>' + (d.boiler_hvs_factory_total?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.kos_inflow?.toLocaleString('ru-RU') || 0) + '</td>' +
          '<td>' + (d.pressure_bar || 0) + '</td>' +
          '<td style="font-weight:600;">' + (d.cost_total_resources ? (d.cost_total_resources / 1000000).toFixed(2) + ' млн' : 0) + '</td>';
        tbody.appendChild(tr);
      });
    }

    // MODAL & EDITING
    function openNewRecordModal() {
      document.getElementById('modalTitle').innerText = 'Внесение новых данных за месяц';
      document.getElementById('editRecordId').value = '';
      
      const last = APP_DATA[APP_DATA.length - 1] || {};
      let nextY = last.year || 2026;
      let nextM = (last.monthIndex || 7) + 1;
      if (nextM > 12) { nextM = 1; nextY += 1; }

      document.getElementById('formYear').value = nextY;
      document.getElementById('formMonthIndex').value = nextM;

      document.getElementById('recordModal').classList.add('active');
    }

    function openEditRecordModal(id) {
      const rec = APP_DATA.find(r => r.id === id);
      if (!rec) return;

      document.getElementById('modalTitle').innerText = 'Редактирование записи: ' + rec.month;
      document.getElementById('editRecordId').value = rec.id;

      document.getElementById('formYear').value = rec.year;
      document.getElementById('formMonthIndex').value = rec.monthIndex;
      document.getElementById('formProdRoasted').value = rec.prod_roasted_coffee_ton || 0;
      document.getElementById('formProdInstant').value = rec.prod_instant_coffee_ton || 0;
      document.getElementById('formGasTotal').value = rec.gas_total || 0;
      document.getElementById('formGasBoiler').value = rec.gas_boiler || 0;
      document.getElementById('formGasRoasting').value = rec.gas_roasting || 0;
      document.getElementById('formBoilerHours').value = rec.boiler_hours || 0;
      document.getElementById('formBoilerHvsFactory').value = rec.boiler_hvs_factory_total || 0;
      document.getElementById('formEeTotal').value = rec.ee_factory_total || 0;
      document.getElementById('formEeTgs').value = rec.ee_tgs || 0;
      document.getElementById('formEeCrk').value = rec.ee_crk || 0;
      document.getElementById('formEeAkc').value = rec.ee_akc || 0;
      document.getElementById('formEeCzh').value = rec.ee_roasting_czh || 0;
      document.getElementById('formPressure').value = rec.pressure_bar || 0;
      document.getElementById('formKosInflow').value = rec.kos_inflow || 0;
      document.getElementById('formKosDischarge').value = rec.kos_discharge || 0;
      document.getElementById('formKosEe').value = rec.kos_ee || 0;
      document.getElementById('formPriceEe').value = rec.price_ee || 8800;
      document.getElementById('formPriceGas').value = rec.price_gas || 9.47;
      document.getElementById('formPriceHvs').value = rec.price_hvs || 71.11;

      document.getElementById('recordModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('recordModal').classList.remove('active');
    }

    function handleSaveRecord(e) {
      e.preventDefault();
      const year = Number(document.getElementById('formYear').value);
      const monthIdx = Number(document.getElementById('formMonthIndex').value);
      const id = document.getElementById('editRecordId').value || (year + '-' + String(monthIdx).padStart(2, '0'));

      const priceEe = Number(document.getElementById('formPriceEe').value) || 0;
      const priceGas = Number(document.getElementById('formPriceGas').value) || 0;
      const priceHvs = Number(document.getElementById('formPriceHvs').value) || 0;

      const eeTotal = Number(document.getElementById('formEeTotal').value) || 0;
      const gasTotal = Number(document.getElementById('formGasTotal').value) || 0;
      const hvsTotal = Number(document.getElementById('formBoilerHvsFactory').value) || 0;

      const costEe = Math.round(eeTotal * priceEe);
      const costGas = Math.round(gasTotal * priceGas);
      const costHvs = Math.round(hvsTotal * priceHvs);
      const costTotal = costEe + costGas + costHvs;

      const record = {
        id: id,
        year: year,
        monthIndex: monthIdx,
        month: MONTH_NAMES[monthIdx - 1] + ' ' + year,
        monthShort: MONTH_SHORTS[monthIdx - 1],
        prod_roasted_coffee_ton: Number(document.getElementById('formProdRoasted').value) || 0,
        prod_instant_coffee_ton: Number(document.getElementById('formProdInstant').value) || 0,
        prod_spray_dry_kg: 0,
        gas_total: gasTotal,
        gas_boiler: Number(document.getElementById('formGasBoiler').value) || 0,
        gas_roasting: Number(document.getElementById('formGasRoasting').value) || 0,
        boiler_hours: Number(document.getElementById('formBoilerHours').value) || 0,
        boiler_hvs_factory_total: hvsTotal,
        boiler_hvs_boiler: Math.round(hvsTotal * 0.15),
        boiler_ee: 30,
        ee_factory_total: eeTotal,
        ee_tgs: Number(document.getElementById('formEeTgs').value) || 0,
        ee_crk: Number(document.getElementById('formEeCrk').value) || 0,
        ee_akc: Number(document.getElementById('formEeAkc').value) || 0,
        ee_roasting_czh: Number(document.getElementById('formEeCzh').value) || 0,
        ee_akc_rk: 1.8,
        hvs_akc_rk: 3.2,
        ee_crk_rk: 0.95,
        hvs_akc: 1200,
        pressure_bar: Number(document.getElementById('formPressure').value) || 0,
        kos_inflow: Number(document.getElementById('formKosInflow').value) || 0,
        kos_daily_industrial: Math.round(Number(document.getElementById('formKosInflow').value) * 0.9),
        kos_discharge: Number(document.getElementById('formKosDischarge').value) || 0,
        kos_fho: Math.round(Number(document.getElementById('formKosDischarge').value) * 0.95),
        kos_hvs: 450,
        kos_ee: Number(document.getElementById('formKosEe').value) || 0,
        price_hvs: priceHvs,
        price_gas: priceGas,
        price_ee: priceEe,
        cost_hvs_total: costHvs,
        cost_gas_total: costGas,
        cost_ee_total: costEe,
        cost_hvs_boiler: Math.round(costHvs * 0.15),
        cost_gas_boiler: Math.round(costGas * 0.65),
        cost_ee_boiler: 250000,
        cost_ee_crk: Math.round(costEe * 0.20),
        cost_ee_akc: Math.round(costEe * 0.35),
        cost_ee_tgs: Math.round(costEe * 0.12),
        cost_ee_kos: Math.round(costEe * 0.02),
        cost_ee_czh_cf: Math.round(costEe * 0.25),
        cost_total_resources: costTotal
      };

      const existingIndex = APP_DATA.findIndex(r => r.id === id);
      if (existingIndex >= 0) {
        APP_DATA[existingIndex] = record;
      } else {
        APP_DATA.push(record);
        APP_DATA.sort((a,b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.monthIndex - b.monthIndex;
        });
      }

      persistData();
      closeModal();
      renderActiveTab();
    }

    function deleteRecord(id) {
      if (!confirm('Вы действительно хотите удалить эту запись?')) return;
      APP_DATA = APP_DATA.filter(r => r.id !== id);
      persistData();
      renderActiveTab();
    }

    function resetToFactoryDefault() {
      if (!confirm('Вернуться к исходной заводской базе данных? Все локальные правки будут заменены.')) return;
      localStorage.removeItem(STORAGE_KEY);
      initData();
      persistData();
      renderActiveTab();
    }

    function exportJsonData() {
      const blob = new Blob([JSON.stringify(APP_DATA, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'energy_data_backup_' + new Date().toISOString().slice(0,10) + '.json';
      link.click();
    }

    function importJsonFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed) && parsed.length > 0) {
            APP_DATA = parsed;
            persistData();
            renderActiveTab();
            alert('Данные успешно импортированы! Загружено записей: ' + parsed.length);
          }
        } catch (err) {
          alert('Ошибка чтения файла JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    function saveUpdatedHtmlFile() {
      const updatedJson = JSON.stringify(APP_DATA);
      const currentDocHtml = document.documentElement.outerHTML;
      // Replace embedded default data with current APP_DATA
      const newDocHtml = currentDocHtml.replace(
        /const INITIAL_DEFAULT_DATA = .*?;/,
        'const INITIAL_DEFAULT_DATA = ' + updatedJson + ';'
      );
      const blob = new Blob([newDocHtml], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'дашборд_энергоресурсы_сохраненный_' + new Date().toISOString().slice(0,10) + '.html';
      link.click();
    }

    async function saveDashboardAsJpeg() {
      const main = document.querySelector('main');
      if (!main || typeof html2canvas === 'undefined') return;
      try {
        const canvas = await html2canvas(main, { scale: 2, backgroundColor: '#f8fafc' });
        const link = document.createElement('a');
        link.download = 'дашборд_энергоресурсы_' + currentTab + '_' + new Date().toISOString().slice(0,10) + '.jpeg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      } catch (err) {
        console.error('Ошибка сохранения JPEG:', err);
      }
    }

    async function saveDashboardAsPdf() {
      const main = document.querySelector('main');
      if (!main || typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') return;
      try {
        const canvas = await html2canvas(main, { scale: 2, backgroundColor: '#f8fafc' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 5, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10));
        pdf.save('дашборд_энергоресурсы_' + currentTab + '_' + new Date().toISOString().slice(0,10) + '.pdf');
      } catch (err) {
        console.error('Ошибка сохранения PDF:', err);
      }
    }

    // Startup
    window.addEventListener('DOMContentLoaded', () => {
      initData();
      persistData();
      switchTab(currentTab);
    });
  </script>
</body>
</html>`;
}
