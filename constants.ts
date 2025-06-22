
import { StandardFeatureKey, ProjectType, AppCategory, GameCategory, Language, Framework, Platform, PromptTone, PromptStyle } from './types.ts';

interface StandardFeatureOption {
  id: StandardFeatureKey;
  label: string;
  promptText: string;
}

export const PROJECT_TYPES_OPTIONS: { id: ProjectType; label: string }[] = [
  { id: ProjectType.App, label: '애플리케이션' },
  { id: ProjectType.Game, label: '게임' },
];

export const APP_CATEGORIES_OPTIONS: { id: AppCategory; label: string }[] = [
  { id: AppCategory.Productivity, label: '생산성' },
  { id: AppCategory.Education, label: '교육' },
  { id: AppCategory.Utility, label: '유틸리티' },
  { id: AppCategory.Social, label: '소셜' },
  { id: AppCategory.Lifestyle, label: '라이프스타일' },
  { id: AppCategory.Other, label: '기타' },
];

export const GAME_CATEGORIES_OPTIONS: { id: GameCategory; label: string }[] = [
  { id: GameCategory.Puzzle, label: '퍼즐' },
  { id: GameCategory.RPG, label: 'RPG' },
  { id: GameCategory.Simulation, label: '시뮬레이션' },
  { id: GameCategory.Arcade, label: '아케이드' },
  { id: GameCategory.Strategy, label: '전략' },
  { id: GameCategory.Other, label: '기타' },
];

export const LANGUAGES_OPTIONS: { id: Language; label: string }[] = [
  { id: Language.JavaScript, label: 'JavaScript' },
  { id: Language.Python, label: 'Python' },
  { id: Language.Swift, label: 'Swift' },
  { id: Language.Kotlin, label: 'Kotlin' },
  { id: Language.Java, label: 'Java' },
  { id: Language.CSharp, label: 'C#' },
  { id: Language.Go, label: 'Go' },
  { id: Language.TypeScript, label: 'TypeScript' },
  { id: Language.Other, label: '기타' },
];
export const FRAMEWORKS_OPTIONS: { id: Framework; label: string }[] = [
  { id: Framework.React, label: 'React' },
  { id: Framework.Vue, label: 'Vue' },
  { id: Framework.Angular, label: 'Angular' },
  { id: Framework.Svelte, label: 'Svelte' },
  { id: Framework.NextJS, label: 'Next.js' },
  { id: Framework.ReactNative, label: 'React Native' },
  { id: Framework.Flutter, label: 'Flutter' },
  { id: Framework.Django, label: 'Django' },
  { id: Framework.Flask, label: 'Flask' },
  { id: Framework.Spring, label: 'Spring Boot' },
  { id: Framework.NodeJS, label: 'Node.js/Express' },
  { id: Framework.Other, label: '기타' },
];
export const PLATFORMS_OPTIONS: { id: Platform; label: string }[] = [
  { id: Platform.Web, label: '웹' },
  { id: Platform.iOS, label: 'iOS' },
  { id: Platform.Android, label: 'Android' },
  { id: Platform.Desktop, label: '데스크톱 (Windows, macOS, Linux)' },
  { id: Platform.Other, label: '기타' },
];


export const STANDARD_FEATURES: StandardFeatureOption[] = [
  { id: 'login', label: '사용자 로그인/회원가입 (소셜 로그인 포함)', promptText: '회원가입, 로그인, 비밀번호 복구를 포함한 사용자 인증 시스템. 선택적으로 소셜 로그인 기능(예: 구글, 페이스북)을 포함합니다.' },
  { id: 'database', label: '데이터베이스 연동', promptText: '데이터 영속성을 위한 데이터베이스 연동 (예: 사용자 프로필, 애플리케이션 데이터, 콘텐츠). 선호하는 데이터베이스 유형(예: SQL, NoSQL)이 있다면 명시해주세요.' },
  { id: 'push', label: '푸시 알림 기능', promptText: '시기적절한 업데이트나 알림으로 사용자의 참여를 유도하는 푸시 알림 기능입니다.' },
  { id: 'gps', label: '위치 기반 서비스 (GPS)', promptText: '지도, 지역 콘텐츠 추천, 추적 등 위치 기반 기능을 위한 GPS 활용입니다.' },
  { id: 'payment', label: '결제 시스템 연동', promptText: '인앱 구매, 구독 또는 거래를 위한 결제 게이트웨이 연동입니다.' },
];

