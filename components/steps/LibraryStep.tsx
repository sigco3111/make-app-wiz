
import React, { useState, useMemo, useRef } from 'react';
import { SavedPrompt, ProjectType } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { EyeIcon, TrashIcon, PlusCircleIcon, MagnifyingGlassIcon, TagIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { PROJECT_TYPES_OPTIONS, APP_CATEGORIES_OPTIONS, GAME_CATEGORIES_OPTIONS } from '../../constants';


interface LibraryStepProps {
  prompts: SavedPrompt[];
  onLoadPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onStartNew: () => void;
  onImportPrompts: (prompts: SavedPrompt[]) => void;
}

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' | 'projectType_asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'createdAt_desc', label: '최신순 (기본값)' },
  { value: 'createdAt_asc', label: '오래된순' },
  { value: 'name_asc', label: '이름 (오름차순)' },
  { value: 'name_desc', label: '이름 (내림차순)' },
  { value: 'projectType_asc', label: '프로젝트 유형 (오름차순)' },
];

export const LibraryStep: React.FC<LibraryStepProps> = ({ prompts, onLoadPrompt, onDeletePrompt, onStartNew, onImportPrompts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPromptDisplayDetails = (prompt: SavedPrompt) => {
    const projectTypeLabel = PROJECT_TYPES_OPTIONS.find(opt => opt.id === prompt.ideaDetails.projectType)?.label || '해당 없음';
    
    let categoryLabel = '';
    if (prompt.ideaDetails.category) {
      const categoryList = prompt.ideaDetails.projectType === ProjectType.App ? APP_CATEGORIES_OPTIONS : GAME_CATEGORIES_OPTIONS;
      categoryLabel = categoryList.find(opt => opt.id === prompt.ideaDetails.category)?.label || '';
    }
    
    return `타입: ${projectTypeLabel}${categoryLabel ? ` - ${categoryLabel}` : ''}`;
  };

  const filteredAndSortedPrompts = useMemo(() => {
    let processedPrompts = [...prompts];

    // Sorting
    processedPrompts.sort((a, b) => {
      switch (sortOption) {
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'projectType_asc':
          const typeA = PROJECT_TYPES_OPTIONS.find(opt => opt.id === a.ideaDetails.projectType)?.label || '';
          const typeB = PROJECT_TYPES_OPTIONS.find(opt => opt.id === b.ideaDetails.projectType)?.label || '';
          return typeA.localeCompare(typeB);
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Filtering
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedPrompts = processedPrompts.filter(prompt => 
        prompt.name.toLowerCase().includes(lowerSearchTerm) ||
        prompt.promptText.toLowerCase().includes(lowerSearchTerm) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    return processedPrompts;
  }, [prompts, searchTerm, sortOption]);

  const handleExportLibrary = () => {
    if (prompts.length === 0) {
      alert("내보낼 프롬프트가 라이브러리에 없습니다.");
      return;
    }
    const jsonString = JSON.stringify(prompts, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "prompt_architect_library.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert("라이브러리가 성공적으로 내보내졌습니다!");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);
        if (Array.isArray(importedData)) {
          // Basic validation for each prompt object
          const validPrompts = importedData.filter(p => 
            p && typeof p.id === 'string' && 
            typeof p.name === 'string' && 
            typeof p.promptText === 'string' &&
            typeof p.createdAt === 'string' && 
            typeof p.ideaDetails === 'object' && p.ideaDetails !== null
          );
          
          if (validPrompts.length > 0) {
            onImportPrompts(validPrompts);
          } else if (importedData.length > 0) {
            alert("파일에 유효한 프롬프트 데이터가 없습니다. 각 프롬프트는 id, name, promptText, ideaDetails, createdAt 필드를 포함해야 합니다.");
          } else {
            alert("가져온 파일이 비어있거나 프롬프트 목록이 아닙니다.");
          }
        } else {
          alert("유효하지 않은 파일 형식입니다. JSON 배열 형태의 프롬프트 목록이어야 합니다.");
        }
      } catch (error) {
        console.error("Error importing library:", error);
        alert("라이브러리 가져오기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.");
      } finally {
        // Reset file input value to allow importing the same file again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-slate-800 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-semibold text-slate-100">프롬프트 라이브러리</h2>
        <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportLibrary} variant="ghost" size="sm" leftIcon={<ArrowDownTrayIcon className="h-5 w-5"/>}>
                내보내기
            </Button>
            <Button onClick={handleImportClick} variant="ghost" size="sm" leftIcon={<ArrowUpTrayIcon className="h-5 w-5"/>}>
                가져오기
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFileChange}
                className="hidden"
                aria-hidden="true"
            />
            <Button onClick={onStartNew} variant="primary" size="sm" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                새 프롬프트 만들기
            </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          label="라이브러리 검색"
          placeholder="이름, 내용, 태그로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-slate-400"/>}
        />
        <Select
          label="정렬 기준"
          options={SORT_OPTIONS}
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="w-full"
        />
      </div>

      {filteredAndSortedPrompts.length === 0 ? (
        <p className="text-slate-400 text-center py-10">
          {searchTerm ? '검색 결과가 없습니다.' : '라이브러리가 비어있습니다. 프롬프트를 만들어보세요!'}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedPrompts.map(prompt => (
            <div key={prompt.id} className="bg-slate-700 p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-medium text-slate-100 truncate" title={prompt.name}>{prompt.name}</h3>
                <p className="text-xs text-slate-400">
                  생성일: {new Date(prompt.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-md" title={getPromptDisplayDetails(prompt)}>
                  {getPromptDisplayDetails(prompt)}
                </p>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <TagIcon className="h-3.5 w-3.5 text-slate-500 flex-shrink-0"/>
                    {prompt.tags.map(tag => (
                      <button 
                        key={tag} 
                        onClick={() => setSearchTerm(tag)}
                        className="text-xs bg-purple-600 hover:bg-purple-500 text-purple-100 px-1.5 py-0.5 rounded-full transition-colors"
                        title={`'${tag}' 태그로 검색`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                <Button onClick={() => onLoadPrompt(prompt)} variant="ghost" size="sm" leftIcon={<EyeIcon className="h-4 w-4"/>}>
                  보기/수정
                </Button>
                <Button 
                  onClick={() => onDeletePrompt(prompt.id)} 
                  variant="danger" 
                  size="sm"
                  leftIcon={<TrashIcon className="h-4 w-4"/>}
                  aria-label={`"${prompt.name}" 프롬프트 삭제`}
                 >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
