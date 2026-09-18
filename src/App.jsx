import React, { useState } from "react";
import { ThermaTwinProvider, useThermaTwin } from "./context/ThermaTwinContext";
import { Header } from "./components/Header";
import { MetricsBar } from "./components/MetricsBar";
import { GeospatialMap } from "./components/Map/GeospatialMap";
import { Globe3D } from "./components/Globe/Globe3D";
import { IncidentFeed } from "./components/Sidebar/IncidentFeed";
import { SideMenuPanel } from "./components/Sidebar/SideMenuPanel";
import { ERSSDispatchModal } from "./components/Sidebar/ERSSDispatchModal";
import { SimulationModal } from "./components/Backtesting/SimulationModal";
import { ApiKeyModal } from "./components/Common/ApiKeyModal";
import { Toast } from "./components/Common/Toast";

function DashboardLayout() {
  const { theme, isApiKeyModalOpen, closeApiKeyModal } = useThermaTwin();
  // Single unified state for 3D Globe vs 2D Map
  const [viewMode, setViewMode] = useState("globe"); // "globe" | "map"

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-200 ${
      isDark ? "bg-[#070d1a] text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* 1. Navigation Header with AGNI-X logo, Side Menu toggle, 3D/2D switcher & Dark/Light mode toggle */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* 2. Unified 4-Card Metrics Strip */}
      <MetricsBar />

      {/* 3. Central Viewport: 3D Satellite Earth Globe OR 2D Tactical Map */}
      <div className="flex flex-1 relative overflow-hidden">
        <main className="flex-1 relative h-full">
          {viewMode === "globe" ? (
            <Globe3D />
          ) : (
            <GeospatialMap />
          )}
        </main>

        {/* Right Sidebar: Incident Alert Feed & SHAP Telemetry Inspector */}
        <IncidentFeed />
      </div>

      {/* 4. Slide-Out Side Menu Panel (Simulation, Search, NASA Live, Tools) */}
      <SideMenuPanel
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* 5. Functional Modals & Toast HUD */}
      <ERSSDispatchModal />
      <SimulationModal />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ThermaTwinProvider>
      <DashboardLayout />
    </ThermaTwinProvider>
  );
}
