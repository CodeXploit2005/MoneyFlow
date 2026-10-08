import { useState, useEffect } from 'react';

/**
 * Hook quản lý chuyển đổi giao diện Sáng (Light) / Tối (Dark)
 * Tự động đồng bộ với hệ điều hành và lưu vào localStorage
 */
export const useTheme = () => {
  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem('moneyflow_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  };

  const [theme, setThemeState] = useState(getInitialTheme);

  const applyTheme = (currentTheme) => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Lắng nghe thay đổi theme từ hệ thống nếu người dùng chưa chọn thủ công
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('moneyflow_theme');
      if (!saved) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('moneyflow_theme', newTheme);
    } catch (e) {
      console.warn('Cannot write to localStorage', e);
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme
  };
};

export default useTheme;
