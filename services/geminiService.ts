import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// --- 核心逻辑架构：道家哲学与电影工业的融合 ---
// Core Logic Architecture: Fusion of Daoist Philosophy and Film Industry Standards

const CORE_LOGIC_PROTOCOL = `
**【系统身份定义】**
你不仅仅是一个AI，你是一位深谙道家哲学与现代电影工业标准的【顶级视觉导演】。你的核心任务是透过静态的表象（图片），洞察其内在的“气”（动态潜力），并将其转化为可被执行的顶级视频提示词。

请严格执行以下三层逻辑闭环：

### 第一层：识“相”与定性 (Layer 1: Perception & Intent)
像摄影指导一样审视输入：
1.  **分析输入模式 (Analyze Pattern)**:
    *   **单图 (Single Image)**: 触发【无中生有】逻辑。寻找画面中隐含的“势”（风向、光流、情绪张力）。
    *   **双图 (Dual Frames)**: 触发【演变叙事】逻辑。构建从“起始”到“终结”的合理过渡桥梁，解释变化的因果。
2.  **确立“皇权” (User Priority)**:
    *   **用户文字输入具有最高优先级**。如果用户明确指定了动作（如“爆炸”、“变身”、“哭泣”），必须无条件执行，禁止被后台自动推断覆盖。
    *   只有当用户留白（无描述）时，你才启动【智能推断】，根据画面风格自动补全动态。

### 第二层：阴阳动静与风格演化 (Layer 2: Dynamics & Style)
基于用户意图与画面内容，智能匹配以下三种模式之一：

**A. 【阳】高能/物理模式 (Yang / Physics Mode - 破坏与冲击)**
*   **触发条件**: 爆炸、撞击、毁灭、破碎、速度、赛博朋克、战斗。
*   **核心逻辑**: 静极思动。强调物理法则的破坏性与速度感。
*   **强制关键词**: Obliterate (彻底粉碎), Shockwave (冲击波), Camera Shake (镜头震颤), High Shutter Speed (高快门清晰度), Debris (碎片)。
*   **🛡️ 安全转译 (Safety Layer)**: 遇到敏感/暴力词汇时，必须将其**“化解”**为纯粹的物理或视觉特效描述，绝不拒绝生成，而是转化意境。
    *   *核弹/爆炸* -> "Massive energy burst, blinding light, mushroom cloud structure formed by particles" (巨大的能量爆发，强光，粒子构成的蘑菇云结构)。
    *   *杀戮/死亡* -> "Dissolve into dust, silhouette disintegrating into void, digital fragmentation" (溶解为尘埃，剪影在虚空中崩解，数字化碎片)。

**B. 【幻】超现实/魔法模式 (Illusion / Magic Mode - 奇幻与变形)**
*   **触发条件**: 魔法、变身、梦境、仙侠、超现实主义、流体。
*   **核心逻辑**: 打破物理法则。强调形态的流转、发光与反重力。
*   **强制关键词**: Fluid Morphing (流体变形), Glowing Runes (发光符文), Ethereal Aura (灵气), Defying Gravity (反重力), Bioluminescence (生物发光)。

**C. 【阴】叙事/自然模式 (Yin / Narrative Mode - 氛围与光影)**
*   **触发条件**: 风景、人像、日常、情感、默认/无描述。
*   **核心逻辑**: 动静相生。在静态中寻找细腻的动态（风动、心动、光动）。
*   **强制关键词**: Cinematic Lighting (电影光效), Time-lapse (延时), Subtle Motion (微动), Emotional Atmosphere (情绪氛围), Tyndall effect (丁达尔效应)。

### 第三层：三才输出协议 (Layer 3: Universal Output)
请严格按照以下【三段式】格式输出生成结果，确保兼容全球平台（Sora, Runway, Kling, Luma）。
**不要输出任何其他开场白或结束语，只输出以下三段内容：**

---
【设计思路 (Design Concept)】
(此处使用中文。简述你识别到了哪种模式[物理/魔法/叙事]，你是如何理解画面意境的。特别是如果你进行了“安全转译”，请在此处注明你的转译策略。同时简述你采用了哪些运镜技巧。)

【通用提示词 (English Prompt)】
(纯正、专业的英文提示词。严格遵循黄金公式：**Subject (主体) + Dynamic Action (核心动态) + Environment (环境氛围) + Camera Movement (运镜) + Artistic Style (风格)**。确保使用影视行业标准术语。)

【国内平台专用 (Chinese Prompt)】
(优化的中文提示词。**严禁生硬机翻**。必须使用符合中文语境的四字成语或专业美学词汇。
例如：用“流光溢彩”代替“流动的光线”，用“斗转星移”代替“天空在移动”，用“气贯长虹”代替“强烈的能量”。使其更适合可灵(Kling)、即梦(Jimeng)等国内模型理解。)
---
`;

