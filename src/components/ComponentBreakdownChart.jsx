import { useEffect, useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { db } from "../firebase";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ComponentBreakdownChart = () => {
  const [componentData, setComponentData] = useState({
    ledPower: 0,
    systemPower: 0,
    buzzerPower: 0,
    regulatorLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const powerRef = query(
      ref(db, "PowerUsage"),
      orderByChild("timestamp"),
      limitToLast(1)
    );

    const unsubscribe = onValue(powerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const latestReading = Object.values(data)[0];

        if (latestReading) {
          const ledPower = latestReading.ledStripPower || 0;
          const systemPower = latestReading.systemBasePower || 0;
          const buzzerPower = latestReading.buzzerPower || 0;
          const totalWithoutLoss = ledPower + systemPower + buzzerPower;
          const totalWithLoss = latestReading.totalPower || 0;
          const regulatorLoss = Math.max(0, totalWithLoss - totalWithoutLoss);

          setComponentData({
            ledPower,
            systemPower,
            buzzerPower,
            regulatorLoss,
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const doughnutData = {
    labels: ["LED Strip", "ESP32 + Sensors", "Buzzer", "Regulator Loss"],
    datasets: [
      {
        data: [
          componentData.ledPower,
          componentData.systemPower,
          componentData.buzzerPower,
          componentData.regulatorLoss,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(53, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(53, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ["LED Strip", "ESP32", "PIR", "LDR", "Buzzer", "Reg. Loss"],
    datasets: [
      {
        label: "Чадал (Вт)",
        data: [
          componentData.ledPower,
          0.25, // ESP32_POWER
          0.065, // PIR_POWER
          0.01, // LDR_POWER
          componentData.buzzerPower,
          componentData.regulatorLoss,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(53, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(53, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Бүрэлдэхүүн хэсгүүдийн чадлын хуваарилалт",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value.toFixed(3)}Вт (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Бүрэлдэхүүн хэсгүүдийн чадлын жишээ",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed.y.toFixed(3)}Вт`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Чадал (Вт)",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-80">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-80">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default ComponentBreakdownChart;
