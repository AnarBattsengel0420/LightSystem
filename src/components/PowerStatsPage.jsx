// src/components/PowerStatsPage.jsx
import PowerUsageGraph from "./PowerUsageGraph";
import { db } from "../firebase"; // Adjust the import based on your project structure
import { query, ref, orderByChild } from "firebase/database";

// Inside your PowerStatsPage component:

const PowerStatsPage = () => {
  // This component will render the power usage statistics page
  // It can include various components like graphs, tables, etc.

  // You can add state and logic here if needed
  // For now, it just renders the PowerUsageGraph component

  // Firebase query to get power usage data
  const powerRef = query(ref(db, "PowerUsage"), orderByChild("timestamp"));

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Цахилгааны хэрэглээний статистик
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Power Usage Line Graph */}
        <PowerUsageGraph powerRef={powerRef} />

        {/* Other statistics */}
        {/* ... */}
      </div>
    </div>
  );
};

export default PowerStatsPage;
