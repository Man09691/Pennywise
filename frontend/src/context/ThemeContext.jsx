import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// ==================================================
// THEME CONTEXT
// ==================================================

const ThemeContext = createContext(null);

// ==================================================
// STORAGE KEY
// ==================================================

const THEME_STORAGE_KEY = "pennywise-theme";

// ==================================================
// THEME PROVIDER
// ==================================================

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || "system";
  });

  // ==================================================
  // APPLY THEME
  // ==================================================

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      let activeTheme = theme;

      // ------------------------------------------------
      // SYSTEM THEME
      // ------------------------------------------------

      if (theme === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;

        activeTheme = prefersDark ? "dark" : "light";
      }

      // ------------------------------------------------
      // APPLY DATA ATTRIBUTE
      // ------------------------------------------------

      root.setAttribute("data-theme", activeTheme);
    }

    applyTheme();

    // --------------------------------------------------
    // LISTEN FOR SYSTEM THEME CHANGES
    // --------------------------------------------------

    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

      const handleSystemThemeChange = () => {
        applyTheme();
      };

      mediaQuery.addEventListener(
        "change",
        handleSystemThemeChange,
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleSystemThemeChange,
        );
      };
    }
  }, [theme]);

  // ==================================================
  // SAVE THEME
  // ==================================================

  useEffect(() => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  }, [theme]);

  // ==================================================
  // CONTEXT VALUE
  // ==================================================

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ==================================================
// CUSTOM HOOK
// ==================================================

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider",
    );
  }

  return context;
}