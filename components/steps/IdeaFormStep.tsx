
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { IdeaData, ProjectType, AppCategory, GameCategory, Language, Framework, Platform, StandardFeatureKey, ProjectImage, PromptTone, PromptStyle } from '../../types.ts';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { CheckboxGroup } from '../common/CheckboxGroup';
import { Button } from '../common/Button';
import { 
    STANDARD_FEATURES, APP_CATEGORIES_OPTIONS, GAME_CATEGORIES_OPTIONS, 
    LANGUAGES_OPTIONS, FRAMEWORKS_OPTIONS, PLATFORMS_OPTIONS, PROJECT_TYPES_OPTIONS,
    PROMPT_TONE_OPTIONS, PROMPT_STYLE_OPTIONS, HELP_TEXTS 
} from '../../constants';
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon, MagnifyingGlassIcon, LinkIcon, QuestionMarkCircleIcon, InformationCircleIcon, PhotoIcon, XCircleIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const promptToneIds = PROMPT_TONE_OPTIONS.map(t => t.id);
  const promptStyleIds = PROMPT_STYLE_OPTIONS.map(s => s.id);


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

  const getValidatedEnumValue = <T extends string>(
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
      language: getValidatedEnumValue(geminiTechStack.language, languageIds as Language[], currentFormData.techStack.language),
      framework: getValidatedEnumValue(geminiTechStack.framework, frameworkIds as Framework[], currentFormData.techStack.framework),
      platform: getValidatedEnumValue(geminiTechStack.platform, platformIds as Platform[], currentFormData.techStack.platform),
    },
    useGoogleSearchGrounding: typeof suggestions.useGoogleSearchGrounding === 'boolean' ? suggestions.useGoogleSearchGrounding : currentFormData.useGoogleSearchGrounding,
    promptTone: getValidatedEnumValue(suggestions.promptTone, promptToneIds, currentFormData.promptTone),
    promptStyle: getValidatedEnumValue(suggestions.promptStyle, promptStyleIds, currentFormData.promptStyle),
  };
};

const KEY_IDEA_FIELDS = [
  'projectName', 
  'category', 
  'summary', 
  'targetAudience',
];
const TOTAL_KEY_FIELDS_COUNT = KEY_IDEA_FIELDS.length + 1; // +1 for (selectedStandardFeatures OR customFeatures)