export interface RefinementOption {
  id: string;
  label: string;
  instruction: string;
}

export const PROMPT_REFINEMENT_OPTIONS: RefinementOption[] = [
  { id: 'concise', label: '더 간결하게', instruction: '프롬프트를 더 간결하고 핵심적인 내용만 남도록 수정해줘. 불필요한 반복이나 설명은 줄여줘.' },
  { id: 'detailed', label: '더 상세하게 (항목별)', instruction: '프롬프트의 각 항목(개요, 기능, 기술 스택 등)에 대해 좀 더 구체적이고 상세한 설명을 추가해줘. 가능한 예시도 포함해주면 좋겠어.' },
  { id: 'professional_tone', label: '전문적인 톤으로 변경', instruction: '프롬프트의 전체적인 어조를 더 공식적이고 전문적인 비즈니스 문서 스타일로 변경해줘.' },
  { id: 'casual_tone', label: '캐주얼한 톤으로 변경', instruction: '프롬프트의 전체적인 어조를 좀 더 친근하고 캐주얼한 스타일로 변경해줘.' },
  { id: 'for_junior_dev', label: '초보 개발자 대상 설명 추가', instruction: '프롬프트 내용 중 기술적인 부분이나 전문 용어가 있다면, 초보 개발자도 이해하기 쉽도록 풀어서 설명하거나 간단한 예시를 추가해줘.' },
  { id: 'emphasize_ui_ux', label: 'UI/UX 측면 강조', instruction: '프롬프트 내용에서 사용자 인터페이스(UI)와 사용자 경험(UX) 디자인과 관련된 요구사항을 더 강조하고 구체화해줘. 사용성, 접근성, 시각적 디자인 컨셉 등을 포함할 수 있어.' },
  { id: 'emphasize_backend', label: '백엔드 로직 강조', instruction: '프롬프트 내용에서 데이터 처리, 서버 로직, API 설계 등 백엔드 시스템과 관련된 요구사항을 더 강조하고 구체화해줘.' },
  { id: 'add_monetization', label: '수익화 아이디어 추가 요청', instruction: '현재 프롬프트 내용에 기반하여, 이 프로젝트를 통해 수익을 창출할 수 있는 아이디어나 전략을 몇 가지 제안하는 내용을 프롬프트에 추가해줘.' },
  { id: 'target_specific_audience', label: '특정 타겟 사용자 맞춤', instruction: '현재 프롬프트의 타겟 사용자를 고려하여, 해당 사용자들이 더욱 매력을 느낄 수 있도록 프롬프트 내용(기능, 어투 등)을 조정해줘. (타겟 사용자: [여기에 구체적인 타겟 사용자 명시])' },
];

export const PROMPT_TONE_OPTIONS: { id: PromptTone; label: string; description: string }[] = [
  { id: PromptTone.Formal, label: '격식체 (Formal)', description: '공식적이고 전문적인 문서 스타일로 프롬프트를 구성합니다.' },
  { id: PromptTone.Casual, label: '일상체 (Casual)', description: '친근하고 편안한 어조로 프롬프트를 구성합니다.' },
  { id: PromptTone.Technical, label: '기술적 (Technical)', description: '정확하고 상세한 기술 용어를 사용하여 프롬프트를 구성합니다.' },
  { id: PromptTone.Enthusiastic, label: '열정적 (Enthusiastic)', description: '프로젝트에 대한 기대감과 흥미를 나타내는 어조로 구성합니다.' },
  { id: PromptTone.Humorous, label: '유머러스 (Humorous)', description: '가볍고 재미있는 요소를 포함하여 프롬프트를 구성합니다.' },
];

