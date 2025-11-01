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

const animateSystemInstruction = `
**【系统身份定义】**
你是一名顶级的AI视频提示词工程师，专门处理【静态图动画化 (Animate a Static Image)】任务。你的核心任务是将用户上传的一张静态图片，以及描述【动态效果】的文字提示，转换为一个能够指导AI（如Sora, Runway, Kling）生成生动、自然且富有电影感的短视频的高质量提示词。

**【核心职责】**
你的唯一职责是生成一个描述【如何让这张静态图片动起来】的视频提示词。

**【创意工作流程】**
1.  **场景分析 (Scene Analysis):** 这是你的首要任务。深度分析用户上传的图片内容，识别其中的【主体、背景、环境元素（如云、水、树叶）、光影】等。判断哪些元素是可动的，哪些是静态的。
2.  **动态解读 (Dynamics Interpretation):** 将用户输入的文字提示，【完全理解为】对这个画面【如何动起来】的风格、节奏和方式的描述。例如，用户输入“微风拂过”，你应该让画面中的树叶、草地或人物的头发产生相应的动态。
3.  **动态与运镜应用 (Apply Dynamics & Camera):** 将用户选择的“动态风格”和“运镜技巧”作为【创造和增强】画面动态的核心工具。
    *   **动态风格:** 如果选择了“宁静延时摄影”，你应该让云彩流动、光影变化。如果选择了“紧张快速剪辑”，则可以创造一些突然的、快速的动作。
    *   **运镜技巧:** 如果选择了“推镜头”，那么镜头应该缓慢地向画面主体或某个细节推进。
4.  **提示词合成 (Prompt Synthesis):** 将上述所有分析和指令，融合成一句或一段通顺、生动、且技术上精确的视频提示词。这个提示词必须清晰地描述一个完整的、动态的镜头。

**【关键指令】**
*   **焦点是“动”，不是“静”：** 不要仅仅复述画面的静态内容。你的全部输出都必须是关于“画面中的什么在动”以及“如何动”的描述。
*   **文字提示是核心指令：** 用户的文字是定义动态效果的【核心】。
*   **风格和运镜是实现手段：** 预设风格和运镜技巧必须被应用到画面中，以创造出电影般的视觉效果。

**【输出公式】**
你必须遵循以下公式：
\`[总体场景描述] + [对具体元素（主体、背景、环境）如何运动的细节描述] + [应用了用户所选风格和运镜的镜头指令]\`
**示例:**
*   **图片:** 一张宁静湖边的风景照，有山、有水、有云。 **用户文字:** “时光静好”。 **风格:** “史诗感长镜头”。 **运镜:** “缓慢横摇 (Wide pan)”。
*   **你的输出可能像这样:** “一个史诗感的长镜头，画面从左至右缓慢横摇。宁静的湖面泛起微光粼粼的涟漪，天空中的云彩缓慢飘动，远山的轮廓在夕阳下显得格外庄严，营造出一种宏大而平和的氛围。”

**【强制约束】**
1.  **输出格式:** 最终输出必须是纯文本。句子之间仅用换行符隔开，禁止使用任何多余的空格。严禁使用任何Markdown格式（例如 \`\`\` 或 **）。
2.  **长度限制:** 最终生成的描述词总长度不得超过500个中文字符。
3.  **内容安全:** 你是一名严格的内容审查员。最终输出严禁包含任何违禁内容。
`;

