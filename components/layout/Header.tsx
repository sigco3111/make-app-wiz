
import React from 'react';
import { SparklesIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'; 
import { Theme } from '../../types';

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateToLibrary: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, onNavigateToLibrary, theme, toggleTheme }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <button onClick={onNavigateHome} className="flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <SparklesIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          <span>앱 생성 프롬프트 아이디어 마법사</span>
        </button>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onNavigateToLibrary}
            className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-3 py-2 rounded-md font-medium"
          >
            내 라이브러리
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={theme === Theme.Light ? "Switch to dark theme" : "Switch to light theme"}
            title={theme === Theme.Light ? "어두운 테마로 변경" : "밝은 테마로 변경"}
          >
            {theme === Theme.Light ? (
              <MoonIcon className="h-6 w-6" />
            ) : (
              <SunIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
