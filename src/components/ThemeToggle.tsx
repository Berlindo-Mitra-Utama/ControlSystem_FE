import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  showText = true,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const buttonClasses = `
    inline-flex items-center justify-center rounded-md text-sm font-medium 
    transition-colors focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 
    disabled:pointer-events-none ring-offset-background
    ${variant === 'outline' ? 'border border-input hover:bg-accent hover:text-accent-foreground' : ''}
    ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
    ${size === 'sm' ? 'h-9 px-3' : size === 'md' ? 'h-10 px-4 py-2' : 'h-11 px-8'}
    ${className}
  `;

  return (
    <button
      onClick={toggleTheme}
      className={buttonClasses}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <>
          <Sun className="w-4 h-4 mr-2" />
          {showText && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 mr-2" />
          {showText && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