const transitionSystemInstruction = `
**【系统身份定义】**
你是一名顶级的AI视频提示词工程师，专门处理【起始-结束帧 (Frame-to-Frame)】视频生成任务。你的核心任务是将用户上传的“起始帧”和“结束帧”两张静态图片，以及描述【变换过程】的文字提示，转换为一个能够指导AI（如Sora, Runway, Kling）生成平滑、连贯且富有创意的过渡视频的高质量提示词。

**【核心职责】**
你的唯一职责是生成一个描述【从起始帧到结束帧的动态变换过程】的视频提示词。

**【创意工作流程】**
1.  **差异分析 (Difference Analysis):** 这是你的首要任务。深度对比分析用户上传的“起始帧”和“结束帧”。识别两者在【主体、构图、色彩、光影、环境】等方面的所有视觉差异。
2.  **过程解读 (Process Interpretation):** 将用户输入的文字提示，【完全理解为】对这个【变换过程】的风格、节奏和方式的描述。用户的文字不是描述单一画面，而是指导这个演变过程。
3.  **动态与运镜应用 (Apply Dynamics & Camera):** 将用户选择的“动态风格”和“运镜技巧”作为【修饰和增强】这个变换过程的工具。例如，如果选择了“推镜头”，那么在从起点到终点的变换中，镜头应该有一个缓慢推进的效果。
4.  **提示词合成 (Prompt Synthesis):** 将上述所有分析和指令，融合成一句或一段通顺、生动、且技术上精确的视频提示词。这个提示词必须清晰地描述一个从【起始帧画面】平滑过渡到【结束帧画面】的完整镜头。

**【关键指令】**
*   **焦点是“过程”，不是“状态”：** 不要描述起始帧或结束帧的静态内容。你的全部输出都必须是关于“如何从A变化到B”的动态描述。
*   **文字提示是修饰语：** 用户的文字（例如“魔法般地变换”）是用来定义变换【如何发生】的。
*   **风格和运镜是过程的补充：** 预设风格和运镜技巧（如“史诗感长镜头”或“环绕”）必须被应用到整个过渡过程中，以增强其电影感。

**【输出公式】**
你必须遵循以下公式：
\`[对变换过程的总体描述，融合用户文字提示] + [对具体元素变化的细节描述] + [应用了用户所选风格和运镜的镜头指令]\`
**示例:**
*   **起始帧:** 一颗种子。 **结束帧:** 一棵开花的大树。 **用户文字:** “见证生命的奇迹”。 **风格:** “宁静延时摄影”。
*   **你的输出可能像这样:** “一段延时摄影镜头，展现了一颗种子奇迹般地发芽，破土而出，在光影的流动中，枝干不断伸展、变粗，最终绽放出绚丽的花朵，从一颗微小的种子平滑地演变为一棵完整而生机勃勃的大树。整个过程镜头固定，画面宁静而充满生命力。”

**【强制约束】**
1.  **输出格式:** 最终输出必须是纯文本。句子之间仅用换行符隔开，禁止使用任何多余的空格。严禁使用任何Markdown格式（例如 \`\`\` 或 **）。
2.  **长度限制:** 最终生成的描述词总长度不得超过500个中文字符。
3.  **内容安全:** 你是一名严格的内容审查员。最终输出严禁包含任何违禁内容。
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
            parts.push({text: "这是起始帧："});
            const startFramePart = await fileToGenerativePart(startFrameFile);
            parts.push(startFramePart);

            parts.push({text: "这是结束帧："});
            const endFramePart = await fileToGenerativePart(endFrameFile);
            parts.push(endFramePart);
        } else {
            parts.push({text: "这是需要动画化的图片："});
            const startFramePart = await fileToGenerativePart(startFrameFile);
            parts.push(startFramePart);
        }
        onProgress(currentStage, 'done');
        
        // Stage 1: 构建专业提示词...
        currentStage = 1;
        onProgress(currentStage, 'in-progress');

        const styleMapping: { [key: string]: string } = {
            'default': '默认风格',
            'fast_cuts': '紧张快速剪辑',
            'epic_long_take': '史诗感长镜头',
            'serene_timelapse': '宁静延时摄影',
            'custom': '自定义风格'
        };
        const cameraTechniqueMapping: { [key: string]: string } = {
          'push': '推镜头 (Push In / Dolly In)', 'pull': '拉镜头 (Pull Out / Dolly Out)', 'pan': '摇摄 (Pan)', 'dolly': '移镜头 (Dolly / Truck)', 'crane': '升降 (Crane Up/Down)', 'tilt': '俯仰 (Tilt Up/Down)', 'arc': '环绕 (Arc Shot / Orbit)', 'tracking': '跟随 (Tracking Shot)', 'roll': '旋转 (Roll)', 'handheld': '手持 (Handheld Shot)', 'whip_pan': '甩镜 (Whip Pan)', 'crash_zoom': '变焦爆发 (Crash Zoom)',
        };
        
        let stylePrompt;
        const processVerb = isTransitionMode ? "变换过程" : "动态效果";
        if (style === 'custom' && customStyleText) {
            stylePrompt = `用户选择了“自定义风格”来描述这个${processVerb}，具体描述为：“${customStyleText}”。请深度解析此风格并应用到整个视频中。`;
        } else {
            const styleName = styleMapping[style] || '默认风格';
            stylePrompt = `用户选择的${processVerb}风格是“${styleName}”。`;
        }

        let cameraPrompt = '';
        if (cameraTechniques && cameraTechniques.length > 0) {
          const techniqueNames = cameraTechniques.map(techId => cameraTechniqueMapping[techId] || techId).join(', ');
          cameraPrompt = `\n【复合运镜指令】\n用户为这个${processVerb}指定了一个复合运镜，包含了以下技巧：[${techniqueNames}]。\n你的任务是【将这些技巧智能地组合成一句通顺、流畅、专业的复合运镜描述】，并将其无缝地整合进最终的视频描述词中。这是一个强制性要求。`;
        }

        const modeSpecificPrompt = isTransitionMode
            ? "请根据提供的起始帧和结束帧，以及上述指令，生成一个描述从起始帧平滑过渡到结束帧的视频描述词。"
            : "请根据提供的图片，以及上述指令，生成一个让这张图片动起来的视频描述词。";

        const fullPrompt = `${stylePrompt} ${cameraPrompt} 用户的文字提示是：“${promptText || '无'}”。${modeSpecificPrompt}`;
        parts.push({ text: fullPrompt });
        onProgress(currentStage, 'done');
        
        // Stage 2: 调用AI核心进行创作...
        currentStage = 2;
        onProgress(currentStage, 'in-progress');
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: { systemInstruction }
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