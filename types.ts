
export enum ProjectType {
  App = 'Application',
  Game = 'Game',
}

export enum AppCategory {
  Productivity = 'Productivity',
  Education = 'Education',
  Utility = 'Utility',
  Social = 'Social',
  Lifestyle = 'Lifestyle',
  Other = 'Other',
}

export enum GameCategory {
  Puzzle = 'Puzzle',
  RPG = 'RPG',
  Simulation = 'Simulation',
  Arcade = 'Arcade',
  Strategy = 'Strategy',
  Other = 'Other',
}

export enum Language {
  JavaScript = 'JavaScript',
  Python = 'Python',
  Swift = 'Swift',
  Kotlin = 'Kotlin',
  Java = 'Java',
  CSharp = 'C#',
  Go = 'Go',
  TypeScript = 'TypeScript',
  Other = 'Other',
}

export enum Framework {
  React = 'React',
  Vue = 'Vue',
  Angular = 'Angular',
  Svelte = 'Svelte',
  NextJS = 'Next.js',
  ReactNative = 'React Native',
  Flutter = 'Flutter',
  Django = 'Django',
  Flask = 'Flask',
  Spring = 'Spring Boot',
  NodeJS = 'Node.js/Express',
  Other = 'Other',
}

export enum Platform {
  Web = 'Web',
  iOS = 'iOS',
  Android = 'Android',
  Desktop = 'Desktop (Windows, macOS, Linux)',
  Other = 'Other',
}

export enum PromptTone {
  Formal = 'Formal',
  Casual = 'Casual',
  Technical = 'Technical',
  Enthusiastic = 'Enthusiastic',
  Humorous = 'Humorous',
}

export enum PromptStyle {
  Concise = 'Concise',
  Detailed = 'Detailed',
  StepByStep = 'StepByStep',
  Creative = 'Creative',
  Instructional = 'Instructional',
}


export type StandardFeatureKey = 'login' | 'database' | 'push' | 'gps' | 'payment';

export interface ProjectImage {
  name: string;
  type: string;
  base64Data: string;
}

export interface IdeaData {
  projectName: string;
  projectType?: ProjectType;
  category?: AppCategory | GameCategory;
  summary: string;
  selectedStandardFeatures: StandardFeatureKey[];
  customFeatures: string;
  targetAudience: string;
  techStack: {
    language?: Language;
    framework?: Framework;
    platform?: Platform;
  };
  useGoogleSearchGrounding?: boolean;
  projectImage?: ProjectImage | null;
  promptTone?: PromptTone;
  promptStyle?: PromptStyle;
}

export interface SavedPrompt {
  id: string;
  name: string;
  promptText: string;
  ideaDetails: IdeaData; 
  createdAt: string; // ISO string
  tags?: string[];
  isFavorite?: boolean;
  templateVariableValues?: Record<string, string>; // Added for template variable values
}

export enum AppStep {
  Home = 'Home',
  ProjectTypeSelection = 'ProjectTypeSelection',
  IdeaForm = 'IdeaForm',
  PromptDisplay = 'PromptDisplay',
  Library = 'Library',
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}