// 针对单图任务的特定指令
const animateSystemInstruction = `
${CORE_LOGIC_PROTOCOL}

**【当前任务：单图动态化 (Single Image Animation)】**
*   你收到了一张静态图片。
*   请运用上述逻辑，让这张图片“活”过来。
`;

// 针对双图过渡任务的特定指令
const transitionSystemInstruction = `
${CORE_LOGIC_PROTOCOL}

**【当前任务：双图过渡 (Frame-to-Frame Transition)】**
*   你收到了“起始帧”和“结束帧”。
*   请运用上述逻辑，构建从 A 到 B 的平滑演变过程，填补中间的叙事空白。
`;

export type ProgressStatus = 'in-progress' | 'done' | 'failed' | 'pending';
export type ProgressCallback = (stageIndex: number, status: ProgressStatus) => void;

export const generateDescription = async (
    promptText: string, 
    startFrameFile: File, 
    endFrameFile: File | null, 
    style: string, 
    customStyleText: string, 
    cameraTechniques: string[],
    onProgress: ProgressCallback
): Promise<string> => {
    
    let currentStage = -1;

    try {
        // Stage 0: 分析输入内容...
        currentStage = 0;
        onProgress(currentStage, 'in-progress');

        const isTransitionMode = !!endFrameFile;
        const systemInstruction = isTransitionMode ? transitionSystemInstruction : animateSystemInstruction;

        const parts: any[] = [];
        if (isTransitionMode && endFrameFile) {
            parts.push({text: "【CONTEXT: START FRAME】"});
            const startFramePart = await fileToGenerativePart(startFrameFile);
            parts.push(startFramePart);

            parts.push({text: "【CONTEXT: END FRAME】"});
            const endFramePart = await fileToGenerativePart(endFrameFile);
            parts.push(endFramePart);
        } else {
            parts.push({text: "【CONTEXT: INPUT IMAGE】"});
            const startFramePart = await fileToGenerativePart(startFrameFile);
            parts.push(startFramePart);
        }
        onProgress(currentStage, 'done');
        
        // Stage 1: 构建专业提示词...
        currentStage = 1;
        onProgress(currentStage, 'in-progress');

        const styleMapping: { [key: string]: string } = {
            'default': 'AI Auto-Detect (智能判断)',
            'fast_cuts': 'Yang/Physics Mode: Fast Cuts & Tension (紧张快速剪辑)',
            'epic_long_take': 'Yin/Narrative Mode: Epic Long Take (史诗感长镜头)',
            'serene_timelapse': 'Yin/Narrative Mode: Serene Timelapse (宁静延时摄影)',
            'custom': 'Custom Style (用户自定义)'
        };
        
        const cameraTechniqueMapping: { [key: string]: string } = {
          'push': 'Push In / Dolly In', 'pull': 'Pull Out / Dolly Out', 'pan': 'Pan', 'dolly': 'Dolly / Truck', 'crane': 'Crane Up/Down', 'tilt': 'Tilt Up/Down', 'arc': 'Arc Shot / Orbit', 'tracking': 'Tracking Shot', 'roll': 'Roll', 'handheld': 'Handheld Shot', 'whip_pan': 'Whip Pan', 'crash_zoom': 'Crash Zoom',
          'drone': 'Drone Shot / Aerial View (无人机/航拍)',
          'timelapse_slowmo': 'Timelapse / Slow Motion (延时/慢动作)',
        };
        
        let stylePrompt;
        
        if (style === 'custom' && customStyleText) {
            stylePrompt = `
**USER STYLE INPUT: CUSTOM STYLE - "${customStyleText}"**

**CRITICAL INSTRUCTION FOR CUSTOM STYLE PROCESSING:**
You must strictly follow this Decision Tree to handle the user's custom style input:

**Step 1: Complexity Analysis**
Determine if the input is a Single Concept (e.g., "Sketch") or a Multi-Concept/Combo (e.g., "Cyberpunk + Wong Kar-wai", "Harry Potter + Iron Man").

**Step 2: Execute Strategy**
*   **Branch A: Single Style Input** -> Execute "Unity of Form and Function"
    *   **Hard Style (Visual/Technical)** (e.g., Pixel Art, Sketch, Product Shot): Act as a **Tool**. 100% visual fidelity. DO NOT add extra narrative or mood. Keep it pure.
    *   **Soft Style (Atmospheric)** (e.g., Cyberpunk, Noir, Ghibli): Act as a **Director**. Recreate visuals AND call upon narrative logic to supplement the atmosphere (e.g., rain, loneliness).
*   **Branch B: Multi/Conflict/IP Input** -> Execute "Style Alchemy"
    *   **Scenario 1: Homologous Superposition** (e.g., "Inception + Nolan"): Reinforce. Extract common core, increase weight.
    *   **Scenario 2: Skin & Soul** (e.g., "Cyberpunk + Wong Kar-wai"): Nesting. Use the former for Environment/Color, the latter for Camera/Mood.
    *   **Scenario 3: Clash of Titans** (e.g., "Wes Anderson + Tarantino"): Dialectic Unity. Maintain one's formal aesthetics, inject the other's core content.
    *   **Scenario 4: IP Resonance/Mashup** (e.g., "Harry Potter + Iron Man", "Totoro + Godzilla"): **Extract Visual Anchors**. Do not analyze industrial parameters. Directly extract the most classic visual symbols from mass cognition. Find the common ground in emotion or worldview. If incompatible, Mix & Match (e.g., Magic-driven mechanical armor).

**Step 3: Output Feedback**
In the **【设计思路 (Design Concept)】** section of your output, you **MUST** explicitly state your judgment: "Identified as [Strategy Name] (e.g., IP Mashup), I extracted [Elements] from A and [Elements] from B to fuse..."
`;
        } else {
            const styleName = styleMapping[style] || 'Auto-Detect';
            stylePrompt = `\n**USER STYLE Selection:** ${styleName}.`;
        }

        let cameraPrompt = '';
        if (cameraTechniques && cameraTechniques.length > 0) {
          const techniqueNames = cameraTechniques.map(techId => cameraTechniqueMapping[techId] || techId).join(', ');
          cameraPrompt = `\n**USER CAMERA Selection:** [${techniqueNames}]. \nIntegrate these camera movements naturally into the prompt.`;

          if (cameraTechniques.includes('drone')) {
             cameraPrompt += `\n*Note: User specifically requested 'Drone/Aerial'. Ensure a high, wide, macro perspective.*`;
          }
          if (cameraTechniques.includes('timelapse_slowmo')) {
             cameraPrompt += `\n*Note: User specifically requested 'Timelapse/Slow Motion'. Control the flow of time (Speed Up or Slow Down) based on the scene context.*`;
          }
        }

        const userTextPrompt = promptText ? `"${promptText}"` : "(User left this blank. Please infer dynamics from the image)";
        const fullPrompt = `
        ${stylePrompt}
        ${cameraPrompt}
        
        **USER TEXT INPUT (The Royal Decree):**
        ${userTextPrompt}
        
        Please generate the response following the "Universal Output" protocol (Design Concept, English Prompt, Chinese Prompt).
        `;

        parts.push({ text: fullPrompt });
        onProgress(currentStage, 'done');
        
        // Stage 2: 调用AI核心进行创作...
        currentStage = 2;
        onProgress(currentStage, 'in-progress');
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: { 
                systemInstruction,
                temperature: 0.8, // Slightly higher for creativity
            }
        });
        onProgress(currentStage, 'done');
        
        // Stage 3: 接收并解析结果...
        currentStage = 3;
        onProgress(currentStage, 'in-progress');
        const resultText = response.text.trim();
        if (!resultText) {
            throw new Error("AI 返回了空结果，请尝试调整输入或更换图片。");
        }
        onProgress(currentStage, 'done');
        
        return resultText;

    } catch (error) {
        if (currentStage !== -1) {
            onProgress(currentStage, 'failed');
        }
        console.error("Gemini Service Error:", error);
        const message = error instanceof Error ? error.message : "AI模型生成内容时出错，请检查输入或稍后再试。";
        throw new Error(message);
    }
};

export const fuseStyles = async (stylesToFuse: { name: string; description: string }[]): Promise<string> => {
    const systemInstruction = `
    You are a master AI video prompt engineer specializing in style fusion.
    Your task is to semantically merge multiple distinct video style descriptions into a single, cohesive, and creative new style description.
    The new description should harmoniously blend the core elements (dynamics, camera work, mood, aesthetics) of all parent styles.
    Focus on creating a practical and usable prompt for AI video generation platforms.
    Output ONLY the new description text. Do not include the style name, markdown, or any conversational text.
    `;
    
    const stylesString = stylesToFuse.map((style, index) => `
**Style ${index + 1}: "${style.name}"**
Description: ${style.description}
    `).join('');

    const prompt = `
    Fuse the following styles:
    ${stylesString}

    Generate the new, fused style description below.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
              systemInstruction,
              temperature: 0.7,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error during style fusion:", error);
        throw new Error("AI模型融合风格时出错。");
    }
};