export const IdeaFormStep: React.FC<IdeaFormStepProps> = ({ initialData, onSubmit, onBack, apiKey }) => {
  const [formData, setFormData] = useState<IdeaData>({
    ...initialData, 
    useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false, 
    projectImage: initialData.projectImage || null,
    promptTone: initialData.promptTone || undefined,
    promptStyle: initialData.promptStyle || undefined,
  });
  const [keywordsInput, setKeywordsInput] = useState<string>('');
  const [relatednessValue, setRelatednessValue] = useState<number>(0.5);
  const [isFetchingRelatedKeywords, setIsFetchingRelatedKeywords] = useState<boolean>(false);
  const [isFetchingRandomKeywords, setIsFetchingRandomKeywords] = useState<boolean>(false);
  const [isProcessingViaKeywords, setIsProcessingViaKeywords] = useState<boolean>(false);
  const [isProcessingViaName, setIsProcessingViaName] = useState<boolean>(false);
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isCritiquingIdea, setIsCritiquingIdea] = useState<boolean>(false);
  const [critiqueResult, setCritiqueResult] = useState<string | null>(null);
  const [showCritiqueModal, setShowCritiqueModal] = useState<boolean>(false);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);


  useEffect(() => {
    setFormData({
        ...initialData, 
        useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false, 
        projectImage: initialData.projectImage || null,
        promptTone: initialData.promptTone || undefined,
        promptStyle: initialData.promptStyle || undefined,
    });
    setRationales({}); 
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value || undefined })); 
    }
  };

  const handleTechStackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        [name]: value as Language | Framework | Platform || undefined, 
      },
    }));
  };

  const handleCheckboxGroupChange = (field: keyof Pick<IdeaData, 'selectedStandardFeatures'>) => (selectedItems: string[]) => {
    setFormData(prev => ({ ...prev, [field]: selectedItems as StandardFeatureKey[] }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("이미지 파일 크기는 5MB를 초과할 수 없습니다.");
        if(imageInputRef.current) imageInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          projectImage: {
            name: file.name,
            type: file.type,
            base64Data: reader.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, projectImage: null }));
    if (imageInputRef.current) {
      imageInputRef.current.value = ""; 
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName?.trim() || !formData.category?.trim() || !formData.summary?.trim()) {
        alert("프로젝트 이름, 카테고리, 프로젝트 요약은 필수 입력 항목입니다.");
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

  const getGeminiTextResponse = async (prompt: string): Promise<string> => {
    if (!apiKey) {
      console.error("API key is not available for Gemini text call.");
      throw new Error("API 키가 설정되지 않았습니다. 상단 배너에서 API 키를 먼저 설정해주세요.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text.trim();
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
    setCritiqueError(null);
    try {
      const projectTypeIds = getEnumValues(ProjectType) as ProjectType[];
      const appCategoryIds = APP_CATEGORIES_OPTIONS.map(c => c.id);
      const gameCategoryIds = GAME_CATEGORIES_OPTIONS.map(g => g.id);
      const standardFeatureIds = STANDARD_FEATURES.map(f => f.id);
      const languageIds = LANGUAGES_OPTIONS.map(l => l.id);
      const frameworkIds = FRAMEWORKS_OPTIONS.map(f => f.id);
      const platformIds = PLATFORMS_OPTIONS.map(p => p.id);
      const promptToneIds = PROMPT_TONE_OPTIONS.map(t => t.id);
      const promptStyleIds = PROMPT_STYLE_OPTIONS.map(s => s.id);

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
          "promptTone": "${formData.promptTone || PromptTone.Formal}",
          "promptStyle": "${formData.promptStyle || PromptStyle.Detailed}",
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
            "useGoogleSearchGrounding": "최신 정보 반영(Google Search) 옵션 선택/해제 이유",
            "promptTone": "프롬프트 어조 선택 이유",
            "promptStyle": "프롬프트 스타일 선택 이유"
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
        - "promptTone": [${promptToneIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.promptTone": 어조 선택 이유.
        - "promptStyle": [${promptStyleIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.promptStyle": 스타일 선택 이유.
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
    setCritiqueError(null);
    try {
        const promptToneIds = PROMPT_TONE_OPTIONS.map(t => t.id);
        const promptStyleIds = PROMPT_STYLE_OPTIONS.map(s => s.id);
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
          "promptTone": "${formData.promptTone || PromptTone.Formal}",
          "promptStyle": "${formData.promptStyle || PromptStyle.Detailed}",
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
            "useGoogleSearchGrounding": "최신 정보 반영(Google Search) 옵션 선택/해제 이유",
            "promptTone": "프롬프트 어조 선택 이유",
            "promptStyle": "프롬프트 스타일 선택 이유"
          }
        }
        
        지침:
        - "projectType": 현재 값(${formData.projectType || '미설정'}) 유지 또는 이름에 더 적합하면 변경. "rationales.projectType": 선택/유지 근거.
        - "useGoogleSearchGrounding": true 또는 false. "rationales.useGoogleSearchGrounding": 해당 값 제안 이유.
        - "promptTone": [${promptToneIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.promptTone": 어조 선택 이유.
        - "promptStyle": [${promptStyleIds.map(id => `"${id}"`).join(', ')}, null] 중 선택. "rationales.promptStyle": 스타일 선택 이유.
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

  const handleCritiqueMyIdea = async () => {
    if (!apiKey) {
      alert("API 키가 없어 아이디어 비평 기능을 사용할 수 없습니다. 상단 배너에서 API 키를 설정해주세요.");
      return;
    }
    if (!formData.summary?.trim() && !formData.projectName?.trim()) {
      alert("아이디어 비평을 받으려면 프로젝트 이름 또는 요약을 입력해주세요.");
      return;
    }
    setIsCritiquingIdea(true);
    setCritiqueResult(null);
    setCritiqueError(null);
    setShowCritiqueModal(false);

    try {
      const critiquePrompt = `
        당신은 경험 많은 스타트업 멘토이자 뛰어난 프로덕트 매니저입니다. 
        다음 프로젝트 아이디어에 대해 한국어로 건설적이고 상세한 비평을 제공해주세요.

        [프로젝트 아이디어 정보]
        - 프로젝트 이름: ${formData.projectName || "제공되지 않음"}
        - 프로젝트 유형: ${PROJECT_TYPES_OPTIONS.find(opt => opt.id === formData.projectType)?.label || "제공되지 않음"}
        - 카테고리: ${(formData.projectType === ProjectType.App ? APP_CATEGORIES_OPTIONS : GAME_CATEGORIES_OPTIONS).find(opt => opt.id === formData.category)?.label || "제공되지 않음"}
        - 프로젝트 요약: ${formData.summary || "제공되지 않음"}
        - 핵심/특화 기능: ${formData.customFeatures || "제공되지 않음"}
        - 주요 타겟 사용자: ${formData.targetAudience || "제공되지 않음"}
        - 기술 스택 고려사항: 
            ${formData.techStack.language ? `언어: ${LANGUAGES_OPTIONS.find(o => o.id === formData.techStack.language)?.label}, ` : ''}
            ${formData.techStack.framework ? `프레임워크: ${FRAMEWORKS_OPTIONS.find(o => o.id === formData.techStack.framework)?.label}, ` : ''}
            ${formData.techStack.platform ? `플랫폼: ${PLATFORMS_OPTIONS.find(o => o.id === formData.techStack.platform)?.label}` : ''}
            ${!formData.techStack.language && !formData.techStack.framework && !formData.techStack.platform ? "특별히 명시된 기술 스택 없음" : ""}

        [비평 요청 사항]
        아이디어의 다음 측면들을 포함하여 종합적으로 분석하고, 각 항목에 대해 구체적인 의견을 제시해주세요:
        1.  **강점 (Strengths):** 이 아이디어가 가진 잠재적인 강점이나 매력적인 요소는 무엇인가?
        2.  **약점 (Weaknesses):** 이 아이디어가 가진 명백한 약점이나 개선이 필요한 부분은 무엇인가?
        3.  **시장 경쟁력 및 차별화 (Market Competitiveness & Differentiation):** 유사한 서비스나 경쟁 상황을 고려했을 때, 이 아이디어가 시장에서 어떤 위치를 차지할 수 있을까? 어떻게 차별화될 수 있을까?
        4.  **잠재적 위험 및 도전 과제 (Potential Risks & Challenges):** 아이디어를 실현하는 과정에서 예상되는 주요 위험 요소나 기술적, 사업적 도전 과제는 무엇인가?
        5.  **개선 제안 (Suggestions for Improvement):** 아이디어를 더 발전시키기 위한 구체적인 제안이나 고려해야 할 추가 사항이 있다면 알려달라.
        6.  **종합 의견 (Overall Opinion):** 이 아이디어에 대한 전반적인 당신의 생각이나 조언.

        결과는 명확하고 구조화된 텍스트 형태로, 가능한 경우 마크다운(#, ##, *, - 등)을 사용하여 가독성을 높여주세요. 친절하지만 통찰력 있는 분석을 기대합니다.
        `;
        
      const critiqueText = await getGeminiTextResponse(critiquePrompt);
      setCritiqueResult(critiqueText);
      setShowCritiqueModal(true);
    } catch (error: any) {
      console.error("Error critiquing idea:", error);
      setCritiqueError(error.message || "아이디어 비평 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      alert(error.message || "아이디어 비평 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsCritiquingIdea(false);
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
    setCritiqueError(null);
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
    setCritiqueError(null);
    let promptForRandomKeywords = "";

    if (formData.projectType === ProjectType.Game) {
      promptForRandomKeywords = `
        게임 개발 아이디어 구상에 도움이 될 만한, 게임과 관련된 흥미롭거나 독특한 랜덤 키워드 5개를 쉼표로 구분하여 한국어로 알려줘.
        다양한 게임 장르(예: 판타지 RPG, SF 전략, 퍼즐 어드벤처, 스포츠 시뮬레이션 등)나 컨셉(예: 마법 학교, 사이버펑크 도시, 고대 유적 탐험, 우주 전쟁, 요리 대결 등)과 관련된 키워드를 포함해줘.
        상상력을 자극할 수 있는 단어들로 구성하고, 다른 설명 없이 키워드 목록만 제공해야 해. 오직 쉼표로 구분된 키워드 목록만 응답해줘.
        예시: 드래곤 라이더, 시간 왜곡, 고대 마법서, AI 반란, 비밀 요원 고양이
      `;
    } else { 
      promptForRandomKeywords = `
        애플리케이션 아이디어 구상에 도움이 될 만한 랜덤 키워드 5개를 쉼표로 구분하여 한국어로 알려줘.
        키워드는 '생산성', '유틸리티', 또는 '라이프스타일' 카테고리와 관련된 내용이면 좋겠어.
        예시: 스마트 일정 관리, AI 학습 도우미, 미니멀 습관 추적, 개인 맞춤형 레시피, 로컬 커뮤니티 연결
        다른 설명 없이 키워드 목록만 제공해야 해. 오직 쉼표로 구분된 키워드 목록만 응답해줘.
      `;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey }); 
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

  const completenessScore = useMemo(() => {
    let score = 0;
    if (formData.projectName?.trim()) score++;
    if (formData.category) score++;
    if (formData.summary?.trim()) score++;
    if (formData.targetAudience?.trim()) score++;
    if (formData.selectedStandardFeatures.length > 0 || formData.customFeatures?.trim()) score++;
    return score;
  }, [formData]);

  const completenessPercentage = Math.round((completenessScore / TOTAL_KEY_FIELDS_COUNT) * 100);

  const getCompletenessFeedback = () => {
    if (completenessPercentage === 100) return { text: "훌륭해요! 모든 주요 정보가 입력되었습니다.", color: "text-green-500 dark:text-green-400", bgColor: "bg-green-500 dark:bg-green-500" };
    if (completenessPercentage >= 75) return { text: "거의 다 왔어요! 몇 가지만 더 채우면 완벽해요.", color: "text-sky-500 dark:text-sky-400", bgColor: "bg-sky-500 dark:bg-sky-500" };
    if (completenessPercentage >= 40) return { text: "좋아요! 더 많은 정보를 입력할수록 프롬프트가 정교해집니다.", color: "text-yellow-500 dark:text-yellow-400", bgColor: "bg-yellow-500 dark:bg-yellow-500" };
    return { text: "시작이 반! 아이디어를 더 자세히 설명해주세요.", color: "text-purple-500 dark:text-purple-400", bgColor: "bg-purple-500 dark:bg-purple-500" };
  };
  const feedback = getCompletenessFeedback();


  const categoryOptions = formData.projectType === ProjectType.App ? APP_CATEGORIES_OPTIONS : GAME_CATEGORIES_OPTIONS;
  const projectTypeLabel = PROJECT_TYPES_OPTIONS.find(opt => opt.id === formData.projectType)?.label || '프로젝트';
  const anyProcessing = isProcessingViaKeywords || isProcessingViaName || isFetchingRandomKeywords || isFetchingRelatedKeywords || isCritiquingIdea;

  return (
    <>
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl space-y-8">
      <div>
        <Button onClick={onBack} variant="ghost" size="sm" className="mb-6" leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>
          프로젝트 유형으로 돌아가기
        </Button>
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">당신의 {projectTypeLabel} 아이디어를 설명해주세요</h2>
        <p className="text-slate-600 dark:text-slate-400">당신의 비전을 구체화해봅시다. 자세할수록 더 좋은 프롬프트가 만들어집니다!</p>
      </div>

       <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" />
            아이디어 구체화 수준
          </h3>
          <span className={`text-sm font-semibold ${feedback.color}`}>{completenessScore} / {TOTAL_KEY_FIELDS_COUNT}</span>
        </div>
        <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2.5">
          <div 
            className={`${feedback.bgColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${completenessPercentage}%` }}
            role="progressbar"
            aria-valuenow={completenessPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="아이디어 구체화 진행률"
          ></div>
        </div>
        <p className={`text-xs mt-1.5 ${feedback.color}`}>{feedback.text}</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
          주요 항목: 프로젝트명, 카테고리, 요약, 기능(표준 또는 사용자정의), 타겟 사용자.
        </p>
      </div>


      <div className="space-y-3">
        <Input
          label="핵심 키워드 (쉼표로 구분하여 여러 개 입력 가능)"
          name="keywords"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="예: AI, 여행, 사진 공유, 실시간 건강 관리"
          className="flex-grow"
          helpText={HELP_TEXTS.keywords}
        />
        <div className="flex flex-wrap gap-2">
            <Button
                type="button"
                onClick={handleAutoFillFromKeywords}
                disabled={anyProcessing || !keywordsInput.trim() || !apiKey}
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
                disabled={anyProcessing || !apiKey} 
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
      
      <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg space-y-3 bg-slate-50 dark:bg-transparent">
        <h3 className="text-md font-medium text-slate-700 dark:text-slate-200">연관 키워드 확장 도우미</h3>
        <div>
          <label htmlFor="relatednessSlider" className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            연관도: <span className="font-bold text-purple-600 dark:text-purple-400 ml-1 mr-1">{relatednessValue.toFixed(2)}</span> (0: 창의적 확장 ~ 1: 밀접한 관련)
            <div className="relative group ml-1.5">
              <InformationCircleIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 sm:w-72 p-2.5 text-xs text-white dark:text-slate-100 bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 border border-slate-600 dark:border-slate-500">
                {HELP_TEXTS.relatedness}
              </div>
            </div>
          </label>
          <input
            type="range"
            id="relatednessSlider"
            min="0"
            max="1"
            step="0.01"
            value={relatednessValue}
            onChange={handleRelatednessChange}
            className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            aria-label="연관도 슬라이더"
          />
        </div>
        <Button
            type="button"
            onClick={handleFetchRelatedKeywords}
            disabled={!keywordsInput.trim() || anyProcessing || !apiKey} 
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
          isRequired 
          rationale={rationales.projectName}
          helpText={HELP_TEXTS.projectName}
        />
        <div className="md:col-span-1 flex flex-col md:flex-row items-stretch gap-2 md:items-end">
            <Button 
                type="button" 
                onClick={handleAutoFillFromProjectName} 
                disabled={anyProcessing || !formData.projectName.trim() || !apiKey}
                variant="secondary"
                size="sm"
                className="w-full md:w-auto"
                leftIcon={<SparklesIcon className="h-4 w-4" />}
            >
                {isProcessingViaName ? '생성중...' : '이름으로 자동 제안'} 
            </Button>
            <Button
                type="button"
                onClick={handleCritiqueMyIdea}
                disabled={anyProcessing || (!formData.summary?.trim() && !formData.projectName?.trim()) || !apiKey}
                variant="secondary"
                size="sm"
                className="w-full md:w-auto"
                leftIcon={<ChatBubbleBottomCenterTextIcon className="h-4 w-4" />}
            >
                {isCritiquingIdea ? '비평 생성중...' : '내 아이디어 비평받기'}
            </Button>
        </div>
        
        <Select
          label={`${projectTypeLabel} 카테고리`}
          name="category"
          value={formData.category || ''}
          onChange={handleChange}
          options={categoryOptions.map(opt => ({ value: opt.id, label: opt.label }))}
          required
          isRequired 
          rationale={rationales.category || rationales.projectType}
          helpText={HELP_TEXTS.category}
        />

        <div className="md:col-span-2">
          <Textarea
            label="프로젝트 요약"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="이 프로젝트가 무엇이고 어떤 문제를 해결하는지 간략하게 설명해주세요. (1-2 문장)"
            required
            isRequired 
            rationale={rationales.summary}
            helpText={HELP_TEXTS.summary}
          />
        </div>

        <div className="md:col-span-2">
          <CheckboxGroup
            label="표준 기능 (선택 사항)"
            name="selectedStandardFeatures"
            options={STANDARD_FEATURES.map(f => ({ id: f.id, label: f.label}))}
            selectedOptions={formData.selectedStandardFeatures}
            onChange={handleCheckboxGroupChange('selectedStandardFeatures')}
            rationale={rationales.selectedStandardFeatures || "프로젝트에 필요한 일반적인 기능을 선택하세요. (예: 로그인, 데이터베이스)"}
            helpText={HELP_TEXTS.selectedStandardFeatures}
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
            rationale={rationales.customFeatures || "프로젝트를 특별하게 만드는 핵심 기능을 설명해주세요."}
            helpText={HELP_TEXTS.customFeatures}
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
            helpText={HELP_TEXTS.targetAudience}
          />
        </div>
      </div>
      
      <fieldset className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-transparent">
        <legend className="text-lg font-medium text-slate-700 dark:text-slate-200 px-2 flex items-center">
            영감 이미지 (선택 사항)
            <div className="relative group ml-1.5">
              <InformationCircleIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 sm:w-72 p-2.5 text-xs text-white dark:text-slate-100 bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 border border-slate-600 dark:border-slate-500">
                {HELP_TEXTS.projectImage}
              </div>
            </div>
        </legend>
        <div className="mt-2">
            {!formData.projectImage ? (
                <label
                    htmlFor="projectImageUpload"
                    className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none"
                >
                    <PhotoIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                    <span className="flex items-center mt-2 space-x-2">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            이미지 파일 드롭 또는 <span className="text-purple-600 dark:text-purple-400">여기서 찾아보기</span>
                        </span>
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">PNG, JPG, GIF 최대 5MB</p>
                    <input
                        id="projectImageUpload"
                        ref={imageInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageChange}
                        className="sr-only"
                    />
                </label>
            ) : (
                <div className="relative group">
                    <img
                        src={formData.projectImage.base64Data}
                        alt={formData.projectImage.name || "Uploaded image preview"}
                        className="max-h-48 rounded-md border border-slate-300 dark:border-slate-600 object-contain"
                    />
                    <Button
                        type="button"
                        onClick={handleRemoveImage}
                        variant="danger"
                        size="sm"
                        className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 !p-1.5"
                        aria-label="이미지 제거"
                        title="이미지 제거"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </Button>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate" title={formData.projectImage.name}>
                        {formData.projectImage.name} ({(formData.projectImage.base64Data.length * 0.75 / 1024).toFixed(1)} KB)
                    </p>
                </div>
            )}
        </div>
      </fieldset>


      <fieldset className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-transparent">
        <legend className="text-lg font-medium text-slate-700 dark:text-slate-200 px-2">기술 스택 (선택 사항)</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mt-4">
          <Select
            label="주요 프로그래밍 언어"
            name="language" 
            value={formData.techStack.language || ''}
            onChange={handleTechStackChange}
            options={LANGUAGES_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_language}
            helpText={HELP_TEXTS.techStack_language}
          />
          <Select
            label="프레임워크/라이브러리"
            name="framework" 
            value={formData.techStack.framework || ''}
            onChange={handleTechStackChange}
            options={FRAMEWORKS_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_framework}
            helpText={HELP_TEXTS.techStack_framework}
          />
          <Select
            label="타겟 플랫폼"
            name="platform" 
            value={formData.techStack.platform || ''}
            onChange={handleTechStackChange}
            options={PLATFORMS_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
            rationale={rationales.techStack_platform}
            helpText={HELP_TEXTS.techStack_platform}
          />
        </div>
      </fieldset>

      <fieldset className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-transparent">
        <legend className="text-lg font-medium text-slate-700 dark:text-slate-200 px-2">프롬프트 생성 설정</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-4">
            <Select
                label="프롬프트 어조 (Tone)"
                name="promptTone"
                value={formData.promptTone || ''}
                onChange={handleChange}
                options={PROMPT_TONE_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
                rationale={rationales.promptTone}
                helpText={HELP_TEXTS.promptTone}
            />
            <Select
                label="프롬프트 스타일 (Style)"
                name="promptStyle"
                value={formData.promptStyle || ''}
                onChange={handleChange}
                options={PROMPT_STYLE_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
                rationale={rationales.promptStyle}
                helpText={HELP_TEXTS.promptStyle}
            />
        </div>
      </fieldset>

      <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-transparent">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="useGoogleSearchGrounding"
            checked={!!formData.useGoogleSearchGrounding}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-purple-600 bg-slate-100 dark:bg-slate-600 border-slate-400 dark:border-slate-500 rounded focus:ring-purple-500 dark:focus:ring-purple-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800"
          />
          <span className="text-slate-700 dark:text-slate-200 font-medium">최신 정보 반영 및 실시간 검색 활용 (Google Search)</span>
          <div className="relative group">
            <InformationCircleIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white dark:text-slate-100 bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 border border-slate-600 dark:border-slate-500">
              {HELP_TEXTS.useGoogleSearchGrounding}
            </div>
          </div>
        </label>
        {rationales.useGoogleSearchGrounding && (
          <p className="ml-8 mt-1 text-xs text-sky-600 dark:text-sky-400 italic">{rationales.useGoogleSearchGrounding}</p>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-slate-300 dark:border-slate-700">
         <Button 
          type="button" 
          onClick={() => {
            setFormData({
                ...initialData, 
                projectType: formData.projectType, 
                projectName: '', 
                category: undefined,
                summary: '',
                selectedStandardFeatures: [],
                customFeatures: '',
                targetAudience: '',
                techStack: {},
                useGoogleSearchGrounding: initialData.useGoogleSearchGrounding || false, 
                projectImage: null,
                promptTone: undefined, 
                promptStyle: undefined,
            }); 
            setKeywordsInput('');
            setRationales({});
            if(imageInputRef.current) imageInputRef.current.value = "";
          }} 
          variant="ghost"
          size="md"
        >
          양식 초기화 (유형 유지)
        </Button>
        <Button type="submit" variant="primary" size="lg" disabled={anyProcessing} leftIcon={<CheckCircleIcon className="h-5 w-5"/>}>
          프롬프트 생성하기
        </Button>
      </div>
      {critiqueError && (
        <p className="text-center text-red-500 dark:text-red-400 text-sm mt-4" role="alert">
          {critiqueError}
        </p>
      )}
      {!apiKey && (
        <p className="text-center text-red-500 dark:text-red-400 text-sm mt-4" role="alert">
            API 키가 설정되지 않아 Gemini 기반 자동 완성 기능 및 프롬프트 생성이 비활성화되었습니다. <br/> 
            환경 변수(<code>process.env.API_KEY</code>)를 설정하거나, 앱 상단의 관리 섹션에서 로컬 API 키를 입력하고 저장해주세요.
        </p>
      )}
    </form>

    {showCritiqueModal && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="critique-modal-title"
        >
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 id="critique-modal-title" className="text-2xl font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="h-7 w-7 mr-2" />
                Gemini의 아이디어 비평
              </h3>
              <Button onClick={() => setShowCritiqueModal(false)} variant="ghost" size="sm" className="!p-1.5" aria-label="비평 팝업 닫기">
                <XMarkIcon className="h-6 w-6" />
              </Button>
            </div>
            <div className="overflow-y-auto pr-2 text-sm text-slate-700 dark:text-slate-200" style={{ whiteSpace: 'pre-wrap' }}>
              {critiqueResult ? critiqueResult : "비평 내용을 불러오는 중입니다..."}
            </div>
            <div className="mt-6 text-right">
              <Button onClick={() => setShowCritiqueModal(false)} variant="secondary">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
