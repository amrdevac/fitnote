"use client";

import React, { useState, useEffect } from "react";

const themes = ["theme-blue", "theme-default", "theme-green"]; // daftar tema yang sudah ada di CSS

interface ThemeSwitcherProps {
  currentTheme?: string;
  onChange?: (theme: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme = "theme-blue",
  onChange,
}) => {
  const [theme, setTheme] = useState<string>(currentTheme);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(...themes); // remove all previous themes
    html.classList.add(theme); // apply the new theme
  }, [theme]);

  const handleChangeTheme = (newTheme: string) => {
    setTheme(newTheme);
    onChange?.(newTheme);
  };

  return (
    <div className="flex items-center space-x-2">
      {themes.map((th) => (
        <button
          key={th}
          onClick={() => handleChangeTheme(th)}
          className={`px-4 py-2 rounded text-white ${
            theme === th ? "opacity-100" : "opacity-60"
          }`}
          style={{
            backgroundColor:
              th === "theme-blue"
                ? "#4f46e5"
                : th === "theme-default"
                ? "#f97316"
                : "#10b981", // warna sesuai tema
          }}
        >
          {th.replace("theme-", "")}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