export const PROMPT_STYLE_OPTIONS: { id: PromptStyle; label: string; description: string }[] = [
  { id: PromptStyle.Concise, label: '간결하게 (Concise)', description: '핵심 내용 위주로 명확하고 짧게 프롬프트를 구성합니다.' },
  { id: PromptStyle.Detailed, label: '상세하게 (Detailed)', description: '각 항목에 대해 구체적이고 풍부한 정보를 담아 프롬프트를 구성합니다.' },
  { id: PromptStyle.StepByStep, label: '단계별로 (Step-by-Step)', description: '요청 사항을 명확한 단계로 나누어 지시하는 형태로 프롬프트를 구성합니다.' },
  { id: PromptStyle.Creative, label: '창의적으로 (Creative)', description: 'Gemini의 창의력을 자극할 수 있도록 개방형 질문이나 시나리오를 포함합니다.' },
  { id: PromptStyle.Instructional, label: '지시적으로 (Instructional)', description: '명령형 어투를 사용하여 명확한 지시사항을 전달합니다.' },
];

export const HELP_TEXTS: Record<string, string> = {
  projectName: "프로젝트의 이름입니다. 기억하기 쉽고 프로젝트의 특징을 잘 나타내는 이름이 좋습니다.",
  projectType: "만들고 싶은 프로젝트의 유형을 선택하세요. 앱 또는 게임인지에 따라 다음 단계의 옵션이 달라집니다.",
  category: "선택한 프로젝트 유형 내의 구체적인 카테고리입니다. (예: 생산성 앱, 퍼즐 게임)",
  summary: "프로젝트의 핵심 아이디어나 목표를 1-2문장으로 간략하게 요약해주세요. 어떤 문제를 해결하거나 어떤 가치를 제공하는지가 명확하면 좋습니다. \n템플릿 변수를 사용하려면 대괄호 안에 변수명을 입력하세요 (예: [TARGET_USER], [MAIN_FEATURE]).",
  selectedStandardFeatures: "프로젝트에 포함될 수 있는 일반적인 기능들입니다. 필요한 기능을 선택하세요.",
  customFeatures: "프로젝트를 특별하게 만드는 독특하거나 핵심적인 기능을 구체적으로 설명해주세요. 경쟁 서비스와의 차별점이 될 수 있습니다. \n템플릿 변수를 사용하려면 대괄호 안에 변수명을 입력하세요 (예: [UNIQUE_SELLING_POINT]).",
  targetAudience: "이 프로젝트를 주로 사용할 사람들은 누구인가요? (예: 20대 대학생, IT 개발자, 특정 취미를 가진 사람들 등) \n템플릿 변수를 사용하려면 대괄호 안에 변수명을 입력하세요 (예: [AGE_GROUP], [INTERESTS]).",
  projectImage: "프로젝트 컨셉, 분위기, UI 스케치 등 영감을 주는 이미지를 첨부할 수 있습니다. 이미지는 프롬프트와 함께 Gemini에게 전달되어 더 나은 결과물을 얻는 데 도움이 됩니다.",
  techStack_language: "프로젝트 개발에 사용할 주요 프로그래밍 언어를 선택하세요. (선택 사항)",
  techStack_framework: "사용할 프레임워크나 라이브러리가 있다면 선택하세요. (선택 사항)",
  techStack_platform: "프로젝트가 주로 실행될 플랫폼을 선택하세요. (예: 웹, iOS, Android 등)",
  useGoogleSearchGrounding: "이 옵션을 선택하면, 생성될 프롬프트에 Google Search를 활용하여 최신 정보를 반영하도록 하는 지침이 포함됩니다. (참고: JSON 응답 모드와 함께 사용할 수 없습니다.)",
  keywords: "프로젝트 아이디어를 나타내는 핵심 단어들을 입력하세요. AI가 이 키워드를 바탕으로 아이디어를 확장하거나 관련 정보를 제안할 수 있습니다.",
  relatedness: "연관 키워드 생성 시, 원본 키워드와의 관련성 정도를 조절합니다. 0에 가까울수록 창의적이고 새로운 키워드를, 1에 가까울수록 원본과 밀접한 키워드를 제안합니다.",
  promptTone: "생성될 프롬프트 자체의 전반적인 어조를 선택합니다. 이는 Gemini에게 전달될 지침의 분위기를 결정합니다.",
  promptStyle: "생성될 프롬프트의 구조나 서술 방식을 선택합니다. Gemini에게 어떤 방식으로 응답을 요구할지 결정합니다.",
};