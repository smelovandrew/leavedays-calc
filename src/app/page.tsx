"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

function parseDate(dateStr: string) {
  return dateStr ? new Date(dateStr) : null;
}

function calculateAccruedDays(
  totalDays: number,
  startDate: Date | null,
  calcDate: Date
) {
  if (!startDate) return totalDays;

  const year = calcDate.getFullYear();
  const calculationStart =
    startDate.getFullYear() < year ? new Date(year, 0, 1) : startDate;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const totalYearDays =
    (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1;

  const workedDays =
    (calcDate.getTime() - calculationStart.getTime()) / (1000 * 60 * 60 * 24) +
    1;

  if (workedDays < 0) return 0;

  const accrued = (totalDays / totalYearDays) * workedDays;

  return Math.min(accrued, totalDays);
}

const STORAGE_KEY = "vacation-calculator";

export default function Home() {
  // Состояния с дефолтными значениями, чтобы сервер и клиент совпадали
  const [totalDays, setTotalDays] = useState(28);
  const [usedDays, setUsedDays] = useState(0);
  const [startDate, setStartDate] = useState(""); // пустая строка
  const [calcDate, setCalcDate] = useState("");

  // Флаг, чтобы понять, что мы на клиенте и можно читать localStorage и текущую дату
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Загрузка из localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTotalDays(data.totalDays ?? 28);
        setUsedDays(data.usedDays ?? 0);
        setStartDate(data.startDate ?? "");
        setCalcDate(data.calcDate ?? "");
      } catch {
        // Если парсинг не удался, ничего не делаем
      }
    }

    // Если дат нет, ставим дефолтные:
    if (!startDate) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      setStartDate(startOfYear);
    }
    if (!calcDate) {
      const now = new Date().toISOString().split("T")[0];
      setCalcDate(now);
    }
  }, []);

  // Сохраняем изменения в localStorage, но только если на клиенте
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ totalDays, usedDays, startDate, calcDate })
    );
  }, [totalDays, usedDays, startDate, calcDate, isClient]);

  if (!isClient) {
    // Пока не на клиенте, чтобы не было рассогласования, рендерим только заглушку
    return <main className={styles.container}>Loading...</main>;
  }

  const accruedDays = Math.round(
    calculateAccruedDays(totalDays, parseDate(startDate), new Date(calcDate))
  );
  const remainingDays = Math.max(accruedDays - usedDays, 0);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Vacation Days Calculator</h1>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()} noValidate>
        <label className={styles.label}>
          Annual Allowance (days)
          <input
            className={styles.input}
            type="number"
            min={0}
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value))}
          />
        </label>

        <label className={styles.label}>
          Start Date
          <input
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Calculation Date
          <input
            className={styles.input}
            type="date"
            value={calcDate}
            onChange={(e) => setCalcDate(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Used Days
          <input
            className={styles.input}
            type="number"
            min={0}
            value={usedDays}
            onChange={(e) => setUsedDays(Number(e.target.value))}
          />
        </label>
      </form>

      <section className={styles.results}>
        <p>
          <strong>Accrued Days:</strong> <span className={styles.accrued}>{accruedDays}</span>
        </p>
        <p>
          <strong>Remaining Days:</strong> <span className={styles.remaining}>{remainingDays}</span>
        </p>
      </section>
    </main>
  );
}
