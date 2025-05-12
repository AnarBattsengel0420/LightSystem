import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

const Navbar = ({ user }) => {
  const navigate = useNavigate();

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
        <a href="/dashboard" className="hover:underline">
          Dashboard
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
