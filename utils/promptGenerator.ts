
import { IdeaData, PromptTone, PromptStyle } from '../types.ts';
import { STANDARD_FEATURES, PROJECT_TYPES_OPTIONS, PROMPT_TONE_OPTIONS, PROMPT_STYLE_OPTIONS } from '../constants'; 

export function generatePromptText(data: IdeaData): string {
  const projectTypeKorean = PROJECT_TYPES_OPTIONS.find(opt => opt.id === data.projectType)?.label.toLowerCase() || '프로젝트';
  const roleSpecific = data.projectType === 'Game' ? '게임 기획자' : `${projectTypeKorean} 전문 기획자`;
  
  let prompt = `너는 이제부터 10년차 시니어 풀스택 개발자이자 ${roleSpecific}로서 행동해야 해. 내가 제시하는 요구사항에 맞춰 ${data.techStack.framework ? data.techStack.framework + '와(과) ' : ''}${data.techStack.language ? data.techStack.language + '를 사용한 ' : ''}${data.techStack.platform ? data.techStack.platform + ' ' : ''}${projectTypeKorean} 프로토타입을 만들어줘.

### **[프로젝트 개요]**

- **${data.projectType === 'Game' ? '게임' : '앱'} 이름:** ${data.projectName || '제목 없음'}
- **프로젝트 유형:** ${projectTypeKorean}
${data.category ? `- **카테고리:** ${data.category}\n` : ''}
- **핵심 컨셉/목표:** ${data.summary || '명시되지 않음.'}
- **주요 타겟 사용자:** ${data.targetAudience || '명시되지 않음.'}
`;

  if (data.projectImage) {
    prompt += `- **참고 이미지:** 사용자가 이미지를 제공했습니다. 이 이미지는 아이디어 구상에 영감을 주기 위한 것으로, 요청 시 이미지 데이터와 함께 전달될 것입니다. 이미지의 내용, 스타일, 분위기 등을 고려하여 응답을 생성해주세요. (이미지 파일명: ${data.projectImage.name})\n`;
  }

  prompt += `
### **[핵심 기능 요구사항]**
`;

  if (data.selectedStandardFeatures.length > 0) {
    prompt += "\n**표준 기능:**\n";
    data.selectedStandardFeatures.forEach(featureKey => {
      const featureDetail = STANDARD_FEATURES.find(f => f.id === featureKey);
      if (featureDetail) {
        prompt += `- **${featureDetail.label}:** ${featureDetail.promptText}\n`;
      }
    });
  }

  if (data.customFeatures) {
    prompt += `\n**사용자 정의/특정 기능:**\n${data.customFeatures}\n`;
  }

  if (data.selectedStandardFeatures.length === 0 && !data.customFeatures) {
    prompt += "특별히 명시된 기능 없음.\n";
  }

  prompt += "\n### **[기술 스택]**\n";
  if (data.techStack.language || data.techStack.framework || data.techStack.platform) {
    if (data.techStack.language) prompt += `- **선호 언어:** ${data.techStack.language}\n`;
    if (data.techStack.framework) prompt += `- **선호 프레임워크/라이브러리:** ${data.techStack.framework}\n`;
    if (data.techStack.platform) prompt += `- **타겟 플랫폼:** ${data.techStack.platform}\n`;
  } else {
    prompt += "특정 기술 스택 선호도가 제공되지 않았습니다. 요청된 결과물에 적합하다면 적절한 스택을 제안해주세요.\n";
  }

  if (data.useGoogleSearchGrounding) {
    prompt += `
### **[중요: 최신 정보 반영을 위한 Google Search 활용 지침]**
이 프롬프트가 최신 정보, 뉴스, 또는 실시간 트렌드를 반영해야 하는 경우, 최종적으로 Gemini 모델에게 요청할 때 Google Search grounding 기능을 사용하도록 설정하는 것이 좋습니다.
API를 사용한다면, 모델 요청 시 \`config\` 객체에 다음을 포함시키세요:
\`\`\`json
{
  "tools": [{ "googleSearch": {} }]
}
\`\`\`
Google AI Studio에서는 '모델 설정'(Model Settings)의 '도구'(Tools) 섹션에서 'Google Search'를 활성화할 수 있습니다.
이렇게 하면 모델이 보다 정확하고 최신의 정보를 바탕으로 응답을 생성하는 데 도움이 됩니다.

**주의:** \`responseMimeType: "application/json"\` 설정과 \`googleSearch\` 도구는 **함께 사용할 수 없습니다**. 
만약 JSON 형식의 응답이 반드시 필요하다면, Google Search grounding 기능을 사용하지 않거나, grounding된 텍스트 응답을 받은 후 애플리케이션에서 직접 JSON으로 파싱하는 방법을 고려해야 합니다.
`;
  }

  prompt += `
### **[요청 사항: 전체 애플리케이션 프로토타입 생성]**

위의 프로젝트 개요, 핵심 기능 요구사항, 기술 스택을 바탕으로, Google AI Studio의 "Build apps with Gemini" 기능을 통해 직접 실행하거나 가져올 수 있는 **완전한 기능을 갖춘 애플리케이션 프로토타입**을 생성해주세요. 다음 사항들을 포함해야 합니다:

1.  **전체 프로젝트 구조:** 명확한 디렉토리 및 파일 구조를 제시해주세요.
2.  **완전한 소스 코드:**
    *   지정된 기술 스택(${data.techStack.framework ? data.techStack.framework : (data.techStack.language ? '선택된 언어 기반' : '적절한 프레임워크') }${data.techStack.language ? ` (${data.techStack.language})` : ''})을 사용하여 모든 주요 컴포넌트, 모듈, 서비스, HTML, CSS, JavaScript/TypeScript 등의 완전한 소스 코드를 제공해주세요.
    *   코드는 명시된 핵심 기능들을 시연할 수 있도록 기능적으로 완전해야 합니다.
    *   필요한 경우 적절한 주석을 포함하여 코드의 가독성을 높여주세요.
3.  **UI/UX 구현:**
    *   애플리케이션의 주요 화면에 대한 기본적인 UI를 생성해주세요 (HTML, CSS, 클라이언트 측 스크립트 등).
    *   사용자 인터페이스는 직관적이고 사용하기 쉬워야 합니다.
4.  **데이터 처리 (필요시):**
    *   만약 '데이터베이스 연동' 기능이 포함되었거나 데이터 저장이 필요한 경우, 이를 처리할 수 있는 코드 (예: 임시 인메모리 데이터 저장, localStorage 활용, 또는 간단한 파일 기반 저장 방식) 또는 명확한 데이터 구조 정의를 포함해주세요. 데이터베이스 스키마가 복잡하다면, 그 구조를 명확히 설명해주세요.
5.  **실행 방법 안내 (README.md 내용 제안):**
    *   프로젝트를 로컬 환경에서 설정하고 실행하는 방법에 대한 명확하고 단계별 지침을 제공해주세요. (예: 필요한 의존성, 빌드 명령어, 실행 명령어 등)
    *   프로젝트의 간략한 개요와 주요 기능 설명을 포함해주세요.
6.  **필수 설정 파일:**
    *   필요한 경우 \`package.json\` (Node.js 프로젝트의 경우), 빌드 스크립트, 환경 설정 파일 등의 기본 뼈대를 제공해주세요.

**출력 형식:**
응답은 각 파일의 내용과 함께 명확한 파일 경로를 지정하는 형태로 구성되어야 합니다. 예를 들어, 다음과 같은 형식으로 제공될 수 있습니다:

\`\`\`
// path: src/App.js 
// 내용:
// (App.js 코드 내용)
\`\`\`

\`\`\`
// path: public/index.html
// 내용:
// (index.html 코드 내용)
\`\`\`

모든 코드는 즉시 실행 가능하거나 최소한의 설정 변경으로 실행될 수 있도록 작성해주세요. 당신의 목표는 이 프롬프트의 결과물을 사용자가 Google AI Studio의 "Build apps with Gemini"에 바로 적용하여 애플리케이션의 초기 버전을 빠르게 구축할 수 있도록 돕는 것입니다.
`;

  if (data.projectImage) {
    prompt += `
**멀티모달 입력 참고:**
이 프롬프트와 함께 사용자 제공 이미지가 전송될 예정입니다. API를 통해 Gemini 모델에 요청을 보낼 때, 텍스트 파트와 이미지 파트를 함께 \`contents\`에 포함시켜주세요.
예시 (JavaScript SDK):
\`\`\`javascript
const imagePart = {
  inlineData: {
    mimeType: "${data.projectImage.type}", 
    data: "[ 여기에 이미지의 base64 인코딩 데이터 ]" 
  }
};
const textPart = { text: "위의 프롬프트 내용..." };
// ...
// const response = await ai.models.generateContent({ 
//   model: "gemini-2.5-flash-preview-04-17", // or other suitable model
//   contents: { parts: [textPart, imagePart] } 
// });
\`\`\`
`;
  }

  prompt += `
### **[응답 스타일 및 어조]**
- 명확하고 간결하며 실행 가능한 정보를 제공해주세요.
- 코드를 생성하는 경우, 모범 사례를 따르고 필요한 경우 주석을 잘 달아주세요.
- 디자인 또는 개념 아이디어의 경우 혁신과 사용자 경험에 중점을 두세요.`;

  const selectedTone = PROMPT_TONE_OPTIONS.find(opt => opt.id === data.promptTone);
  const selectedStyle = PROMPT_STYLE_OPTIONS.find(opt => opt.id === data.promptStyle);

  if (selectedTone) {
    prompt += `\n- **선호하는 어조:** ${selectedTone.label}. ${selectedTone.description}`;
  }
  if (selectedStyle) {
    prompt += `\n- **선호하는 스타일:** ${selectedStyle.label}. ${selectedStyle.description}`;
  }
  if (!selectedTone && !selectedStyle) {
    prompt += `\n- 특별히 선호하는 어조나 스타일이 지정되지 않았습니다. 일반적인 기술 문서 스타일로 작성해주세요.`;
  }

  prompt += `\n\n단계별로 생각하고 포괄적인 답변을 제공해주세요.
`;

  return prompt.trim();
}