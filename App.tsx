
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { ProjectTypeStep } from './components/steps/ProjectTypeStep';
import { IdeaFormStep } from './components/steps/IdeaFormStep';
import { PromptDisplayStep } from './components/steps/PromptDisplayStep';
import { LibraryStep } from './components/steps/LibraryStep';
import { IdeaData, SavedPrompt, AppStep, ProjectType, Theme } from './types.ts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generatePromptText } from './utils/promptGenerator';
import { PersistentApiKeySection } from './components/layout/PersistentApiKeySection';

const LOCAL_STORAGE_API_KEY = 'geminiApiKey';
const LOCAL_STORAGE_THEME_KEY = 'appTheme';

const initialIdeaData: IdeaData = {
  projectName: '',
  projectType: undefined,
  category: undefined,
  summary: '',
  selectedStandardFeatures: [],
  customFeatures: '',
  targetAudience: '',
  techStack: {},
  useGoogleSearchGrounding: false,
  projectImage: null,
  promptTone: undefined,
  promptStyle: undefined,
};

const App: React.FC = () => {
  const envApiKey = process.env.API_KEY;
  const [localApiKey, setLocalApiKeyInStorage] = useLocalStorage<string | null>(LOCAL_STORAGE_API_KEY, null);
  const [theme, setTheme] = useLocalStorage<Theme>(LOCAL_STORAGE_THEME_KEY, Theme.Dark);

  const effectiveApiKey = envApiKey || localApiKey;

  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Home);
  const [ideaData, setIdeaData] = useState<IdeaData>(initialIdeaData);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [promptName, setPromptName] = useState<string>('');
  const [promptTags, setPromptTags] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});

  const [savedPrompts, setSavedPrompts] = useLocalStorage<SavedPrompt[]>('promptArchitectLibrary', []);

  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const handleUpdateLocalApiKey = (newKey: string) => {
    setLocalApiKeyInStorage(newKey);
  };

  const handleStartNew = () => {
    setIdeaData(initialIdeaData);
    setGeneratedPrompt('');
    setPromptName('');
    setPromptTags([]);
    setEditingPrompt(null);
    setTemplateVariableValues({});
    setCurrentStep(AppStep.ProjectTypeSelection);
  };

  const handleSelectProjectType = (type: ProjectType) => {
    setIdeaData(prev => ({ 
        ...initialIdeaData, 
        projectType: type, 
        projectImage: prev.projectImage, // Keep image if set before type selection
    }));
    setTemplateVariableValues({}); // Reset template variables for new form
    setCurrentStep(AppStep.IdeaForm);
  };

  const handleSubmitIdeaForm = (data: IdeaData) => {
    setIdeaData(data);
    const prompt = generatePromptText(data);
    setGeneratedPrompt(prompt);
    setPromptName(data.projectName || '제목 없는 프롬프트');
    setPromptTags(editingPrompt?.tags || []); 
    // If editing, try to preserve existing template values, otherwise clear for new prompt
    setTemplateVariableValues(editingPrompt?.templateVariableValues || {});
    setCurrentStep(AppStep.PromptDisplay);
  };

  const handleSavePrompt = useCallback(() => {
    if (!generatedPrompt || !promptName) return;

    if (editingPrompt) {
      const updatedPrompts = savedPrompts.map(p =>
        p.id === editingPrompt.id ? { 
          ...editingPrompt, 
          name: promptName, 
          promptText: generatedPrompt, 
          tags: promptTags, 
          ideaDetails: {
            ...editingPrompt.ideaDetails, 
            ...ideaData 
          }, 
          templateVariableValues: templateVariableValues, // Save current variable values
          createdAt: new Date().toISOString(),
        } : p
      );
      setSavedPrompts(updatedPrompts);
      setEditingPrompt(null); 
    } else {
      const newPrompt: SavedPrompt = {
        id: Date.now().toString(),
        name: promptName,
        promptText: generatedPrompt,
        tags: promptTags,
        ideaDetails: ideaData, 
        templateVariableValues: templateVariableValues, // Save current variable values
        createdAt: new Date().toISOString(),
        isFavorite: false, 
      };
      setSavedPrompts(prev => [...prev, newPrompt]);
    }
    alert('프롬프트가 라이브러리에 저장되었습니다!');
  }, [generatedPrompt, promptName, promptTags, ideaData, savedPrompts, setSavedPrompts, editingPrompt, templateVariableValues]);


  const handleLoadPromptFromLibrary = (promptToLoad: SavedPrompt) => {
    const ideaDetailsWithDefaults: IdeaData = {
        ...initialIdeaData, 
        ...promptToLoad.ideaDetails, 
        projectImage: promptToLoad.ideaDetails.projectImage || null, 
        promptTone: promptToLoad.ideaDetails.promptTone || undefined,
        promptStyle: promptToLoad.ideaDetails.promptStyle || undefined,
    };

    setIdeaData(ideaDetailsWithDefaults);
    setGeneratedPrompt(promptToLoad.promptText);
    setPromptName(promptToLoad.name);
    setPromptTags(promptToLoad.tags || []);
    setTemplateVariableValues(promptToLoad.templateVariableValues || {}); // Load saved variable values
    setEditingPrompt(promptToLoad); 
    setCurrentStep(AppStep.PromptDisplay);
  };
  
  const handleDeletePromptFromLibrary = (id: string) => {
    if (editingPrompt?.id === id) {
        setEditingPrompt(null); 
        setTemplateVariableValues({});
    }
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleFavoritePrompt = (id: string) => {
    setSavedPrompts(prev => 
      prev.map(p => 
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
    if (editingPrompt && editingPrompt.id === id) {
        setEditingPrompt(prev => prev ? ({...prev, isFavorite: !prev.isFavorite}) : null);
    }
  };

  const handleDuplicatePrompt = (id: string) => {
    const promptToDuplicate = savedPrompts.find(p => p.id === id);
    if (promptToDuplicate) {
      const newPrompt: SavedPrompt = {
        ...promptToDuplicate, 
        id: Date.now().toString(),
        name: `Copy of ${promptToDuplicate.name}`,
        createdAt: new Date().toISOString(),
        templateVariableValues: promptToDuplicate.templateVariableValues || {}, // Duplicate variable values
      };
      setSavedPrompts(prev => [...prev, newPrompt]);
      alert(`"${promptToDuplicate.name}" 프롬프트가 복제되었습니다.`);
    }
  };


  const handleEditIdea = () => {
    // templateVariableValues are already set from handleSubmitIdeaForm or handleLoadPromptFromLibrary
    setCurrentStep(AppStep.IdeaForm);
  };

  const handleImportPrompts = useCallback((importedPrompts: SavedPrompt[]) => {
    setSavedPrompts(prevSavedPrompts => {
      const promptsMap = new Map(prevSavedPrompts.map(p => [p.id, p]));
      importedPrompts.forEach(importedPrompt => {
        if (
          importedPrompt &&
          typeof importedPrompt.id === 'string' &&
          typeof importedPrompt.name === 'string' &&
          typeof importedPrompt.promptText === 'string' &&
          typeof importedPrompt.createdAt === 'string' && 
          typeof importedPrompt.ideaDetails === 'object' && importedPrompt.ideaDetails !== null
        ) {
          const promptWithDefaults: SavedPrompt = {
            ...importedPrompt, 
            isFavorite: importedPrompt.isFavorite || false, 
            tags: importedPrompt.tags || [],
            ideaDetails: { 
                ...initialIdeaData, 
                ...importedPrompt.ideaDetails, 
                projectImage: importedPrompt.ideaDetails.projectImage || null, 
                promptTone: importedPrompt.ideaDetails.promptTone || undefined, 
                promptStyle: importedPrompt.ideaDetails.promptStyle || undefined, 
            },
            templateVariableValues: importedPrompt.templateVariableValues || {}, // Import variable values
          };
          promptsMap.set(importedPrompt.id, promptWithDefaults);
        } else {
          console.warn('Skipping invalid prompt during import:', importedPrompt);
        }
      });
      return Array.from(promptsMap.values());
    });
    alert(`${importedPrompts.length}개의 프롬프트가 라이브러리로 가져와졌습니다. (중복 ID는 덮어쓰기)`);
  }, [setSavedPrompts]);


  const renderStep = () => {
    switch (currentStep) {
      case AppStep.Home:
        return (
          <div className="text-center p-8">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-600">앱을 위한 프롬프트 아이디어</h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">당신의 프로젝트를 위한 완벽한 프롬프트를 만드세요. 아이디어를 현실로.</p>
            <div className="space-x-4">
              <button
                onClick={handleStartNew}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105"
              >
                새 프롬프트 시작
              </button>
              <button
                onClick={() => setCurrentStep(AppStep.Library)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100 font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out"
              >
                라이브러리 보기
              </button>
            </div>
          </div>
        );
      case AppStep.ProjectTypeSelection:
        return <ProjectTypeStep onSelectProjectType={handleSelectProjectType} />;
      case AppStep.IdeaForm:
        return <IdeaFormStep initialData={ideaData} onSubmit={handleSubmitIdeaForm} onBack={() => setCurrentStep(AppStep.ProjectTypeSelection)} apiKey={effectiveApiKey} />;
      case AppStep.PromptDisplay:
        return (
          <PromptDisplayStep
            promptText={generatedPrompt}
            setPromptText={setGeneratedPrompt}
            promptName={promptName}
            setPromptName={setPromptName}
            tags={promptTags}
            setTags={setPromptTags}
            onSave={handleSavePrompt}
            onEditIdea={handleEditIdea}
            onStartNew={handleStartNew}
            isEditing={!!editingPrompt}
            apiKey={effectiveApiKey}
            currentIdeaData={ideaData} 
            isFavorite={editingPrompt?.isFavorite || false}
            onToggleFavorite={() => editingPrompt && handleToggleFavoritePrompt(editingPrompt.id)}
            templateVariableValues={templateVariableValues}
            setTemplateVariableValues={setTemplateVariableValues}
          />
        );
      case AppStep.Library:
        return (
          <LibraryStep
            prompts={savedPrompts}
            onLoadPrompt={handleLoadPromptFromLibrary}
            onDeletePrompt={handleDeletePromptFromLibrary}
            onStartNew={handleStartNew}
            onImportPrompts={handleImportPrompts}
            onToggleFavorite={handleToggleFavoritePrompt}
            onDuplicatePrompt={handleDuplicatePrompt}
          />
        );
      default:
        return <div className="text-slate-700 dark:text-slate-300">알 수 없는 단계</div>;
    }
  };

  return (
    <>
      <PersistentApiKeySection
        envKeyIsSet={!!envApiKey}
        currentLocalKey={localApiKey}
        onUpdateLocalKey={handleUpdateLocalApiKey}
        isAppUsable={!!effectiveApiKey}
      />
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
        <Header 
            onNavigateHome={() => setCurrentStep(AppStep.Home)} 
            onNavigateToLibrary={() => setCurrentStep(AppStep.Library)}
            theme={theme}
            toggleTheme={toggleTheme}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          {renderStep()}
        </main>
        <footer className="text-center py-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-300 dark:border-slate-700">
          앱 생성 프롬프트 아이디어 마법사 &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
};

export default App;
