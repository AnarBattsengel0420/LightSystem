import { onValue, ref, set, update } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

// Simple icon components
const FaLightbulb = () => <span>💡</span>;
const FaPowerOff = () => <span>⏻</span>;
const MdBrightness6 = () => <span>🔆</span>;

// Helper function for consistent error handling
const createErrorHandler = (setError, setIsLoading) => {
  return (operation, error) => {
    setError(`Failed to ${operation}: ${error.message}`);
    setIsLoading(false);
  };
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [sensorState, setSensorState] = useState({
    time: 0,
    product1: 0,
    brightness: 0,
    pwm: 0,
    lightSensor: 0,
    motionSensor: 0,
    autoMode: 1,
  });
  const [localBrightness, setLocalBrightness] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sliderDragging, setSliderDragging] = useState(false);

  const handleError = createErrorHandler(setError, setIsLoading);

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
            motionSensor: data.motionSensor || 0,
            // IMPORTANT: Check both fields for auto mode
            autoMode:
              data.autoModeState !== undefined
                ? data.autoModeState
                : data.autoMode || 0,
          });
          setLastUpdated(new Date());
        }
        setError(null);
      },
      (error) => {
        handleError("fetch sensor data", error);
      }
    );
    return () => unsubscribe();
  }, [handleError]);

  // Synchronize local state with Firebase state
  useEffect(() => {
    // Only update local state from Firebase if user is not actively dragging
    if (!sliderDragging) {
      setLocalBrightness(sensorState.brightness);
    }
  }, [sensorState.brightness, sliderDragging]);

  // Handle brightness change with immediate local update and delayed Firebase update
  const handleBrightnessChange = (e) => {
    const brightnessValue = parseInt(e.target.value);

    // Only update local state, don't send to Firebase
    setLocalBrightness(brightnessValue);
  };

  // First, wrap handleSliderRelease in useCallback to avoid recreation on every render
  const handleSliderRelease = useCallback(async () => {
    // Only update if the value has changed
    if (localBrightness !== sensorState.brightness) {
      // Update both values in a single atomic operation
      const updates = {};
      updates["/Sensor/brightness"] = localBrightness;
      updates["/Sensor/pwm"] = Math.round((localBrightness / 100) * 255);

      setIsLoading(true);
      setError(null);
      try {
        await update(ref(db), updates);
        console.log(`Brightness updated to ${localBrightness}% on release`);
      } catch (error) {
        handleError("update brightness", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Reset slider dragging state
    setSliderDragging(false);
  }, [localBrightness, sensorState.brightness, handleError]);

  // Handle turning device ON
  const handleTurnOn = async () => {
    const currentBrightness = sensorState.brightness || 50;
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
      handleError("turn on device", error);
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
        brightness: 0,
        pwm: 0,
      });
    } catch (error) {
      handleError("turn off device", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auto mode toggle
  const handleAutoModeToggle = async () => {
    // Optimistically update UI state immediately with loading indicator
    setIsLoading(true);

    try {
      // First, get the current auto mode value to confirm
      const newAutoModeValue = sensorState.autoMode === 1 ? 0 : 1;

      // Create a complete update with timestamp
      const updates = {};
      updates["/Sensor/autoMode"] = newAutoModeValue;
      updates["/Sensor/lastAutoModeChange"] = Date.now();

      // Update Firebase
      await update(ref(db), updates);
      console.log(
        `Auto mode toggle initiated: ${
          sensorState.autoMode === 1 ? "ON→OFF" : "OFF→ON"
        }`
      );

      // IMPORTANT: Add a small delay to allow ESP32 to process the change
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Now update local state (after delay)
      setSensorState((prev) => ({
        ...prev,
        autoMode: newAutoModeValue,
      }));

      console.log(`Auto mode toggle completed after delay`);
    } catch (error) {
      handleError("toggle auto mode", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (sliderDragging) {
        handleSliderRelease();
      }
    };

    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
  }, [sliderDragging, handleSliderRelease]);

  // Debug effect for auto mode changes
  useEffect(() => {
    console.log(
      `Auto mode changed to: ${sensorState.autoMode === 1 ? "ON" : "OFF"}`
    );

    // This can help check if the ESP32 is receiving the changes
    const logChanges = async () => {
      try {
        // Write a debug entry to Firebase when auto mode changes
        await set(ref(db, "Debug/lastAutoModeChange"), {
          timestamp: new Date().toISOString(),
          value: sensorState.autoMode,
          client: "dashboard",
        });
      } catch (error) {
        console.error("Failed to log debug data", error);
      }
    };

    logChanges();
  }, [sensorState.autoMode]);

  // Log current user info (for debugging or future use)
  useEffect(() => {
    if (currentUser) {
      console.log("User is logged in:", currentUser.email);
    }
  }, [currentUser]);

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
            onMouseDown={() => setSliderDragging(true)}
            onMouseUp={handleSliderRelease}
            onTouchStart={() => setSliderDragging(true)}
            onTouchEnd={handleSliderRelease}
            onMouseMove={(e) => {
              if (e.buttons === 1) {
                // Left mouse button is pressed
                handleBrightnessChange(e);
              }
            }}
            onTouchMove={handleBrightnessChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              // Enhanced styling for better thumb movement
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localBrightness}%, #e5e7eb ${localBrightness}%, #e5e7eb 100%)`,
              height: "8px",
              outline: "none",
              WebkitAppearance: "none",
            }}
            disabled={
              sensorState.product1 === 0 || (isLoading && !sliderDragging)
            }
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Sensor Information</h3>

          <div className="flex justify-between mb-2">
            <span>Motion Detected:</span>
            <span
              className={`font-medium ${
                sensorState.motionSensor === 1
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {sensorState.motionSensor === 1 ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex justify-between mb-2">
            <span>Light Sensor:</span>
            <span className="font-medium">{sensorState.lightSensor} lux</span>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <span>Auto Mode:</span>
              <div className="relative inline-block w-10 ml-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="autoMode"
                  id="autoMode"
                  checked={sensorState.autoMode === 1}
                  onChange={handleAutoModeToggle}
                  disabled={isLoading}
                  className="sr-only"
                />
                <label
                  htmlFor="autoMode"
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    sensorState.autoMode === 1 ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                      <div className="w-3 h-3 border-2 border-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                      sensorState.autoMode === 1
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  sensorState.autoMode === 1 ? "text-green-600" : "text-red-600"
                }`}
              >
                {isLoading
                  ? "UPDATING..."
                  : sensorState.autoMode === 1
                  ? "ENABLED"
                  : "DISABLED"}
              </span>
              <div
                className={`ml-2 w-3 h-3 rounded-full ${
                  isLoading
                    ? "bg-yellow-500 animate-pulse"
                    : sensorState.autoMode === 1
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {sensorState.autoMode === 1
              ? "Motion sensors are controlling the light automatically."
              : "Manual control mode is active. Sensors are ignored."}
          </p>
        </div>

        <div className="flex gap-4 mt-6">
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
