import React, { useState, useEffect } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../firebase";
// Remove these imports temporarily if they cause issues
// import { FaLightbulb, FaPowerOff } from "react-icons/fa";
// import { MdBrightness6 } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";

// Replace icons with plain text if needed
const FaLightbulb = () => <span>💡</span>;
const FaPowerOff = () => <span>⏻</span>;
const MdBrightness6 = () => <span>🔆</span>;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [sensorState, setSensorState] = useState({
    time: 0,
    product1: 0,
    brightness: 0,
    pwm: 0,
    lightSensor: 0,
  });
  const [localBrightness, setLocalBrightness] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debouncedUpdateTimeout, setDebouncedUpdateTimeout] = useState(null);

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
          setLastUpdated(new Date());
        } else {
          setSensorState({
            time: 0,
            product1: 0,
            brightness: 0,
            pwm: 0,
            lightSensor: 0,
          });
        }
        setError(null);
      },
      (error) => {
        setError("Failed to fetch sensor data: " + error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Synchronize local state with Firebase state
  useEffect(() => {
    setLocalBrightness(sensorState.brightness);
  }, [sensorState.brightness]);

  // Handle brightness change
  const handleBrightnessChange = (e) => {
    const brightnessValue = parseInt(e.target.value);

    // Update local state immediately for responsive UI
    setLocalBrightness(brightnessValue);

    // Clear any existing timeout
    if (debouncedUpdateTimeout) {
      clearTimeout(debouncedUpdateTimeout);
    }

    // Set a new timeout to update Firebase after dragging stops
    const timeoutId = setTimeout(async () => {
      const pwmValue = Math.round((brightnessValue / 100) * 255);

      setIsLoading(true);
      setError(null);
      try {
        await set(ref(db, "Sensor/"), {
          ...sensorState,
          brightness: brightnessValue,
          pwm: pwmValue,
        });
      } catch (error) {
        setError("Failed to update brightness: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms delay

    setDebouncedUpdateTimeout(timeoutId);
  };

  // Handle turning device ON
  const handleTurnOn = async () => {
    const currentBrightness = sensorState.brightness || 50; // Default to 50% if brightness is 0
    const pwmValue = Math.round((currentBrightness / 100) * 255);

    setIsLoading(true);
    setError(null);
    try {
      await set(ref(db, "Sensor/"), {
        ...sensorState,
        time: 1,
        product1: 1,
        brightness: currentBrightness,
        pwm: pwmValue,
      });
    } catch (error) {
      setError("Failed to turn on device: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle turning device OFF
  const handleTurnOff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await set(ref(db, "Sensor/"), {
        ...sensorState,
        time: 0,
        product1: 0,
        brightness: 0, // Set brightness to 0
        pwm: 0, // Set PWM to 0
      });
    } catch (error) {
      setError("Failed to turn off device: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mt-8">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Light Control</h2>
          <div className="text-sm text-gray-500">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaLightbulb
              className={`text-2xl mr-3 ${
                sensorState.product1 === 1 ? "text-yellow-400" : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <h3 className="text-lg font-medium">Light Status</h3>
              <p
                className={`font-medium ${
                  sensorState.product1 === 1 ? "text-green-600" : "text-red-600"
                }`}
              >
                {sensorState.product1 === 1 ? "ON" : "OFF"}
              </p>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <MdBrightness6 className="text-2xl mr-3 text-blue-500" />
            <div className="flex-1">
              <h3 className="text-lg font-medium">Brightness</h3>
              <p className="font-medium text-blue-600">
                {sensorState.brightness}%
              </p>
              <p className="text-xs text-gray-500">
                PWM Value: {sensorState.pwm}/255
              </p>
            </div>
          </div>

          {sensorState.lightSensor > 0 && (
            <div className="flex items-center">
              <FaLightbulb className="text-2xl mr-3 text-orange-400" />
              <div className="flex-1">
                <h3 className="text-lg font-medium">Ambient Light</h3>
                <p className="font-medium text-orange-600">
                  {sensorState.lightSensor} lux
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <label
            htmlFor="brightness"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Brightness Control
          </label>
          <input
            type="range"
            id="brightness"
            min="0"
            max="100"
            value={localBrightness}
            onChange={handleBrightnessChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={sensorState.product1 === 0 || isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleTurnOn}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                      disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={sensorState.product1 === 1 || isLoading}
          >
            <FaPowerOff className="mr-2" />
            {isLoading && sensorState.product1 === 0
              ? "Turning on..."
              : "Turn ON"}
          </button>
          <button
            onClick={handleTurnOff}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                      disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={sensorState.product1 === 0 || isLoading}
          >
            <FaPowerOff className="mr-2" />
            {isLoading && sensorState.product1 === 1
              ? "Turning off..."
              : "Turn OFF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
