import { Dashboard } from "@/components/Dashboard";
import { useEffect } from "react";

function App() {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Dashboard />
    </div>
  );
}

export default App;
