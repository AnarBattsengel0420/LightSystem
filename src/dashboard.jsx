import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaLightbulb } from "react-icons/fa"; // Import the lightbulb icon

const Dashboard = () => {
  const navigate = useNavigate();
  const [sensorState, setSensorState] = useState({
    time: 0,
    product1: 0,
    brightness: 0,
    pwm: 0,
    lightSensor: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Read state from Firebase
  useEffect(() => {
    const sensorRef = ref(db, "Sensor/");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorState({
            time: data.time || 0,
            product1: data.product1 || 0,
            brightness: data.brightness || 0,
            pwm: data.pwm || 0,
            lightSensor: data.lightSensor || 0,
          });
        } else {
          setSensorState({
            time: 0,
            product1: 0,
            brightness: 0,
            pwm: 0,
            lightSensor: 0,
          });
        }
      },
      (error) => {
        setError("Failed to fetch sensor data: " + error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle brightness change
  const handleBrightnessChange = async (e) => {
    const brightnessValue = parseInt(e.target.value);
    const pwmValue = Math.round((brightnessValue / 100) * 255);

    setIsLoading(true);
    setError(null);
    try {
      await set(ref(db, "Sensor/"), {
        time: sensorState.product1,
        product1: sensorState.product1,
        brightness: brightnessValue,
        pwm: pwmValue,
        lightSensor: sensorState.lightSensor,
      });
    } catch (error) {
      setError("Failed to update brightness: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle turning device ON
  const handleTurnOn = async () => {
    const currentBrightness = sensorState.brightness || 50;
    const pwmValue = Math.round((currentBrightness / 100) * 255);

    setIsLoading(true);
    setError(null);
    try {
      await set(ref(db, "Sensor/"), {
        time: 1,
        product1: 1,
        brightness: currentBrightness,
        pwm: pwmValue,
        lightSensor: sensorState.lightSensor,
      });
    } catch (error) {
      setError("Failed to turn on device: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle turning device OFF
  const handleTurnOff = async () => {
    const currentBrightness = 0;
    const pwmValue = Math.round((currentBrightness / 100) * 255);

    setIsLoading(true);
    setError(null);
    try {
      await set(ref(db, "Sensor/"), {
        time: 0,
        product1: 0,
        brightness: currentBrightness,
        pwm: pwmValue,
        lightSensor: sensorState.lightSensor,
      });
    } catch (error) {
      setError("Failed to turn off device: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate lamp glow effect based on brightness (0–100%)
  const lampBrightness = sensorState.brightness / 100; // Normalize to 0–1 for opacity or other effects
  const lampColor =
    sensorState.product1 === 1 ? "text-yellow-400" : "text-gray-400";
  const glowStyle = {
    filter: `drop-shadow(0 0 ${
      lampBrightness * 20
    }px rgba(255, 215, 0, ${lampBrightness}))`, // Dynamic glow effect
    opacity: sensorState.product1 === 1 ? 0.5 + lampBrightness * 0.5 : 0.3, // Adjust opacity based on brightness
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-10">
      <h2 className="text-2xl font-semibold">Хянах самбар</h2>

      {error && <p className="text-red-500">{error}</p>}

      {/* Lamp Icon with Dynamic Brightness */}
      <div className="relative flex justify-center items-center mb-4">
        <FaLightbulb
          className={`text-6xl ${lampColor} transition-all duration-300`}
          style={glowStyle}
        />
      </div>

      <div className="text-center">
        <p className="text-lg">
          Сенсорын төлөв:
          <span
            className={`font-bold ${
              sensorState.time === 1 ? "text-green-500" : "text-red-500"
            }`}
          >
            {sensorState.time === 1 ? " АСААЛТТАЙ" : " УНТАРСАН"}
          </span>
        </p>
        <p className="text-lg">
          Гэрэл:
          <span
            className={`font-bold ${
              sensorState.product1 === 1 ? "text-green-500" : "text-red-500"
            }`}
          >
            {sensorState.product1 === 1 ? " АСААЛТТАЙ" : " УНТАРСАН"}
          </span>
        </p>
        <p className="text-lg mt-2">
          Гэрлийн түвшин:
          <span className="font-bold text-blue-500">
            {sensorState.brightness}%
          </span>
        </p>
        <p className="text-lg mt-2">
          LCD гэрлийн мэдрэгч:
          <span className="font-bold text-blue-500">
            {sensorState.lightSensor} lux
          </span>
        </p>
        <p className="text-sm text-gray-500">PWM утга: {sensorState.pwm}/255</p>
      </div>

      <div className="w-64">
        <input
          type="range"
          min="0"
          max="100"
          value={sensorState.brightness}
          onChange={handleBrightnessChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          disabled={sensorState.product1 === 0 || isLoading}
        />
      </div>

      <div className="flex flex-col items-center gap-4 mt-4">
        <button
          onClick={handleTurnOn}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          disabled={sensorState.product1 === 1 || isLoading}
        >
          {isLoading && sensorState.product1 === 0
            ? "Ачааллаж байна..."
            : "АСААХ"}
        </button>
        <button
          onClick={handleTurnOff}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
          disabled={sensorState.product1 === 0 || isLoading}
        >
          {isLoading && sensorState.product1 === 1
            ? "Ачааллаж байна..."
            : "УНТРААХ"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
