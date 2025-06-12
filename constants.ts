
import { StandardFeatureKey, ProjectType, AppCategory, GameCategory, Language, Framework, Platform } from './types';

interface StandardFeatureOption {
  id: StandardFeatureKey;
  label: string;
  promptText: string;
}

// interface DesiredOutputOption { // Removed
//   id: DesiredOutputKey;
//   label: string;
//   promptText: (techStack: { language?: Language, framework?: Framework, platform?: Platform }) => string;
// }

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

// export const DESIRED_OUTPUT_OPTIONS: DesiredOutputOption[] = [ // Removed
// ];
