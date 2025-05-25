import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every 1000ms (1 second)

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Format the time as HH:MM:SS (24-hour format) in the +08 timezone
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    timeZone: "Asia/Shanghai", // +08 timezone
    hour12: false, // 24-hour format
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <nav className="bg-red-700 text-white p-4 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">LightSystem</div>
      <div className="flex items-center space-x-4">
        <a
          href="/dashboard"
          className="hover:underline flex items-center gap-2"
          aria-label={`Dashboard, current time ${formattedTime}`}
        >
          <span>Цаг</span>
          <span className="text-sm text-gray-200">({formattedTime} +08)</span>
        </a>
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              Гарах
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="px-3 py-1 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            Нэвтрэх
          </a>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
