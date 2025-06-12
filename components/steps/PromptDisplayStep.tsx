
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { ClipboardDocumentIcon, PencilSquareIcon, ArrowPathIcon, BookmarkIcon, CheckIcon, SparklesIcon, InformationCircleIcon, TagIcon } from '@heroicons/react/24/outline';

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
}

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
  apiKey
}) => {
  const [copied, setCopied] = useState(false);
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    setTagsInput(tags.join(', '));
  }, [tags]);

  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTagsInput = e.target.value;
    setTagsInput(newTagsInput);
    const parsedTags = newTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setTags(parsedTags);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefinePrompt = async () => {
    if (!apiKey) {
      setRefinementError("API 키가 설정되지 않아 프롬프트를 개선할 수 없습니다. API 키를 먼저 설정해주세요.");
      return;
    }
    if (!refinementInstruction.trim()) {
      setRefinementError("개선 지침을 입력해주세요.");
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
      setRefinementInstruction(''); 

    } catch (error) {
      console.error("Error refining prompt:", error);
      setRefinementError("프롬프트 개선 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsRefining(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-slate-800 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-semibold text-slate-100 mb-6">생성된 Gemini 프롬프트</h2>
      
      <div className="mb-4">
        <Input 
          label="프롬프트 이름 (라이브러리 저장용)"
          value={promptName}
          onChange={(e) => setPromptName(e.target.value)}
          placeholder="이 프롬프트의 이름을 입력하세요"
        />
      </div>

      <div className="mb-6">
        <Input
          label="태그 (쉼표로 구분하여 여러 개 입력)"
          value={tagsInput}
          onChange={handleTagsInputChange}
          placeholder="예: AI, 코드생성, 게임기획"
          leftIcon={<TagIcon className="h-5 w-5 text-slate-400" />}
        />
      </div>

      <Textarea
        label="생성된 프롬프트"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={15}
        className="text-sm leading-relaxed font-mono"
        aria-label="생성된 프롬프트 텍스트"
      />
      
      <div className="mt-6 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
        <h3 className="text-lg font-medium text-slate-200 mb-3">프롬프트 반복 개선</h3>
        <Input
          label="개선 지침"
          value={refinementInstruction}
          onChange={(e) => { setRefinementInstruction(e.target.value); setRefinementError(null); }}
          placeholder="예: 더 간결하게, 전문적인 톤으로, 유머 추가, 특정 기술 스택 명시 등"
          className="mb-3"
          disabled={isRefining}
        />
        <Button 
          onClick={handleRefinePrompt} 
          disabled={isRefining || !apiKey || !refinementInstruction.trim()}
          leftIcon={isRefining ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : <SparklesIcon className="h-5 w-5"/>}
        >
          {isRefining ? '개선 중...' : '프롬프트 개선'}
        </Button>
        {!apiKey && (
          <p className="text-xs text-yellow-400 mt-2 flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> API 키가 없어 프롬프트 개선 기능을 사용할 수 없습니다.
          </p>
        )}
        {refinementError && (
          <p className="text-xs text-red-400 mt-2" role="alert">{refinementError}</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:flex md:flex-wrap gap-4 justify-center">
        <Button onClick={handleCopyToClipboard} variant="secondary" leftIcon={copied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <ClipboardDocumentIcon className="h-5 w-5"/>}>
          {copied ? '복사됨!' : '프롬프트 복사'}
        </Button>
        <Button onClick={onSave} leftIcon={<BookmarkIcon className="h-5 w-5"/>}>
          {isEditing ? '라이브러리에 업데이트' : '라이브러리에 저장'}
        </Button>
        <Button onClick={onEditIdea} variant="ghost" leftIcon={<PencilSquareIcon className="h-5 w-5"/>}>
          아이디어 수정
        </Button>
        <Button onClick={onStartNew} variant="ghost" leftIcon={<ArrowPathIcon className="h-5 w-5"/>}>
          새로 시작
        </Button>
      </div>
       <p className="text-xs text-slate-500 mt-6 text-center">이제 이 프롬프트를 복사하여 Google AI Studio에 붙여넣거나 Gemini API와 함께 사용할 수 있습니다.</p>
    </div>
  );
};