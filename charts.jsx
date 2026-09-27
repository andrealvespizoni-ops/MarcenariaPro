import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function ink() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000';
}
function baseOpts() {
  const c = ink();
  return { responsive: true, plugins: { legend: { labels: { color: c, font: { family: 'Nunito', weight: '700' } } } }, scales: { x: { ticks: { color: c } }, y: { ticks: { color: c } } } };
}

export function LineChart({ labels, series }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const c = ink();
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: series.map((s) => ({ ...s, borderColor: c, backgroundColor: 'transparent', borderWidth: 3, tension: 0.3 })) },
      options: baseOpts(),
    });
    return () => chartRef.current && chartRef.current.destroy();
  }, [JSON.stringify(labels), JSON.stringify(series)]);
  return <canvas ref={ref} />;
}

export function BarChart({ labels, series }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const shades = [ink(), '#999'];
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets: series.map((s, i) => ({ ...s, backgroundColor: shades[i % 2] })) },
      options: baseOpts(),
    });
    return () => chartRef.current && chartRef.current.destroy();
  }, [JSON.stringify(labels), JSON.stringify(series)]);
  return <canvas ref={ref} />;
}

export function PieChart({ labels, values }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const shades = ['#0a0a0a', '#3d3d3d', '#666', '#8f8f8f', '#b3b3b3', '#d1d1d1'];
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => shades[i % shades.length]) }] },
      options: baseOpts(),
    });
    return () => chartRef.current && chartRef.current.destroy();
  }, [JSON.stringify(labels), JSON.stringify(values)]);
  return <canvas ref={ref} />;
}
