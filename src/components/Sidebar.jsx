import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { RiDashboardLine, RiFlashlightLine } from "react-icons/ri"; // Import icons

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`bg-blue-600 text-white h-screen sticky top-0 left-0 transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        {isOpen && <h2 className="text-lg font-bold">Цэс</h2>}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-blue-700 rounded"
        >
          {isOpen ? (
            <ChevronLeftIcon className="w-6 h-6" />
          ) : (
            <ChevronRightIcon className="w-6 h-6" />
          )}
        </button>
      </div>
      <nav className="mt-4">
        <ul>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center p-4 hover:bg-blue-700 ${
                  isActive ? "bg-blue-700" : ""
                } ${isOpen ? "justify-start" : "justify-center"}`
              }
            >
              <RiDashboardLine className="w-5 h-5" />
              {isOpen && <span className="ml-3">Хянах самбар</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/power-stats"
              className={({ isActive }) =>
                `flex items-center p-4 hover:bg-blue-700 ${
                  isActive ? "bg-blue-700" : ""
                } ${isOpen ? "justify-start" : "justify-center"}`
              }
            >
              <RiFlashlightLine className="w-5 h-5" />
              {isOpen && <span className="ml-3">Цахилгааны мэдээлэл</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
