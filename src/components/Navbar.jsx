import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Handle error
    }
  }

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Light Control System
        </Link>

        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <span className="text-sm">{currentUser.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
