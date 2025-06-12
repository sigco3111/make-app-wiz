
import React from 'react';
import { ProjectType } from '../../types';
import { Button } from '../common/Button';
import { BuildingStorefrontIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { PROJECT_TYPES_OPTIONS } from '../../constants';


interface ProjectTypeStepProps {
  onSelectProjectType: (type: ProjectType) => void;
}

export const ProjectTypeStep: React.FC<ProjectTypeStepProps> = ({ onSelectProjectType }) => {
  const appLabel = PROJECT_TYPES_OPTIONS.find(opt => opt.id === ProjectType.App)?.label || ProjectType.App;
  const gameLabel = PROJECT_TYPES_OPTIONS.find(opt => opt.id === ProjectType.Game)?.label || ProjectType.Game;

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-semibold text-center text-slate-100 mb-8">프로젝트 유형 선택</h2>
      <p className="text-center text-slate-400 mb-10">Gemini와 함께 어떤 멋진 것을 만들 계획인가요?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button
          onClick={() => onSelectProjectType(ProjectType.App)}
          variant="secondary"
          size="lg"
          className="flex flex-col items-center justify-center p-8 h-48 !bg-slate-700 hover:!bg-purple-600 transition-all duration-200 group"
        >
          <BuildingStorefrontIcon className="h-16 w-16 mb-3 text-purple-400 group-hover:text-white transition-colors" />
          <span className="text-xl font-medium text-slate-100">{appLabel}</span>
          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">유틸리티, 소셜, 생산성 등</span>
        </Button>
        <Button
          onClick={() => onSelectProjectType(ProjectType.Game)}
          variant="secondary"
          size="lg"
          className="flex flex-col items-center justify-center p-8 h-48 !bg-slate-700 hover:!bg-purple-600 transition-all duration-200 group"
        >
          <PuzzlePieceIcon className="h-16 w-16 mb-3 text-purple-400 group-hover:text-white transition-colors" />
          <span className="text-xl font-medium text-slate-100">{gameLabel}</span>
          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">퍼즐, RPG, 시뮬레이션 등</span>
        </Button>
      </div>
    </div>
  );
};