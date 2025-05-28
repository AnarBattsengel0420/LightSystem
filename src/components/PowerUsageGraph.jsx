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
  const [timeRange, setTimeRange] = useState("24h");
  const [stats, setStats] = useState({
    totalPower: 0,
    avgPower: 0,
    peakPower: 0,
    estimatedMonthlyCost: 0,
    efficiency: 0,
    batteryPercent: 100,
  });

  useEffect(() => {
    // Query Firebase for power usage data from the new structure
    const powerRef = query(
      ref(db, "PowerUsage"),
      orderByChild("timestamp"),
      limitToLast(100) // Match your ESP32's rotating buffer
    );

    const unsubscribe = onValue(
      powerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const readings = Object.values(data)
            .filter((reading) => reading.timestamp) // Ensure valid data
            .map((reading) => ({
              timestamp: new Date(parseInt(reading.timestamp)),
              totalPower: reading.totalPower || 0,
              ledStripPower: reading.ledStripPower || 0,
              systemBasePower: reading.systemBasePower || 0,
              buzzerPower: reading.buzzerPower || 0,
              totalEnergyWh: reading.totalEnergyWh || 0,
              brightness: reading.brightness || 0,
              ledState: reading.ledState || 0,
              motionActive: reading.motionActive || 0,
              autoMode: reading.autoMode || 0,
              batteryVoltage: reading.batteryVoltage || 11.1,
            }));

          // Filter by time range and sort
          const now = new Date().getTime();
          let timeLimit;
          switch (timeRange) {
            case "7d":
              timeLimit = now - 7 * 24 * 60 * 60 * 1000;
              break;
            case "30d":
              timeLimit = now - 30 * 24 * 60 * 60 * 1000;
              break;
            case "24h":
            default:
              timeLimit = now - 24 * 60 * 60 * 1000;
              break;
          }

          const filteredReadings = readings
            .filter((reading) => reading.timestamp.getTime() > timeLimit)
            .sort((a, b) => a.timestamp - b.timestamp);

          setPowerData(filteredReadings);

          // Calculate enhanced statistics
          if (filteredReadings.length > 0) {
            const totalPowers = filteredReadings.map((r) => r.totalPower);
            const ledPowers = filteredReadings.map((r) => r.ledStripPower);
            const totalEnergy =
              filteredReadings[filteredReadings.length - 1].totalEnergyWh;
            const avgTotalPower =
              totalPowers.reduce((a, b) => a + b, 0) / totalPowers.length;
            const avgLedPower =
              ledPowers.reduce((a, b) => a + b, 0) / ledPowers.length;
            const peakPower = Math.max(...totalPowers);
            const estimatedMonthlyCost = ((totalEnergy * 30) / 1000) * 300; // ₮300/kWh
            const efficiency =
              avgTotalPower > 0 ? (avgLedPower / avgTotalPower) * 100 : 0;
            const batteryVoltage =
              filteredReadings[filteredReadings.length - 1]?.batteryVoltage ||
              11.1;
            const batteryPercent = Math.max(
              0,
              Math.min(100, ((batteryVoltage - 9.0) / (12.6 - 9.0)) * 100)
            );

            setStats({
              totalPower: totalEnergy,
              avgPower: avgTotalPower,
              peakPower,
              estimatedMonthlyCost,
              efficiency,
              batteryPercent,
            });
          }
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
        label: "Нийт чадал (Вт)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.totalPower,
        })),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: true,
      },
      {
        label: "LED чадал (Вт)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.ledStripPower,
        })),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.1)",
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: true,
      },
      {
        label: "Систем чадал (Вт)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.systemBasePower,
        })),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.1,
        fill: false,
      },
      {
        label: "Гэрлийн хүч (%)",
        data: powerData.map((reading) => ({
          x: reading.timestamp,
          y: reading.brightness,
        })),
        borderColor: "rgb(255, 206, 86)",
        backgroundColor: "rgba(255, 206, 86, 0.1)",
        borderWidth: 1,
        pointRadius: 1,
        pointHoverRadius: 3,
        tension: 0.1,
        yAxisID: "y1",
        fill: false,
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
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "Цахилгаан хэрэглээний график",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          title: (items) => {
            if (!items.length) return "";
            const date = new Date(items[0].parsed.x);
            return date.toLocaleString("mn-MN");
          },
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.dataset.label.includes("(Вт)")) {
              label += `${context.parsed.y.toFixed(3)} Вт`;
            } else {
              label += `${context.parsed.y}%`;
            }
            return label;
          },
          afterBody: (items) => {
            if (items.length > 0) {
              const dataIndex = items[0].dataIndex;
              const reading = powerData[dataIndex];
              if (reading) {
                return [
                  `Хөдөлгөөн: ${reading.motionActive ? "Илэрсэн" : "Байхгүй"}`,
                  `LED төлөв: ${reading.ledState ? "Асаалттай" : "Унтарсан"}`,
                  `Горим: ${reading.autoMode ? "Автомат" : "Гараар"}`,
                  `Батерей: ${reading.batteryVoltage.toFixed(1)}V`,
                ];
              }
            }
            return [];
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
            day: "MM/dd",
            week: "MM/dd",
          },
        },
        title: {
          display: true,
          text: "Хугацаа",
          font: {
            size: 12,
            weight: "bold",
          },
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Чадал (Вт)",
          font: {
            size: 12,
            weight: "bold",
          },
        },
        beginAtZero: true,
        max: 6, // Max power for your system
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Гэрлийн хүч (%)",
          font: {
            size: 12,
            weight: "bold",
          },
        },
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Ачаалж байна...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-8 text-center">
        <p>Алдаа гарлаа: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Дахин ачаалах
        </button>
      </div>
    );
  }

  if (!powerData.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Одоогоор цахилгааны мэдээлэл байхгүй байна</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with time range selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Цахилгааны хэрэглээний график
        </h2>
        <div className="flex space-x-2">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {range === "24h"
                ? "24 цаг"
                : range === "7d"
                ? "7 хоног"
                : "30 хоног"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <Line data={chartData} options={options} />
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Нийт хэрэглээ</p>
          <p className="text-2xl font-bold text-blue-800">
            {stats.totalPower.toFixed(2)} Вт/цаг
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Дундаж чадал</p>
          <p className="text-2xl font-bold text-green-800">
            {stats.avgPower.toFixed(3)} Вт
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-medium">Дээд чадал</p>
          <p className="text-2xl font-bold text-yellow-800">
            {stats.peakPower.toFixed(3)} Вт
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Үр ашиг</p>
          <p className="text-2xl font-bold text-purple-800">
            {stats.efficiency.toFixed(1)}%
          </p>
          <p className="text-xs text-purple-500">LED/Нийт чадал</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Батерей</p>
          <p className="text-2xl font-bold text-orange-800">
            {stats.batteryPercent.toFixed(0)}%
          </p>
          <p className="text-xs text-orange-500">3S 18650</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-600 font-medium">Сарын зардал</p>
          <p className="text-2xl font-bold text-indigo-800">
            ₮{stats.estimatedMonthlyCost.toFixed(0)}
          </p>
          <p className="text-xs text-indigo-500">₮300/кВт цаг</p>
        </div>
      </div>

      {/* Real-time status */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Сүүлийн шинэчлэл:</span>
          <span className="font-medium">
            {powerData.length > 0
              ? powerData[powerData.length - 1].timestamp.toLocaleString(
                  "mn-MN"
                )
              : "Мэдээлэл байхгүй"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-600">Нийт бичлэг:</span>
          <span className="font-medium">{powerData.length} удаа</span>
        </div>
      </div>
    </div>
  );
};

export default PowerUsageGraph;
