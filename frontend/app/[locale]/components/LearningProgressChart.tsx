"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Scale,
  CoreScaleOptions,
  Tick
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
  }[]
}

interface Props {
  data?: ChartData
}

export default function LearningProgressChart({ data }: Props) {
  if (!data) return null

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return `${tickValue}%`
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
    },
    barThickness: 30
  }

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: index === 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 159, 64, 0.5)',
      borderColor: index === 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 159, 64)',
      borderWidth: 1,
      borderRadius: 4
    }))
  }

  return (
    <div style={{ height: '240px', width: '100%' }}>
      <Bar options={options} data={chartData} />
    </div>
  )
}

