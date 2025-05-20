import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sensorState, setSensorState] = useState({
    time: { value: 0 },
    "product 1": 0,
  });

  // Firebase-ээс төлөвийг унших
  useEffect(() => {
    const sensorRef = ref(db, "Sensor/");
    onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorState(data);
      } else {
        // Хэрвээ "Sensor" замд утга байхгүй бол анхны утга тавьж болно
        setSensorState({ time: { value: 0 }, "product 1": 0 });
      }
    });
  }, []); // Компонент анх ачааллахдаа ганцхан удаа ажиллана

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleTurnOn = () => {
    set(ref(db, "Sensor/"), {
      time: {
        value: 1,
      },
      "product 1": 1,
    });
  };

  const handleTurnOff = () => {
    set(ref(db, "Sensor/"), {
      time: {
        value: 0,
      },
      "product 1": 0,
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-10">
      <h2 className="text-2xl font-semibold">Хянах самбар</h2>

      {/* Сенсорын төлөвийг харуулах */}
      <div className="text-center">
        <p className="text-lg">
          Сенсорын төлөв:
          <span
            className={`font-bold ${
              sensorState.time.value === 1 ? "text-green-500" : "text-red-500"
            }`}
          >
            {sensorState.time.value === 1 ? " АСААЛТТАЙ" : " УНТАРСАН"}
          </span>
        </p>
        <p className="text-lg">
          Product 1:
          <span
            className={`font-bold ${
              sensorState["product 1"] === 1 ? "text-green-500" : "text-red-500"
            }`}
          >
            {sensorState["product 1"] === 1 ? " АСААЛТТАЙ" : " УНТАРСАН"}
          </span>
        </p>
      </div>

      {/* ON/OFF товч */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <button
          onClick={handleTurnOn}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          АСААХ
        </button>
        <button
          onClick={handleTurnOff}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          УНТРААХ
        </button>
      </div>

      {/* Гарах товч */}
      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mt-4"
      >
        Гарах
      </button>
    </div>
  );
};

export default Dashboard;
