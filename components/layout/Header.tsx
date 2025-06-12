
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline'; // Using Heroicons

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateToLibrary: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, onNavigateToLibrary }) => {
  return (
    <header className="bg-slate-800 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <button onClick={onNavigateHome} className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-purple-400 transition-colors">
          <SparklesIcon className="h-8 w-8 text-purple-400" />
          <span>앱 생성 프롬프트 아이디어 마법사</span>
        </button>
        <nav>
          <button 
            onClick={onNavigateToLibrary}
            className="text-slate-300 hover:text-purple-400 transition-colors px-4 py-2 rounded-md font-medium"
          >
            내 라이브러리
          </button>
        </nav>
      </div>
    </header>
  );
};