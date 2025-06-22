
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { 
  ClipboardDocumentIcon, PencilSquareIcon, ArrowPathIcon, BookmarkIcon, CheckIcon, SparklesIcon, InformationCircleIcon, TagIcon, StarIcon as StarSolidIcon, CodeBracketSquareIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { IdeaData } from '../../types';
import { PROMPT_REFINEMENT_OPTIONS, RefinementOption } from '../../constants'; 

interface PromptDisplayStepProps {
  promptText: string;
  setPromptText: (text: string) => void;
  promptName: string;
  setPromptName: (name: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  onSave: () => void;
  onEditIdea: () => void;
  onStartNew: () => void;
  isEditing: boolean;
  apiKey: string | null;
  currentIdeaData: IdeaData; 
  isFavorite: boolean;
  onToggleFavorite: () => void;
  templateVariableValues: Record<string, string>;
  setTemplateVariableValues: (values: Record<string, string>) => void;
}

const PLACEHOLDER_REGEX = /\[([A-Z0-9_]+)\]/g;

export const PromptDisplayStep: React.FC<PromptDisplayStepProps> = ({
  promptText,
  setPromptText,
  promptName,
  setPromptName,
  tags,
  setTags,
  onSave,
  onEditIdea,
  onStartNew,
  isEditing,
  apiKey,
  currentIdeaData,
  isFavorite,
  onToggleFavorite,
  templateVariableValues,
  setTemplateVariableValues,
}) => {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [selectedRefinementOption, setSelectedRefinementOption] = useState<string>('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [tagSuggestionError, setTagSuggestionError] = useState<string | null>(null);

  const detectedPlaceholders = useMemo(() => {
    const matches = [...promptText.matchAll(PLACEHOLDER_REGEX)];
    return Array.from(new Set(matches.map(match => match[1])));
  }, [promptText]);

  // Initialize local variable values from props or set defaults for new placeholders
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    detectedPlaceholders.forEach(ph => {
      initialValues[ph] = templateVariableValues[ph] || '';
    });
    // Only update if there's a structural change or new placeholders detected
    // This prevents overwriting user input if templateVariableValues from App.tsx hasn't changed
    if (JSON.stringify(initialValues) !== JSON.stringify(templateVariableValues)) {
        // If editing an existing prompt, templateVariableValues would be pre-filled
        // If it's a new prompt, it would be empty.
        // This ensures that when loading a prompt, its saved values are used.
        // When generating a new prompt, it initializes to empty strings for detected placeholders.
        if (Object.keys(templateVariableValues).length > 0 && isEditing) {
             const loadedValues = { ...templateVariableValues };
             detectedPlaceholders.forEach(ph => { // Ensure all current placeholders have an entry
                if (!(ph in loadedValues)) {
                    loadedValues[ph] = '';
                }
             });
             setTemplateVariableValues(loadedValues);
        } else {
            setTemplateVariableValues(initialValues);
        }
    }
  }, [detectedPlaceholders, isEditing]); // Removed templateVariableValues from dependency array to avoid loop

  useEffect(() => {
    setTagsInput(tags.join(', '));
  }, [tags]);
  
  const handleTemplateVariableChange = (placeholder: string, value: string) => {
    setTemplateVariableValues({ ...templateVariableValues, [placeholder]: value });
  };

  const previewedPromptText = useMemo(() => {
    let text = promptText;
    detectedPlaceholders.forEach(ph => {
      const regex = new RegExp(`\\[${ph}\\]`, 'g');
      text = text.replace(regex, templateVariableValues[ph] || `[${ph}]`);
    });
    return text;
  }, [promptText, detectedPlaceholders, templateVariableValues]);


  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTagsInput = e.target.value;
    setTagsInput(newTagsInput);
    const parsedTags = newTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setTags(parsedTags);
  };

  const handleCopyToClipboard = (textToCopy: string, type: 'original' | 'preview') => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedPreview(true);
        setTimeout(() => setCopiedPreview(false), 2000);
      }
    });
  };

  const handleSelectRefinementOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optionId = e.target.value;
    setSelectedRefinementOption(optionId);
    const selectedOption = PROMPT_REFINEMENT_OPTIONS.find(opt => opt.id === optionId);
    if (selectedOption) {
      if (selectedOption.id === 'target_specific_audience') {
        const currentAudience = currentIdeaData.targetAudience || "일반 사용자";
        setRefinementInstruction(selectedOption.instruction.replace('[여기에 구체적인 타겟 사용자 명시]', currentAudience));
      } else {
        setRefinementInstruction(selectedOption.instruction);
      }
    } else {
      setRefinementInstruction(''); 
    }
    setRefinementError(null);
  };

  const handleRefinePrompt = async () => {
    if (!apiKey) {
      setRefinementError("API 키가 설정되지 않아 프롬프트를 개선할 수 없습니다. API 키를 먼저 설정해주세요.");
      return;
    }
    if (!refinementInstruction.trim()) {
      setRefinementError("개선 지침을 입력하거나 사전 정의된 옵션을 선택해주세요.");
      return;
    }

    setIsRefining(true);
    setRefinementError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const metaPrompt = `You are a helpful AI assistant. The user provides an 'Original Prompt' and an 'Instruction' to refine it. Your task is to apply the instruction to the original prompt and output *only* the new, refined prompt text. Do not include any conversational phrases, introductions, or markdown formatting like \`\`\` or \`\`\`text around the prompt.

Original Prompt:
\`\`\`
${promptText}
\`\`\`

Instruction:
\`\`\`
${refinementInstruction}
\`\`\`

Refined Prompt:`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: metaPrompt,
      });
      
      setPromptText(response.text.trim());
    } catch (error) {
      console.error("Error refining prompt:", error);
      setRefinementError("프롬프트 개선 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!apiKey) {
      setTagSuggestionError("API 키가 없어 태그를 제안할 수 없습니다. API 키를 먼저 설정해주세요.");
      return;
    }
    if (!promptName.trim() && !promptText.trim()) {
      setTagSuggestionError("태그를 제안하려면 프롬프트 이름 또는 내용이 필요합니다.");
      return;
    }

    setIsSuggestingTags(true);
    setTagSuggestionError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const tagSuggestionPrompt = `
        다음은 프롬프트의 이름과 내용입니다. 이 프롬프트에 가장 적합한 5-7개의 관련성 높고 간결한 태그를 한국어로, 쉼표로 구분하여 제안해주세요. 
        태그 제안 외 다른 설명이나 앞뒤 텍스트는 포함하지 마세요. 오직 쉼표로 구분된 키워드 목록만 응답해야 합니다.
        예시: AI, 코드생성, 게임기획, UI 디자인, 사용자 경험

        프롬프트 이름: ${promptName || "제목 없음"}
        프롬프트 내용:
        ---
        ${promptText.substring(0, 1000)} ${promptText.length > 1000 ? "..." : ""}
        ---

        태그 제안:`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: tagSuggestionPrompt,
      });

      const suggestedTagsString = response.text.trim();
      if (suggestedTagsString) {
        setTagsInput(suggestedTagsString); 
        const parsedTags = suggestedTagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        setTags(parsedTags); 
      } else {
        setTagSuggestionError("Gemini로부터 태그 제안을 받지 못했습니다.");
      }

    } catch (error) {
      console.error("Error suggesting tags:", error);
      setTagSuggestionError("태그 제안 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSuggestingTags(false);
    }
  };


  const refinementOptionsForSelect = PROMPT_REFINEMENT_OPTIONS.map(opt => ({
    value: opt.id,
    label: opt.label,
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">생성된 Gemini 프롬프트</h2>
        {isEditing && (
            <Button 
                onClick={onToggleFavorite} 
                variant="ghost" 
                size="sm" 
                className="!p-2 text-slate-500 hover:text-yellow-500 dark:text-slate-400 dark:hover:text-yellow-400" 
                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
            >
                {isFavorite ? <StarSolidIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" /> : <StarOutlineIcon className="h-6 w-6" />}
            </Button>
        )}
      </div>
      
      <div className="mb-4">
        <Input 
          label="프롬프트 이름 (라이브러리 저장용)"
          value={promptName}
          onChange={(e) => setPromptName(e.target.value)}
          placeholder="이 프롬프트의 이름을 입력하세요"
          isRequired
        />
      </div>

      <div className="mb-1">
        <Input
          label="태그 (쉼표로 구분하여 여러 개 입력)"
          value={tagsInput}
          onChange={handleTagsInputChange}
          placeholder="예: AI, 코드생성, 게임기획"
          leftIcon={<TagIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
        />
      </div>
      <div className="mb-6 text-right">
        <Button 
          type="button"
          onClick={handleSuggestTags}
          disabled={isSuggestingTags || !apiKey}
          variant="ghost"
          size="sm"
          leftIcon={isSuggestingTags ? <ArrowPathIcon className="h-4 w-4 animate-spin"/> : <SparklesIcon className="h-4 w-4"/>}
          className="mt-1"
        >
          {isSuggestingTags ? '제안 중...' : 'AI 태그 제안'}
        </Button>
        {!apiKey && !isSuggestingTags && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center justify-end">
             <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> API 키가 없어 AI 태그 제안을 사용할 수 없습니다.
          </p>
        )}
        {tagSuggestionError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 text-right" role="alert">{tagSuggestionError}</p>
        )}
      </div>


      <Textarea
        label="생성된 프롬프트 (템플릿)"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={10} 
        className="text-sm leading-relaxed font-mono bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
        aria-label="생성된 프롬프트 템플릿 텍스트"
      />
      <div className="mt-2 text-right">
        <Button onClick={() => handleCopyToClipboard(promptText, 'original')} variant="ghost" size="sm" leftIcon={copiedOriginal ? <CheckIcon className="h-4 w-4 text-green-500"/> : <ClipboardDocumentIcon className="h-4 w-4"/>}>
          {copiedOriginal ? '템플릿 복사됨!' : '템플릿 복사'}
        </Button>
      </div>

      {detectedPlaceholders.length > 0 && (
        <div className="mt-6 p-4 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-slate-800/60">
          <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-3 flex items-center">
            <CodeBracketSquareIcon className="h-6 w-6 mr-2"/>
            템플릿 변수 채우기
          </h3>
          <div className="space-y-3 mb-4">
            {detectedPlaceholders.map(placeholder => (
              <Input
                key={placeholder}
                label={placeholder.replace(/_/g, ' ')}
                value={templateVariableValues[placeholder] || ''}
                onChange={(e) => handleTemplateVariableChange(placeholder, e.target.value)}
                placeholder={`${placeholder}에 해당하는 값을 입력하세요`}
              />
            ))}
          </div>
          <h4 className="text-md font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            실시간 미리보기
          </h4>
          <Textarea
            value={previewedPromptText}
            readOnly
            rows={8}
            className="text-sm leading-relaxed font-mono bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            aria-label="변수가 채워진 프롬프트 미리보기"
          />
           <div className="mt-2 text-right">
            <Button onClick={() => handleCopyToClipboard(previewedPromptText, 'preview')} variant="secondary" size="sm" leftIcon={copiedPreview ? <CheckIcon className="h-4 w-4 text-green-500"/> : <ClipboardDocumentIcon className="h-4 w-4"/>}>
              {copiedPreview ? '미리보기 복사됨!' : '미리보기 복사'}
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">프롬프트 반복 개선 (템플릿 기준)</h3>
        <div className="space-y-3">
          <Select
            label="사전 정의된 개선 옵션"
            options={[{ value: '', label: '개선 옵션 선택...' }, ...refinementOptionsForSelect]}
            value={selectedRefinementOption}
            onChange={handleSelectRefinementOption}
            disabled={isRefining}
          />
          <Input
            label="직접 개선 지침 입력"
            value={refinementInstruction}
            onChange={(e) => { setRefinementInstruction(e.target.value); setSelectedRefinementOption(''); setRefinementError(null); }}
            placeholder="또는 여기에 직접 개선 지침을 입력하세요. 예: 특정 기술 스택(React, Node.js) 사용 명시"
            disabled={isRefining}
          />
        </div>
        <Button 
          onClick={handleRefinePrompt} 
          disabled={isRefining || !apiKey || !refinementInstruction.trim()}
          leftIcon={isRefining ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : <SparklesIcon className="h-5 w-5"/>}
          className="mt-3"
        >
          {isRefining ? '개선 중...' : '프롬프트 개선'}
        </Button>
        {!apiKey && !isRefining && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> API 키가 없어 프롬프트 개선 기능을 사용할 수 없습니다.
          </p>
        )}
        {refinementError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2" role="alert">{refinementError}</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-4 justify-center">
        <Button onClick={onSave} leftIcon={<BookmarkIcon className="h-5 w-5"/>} disabled={!promptName.trim()}>
          {isEditing ? '라이브러리에 업데이트' : '라이브러리에 저장'}
        </Button>
        <Button onClick={onEditIdea} variant="ghost" leftIcon={<PencilSquareIcon className="h-5 w-5"/> }>
          아이디어 수정
        </Button>
        <Button onClick={onStartNew} variant="ghost" leftIcon={<ArrowPathIcon className="h-5 w-5"/>}>
          새로 시작
        </Button>
      </div>
      {!promptName.trim() && (
         <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center" role="alert">프롬프트 이름을 입력해야 라이브러리에 저장할 수 있습니다.</p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center">이제 이 프롬프트(템플릿 또는 미리보기)를 복사하여 Google AI Studio에 붙여넣거나 Gemini API와 함께 사용할 수 있습니다.</p>
    </div>
  );
};