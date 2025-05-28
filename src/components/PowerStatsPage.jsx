// src/components/PowerStatsPage.jsx
import React from "react";
import PowerUsageGraph from "./PowerUsageGraph";
import ComponentBreakdownChart from "./ComponentBreakdownChart";

const PowerStatsPage = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Цахилгааны хэрэглээний статистик
        </h1>
        <p className="text-gray-600">
          ESP32 IoT гэрлийн системийн дэлгэрэнгүй чадлын шинжилгээ
        </p>
      </div>

      {/* Main Power Usage Graph */}
      <PowerUsageGraph />

      {/* Component Breakdown Charts */}
      <ComponentBreakdownChart />
    </div>
  );
};

export default PowerStatsPage;
