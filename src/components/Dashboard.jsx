import { onValue, ref, set, update } from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { Link } from "react-router-dom";

// Simple icon components
const FaLightbulb = () => <span>💡</span>;
const FaPowerOff = () => <span>⏻</span>;
const MdBrightness6 = () => <span>🔆</span>;
const MdAutoMode = () => <span>🤖</span>; // Added auto mode icon

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
  const isMounted = useRef(true);

  const handleError = createErrorHandler(setError, setIsLoading);

  // Read state from Firebase
  useEffect(() => {
    const sensorRef = ref(db, "Sensor/");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // PREVENT rapid state changes during auto mode transitions
          setSensorState((prevState) => {
            const newState = {
              time: data.time || 0,
              product1: data.product1 || 0,
              brightness: data.brightness || 0,
              pwm: data.pwm || 0,
              lightSensor: data.lightSensor || 0,
              motionSensor: data.motionSensor || 0,
              autoMode: data.autoMode || 0,
            };

            // Only update if there's a significant change (prevents flickering)
            const hasSignificantChange =
              newState.autoMode !== prevState.autoMode ||
              newState.product1 !== prevState.product1 ||
              Math.abs(newState.brightness - prevState.brightness) > 2;

            return hasSignificantChange ? newState : prevState;
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

  // Add this check to ALL your Firebase update functions:
  const updateFirebaseIfManualMode = async (updates) => {
    // CRITICAL: Only update Firebase if NOT in auto mode
    if (sensorState.autoMode === 1) {
      console.log(
        "Auto mode active - blocking Firebase update to prevent ESP32 interference"
      );
      return;
    }

    try {
      await set(ref(db, "Sensor/"), {
        ...sensorState,
        ...updates,
      });
    } catch (error) {
      console.error("Firebase update failed:", error);
    }
  };

  // Handle brightness change with immediate local update and delayed Firebase update
  const handleBrightnessChange = (e) => {
    const newBrightness = parseInt(e.target.value);

    // Always update local state for display
    setLocalBrightness(newBrightness);

    // Only send to Firebase in manual mode
    if (sensorState.autoMode !== 1) {
      updateFirebaseIfManualMode({
        brightness: newBrightness,
        pwm:
          newBrightness === 0
            ? 255
            : Math.round(254 - ((newBrightness - 1) * 254) / 99),
      });
    }
  };

  // First, wrap handleSliderRelease in useCallback to avoid recreation on every render
  const handleSliderRelease = useCallback(async () => {
    // Only update if the value has changed
    if (localBrightness !== sensorState.brightness) {
      // Update both values in a single atomic operation
      const updates = {};
      updates["/Sensor/brightness"] = localBrightness;
      // Fix PWM calculation to match ESP32
      updates["/Sensor/pwm"] =
        localBrightness === 0
          ? 255
          : Math.round(254 - ((localBrightness - 1) * 254) / 99);

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

  const handleTurnOn = async () => {
    setIsLoading(true);
    try {
      // Simple update - just set product1 to 1
      await update(ref(db), {
        "/Sensor/product1": 1,
      });
      console.log("System turned ON");
    } catch (error) {
      handleError("turn on device", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle turning device OFF - SIMPLIFIED
  const handleTurnOff = async () => {
    setIsLoading(true);
    try {
      // Simple update - just set product1 to 0
      await update(ref(db), {
        "/Sensor/product1": 0,
      });
      console.log("System turned OFF");
    } catch (error) {
      handleError("turn off device", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auto mode toggle
  const handleAutoModeToggle = async () => {
    setIsLoading(true);

    try {
      const newAutoModeValue = sensorState.autoMode === 1 ? 0 : 1;

      // Simple, direct update - no delays!
      const updates = {};
      updates["/Sensor/autoMode"] = newAutoModeValue;

      await update(ref(db), updates);
      console.log(`Auto mode toggle: ${newAutoModeValue === 1 ? "ON" : "OFF"}`);

      // No artificial delay - let ESP32 respond naturally!
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

  // Add connection status monitoring
  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === false) {
        setError("Firebase connection lost. Some features may not work.");
      } else {
        setError(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mt-8">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Гэрэл удирдах хэсэг
          </h2>
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
              <h3 className="text-lg font-medium">Гэрлийн төлөв</h3>
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
              <h3 className="text-lg font-medium">Тодрол</h3>
              <p className="font-medium text-blue-600">
                {sensorState.brightness}%
              </p>
              <p className="text-xs text-gray-500">
                PWM Утга: {sensorState.pwm}/255
              </p>
            </div>
          </div>

          {/* Auto Mode Status Section */}
          <div className="flex items-center mb-4">
            <MdAutoMode className="text-2xl mr-3 text-purple-500" />
            <div className="flex-1">
              <h3 className="text-lg font-medium">Автомат горим</h3>
              <p
                className={`font-medium ${
                  sensorState.autoMode === 1
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {sensorState.autoMode === 1 ? "Идэвхтэй" : "Идэвхгүй"}
              </p>
              <p className="text-xs text-gray-500">
                {sensorState.autoMode === 1
                  ? "Хөдөлгөөн мэдрэгчээр удирдана"
                  : "Гараар удирдана"}
              </p>
            </div>
          </div>

          {sensorState.lightSensor > 0 && (
            <div className="flex items-center">
              <FaLightbulb className="text-2xl mr-3 text-orange-400" />
              <div className="flex-1">
                <h3 className="text-lg font-medium">Эргэн тойрны гэрэл</h3>
                <p className="font-medium text-orange-600">
                  {sensorState.lightSensor} lux
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Auto Mode Toggle Button */}
        <div className="mb-6">
          <button
            onClick={handleAutoModeToggle}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                       ${
                         sensorState.autoMode === 1
                           ? "bg-purple-600 hover:bg-purple-700 text-white"
                           : "bg-gray-600 hover:bg-gray-700 text-white"
                       }`}
            disabled={isLoading}
          >
            <MdAutoMode className="mr-2" />
            {isLoading
              ? "Өөрчилж байна..."
              : sensorState.autoMode === 1
              ? "Автомат горимыг унтраах"
              : "Автомат горимыг асаах"}
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="brightness"
              className="block text-sm font-medium text-gray-700"
            >
              Тодролыг тохируулах
            </label>

            {/* Add a helpful explanation for when slider is disabled */}
            {sensorState.autoMode === 1 && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                Автомат горим идэвхтэй үед тодролыг өөрчлөх боломжгүй
              </div>
            )}
          </div>

          <input
            type="range"
            id="brightness"
            min="0"
            max="100"
            value={
              sensorState.autoMode === 1
                ? sensorState.brightness || 0
                : localBrightness
            }
            onChange={
              sensorState.autoMode === 1 ? () => {} : handleBrightnessChange
            }
            disabled={sensorState.autoMode === 1 || isLoading}
            className={`w-full h-3 bg-gray-200 rounded-lg appearance-none 
    ${
      sensorState.autoMode === 1
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer"
    }
    ${isLoading ? "opacity-50" : ""}`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Link to Power Stats (instead of showing power data on dashboard) */}
        <div className="mb-6">
          <Link
            to="/power-stats"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Цахилгааны хэрэглээний график үзэх
          </Link>
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
              ? "Асааж байна..."
              : "Асаах"}
          </button>
          <button
            onClick={handleTurnOff}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                      disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={sensorState.product1 === 0 || isLoading}
          >
            <FaPowerOff className="mr-2" />
            {isLoading && sensorState.product1 === 1
              ? "Унтрааж байна..."
              : "Унтраах"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
