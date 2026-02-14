import { useState } from "react";
import Header from "./components/ui/Header";

import HomeScreen from "./screens/HomeScreen";
import TeamScreen from "./screens/TeamScreen";
import CalendarScreen from "./screens/CalendarScreen";
import AdminScreen from "./screens/AdminScreen";

type TabKey = "home" | "team" | "calendar" | "admin";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  function renderScreen() {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "team":
        return <TeamScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "admin":
        return <AdminScreen />;
      default:
        return null;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Header title="Liga Clubes M6" />

      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <TabButton
            label="Home"
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
          />
          <TabButton
            label="Equipa"
            active={activeTab === "team"}
            onClick={() => setActiveTab("team")}
          />
          <TabButton
            label="Calendário"
            active={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
          />
          <TabButton
            label="Admin"
            active={activeTab === "admin"}
            onClick={() => setActiveTab("admin")}
          />
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            minHeight: 220,
          }}
        >
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        marginRight: 8,
        padding: "8px 16px",
        borderRadius: 10,
        border: active ? "1px solid #0f766e" : "1px solid #d1d5db",
        background: active ? "#0f766e" : "white",
        color: active ? "white" : "#111827",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}