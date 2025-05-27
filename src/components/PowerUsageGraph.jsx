// src/components/PowerUsageGraph.jsx
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import {
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { db } from "../firebase";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

const PowerUsageGraph = () => {
  const [powerData, setPowerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24h"); // 24h, 7d, 30d

  useEffect(() => {
    // Calculate the time range limit
    const now = new Date().getTime();
    let timeLimit;

    switch (timeRange) {
      case "7d":
        timeLimit = now - 7 * 24 * 60 * 60 * 1000; // 7 days in ms
        break;
      case "30d":
        timeLimit = now - 30 * 24 * 60 * 60 * 1000; // 30 days in ms
        break;
      case "24h":
      default:
        timeLimit = now - 24 * 60 * 60 * 1000; // 24 hours in ms
        break;
    }

    // Query Firebase for power usage data
    const powerRef = query(
      ref(db, "PowerUsage"),
      orderByChild("timestamp"),
      limitToLast(500) // Get last 500 readings to ensure we have enough data
    );

    const unsubscribe = onValue(
      powerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const readings = Object.values(data).map((reading) => ({
            timestamp: new Date(parseInt(reading.timestamp)),
            power: reading.instantPower || 0,
            wattHours: reading.powerWh || 0,
            brightness: reading.brightness || 0,
          }));

          // Filter by time range and sort
          const filteredReadings = readings
            .filter((reading) => reading.timestamp.getTime() > timeLimit)
            .sort((a, b) => a.timestamp - b.timestamp);

          setPowerData(filteredReadings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching power data:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [timeRange]);

  const chartData = {
    datasets: [
      {
        label: "Чадал (Вт)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.power,
        })),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Гэрлийн хүч (%)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.brightness,
        })),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Цахилгаан хэрэглээний түүх",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return "";
            const date = new Date(items[0].parsed.x);
            return date.toLocaleString();
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit:
            timeRange === "24h" ? "hour" : timeRange === "7d" ? "day" : "week",
          displayFormats: {
            hour: "HH:mm",
            day: "MMM d",
            week: "MMM d",
          },
        },
        title: {
          display: true,
          text: "Хугацаа",
        },
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Чадал (Вт)",
        },
        beginAtZero: true,
        grid: {
          drawBorder: true,
          drawOnChartArea: true,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Гэрлийн хүч (%)",
        },
        beginAtZero: true,
        max: 100,
        grid: {
          drawBorder: true,
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading)
    return <div className="flex justify-center p-8">Ачаалж байна...</div>;
  if (error)
    return <div className="text-red-500 p-8">Алдаа гарлаа: {error}</div>;
  if (!powerData.length)
    return (
      <div className="p-8">Одоогоор цахилгааны мэдээлэл байхгүй байна</div>
    );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Цахилгааны хэрэглээний график</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange("24h")}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === "24h"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            24 цаг
          </button>
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === "7d"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            7 хоног
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === "30d"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            30 хоног
          </button>
        </div>
      </div>

      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Нийт хэрэглээ</p>
          <p className="text-xl font-bold">
            {powerData.length > 0
              ? `${powerData[powerData.length - 1].wattHours.toFixed(2)} Вт/цаг`
              : "0 Вт/цаг"}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Сарын төсөөлөл</p>
          <p className="text-xl font-bold">
            {powerData.length > 0
              ? `₮${(
                  ((powerData[powerData.length - 1].wattHours * 30) / 1000) *
                  300
                ).toFixed(2)}`
              : "₮0.00"}
          </p>
          <p className="text-xs text-gray-500">₮300/кВт цаг тарифаар</p>
        </div>
      </div>
    </div>
  );
};

export default PowerUsageGraph;
