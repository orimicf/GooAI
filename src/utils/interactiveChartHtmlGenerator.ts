import { MonthlyRecord } from '../types';

export function generateInteractiveChartHtml(
  title: string,
  data: MonthlyRecord[],
  periodLabel: string = '2021 — 2026',
  chartConfig?: {
    type?: string;
    series?: { key: keyof MonthlyRecord; label: string; color: string; yAxis?: 'left' | 'right'; type?: 'bar' | 'line' }[];
  }
): string {
  const jsonEncodedData = JSON.stringify(data);

  // Default series if none passed
  const seriesConfig = chartConfig?.series || [
    { key: 'prod_roasted_coffee_ton', label: 'ЖК', color: '#b45309', yAxis: 'left', type: 'bar' },
    { key: 'prod_instant_coffee_ton', label: 'РК', color: '#0284c7', yAxis: 'left', type: 'bar' },
    { key: 'ee_factory_total', label: 'ЭЭ Завод', color: '#16a34a', yAxis: 'right', type: 'line' },
    { key: 'gas_total', label: 'Газ', color: '#e11d48', yAxis: 'right', type: 'line' },
  ];

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Интерактивный аналитический отчёт</title>
  <!-- Chart.js & Plugins -->
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
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 20px;
    }
    .container {
      max-width: 1300px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.03);
      border: 1px solid var(--border);
    }
    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 20px;
    }
    .header-info h1 {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .header-info p {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 12px;
    }
    /* Toolbar */
    .toolbar {
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
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
    .btn-primary.active {
      background: #d97706;
      color: #ffffff;
      border-color: #d97706;
    }
    .btn-download {
      background: #047857;
      color: #ffffff;
      border-color: #047857;
    }
    .btn-download:hover {
      background: #065f46;
      border-color: #065f46;
    }
    .btn-pdf {
      background: #4338ca;
      color: #ffffff;
      border-color: #4338ca;
    }
    .btn-pdf:hover {
      background: #3730a3;
      border-color: #3730a3;
    }
    .series-toggles {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 12px;
      align-items: center;
    }
    .series-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      cursor: pointer;
      transition: all 0.15s;
    }
    .series-btn.inactive {
      opacity: 0.55;
      background: #f1f5f9;
      text-decoration: line-through;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0;
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--text-muted);
    }
    /* Chart Box */
    .chart-container {
      position: relative;
      height: 480px;
      width: 100%;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }
    /* Table */
    .table-box {
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      margin-top: 20px;
    }
    .table-header {
      background: #f8fafc;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .table-search {
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12px;
      width: 220px;
    }
    .table-scroll {
      max-height: 400px;
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
      font-weight: 600;
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
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
      flex-wrap: wrap;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="container" id="report-container">
    <!-- Header -->
    <div class="header">
      <div class="header-info">
        <h1>📊 ${title}</h1>
        <p>Интерактивная аналитика энергопотребления и выпуска продукции • Срез данных за период</p>
      </div>
      <div class="badge">
        <span>🏭 Завод Кофе</span>
        <span>•</span>
        <span id="period-display">${periodLabel}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="btn-group">
        <span style="font-weight: 700; font-size: 12px; color: #475569; margin-right: 4px;">Годы:</span>
        <button class="btn active" id="btn-all" onclick="filterYears('all')">Все (2021—2026)</button>
        <button class="btn" id="btn-2021" onclick="toggleYear(2021)">2021</button>
        <button class="btn" id="btn-2022" onclick="toggleYear(2022)">2022</button>
        <button class="btn" id="btn-2023" onclick="toggleYear(2023)">2023</button>
        <button class="btn" id="btn-2024" onclick="toggleYear(2024)">2024</button>
        <button class="btn" id="btn-2025" onclick="toggleYear(2025)">2025</button>
        <button class="btn" id="btn-2026" onclick="toggleYear(2026)">2026</button>
      </div>
      <div class="btn-group">
        <button class="btn" id="btn-labels" onclick="toggleDataLabels()">
          🏷️ Значения на графике: <span id="labels-status" style="font-weight: 700;">ВКЛ</span>
        </button>
        <button class="btn btn-download" onclick="saveAsJpeg()">
          🖼️ Сохранить в JPEG
        </button>
        <button class="btn btn-pdf" onclick="saveAsPdf()">
          📄 Сохранить в PDF
        </button>
      </div>
    </div>

    <!-- Series inclusion / exclusion toggles -->
    <div class="series-toggles" id="series-toggles-container">
      <!-- Populated by JS -->
    </div>

    <!-- Dynamic KPI Summary Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Общие затраты (ЭЭ + Газ + ХВС)</div>
        <div class="kpi-value" id="kpi-cost">-</div>
        <div class="kpi-sub">За выбранный период</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Электроэнергия завод (МВт/ч)</div>
        <div class="kpi-value" id="kpi-ee">-</div>
        <div class="kpi-sub">Суммарно по всем цехам</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Природный газ (м³)</div>
        <div class="kpi-value" id="kpi-gas">-</div>
        <div class="kpi-sub">Котельная + Обжарка</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Обжаренный кофе (т)</div>
        <div class="kpi-value" id="kpi-roasted">-</div>
        <div class="kpi-sub">Цех обжарки кофе</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Растворимый кофе (т)</div>
        <div class="kpi-value" id="kpi-instant">-</div>
        <div class="kpi-sub">Цех растворимого кофе</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Записей в выборке</div>
        <div class="kpi-value" id="kpi-count">-</div>
        <div class="kpi-sub" id="kpi-years-sub">2021—2026 гг.</div>
      </div>
    </div>

    <!-- Main Chart Box -->
    <div class="chart-container">
      <canvas id="mainChart"></canvas>
    </div>

    <!-- Table of values -->
    <div class="table-box">
      <div class="table-header">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a;">Таблица показателей за выбранный период</div>
        <input type="text" id="tableSearch" class="table-search" placeholder="🔍 Поиск по месяцу..." oninput="renderTable()" />
      </div>
      <div class="table-scroll">
        <table id="dataTable">
          <thead>
            <tr>
              <th>Период</th>
              <th>Обжаренный кофе (т)</th>
              <th>Растворимый кофе (т)</th>
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
          <tbody id="tableBody">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>Интерактивная аналитическая система • Экспорт HTML</span>
      <span>Все графики интерактивны: наведите курсор, переключайте фильтры и ряды данных</span>
    </div>
  </div>

  <script>
    // Register ChartDataLabels plugin globally
    if (typeof ChartDataLabels !== 'undefined') {
      Chart.register(ChartDataLabels);
    }

    const ALL_DATA = ${jsonEncodedData};
    const SERIES_CONFIG = ${JSON.stringify(seriesConfig)};
    
    let activeYears = [2021, 2022, 2023, 2024, 2025, 2026];
    let showLabels = true;
    let seriesVisibility = {};
    SERIES_CONFIG.forEach(s => { seriesVisibility[s.key] = true; });

    let chartInstance = null;

    // Filter data
    function getFilteredData() {
      return ALL_DATA.filter(d => activeYears.includes(d.year));
    }

    // Toggle year
    function toggleYear(year) {
      document.getElementById('btn-all').classList.remove('active');
      if (activeYears.length === 6) {
        // If all were active, select only this one
        activeYears = [year];
      } else if (activeYears.includes(year)) {
        if (activeYears.length > 1) {
          activeYears = activeYears.filter(y => y !== year);
        } else {
          activeYears = [2021, 2022, 2023, 2024, 2025, 2026];
          document.getElementById('btn-all').classList.add('active');
        }
      } else {
        activeYears.push(year);
        activeYears.sort((a,b) => a - b);
        if (activeYears.length === 6) {
          document.getElementById('btn-all').classList.add('active');
        }
      }
      updateYearButtons();
      updateView();
    }

    function filterYears(mode) {
      if (mode === 'all') {
        activeYears = [2021, 2022, 2023, 2024, 2025, 2026];
        document.getElementById('btn-all').classList.add('active');
      }
      updateYearButtons();
      updateView();
    }

    function updateYearButtons() {
      const isAll = activeYears.length === 6;
      document.getElementById('btn-all').className = isAll ? 'btn active' : 'btn';
      [2021, 2022, 2023, 2024, 2025, 2026].forEach(yr => {
        const btn = document.getElementById('btn-' + yr);
        if (btn) {
          btn.className = activeYears.includes(yr) ? 'btn btn-primary active' : 'btn';
        }
      });
      document.getElementById('period-display').innerText = isAll ? 'Все годы (2021 — 2026)' : activeYears.join(', ') + ' гг.';
    }

    function toggleDataLabels() {
      showLabels = !showLabels;
      document.getElementById('labels-status').innerText = showLabels ? 'ВКЛ' : 'ВЫКЛ';
      document.getElementById('btn-labels').style.background = showLabels ? '#d97706' : '#fff';
      document.getElementById('btn-labels').style.color = showLabels ? '#fff' : '#334155';
      renderChart();
    }

    function toggleSeries(key) {
      seriesVisibility[key] = !seriesVisibility[key];
      renderSeriesButtons();
      renderChart();
    }

    function renderSeriesButtons() {
      const container = document.getElementById('series-toggles-container');
      container.innerHTML = '<span style="font-size: 12px; font-weight: 700; color: #475569; margin-right: 6px;">Ряды данных (вкл/выкл):</span>';
      SERIES_CONFIG.forEach(s => {
        const active = seriesVisibility[s.key] !== false;
        const btn = document.createElement('button');
        btn.className = 'series-btn ' + (active ? '' : 'inactive');
        btn.onclick = () => toggleSeries(s.key);
        btn.innerHTML = '<span class="dot" style="background-color:' + (active ? s.color : '#94a3b8') + '"></span>' +
                        '<span>' + s.label + '</span> ' +
                        '<span style="font-size:10px; background:' + (active ? '#fef3c7' : '#f1f5f9') + '; color:' + (active ? '#92400e' : '#64748b') + '; padding:2px 6px; border-radius:4px; margin-left:4px; font-weight:700;">' + (active ? 'ВКЛ' : 'ВЫКЛ') + '</span>';
        container.appendChild(btn);
      });
    }

    function updateKPIs(data) {
      const totalCost = data.reduce((acc, curr) => acc + (curr.cost_total_resources || 0), 0);
      const totalEe = data.reduce((acc, curr) => acc + (curr.ee_factory_total || 0), 0);
      const totalGas = data.reduce((acc, curr) => acc + (curr.gas_total || 0), 0);
      const totalRoasted = data.reduce((acc, curr) => acc + (curr.prod_roasted_coffee_ton || 0), 0);
      const totalInstant = data.reduce((acc, curr) => acc + (curr.prod_instant_coffee_ton || 0), 0);

      document.getElementById('kpi-cost').innerText = (totalCost / 1000000).toFixed(2) + ' млн ₽';
      document.getElementById('kpi-ee').innerText = totalEe.toLocaleString('ru-RU') + ' МВт/ч';
      document.getElementById('kpi-gas').innerText = totalGas.toLocaleString('ru-RU') + ' м³';
      document.getElementById('kpi-roasted').innerText = totalRoasted.toLocaleString('ru-RU') + ' т';
      document.getElementById('kpi-instant').innerText = totalInstant.toLocaleString('ru-RU') + ' т';
      document.getElementById('kpi-count').innerText = data.length;
      document.getElementById('kpi-years-sub').innerText = activeYears.join(', ') + ' гг.';
    }

    function renderChart() {
      const data = getFilteredData();
      // Format Month with Year so year is immediately obvious: e.g. "янв '21", "фев '21"
      const labels = data.map(d => d.monthShort + " '" + String(d.year).slice(-2));
      const fullLabels = data.map(d => d.month);
      const ctx = document.getElementById('mainChart').getContext('2d');

      const datasets = [];
      let hasRightAxis = false;

      SERIES_CONFIG.forEach(s => {
        if (seriesVisibility[s.key] === false) return;

        const isRight = s.yAxis === 'right';
        if (isRight) hasRightAxis = true;

        datasets.push({
          label: s.label,
          type: s.type || 'line',
          data: data.map(d => d[s.key] || 0),
          borderColor: s.color,
          backgroundColor: s.type === 'bar' ? s.color + 'cc' : s.color + '22',
          borderWidth: 2.5,
          yAxisID: isRight ? 'y1' : 'y',
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 7,
          datalabels: {
            display: () => showLabels,
            color: s.color || '#0f172a',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: s.color,
            borderWidth: 1,
            borderRadius: 4,
            font: { weight: 'bold', size: 9.5 },
            padding: { top: 2, bottom: 2, left: 4, right: 4 },
            align: 'top',
            offset: 4,
            formatter: (val) => {
              if (val === null || val === undefined || val === 0) return '';
              const num = Number(val);
              if (isNaN(num)) return val;
              if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
              if (Math.abs(num) >= 10000) return Math.round(num).toLocaleString('ru-RU');
              if (Math.abs(num) >= 100) return Math.round(num).toString();
              if (Math.abs(num) >= 10) return num.toFixed(1);
              return num.toFixed(2);
            }
          }
        });
      });

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { 
              display: true, 
              position: 'top', 
              labels: { 
                font: { size: 11, weight: '600' }, 
                boxWidth: 12,
                padding: 14
              } 
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { weight: 'bold', size: 13 },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                title: function(context) {
                  const idx = context[0].dataIndex;
                  return fullLabels[idx] || context[0].label;
                },
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += Number(context.parsed.y).toLocaleString('ru-RU');
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#f1f5f9' },
              ticks: { 
                font: { size: 10.5, weight: '600' }, 
                color: '#475569',
                maxRotation: 45, 
                minRotation: 25 
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              grid: { color: '#e2e8f0' },
              title: { display: true, text: 'Шкала 1 (Объемы / Расход)', font: { size: 11, weight: 'bold' } }
            },
            y1: {
              type: 'linear',
              display: hasRightAxis,
              position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Шкала 2 (ЭЭ / Ресурсы)', font: { size: 11, weight: 'bold' } }
            }
          }
        }
      });
    }

    function renderTable() {
      const data = getFilteredData();
      const search = (document.getElementById('tableSearch').value || '').toLowerCase();
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      const filtered = data.filter(d => d.month.toLowerCase().includes(search));

      filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = 
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
          '<td style="font-weight:700; color:#b45309;">' + (d.cost_total_resources ? (d.cost_total_resources / 1000000).toFixed(2) + ' млн' : 0) + '</td>';
        tbody.appendChild(tr);
      });
    }

    function updateView() {
      const data = getFilteredData();
      updateKPIs(data);
      renderChart();
      renderTable();
    }

    // Direct Image Save as JPEG (High Resolution)
    async function saveAsJpeg() {
      const element = document.getElementById('report-container');
      if (!element || typeof html2canvas === 'undefined') return;
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = '${title.toLowerCase().replace(/[\s/\\:]+/g, '_')}.jpeg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      } catch (err) {
        console.error('Ошибка сохранения JPEG:', err);
      }
    }

    // Direct Save as PDF
    async function saveAsPdf() {
      const element = document.getElementById('report-container');
      if (!element || typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') return;
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 5, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10));
        pdf.save('${title.toLowerCase().replace(/[\s/\\:]+/g, '_')}.pdf');
      } catch (err) {
        console.error('Ошибка сохранения PDF:', err);
      }
    }

    // Init on load
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('btn-labels').style.background = '#d97706';
      document.getElementById('btn-labels').style.color = '#fff';
      renderSeriesButtons();
      updateView();
    });
  </script>
</body>
</html>`;
}
