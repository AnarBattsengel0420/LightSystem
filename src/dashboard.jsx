import React from "react";
import { auth, db } from "./firebase";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

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

      <div className="flex flex-col items-center gap-4 mt-4">
        <button
          onClick={handleTurnOn}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Turn ON
        </button>
        <button
          onClick={handleTurnOff}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Turn OFF
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
