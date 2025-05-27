import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

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
            <Link
              to="/dashboard"
              className={`flex items-center p-4 hover:bg-blue-700 ${
                isOpen ? "justify-start" : "justify-center"
              }`}
            >
              <span className={`${isOpen ? "inline" : "hidden"}`}>
                Dashboard
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={`flex items-center p-4 hover:bg-blue-700 ${
                isOpen ? "justify-start" : "justify-center"
              }`}
            >
              <span className={`${isOpen ? "inline" : "hidden"}`}>нэмэлт</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
