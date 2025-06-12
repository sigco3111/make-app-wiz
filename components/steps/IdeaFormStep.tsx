
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { IdeaData, ProjectType, AppCategory, GameCategory, Language, Framework, Platform, StandardFeatureKey } from '../../types';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { CheckboxGroup } from '../common/CheckboxGroup';
import { Button } from '../common/Button';
import { STANDARD_FEATURES, APP_CATEGORIES_OPTIONS, GAME_CATEGORIES_OPTIONS, LANGUAGES_OPTIONS, FRAMEWORKS_OPTIONS, PLATFORMS_OPTIONS, PROJECT_TYPES_OPTIONS } from '../../constants';
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon, MagnifyingGlassIcon, LinkIcon, QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface IdeaFormStepProps {
  initialData: IdeaData;
  onSubmit: (data: IdeaData) => void;
  onBack: () => void;
  apiKey: string | null;
}

const getEnumValues = (enumObj: object) => Object.values(enumObj);

const processGeminiSuggestions = (
  suggestions: any, 
  currentFormData: IdeaData,
  isKeywordWizard: boolean = false
): IdeaData => {
  const projectTypeIds = getEnumValues(ProjectType) as ProjectType[];
  const appCategoryIds = APP_CATEGORIES_OPTIONS.map(c => c.id);
  const gameCategoryIds = GAME_CATEGORIES_OPTIONS.map(g => g.id);
  const standardFeatureIds = STANDARD_FEATURES.map(f => f.id);
  const languageIds = LANGUAGES_OPTIONS.map(l => l.id);
  const frameworkIds = FRAMEWORKS_OPTIONS.map(f => f.id);
  const platformIds = PLATFORMS_OPTIONS.map(p => p.id);

  const newProjectType = projectTypeIds.includes(suggestions.projectType as ProjectType)
    ? suggestions.projectType as ProjectType
    : currentFormData.projectType;

  let validCategory: AppCategory | GameCategory | undefined = currentFormData.category;
  if (suggestions.category) {
    const suggestedCategoryString = suggestions.category as string;
    const relevantCategoryIds = newProjectType === ProjectType.App ? appCategoryIds : gameCategoryIds;

    if ((relevantCategoryIds as ReadonlyArray<string>).includes(suggestedCategoryString)) {
      validCategory = suggestedCategoryString as AppCategory | GameCategory;
    } else if (newProjectType === ProjectType.App && appCategoryIds.length > 0) {
      validCategory = appCategoryIds[0];
    } else if (newProjectType === ProjectType.Game && gameCategoryIds.length > 0) {
      validCategory = gameCategoryIds[0];
    } else {
        validCategory = undefined; 
    }
  }

  const validStandardFeatures = Array.isArray(suggestions.selectedStandardFeatures)
    ? (suggestions.selectedStandardFeatures as string[])
        .filter((f: string): f is StandardFeatureKey => standardFeatureIds.includes(f as StandardFeatureKey))
    : currentFormData.selectedStandardFeatures;

  const geminiTechStack = suggestions.techStack || {};

  const getValidatedTechValue = <T extends string>(
    jsonValue: unknown,
    validEnumValues: readonly T[],
    prevValue: T | undefined
  ): T | undefined => {
    if (jsonValue === null || typeof jsonValue === 'undefined') {
      return undefined;
    }
    if (typeof jsonValue === 'string' && validEnumValues.includes(jsonValue as T)) {
      return jsonValue as T;
    }
    return prevValue;
  };
  
  const projectNameUpdate = (isKeywordWizard && typeof suggestions.projectName === 'string' && suggestions.projectName.trim() !== '') 
    ? suggestions.projectName.trim() 
    : currentFormData.projectName;

  return {
    ...currentFormData,
    projectName: projectNameUpdate,
    projectType: newProjectType,
    category: validCategory,
    summary: typeof suggestions.summary === 'string' ? suggestions.summary : currentFormData.summary,
    selectedStandardFeatures: validStandardFeatures,
    customFeatures: typeof suggestions.customFeatures === 'string' ? suggestions.customFeatures : currentFormData.customFeatures,
    targetAudience: typeof suggestions.targetAudience === 'string' ? suggestions.targetAudience : currentFormData.targetAudience,
    techStack: {
      language: getValidatedTechValue(geminiTechStack.language, languageIds as Language[], currentFormData.techStack.language),
      framework: getValidatedTechValue(geminiTechStack.framework, frameworkIds as Framework[], currentFormData.techStack.framework),
      platform: getValidatedTechValue(geminiTechStack.platform, platformIds as Platform[], currentFormData.techStack.platform),
    },
    useGoogleSearchGrounding: typeof suggestions.useGoogleSearchGrounding === 'boolean' ? suggestions.useGoogleSearchGrounding : currentFormData.useGoogleSearchGrounding,
  };
};


