import { useState, useEffect } from 'react';
import { MonthlyRecord } from '../types';
import { INITIAL_DATA } from '../data/initialData';

const STORAGE_KEY = 'factory_energy_data_v2';
const OLD_STORAGE_KEY = 'factory_energy_data_v1';

export function loadStoredData(): MonthlyRecord[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(OLD_STORAGE_KEY);
      if (raw) {
        try { localStorage.removeItem(OLD_STORAGE_KEY); } catch {}
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const parsedIds = new Set(parsed.map((r: MonthlyRecord) => r.id));
        const missing = INITIAL_DATA.filter((r) => !parsedIds.has(r.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthIndex - b.monthIndex;
          });
          saveStoredData(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load data from localStorage', e);
  }
  return INITIAL_DATA;
}

export function saveStoredData(data: MonthlyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage', e);
  }
}

export function useEnergyData() {
  const [data, setData] = useState<MonthlyRecord[]>(() => loadStoredData());

  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  const addRecord = (record: Omit<MonthlyRecord, 'id'>) => {
    const newId = `${record.year}-${String(record.monthIndex).padStart(2, '0')}`;
    const newRecord: MonthlyRecord = {
      ...record,
      id: newId,
    };
    setData((prev) => {
      // replace if exists or insert sorted
      const filtered = prev.filter((r) => r.id !== newId);
      const updated = [...filtered, newRecord].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      });
      return updated;
    });
  };

  const updateRecord = (id: string, updatedFields: Partial<MonthlyRecord>) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  };

  const deleteRecord = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  const resetToDefault = () => {
    setData(INITIAL_DATA);
    localStorage.removeItem(STORAGE_KEY);
  };

  const importData = (newRecords: MonthlyRecord[]) => {
    setData(newRecords);
  };

  return {
    data,
    setData,
    addRecord,
    updateRecord,
    deleteRecord,
    resetToDefault,
    importData,
  };
}
