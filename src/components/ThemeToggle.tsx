
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verifica se há preferência salva no localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Caso contrário, usa a preferência do sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Sun className={`h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
      <Switch
        checked={isDarkMode}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-200"
      />
      <Moon className={`h-4 w-4 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
    </div>
  );
}