export const IdeaFormStep: React.FC<IdeaFormStepProps> = ({ initialData, onSubmit, onBack, apiKey }) => {
  const [formData, setFormData] = useState<IdeaData>({...initialData, useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false});
  const [keywordsInput, setKeywordsInput] = useState<string>('');
  const [relatednessValue, setRelatednessValue] = useState<number>(0.5);
  const [isFetchingRelatedKeywords, setIsFetchingRelatedKeywords] = useState<boolean>(false);
  const [isFetchingRandomKeywords, setIsFetchingRandomKeywords] = useState<boolean>(false);
  const [isProcessingViaKeywords, setIsProcessingViaKeywords] = useState<boolean>(false);
  const [isProcessingViaName, setIsProcessingViaName] = useState<boolean>(false);
  const [rationales, setRationales] = useState<Record<string, string>>({});


  useEffect(() => {
    setFormData({...initialData, useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false});
    setRationales({}); 
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTechStackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        [name]: value as Language | Framework | Platform, 
      },
    }));
  };

  const handleCheckboxGroupChange = (field: keyof Pick<IdeaData, 'selectedStandardFeatures'>) => (selectedItems: string[]) => {
    setFormData(prev => ({ ...prev, [field]: selectedItems as StandardFeatureKey[] }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert("API 키가 설정되어 있지 않아 프롬프트를 생성할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    onSubmit(formData);
  };

  const commonGeminiCallForSuggestions = async (prompt: string): Promise<any> => {
    if (!apiKey) {
      console.error("API key is not available for Gemini call.");
      throw new Error("API 키가 설정되지 않았습니다. 상단 배너에서 API 키를 먼저 설정해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    return JSON.parse(jsonStr);
  };
  
  const handleAutoFillFromKeywords = async () => {
    if (!apiKey) {
      alert("API 키가 없어 자동 완성 기능을 사용할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    if (!keywordsInput.trim()) {
      alert("키워드를 먼저 입력해주세요.");
      return;
    }
    setIsProcessingViaKeywords(true);
    setRationales({});
    try {
      const projectTypeIds = getEnumValues(ProjectType) as ProjectType[];
      const appCategoryIds = APP_CATEGORIES_OPTIONS.map(c => c.id);
      const gameCategoryIds = GAME_CATEGORIES_OPTIONS.map(g => g.id);
      const standardFeatureIds = STANDARD_FEATURES.map(f => f.id);
      const languageIds = LANGUAGES_OPTIONS.map(l => l.id);
      const frameworkIds = FRAMEWORKS_OPTIONS.map(f => f.id);
      const platformIds = PLATFORMS_OPTIONS.map(p => p.id);

      const promptForKeywordWizard = `
        주어진 키워드 "${keywordsInput}"를 창의적으로 조합하여, 다음 JSON 구조에 맞춰 프로젝트 아이디어를 구체화해주세요.
        모든 필드를 채워주고, 각 제안에 대한 간단한 '이유(rationale)'도 함께 제공해주세요. 응답은 반드시 한국어로 작성된 JSON 형식이어야 합니다.

        JSON 구조:
        {
          "projectName": "생성된 프로젝트 이름",
          "projectType": "${formData.projectType || ProjectType.App}",
          "category": "${formData.category || (formData.projectType === ProjectType.App ? AppCategory.Productivity : GameCategory.Puzzle)}",
          "summary": "프로젝트 요약",
          "selectedStandardFeatures": ["login", "database"],
          "customFeatures": "독특한 기능 아이디어",
          "targetAudience": "주요 타겟 사용자",
          "techStack": {
            "language": "${Language.JavaScript}",
            "framework": "${Framework.React}",
            "platform": "${Platform.Web}"
          },
          "useGoogleSearchGrounding": ${formData.useGoogleSearchGrounding || false},
          "rationales": {
            "projectName": "프로젝트 이름 제안 이유",
            "projectType": "프로젝트 유형 선택 이유",
            "category": "카테고리 선택 이유",
            "summary": "요약 제안 이유",
            "selectedStandardFeatures": "표준 기능 선택 이유",
            "customFeatures": "사용자 정의 기능 제안 이유",
            "targetAudience": "타겟 사용자 제안 이유",
            "techStack_language": "언어 선택 이유",
            "techStack_framework": "프레임워크 선택 이유",
            "techStack_platform": "플랫폼 선택 이유",
            "useGoogleSearchGrounding": "최신 정보 반영(Google Search) 옵션 선택/해제 이유"
          }
        }

        지침:
        - "projectName": 키워드 기반 창의적 이름. "rationales.projectName": 이름 선정 배경 설명.
        - "projectType": [${projectTypeIds.map(id => `"${id}"`).join(', ')}] 중 최적 선택. "rationales.projectType": 선택 근거. (현재: ${formData.projectType || '자동'})
        - "category": projectType에 따라 [${appCategoryIds.map(id => `"${id}"`).join(', ')}] 또는 [${gameCategoryIds.map(id => `"${id}"`).join(', ')}] 중 선택. "rationales.category": 선택 근거. (현재: ${formData.category || '자동'})
        - "summary": 키워드 기반 요약. "rationales.summary": 요약 내용 설명.
        - "selectedStandardFeatures": [${standardFeatureIds.map(id => `"${id}"`).join(', ')}] 중 0~3개. "rationales.selectedStandardFeatures": 기능들 선택 이유.
        - "customFeatures": 독창적 기능 또는 빈 문자열. "rationales.customFeatures": 기능 아이디어 설명.
        - "targetAudience": 간결한 타겟 사용자. "rationales.targetAudience": 타겟 설정 이유.
        - "techStack.language": [${languageIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.techStack_language": 선택 이유.
        - "techStack.framework": [${frameworkIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.techStack_framework": 선택 이유.
        - "techStack.platform": [${platformIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.techStack_platform": 선택 이유.
        - "useGoogleSearchGrounding": true 또는 false. "rationales.useGoogleSearchGrounding": 해당 값 제안 이유.
        - 모든 텍스트는 한국어. 순수 JSON 객체로만 응답.
      `;
      const suggestions = await commonGeminiCallForSuggestions(promptForKeywordWizard);
      setFormData(prev => processGeminiSuggestions(suggestions, prev, true));
      if (suggestions.rationales) {
        setRationales(suggestions.rationales);
      }

    } catch (error) {
      console.error("Error auto-filling from keywords:", error);
      alert("키워드 마법사 실행 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsProcessingViaKeywords(false);
    }
  };

  const handleAutoFillFromProjectName = async () => {
     if (!apiKey) {
      alert("API 키가 없어 자동 완성 기능을 사용할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    if (!formData.projectName.trim()) {
      alert("프로젝트 이름을 먼저 입력해주세요.");
      return;
    }
    setIsProcessingViaName(true);
    setRationales({});
    try {
      const projectTypeIds = getEnumValues(ProjectType) as ProjectType[];
      const appCategoryIds = APP_CATEGORIES_OPTIONS.map(c => c.id);
      const gameCategoryIds = GAME_CATEGORIES_OPTIONS.map(g => g.id);
      const standardFeatureIds = STANDARD_FEATURES.map(f => f.id);
      const languageIds = LANGUAGES_OPTIONS.map(l => l.id);
      const frameworkIds = FRAMEWORKS_OPTIONS.map(f => f.id);
      const platformIds = PLATFORMS_OPTIONS.map(p => p.id);

      const promptForGemini = `
        프로젝트 이름 "${formData.projectName}"을 기반으로 다음 항목들에 대한 아이디어를 한국어로 제안해줘.
        각 제안에 대한 간단한 '이유(rationale)'도 함께 제공해주세요. 응답은 반드시 JSON 형식이어야 해.

        JSON 구조: 
        {
          "projectType": "${formData.projectType || ProjectType.App}", 
          "category": "${formData.category || (formData.projectType === ProjectType.App ? AppCategory.Productivity : GameCategory.Puzzle)}", 
          "summary": "프로젝트 요약",
          "selectedStandardFeatures": ["login", "database"], 
          "customFeatures": "독특한 기능 아이디어",
          "targetAudience": "주요 타겟 사용자",
          "techStack": {
            "language": "${Language.JavaScript}", 
            "framework": "${Framework.React}",    
            "platform": "${Platform.Web}"        
          },
          "useGoogleSearchGrounding": ${formData.useGoogleSearchGrounding || false},
          "rationales": {
            "projectType": "프로젝트 유형 선택 이유",
            "category": "카테고리 선택 이유",
            "summary": "요약 제안 이유",
            "selectedStandardFeatures": "표준 기능 선택 이유",
            "customFeatures": "사용자 정의 기능 제안 이유",
            "targetAudience": "타겟 사용자 제안 이유",
            "techStack_language": "언어 선택 이유",
            "techStack_framework": "프레임워크 선택 이유",
            "techStack_platform": "플랫폼 선택 이유",
            "useGoogleSearchGrounding": "최신 정보 반영(Google Search) 옵션 선택/해제 이유"
          }
        }
        
        지침: (위 handleAutoFillFromKeywords의 지침과 유사하게 적용, projectName은 고정)
        - "projectType": 현재 값(${formData.projectType || '미설정'}) 유지 또는 이름에 더 적합하면 변경. "rationales.projectType": 선택/유지 근거.
        - "useGoogleSearchGrounding": true 또는 false. "rationales.useGoogleSearchGrounding": 해당 값 제안 이유.
        - 기타 필드 및 rationales: 프로젝트 이름에 맞춰 창의적으로 제안 및 설명.
        - 모든 텍스트는 한국어. 순수 JSON 객체로만 응답.
      `;
      
      const suggestions = await commonGeminiCallForSuggestions(promptForGemini);
      setFormData(prev => processGeminiSuggestions(suggestions, prev, false));
       if (suggestions.rationales) {
        setRationales(suggestions.rationales);
      }

    } catch (error) {
      console.error("Error auto-filling from project name:", error);
      alert("자동 완성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsProcessingViaName(false);
    }
  };

  const handleOpenGoogleTrends = () => {
    const query = keywordsInput.trim() || formData.projectName.trim();
    if (!query) {
      alert("키워드 또는 프로젝트 이름을 입력해주세요.");
      return;
    }
    const url = `https://trends.google.com/trends/explore?hl=ko&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const handleRelatednessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRelatednessValue(parseFloat(e.target.value));
  };

  const handleFetchRelatedKeywords = async () => {
    if (!apiKey) {
      alert("API 키가 없어 연관 키워드 기능을 사용할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    if (!keywordsInput.trim()) {
      alert("연관 키워드를 생성하려면 먼저 기준 키워드를 입력해주세요.");
      return;
    }
    setIsFetchingRelatedKeywords(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey }); 
      const promptForRelatedKeywords = `
        주어진 원본 키워드 '${keywordsInput}'를 바탕으로 새로운 키워드 목록을 생성해주세요. 
        '연관도' 점수는 ${relatednessValue.toFixed(2)}입니다. 
        (0은 원본 키워드와 거의 또는 전혀 관련 없는 창의적이고 무작위적인 키워드를 의미하고, 0.5는 어느 정도 연관성이 있으면서도 새로운 아이디어를 탐색할 수 있는 키워드를, 1은 원본 키워드와 매우 밀접하게 관련된 키워드를 의미합니다.) 
        이 연관도 점수를 참고하여 생성되는 키워드의 성격을 조절해주세요.
        생성되는 키워드는 한국어로 작성되어야 합니다.
        최종 결과는 쉼표로 구분된 키워드 목록(예: 키워드1, 새로운 키워드2, 키워드 아이디어3) 형태의 문자열로만 응답해야 합니다. 
        다른 설명이나 앞뒤 텍스트 없이 키워드 목록만 제공해주세요.
      `;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: promptForRelatedKeywords,
      });
      const newKeywords = response.text.trim();
      if (newKeywords) {
        setKeywordsInput(newKeywords);
      } else {
        alert("Gemini로부터 연관 키워드를 받지 못했습니다. 다시 시도해 주세요.");
      }

    } catch (error) {
      console.error("Error fetching related keywords:", error);
      alert("연관 키워드 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsFetchingRelatedKeywords(false);
    }
  };

  const handleFetchRandomKeywords = async () => {
    if (!apiKey) {
      alert("API 키가 없어 랜덤 키워드 기능을 사용할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    setIsFetchingRandomKeywords(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey }); 
      const promptForRandomKeywords = `
        창의적인 아이디어 구상에 도움이 될 만한 흥미롭거나 독특한 랜덤 키워드 5개를 쉼표로 구분하여 한국어로 알려줘.
        다양한 주제를 포괄하고, 서로 연관성이 낮아도 괜찮으니, 상상력을 자극할 수 있는 단어들로 구성해줘.
        예시: 우주 고양이, 시간 여행자, 비밀 정원, 노래하는 로봇, 투명 물약.
        다른 설명 없이 키워드 목록만 제공해야해. 오직 쉼표로 구분된 키워드 목록만 응답해줘.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: promptForRandomKeywords,
      });
      const randomKeywords = response.text.trim();
      if (randomKeywords) {
        setKeywordsInput(randomKeywords);
      } else {
        alert("Gemini로부터 랜덤 키워드를 받지 못했습니다. 다시 시도해 주세요.");
      }
    } catch (error) {
      console.error("Error fetching random keywords:", error);
      alert("랜덤 키워드 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsFetchingRandomKeywords(false);
    }
  };


  const categoryOptions = formData.projectType === ProjectType.App ? APP_CATEGORIES_OPTIONS : GAME_CATEGORIES_OPTIONS;
  const projectTypeLabel = PROJECT_TYPES_OPTIONS.find(opt => opt.id === formData.projectType)?.label || '프로젝트';
  const anyProcessing = isProcessingViaKeywords || isProcessingViaName || isFetchingRandomKeywords || isFetchingRelatedKeywords;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 sm:p-8 bg-slate-800 rounded-xl shadow-2xl space-y-8">
      <div>
        <Button onClick={onBack} variant="ghost" size="sm" className="mb-6" leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>
          프로젝트 유형으로 돌아가기
        </Button>
        <h2 className="text-3xl font-semibold text-slate-100 mb-2">당신의 {projectTypeLabel} 아이디어를 설명해주세요</h2>
        <p className="text-slate-400">당신의 비전을 구체화해봅시다. 자세할수록 더 좋은 프롬프트가 만들어집니다!</p>
      </div>

      <div className="space-y-3">
        <Input
          label="핵심 키워드 (쉼표로 구분하여 여러 개 입력 가능)"
          name="keywords"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="예: AI, 여행, 사진 공유, 실시간 건강 관리"
          className="flex-grow"
        />
        <div className="flex flex-wrap gap-2">
            <Button
                type="button"
                onClick={handleAutoFillFromKeywords}
                disabled={isProcessingViaKeywords || anyProcessing || !keywordsInput.trim() || !apiKey}
                variant="secondary"
                size="sm"
                aria-label="입력된 키워드로 전체 항목 자동 제안"
                title="입력된 키워드로 전체 항목 자동 제안"
                leftIcon={<SparklesIcon className="h-4 w-4" />}
            >
                {isProcessingViaKeywords ? '생성중...' : '키워드로 전체 채우기'}
            </Button>
            <Button
                type="button"
                onClick={handleFetchRandomKeywords} 
                disabled={isFetchingRandomKeywords || anyProcessing || !apiKey} 
                variant="secondary"
                size="sm"
                aria-label="랜덤 키워드 자동 입력" 
                title="랜덤 키워드 자동 입력"
                leftIcon={<QuestionMarkCircleIcon className="h-4 w-4" />}
            >
                {isFetchingRandomKeywords ? '생성중...' : '랜덤 키워드 추천'} 
            </Button>
            <Button
                type="button"
                onClick={handleOpenGoogleTrends}
                variant="ghost"
                size="sm"
                aria-label="구글 트렌드에서 키워드 탐색"
                title="구글 트렌드에서 키워드 탐색"
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            >
                구글 트렌드 탐색
            </Button>
        </div>
      </div>
      
      <div className="p-4 border border-slate-700 rounded-lg space-y-3">
        <h3 className="text-md font-medium text-slate-200">연관 키워드 확장 도우미</h3>
        <div>
          <label htmlFor="relatednessSlider" className="block text-sm font-medium text-slate-300 mb-1">
            연관도: <span className="font-bold text-purple-400">{relatednessValue.toFixed(2)}</span> (0: 창의적 확장 ~ 1: 밀접한 관련)
          </label>
          <input
            type="range"
            id="relatednessSlider"
            min="0"
            max="1"
            step="0.01"
            value={relatednessValue}
            onChange={handleRelatednessChange}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            aria-label="연관도 슬라이더"
          />
        </div>
        <Button
            type="button"
            onClick={handleFetchRelatedKeywords}
            disabled={isFetchingRelatedKeywords || !keywordsInput.trim() || anyProcessing || !apiKey} 
            variant="secondary"
            size="sm"
            aria-label="연관 키워드 제안받기"
            title="연관 키워드 제안받기"
            leftIcon={<LinkIcon className="h-4 w-4" />}
        >
            {isFetchingRelatedKeywords ? '생성중...' : '연관 키워드 제안'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <Input
          label="프로젝트 이름"
          name="projectName"
          value={formData.projectName}
          onChange={handleChange}
          placeholder="예: 지능형 여행 플래너 '여정의 마법사'"
          required
          rationale={rationales.projectName}
        />
        <div className="md:col-span-1 flex items-end">
            <Button 
                type="button" 
                onClick={handleAutoFillFromProjectName} 
                disabled={isProcessingViaName || anyProcessing || !formData.projectName.trim() || !apiKey}
                variant="secondary"
                size="sm"
                className="w-full md:w-auto"
                leftIcon={<SparklesIcon className="h-4 w-4" />}
            >
                {isProcessingViaName ? '생성중...' : '이름으로 나머지 항목 자동 제안'} 
            </Button>
        </div>
        
        <Select
          label={`${projectTypeLabel} 카테고리`}
          name="category"
          value={formData.category || ''}
          onChange={handleChange}
          options={categoryOptions.map(opt => ({ value: opt.id, label: opt.label }))}
          required
          rationale={rationales.category || rationales.projectType /* Show projectType rationale if category one is missing but type was suggested */}
        />

        <div className="md:col-span-2">
          <Textarea
            label="프로젝트 요약"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="이 프로젝트가 무엇이고 어떤 문제를 해결하는지 간략하게 설명해주세요. (1-2 문장)"
            required
            rationale={rationales.summary}
          />
        </div>

        <div className="md:col-span-2">
           <CheckboxGroup
            label="표준 기능 (선택 사항)"
            name="selectedStandardFeatures"
            options={STANDARD_FEATURES.map(f => ({ id: f.id, label: f.label}))}
            selectedOptions={formData.selectedStandardFeatures}
            onChange={handleCheckboxGroupChange('selectedStandardFeatures')}
            rationale={rationales.selectedStandardFeatures}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="사용자 정의/특화 기능"
            name="customFeatures"
            value={formData.customFeatures}
            onChange={handleChange}
            placeholder="이 프로젝트만의 독특한 기능이나 아이디어를 설명해주세요. (예: AI 기반 콘텐츠 추천, 실시간 협업 도구 등)"
            rows={3}
            rationale={rationales.customFeatures}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="주요 타겟 사용자"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            placeholder="예: 20대 대학생, 여행을 자주 다니는 직장인, 특정 취미를 가진 그룹 등"
            rationale={rationales.targetAudience}
          />
        </div>
      </div>

      <fieldset className="p-4 border border-slate-700 rounded-lg">
        <legend className="text-lg font-medium text-slate-200 px-2">기술 스택 (선택 사항)</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mt-4">
          <Select
            label="주요 프로그래밍 언어"
            name="language" 
            value={formData.techStack.language || ''}
            onChange={handleTechStackChange}
            options={LANGUAGES_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_language}
          />
          <Select
            label="프레임워크/라이브러리"
            name="framework" 
            value={formData.techStack.framework || ''}
            onChange={handleTechStackChange}
            options={FRAMEWORKS_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_framework}
          />
          <Select
            label="타겟 플랫폼"
            name="platform" 
            value={formData.techStack.platform || ''}
            onChange={handleTechStackChange}
            options={PLATFORMS_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_platform}
          />
        </div>
      </fieldset>

      <div className="p-4 border border-slate-700 rounded-lg">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="useGoogleSearchGrounding"
            checked={!!formData.useGoogleSearchGrounding}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-offset-slate-800"
          />
          <span className="text-slate-200 font-medium">최신 정보 반영 및 실시간 검색 활용 (Google Search)</span>
          <div className="relative group">
            <InformationCircleIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-slate-100 bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              이 옵션을 선택하면 생성될 프롬프트에 Google Search를 활용하여 최신 정보를 반영하도록 하는 지침이 포함됩니다. (참고: Google Search 도구는 JSON 응답 모드와 함께 사용할 수 없습니다.)
            </div>
          </div>
        </label>
        {rationales.useGoogleSearchGrounding && (
          <p className="ml-8 mt-1 text-xs text-sky-400 italic">{rationales.useGoogleSearchGrounding}</p>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-slate-700">
         <Button 
          type="button" 
          onClick={() => {
            setFormData({...initialData, useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false }); 
            setKeywordsInput('');
            setRationales({});
          }} 
          variant="ghost"
          size="md"
        >
          양식 초기화
        </Button>
        <Button type="submit" variant="primary" size="lg" disabled={!apiKey || anyProcessing} leftIcon={<CheckCircleIcon className="h-5 w-5"/>}>
          프롬프트 생성하기
        </Button>
      </div>
      {!apiKey && (
        <p className="text-center text-red-400 text-sm mt-4" role="alert">
            API 키가 설정되지 않아 Gemini 기반 자동 완성 기능 및 프롬프트 생성이 비활성화되었습니다. <br/> 
            환경 변수(<code>process.env.API_KEY</code>)를 설정하거나, 앱 상단의 관리 섹션에서 로컬 API 키를 입력하고 저장해주세요.
        </p>
      )}
    </form>
  );
};