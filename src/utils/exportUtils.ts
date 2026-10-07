import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MonthlyRecord } from '../types';
import { generateInteractiveChartHtml } from './interactiveChartHtmlGenerator';
import { generateFullDashboardHtml } from './dashboardHtmlGenerator';

/**
 * Export a DOM element as a high-resolution JPEG image
 */
export async function exportElementAsImage(
  elementId: string,
  fileName: string,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: number = 0.95
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const options = {
    quality: quality,
    pixelRatio: 2, // High resolution crisp export
    backgroundColor: '#ffffff',
  };

  let dataUrl = '';
  if (format === 'png') {
    dataUrl = await toPng(element, options);
  } else {
    dataUrl = await toJpeg(element, options);
  }

  const link = document.createElement('a');
  link.download = `${fileName}.${format}`;
  link.href = dataUrl;
  link.click();
}

/**
 * Export a DOM element and title as a formatted PDF page
 */
export async function exportElementAsPdf(elementId: string, title: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const imgProps = pdf.getImageProperties(dataUrl);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10));
  pdf.save(`${title.toLowerCase().replace(/[\s/\\:]+/g, '_')}.pdf`);
}

/**
 * Export interactive standalone HTML report for a specific chart or section
 */
export async function exportPageAsHtml(
  elementId: string,
  title: string,
  data: MonthlyRecord[],
  periodLabel: string = '2021 — 2026',
  chartConfig?: {
    series?: { key: keyof MonthlyRecord; label: string; color: string; yAxis?: 'left' | 'right'; type?: 'bar' | 'line' }[];
  }
) {
  const htmlContent = generateInteractiveChartHtml(title, data, periodLabel, chartConfig);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.toLowerCase().replace(/[\s/\\:]+/g, '_')}_интерактивный_отчет.html`;
  link.click();
}

/**
 * Export the entire dashboard with all tabs into an interactive, offline-capable HTML app with data persistence
 */
export function exportFullDashboardHtml(data: MonthlyRecord[], initialTab?: string) {
  const htmlContent = generateFullDashboardHtml(data, initialTab);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const suffix = initialTab ? `_${initialTab}` : '';
  link.download = `дашборд_энергоресурсы${suffix}_${new Date().toISOString().slice(0, 10)}.html`;
  link.click();
}
