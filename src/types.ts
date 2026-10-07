export interface MonthlyRecord {
  id: string;
  month: string; // e.g. "Январь 2021"
  year: number;  // 2021..2026
  monthIndex: number; // 1..12
  monthShort: string; // "янв", "фев", ...

  // КОС
  kos_inflow: number;            // Кол-во поступившего стока на КОС, м3
  kos_daily_industrial: number;  // Суточный промсток, м3
  kos_discharge: number;         // Сброс с КОС, м3
  kos_fho: number;               // На ФХО, м3
  kos_hvs: number;               // Потребление ХВС для КОС (м3)
  kos_ee: number;                // Электроэнергия, КОС, МВт/час

  // Котельная
  boiler_hvs_factory_total: number; // Потребление ХВС завод общее (м3)
  boiler_hvs_boiler: number;        // Потребление ХВС для котельной (м3)
  boiler_hours: number;             // Наработка котлов, м/ч
  boiler_ee: number;                // Электроэнергия, Котельная, МВт/час
  gas_total: number;                // Потребление ГАЗ общий, м3
  gas_boiler: number;               // Потребление ГАЗ котельная, м3
  gas_roasting: number;             // Потребление ГАЗ цех жарки, м3

  // Цеха / Энергия
  ee_tgs: number;                   // Электроэнергия, ТГС, МВт/час
  ee_crk: number;                   // Электроэнергия, ЦРК, МВт/час
  ee_akc: number;                   // Электроэнергия, АКЦ, МВт/час
  hvs_akc: number;                  // Потребление ХВС для АКЦ (м3)
  ee_roasting_czh: number;          // Электроэнергия, ЦЖ, МВт/час
  ee_akc_rk: number;                // ЭЭ АКЦ/РК, МВт/час
  hvs_akc_rk: number;               // ХВС АКЦ/РК, м3
  ee_crk_rk: number;                // ЭЭ ЦРК/РК, МВт/час
  pressure_bar: number;             // Давление, бар

  // Тарифы
  price_hvs: number;                // Цена ХВС м3, б/НДС (руб)
  price_gas: number;                // Цена ГАЗ м3, б/НДС (руб)
  ee_factory_total: number;         // Электроэнергия, общее завод, МВт/час
  price_ee: number;                 // Цена ЭЭ МВт, б/НДС (руб)

  // Затраты (руб)
  cost_hvs_total: number;           // Общие затраты на ХВС, руб
  cost_gas_total: number;           // Общие затраты на ГАЗ, руб
  cost_ee_total: number;            // Общие затраты ЭЭ, руб
  cost_hvs_boiler: number;          // Затраты ХВС котельной (руб)
  cost_gas_boiler: number;          // Затраты ГАЗ котельной (руб)
  cost_ee_boiler: number;           // Затраты ЭЭ котельной (руб)
  cost_ee_crk: number;              // Затраты ЭЭ ЦРК, руб
  cost_ee_akc: number;              // Затраты ЭЭ АКЦ, руб
  cost_ee_tgs: number;              // Затраты ЭЭ ТГС, руб
  cost_ee_kos: number;              // Затраты ЭЭ КОС (руб)
  cost_ee_czh_cf: number;           // Затраты ЭЭ ЦЖ-ЦФ, руб
  cost_total_resources: number;     // Общие затраты на ресурсы, руб

  // Выпуск продукции
  prod_roasted_coffee_ton: number;  // Жаренный кофе, тонн (ЖК)
  prod_instant_coffee_ton: number;  // Растворимый кофе, тонн (РК)
  prod_spray_dry_kg: number;        // SprayDry порошок, кг
}

export type ViewTab = 
  | 'overview' 
  | 'chart-tgs' 
  | 'chart-boiler' 
  | 'chart-kos' 
  | 'chart-workshops' 
  | 'chart-costs' 
  | 'chart-specific' 
  | 'chart-builder' 
  | 'data-table';

export interface MetricDefinition {
  key: keyof MonthlyRecord;
  name: string;
  category: 'КОС' | 'Котельная' | 'Электроэнергия и Цеха' | 'Тарифы' | 'Затраты' | 'Производство';
  unit: string;
  color: string;
  defaultYAxis?: 'left' | 'right';
}
