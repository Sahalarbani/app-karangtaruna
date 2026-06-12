import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("app-theme") || "system");

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("app-theme", theme);

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  // Listener for system theme changes if set to 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        // Trigger a re-render or CSS update naturally handled by CSS media queries
        // But we can force a tiny state update if needed.
        document.documentElement.setAttribute('data-system-dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    handleChange(); // init
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
