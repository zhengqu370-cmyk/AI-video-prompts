import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { generateDescription, fuseStyles, ProgressStatus } from './services/geminiService';
import { InputArea } from './components/InputArea';
import { ResultDisplay } from './components/ResultDisplay';
import { GithubIcon, CopyIcon, CheckIcon } from './components/Icons';
import { Modal } from './components/Modal';

// --- History Components ---

interface HistoryDisplayProps {
  history: string[];
}

const HistoryItem: React.FC<{ item: string; onCopy: () => void; isCopied: boolean }> = ({ item, onCopy, isCopied }) => {
    return (
        <div className="relative group bg-gray-900 p-3 rounded-lg flex justify-between items-start gap-4 transition-colors hover:bg-gray-700/50">
            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words font-sans">
                {item}
            </p>
            <button
                onClick={onCopy}
                className="flex-shrink-0 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                aria-label="复制到剪贴板"
            >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
        </div>
    );
};

const HistoryDisplay: React.FC<HistoryDisplayProps> = ({ history }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (copiedIndex !== null) {
            const timer = setTimeout(() => setCopiedIndex(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedIndex]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
    };

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="w-full flex flex-col gap-4 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300">历史记录</h3>
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2">
                {history.map((item, index) => (
                    <HistoryItem 
                        key={index}
                        item={item}
                        onCopy={() => handleCopy(item, index)}
                        isCopied={copiedIndex === index}
                    />
                ))}
            </div>
            <style>{`
                .overflow-y-auto::-webkit-scrollbar { width: 6px; }
                .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
                .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 3px; }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
            `}</style>
        </div>
    );
};


const CUSTOM_STYLES_KEY = 'ai-video-gen-custom-styles-v2';
const STYLE_ORDER_KEY = 'ai-video-gen-style-order-v2';
const OLD_LOCAL_STORAGE_KEY = 'ai-video-gen-custom-styles';
const HISTORY_KEY = 'ai-video-gen-history-v1';
const MAX_HISTORY_ITEMS = 20;


export interface Style {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  description: string;
}

export interface ProgressStep {
  name: string;
  status: ProgressStatus;
}

const presetStyles: Omit<Style, 'type'>[] = [
  { id: 'default', name: '默认风格', description: '由AI根据场景内容自主判断，创造最合适的动态和运镜。' },
  { id: 'fast_cuts', name: '紧张快速剪辑', description: '营造紧张、刺激、快节奏的氛围。关键词组合: 快速剪辑(Quick cuts), 手持摄像机(Handheld camera), 动态模糊(Motion blur), 快速(Quickly), 紧张(Tense), 追逐(Chase), 剧烈(dramatically, jerkily), 甩镜(Whip pan), 变焦爆发(Crash zoom)。' },
  { id: 'epic_long_take', name: '史诗感长镜头', description: '营造宏大、壮丽、庄严的史诗感。关键词组合: 长镜头(Long take), 缓慢上升(Slowly crane up), 壮观的环绕(Majestic arc shot), 宽幅横摇(Wide pan), 缓慢地(Slowly), 庄严地(grandly, majestically), 宏大(Epic)。' },
  { id: 'serene_timelapse', name: '宁静延时摄影', description: '营造极致宁静、时间流逝的延时摄影效果。关键词组合: 延时摄影(Timelapse), 极其缓慢地(Extremely slowly, glacially), 固定机位(Fixed camera), 逐渐变化(Gradual change), 宁静(Serene), 平和(Peaceful), 光影流动(Flowing light and shadows)。' },
  { id: 'custom', name: '自定义风格', description: '' },
];

export const cameraTechniques = [
  { id: 'auto', name: 'AI 自动判断' },
  { id: 'push', name: '推镜头 (Push In / Dolly In)' },
  { id: 'pull', name: '拉镜头 (Pull Out / Dolly Out)' },
  { id: 'pan', name: '摇摄 (Pan)' },
  { id: 'dolly', name: '移镜头 (Dolly / Truck)' },
  { id: 'crane', name: '升降 (Crane Up/Down)' },
  { id: 'tilt', name: '俯仰 (Tilt Up/Down)' },
  { id: 'arc', name: '环绕 (Arc Shot / Orbit)' },
  { id: 'tracking', name: '跟随 (Tracking Shot)' },
  { id: 'roll', name: '旋转 (Roll)' },
  { id: 'handheld', name: '手持 (Handheld Shot)' },
  { id: 'whip_pan', name: '甩镜 (Whip Pan)' },
  { id: 'crash_zoom', name: '变焦爆发 (Crash Zoom)' },
  { id: 'drone', name: '无人机镜头 / 航拍 (Drone / Aerial)' },
  { id: 'timelapse_slowmo', name: '延时摄影 / 慢动作 (Timelapse / Slow Motion)' },
];


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isInitialState, setIsInitialState] = useState<boolean>(true);
  
  const [customStyles, setCustomStyles] = useState<Style[]>([]);
  const [styleOrder, setStyleOrder] = useState<string[]>([]);
  
  const [selectedStyleId, setSelectedStyleId] = useState<string>('default');
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [selectedCameraTechniques, setSelectedCameraTechniques] = useState<string[]>([]);

  const [isFuseMode, setIsFuseMode] = useState(false);
  const [fuseSelection, setFuseSelection] = useState<string[]>([]);
  const [isFuseModalOpen, setIsFuseModalOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [styleToEdit, setStyleToEdit] = useState<Style | null>(null);
  const [editedStyleName, setEditedStyleName] = useState('');
  const [editedStyleDesc, setEditedStyleDesc] = useState('');
  
  const [history, setHistory] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressStep[] | null>(null);


  useEffect(() => {
    // Load Styles
    try {
      // --- Migration from old format ---
      const oldSavedStylesJSON = localStorage.getItem(OLD_LOCAL_STORAGE_KEY);
      if (oldSavedStylesJSON) {
        const oldSavedData = JSON.parse(oldSavedStylesJSON);
        const migratedStyles: Style[] = [];
        if (Array.isArray(oldSavedData)) {
            oldSavedData.forEach((style: any) => {
                if (typeof style === 'string') {
                    migratedStyles.push({ id: `migrated-${Date.now()}-${Math.random()}`, name: style, description: style, type: 'custom' });
                } else if (typeof style === 'object' && style.id && style.name) {
                    migratedStyles.push({ id: style.id, name: style.name, description: style.name, type: 'custom' });
                }
            });
        }
        if (migratedStyles.length > 0) {
            setCustomStyles(migratedStyles);
            localStorage.setItem(CUSTOM_STYLES_KEY, JSON.stringify(migratedStyles));
            localStorage.removeItem(OLD_LOCAL_STORAGE_KEY);
        }
      } else {
         // --- Load new format ---
        const savedStylesJSON = localStorage.getItem(CUSTOM_STYLES_KEY);
        if (savedStylesJSON) {
          const savedData = JSON.parse(savedStylesJSON);
          if (Array.isArray(savedData)) {
            setCustomStyles(savedData.map((s: any) => ({ ...s, type: 'custom' })));
          }
        }
      }

      const savedOrderJSON = localStorage.getItem(STYLE_ORDER_KEY);
      if (savedOrderJSON) {
        setStyleOrder(JSON.parse(savedOrderJSON));
      }
    } catch (err) {
      console.error("Failed to load styles from local storage:", err);
    }
    
    // Load History
    try {
        const savedHistoryJSON = localStorage.getItem(HISTORY_KEY);
        if (savedHistoryJSON) {
            const savedHistory = JSON.parse(savedHistoryJSON);
            if (Array.isArray(savedHistory)) {
                setHistory(savedHistory);
            }
        }
    } catch (err) {
        console.error("Failed to load history from local storage:", err);
    }
  }, []);
  
  useEffect(() => {
    if (styleToEdit) {
        setEditedStyleName(styleToEdit.name);
        setEditedStyleDesc(styleToEdit.description);
    }
  }, [styleToEdit]);


  const allStyles = useMemo<Style[]>(() => {
    const combined = [
      ...presetStyles.map(p => ({ ...p, type: 'preset' as const })),
      ...customStyles
    ];
    
    if (styleOrder.length === 0) {
      return combined;
    }

    const styleMap = new Map(combined.map(s => [s.id, s]));
    const orderedStyles = styleOrder.map(id => styleMap.get(id)).filter((s): s is Style => !!s);
    const remainingStyles = combined.filter(s => !styleOrder.includes(s.id));
    
    return [...orderedStyles, ...remainingStyles];
  }, [customStyles, styleOrder]);

  const saveCustomStylesAndOrder = (newStyles: Style[], newOrder: string[]) => {
      try {
          const customOnly = newStyles.filter(s => s.type === 'custom');
          setCustomStyles(customOnly);
          setStyleOrder(newOrder);
          localStorage.setItem(CUSTOM_STYLES_KEY, JSON.stringify(customOnly));
          localStorage.setItem(STYLE_ORDER_KEY, JSON.stringify(newOrder));
      } catch (err) {
          console.error("Failed to save styles to local storage:", err);
      }
  };


  const saveCustomStyle = useCallback((styleDescription: string, styleName?: string) => {
      const trimmedDescription = styleDescription.trim();
      const name = styleName?.trim() || trimmedDescription;
      
      if (!trimmedDescription || customStyles.some(s => s.description === trimmedDescription)) {
          return;
      }
      const newStyle: Style = {
          id: Date.now().toString(),
          name: name,
          description: trimmedDescription,
          type: 'custom',
      };
      
      const newCustomStyles = [...customStyles, newStyle];
      const newOrder = [...allStyles.map(s => s.id), newStyle.id];
      saveCustomStylesAndOrder([...allStyles, newStyle], newOrder);
  }, [customStyles, allStyles]);

  const deleteCustomStyle = useCallback((id: string) => {
    const newStyles = allStyles.filter(s => s.id !== id);
    const newOrder = newStyles.map(s => s.id);
    saveCustomStylesAndOrder(newStyles, newOrder);
  }, [allStyles]);

  const renameCustomStyle = useCallback((id: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) return;

    if (customStyles.some(style => style.name === trimmedNewName && style.id !== id)) {
        alert('该风格名称已存在。');
        return;
    }

    const newStyles = allStyles.map(style =>
      style.id === id ? { ...style, name: trimmedNewName } : style
    );
    const newOrder = newStyles.map(s => s.id);
    saveCustomStylesAndOrder(newStyles, newOrder);
  }, [allStyles, customStyles]);
  

  const addToHistory = useCallback((newItem: string) => {
    setHistory(prevHistory => {
        if (prevHistory.length > 0 && prevHistory[0] === newItem) {
            return prevHistory;
        }
        const newHistory = [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        } catch (err) {
            console.error("Failed to save history to local storage:", err);
        }
        return newHistory;
    });
  }, []);

  const handleCloseProgressError = () => {
    setProgress(null);
    setError(null);
    setIsLoading(false);
  };

  const handleSubmit = useCallback(async (text: string, startFrame: File | null, endFrame: File | null, styleId: string, customStyleText: string, cameraTechniques: string[]) => {
    if (!startFrame) {
      setError('请至少上传起始帧。');
      setResult('');
      return;
    }
    if (styleId === 'custom' && !customStyleText) {
      setError('请输入自定义风格描述。');
      setResult('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult('');
    if (isInitialState) {
      setIsInitialState(false);
    }
    
    const initialProgress: ProgressStep[] = [
      { name: '分析输入内容...', status: 'pending' },
      { name: '构建专业提示词...', status: 'pending' },
      { name: '调用AI核心进行创作...', status: 'pending' },
      { name: '接收并解析结果...', status: 'pending' },
    ];
    setProgress(initialProgress);

    const onProgressUpdate = (stageIndex: number, status: ProgressStatus) => {
        setProgress(prev => {
            if (!prev) return null;
            const newProgress = [...prev];
            newProgress[stageIndex] = { ...newProgress[stageIndex], status };
            return newProgress;
        });
    };

    try {
      const description = await generateDescription(text, startFrame, endFrame, styleId, customStyleText, cameraTechniques, onProgressUpdate);
      setResult(description);
      addToHistory(description);
      if (styleId === 'custom' && customStyleText) {
        saveCustomStyle(customStyleText);
      }
      // Keep loading true for a moment to show final 'done' checkmark
      setTimeout(() => {
        setIsLoading(false);
        setProgress(null);
      }, 500); 
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误，请重试。';
      setError(`生成失败: ${errorMessage}`);
      console.error(err);
      setIsLoading(false);
    }
  }, [isInitialState, saveCustomStyle, addToHistory]);

  const handleToggleFuseMode = () => {
    setIsFuseMode(prev => !prev);
    setFuseSelection([]); // Reset selection when toggling mode
  };

  const handleStyleClick = (style: Style) => {
    if (isEditing) {
      setStyleToEdit(style);
      return; 
    }

    if (isFuseMode) {
      setFuseSelection(prev => {
        if (prev.includes(style.id)) {
          return prev.filter(id => id !== style.id); // Deselect
        }
        return [...prev, style.id]; // Select
      });
    } else {
      setSelectedStyleId(style.id);
      if (style.id === 'custom') {
        setCustomStyleText('');
      } else if (style.type === 'custom') {
        setCustomStyleText(style.description);
      }
    }
  };
  
  const handleConfirmFuse = useCallback(() => {
    if (fuseSelection.length < 2) {
        alert('请至少选择两个风格进行融合。');
        return;
    }
    const selectedStyles = allStyles.filter(s => fuseSelection.includes(s.id));
    const suggestedName = selectedStyles.map(s => s.name).join(' + ');
    setNewStyleName(suggestedName);
    setIsFuseModalOpen(true);
  }, [fuseSelection, allStyles]);

  const handleFuseStyles = useCallback(async () => {
    if (fuseSelection.length < 2 || !newStyleName.trim()) return;

    const stylesToFuse = allStyles.filter(s => fuseSelection.includes(s.id));
    if (stylesToFuse.length < 2) return;
    
    if (customStyles.some(style => style.name === newStyleName.trim())) {
        alert('该风格名称已存在。');
        return;
    }

    setIsLoading(true);
    setIsFuseModalOpen(false);
    setError(null);

    try {
      const fusedDescription = await fuseStyles(stylesToFuse.map(s => ({ name: s.name, description: s.description })));
      saveCustomStyle(fusedDescription, newStyleName);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误，请重试。';
      setError(`融合失败: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setFuseSelection([]);
      setNewStyleName('');
      setIsFuseMode(false);
    }
  }, [fuseSelection, newStyleName, allStyles, saveCustomStyle, customStyles]);

  const handleCloseFuseModal = () => {
      setIsFuseModalOpen(false);
  };
  
  const handleCloseEditModal = () => {
    setStyleToEdit(null);
  };
  
  const handleSaveStyleEdit = () => {
    if (!styleToEdit) return;

    const trimmedName = editedStyleName.trim();
    const trimmedDesc = editedStyleDesc.trim();

    if (!trimmedName || !trimmedDesc) return;
    
    if (customStyles.some(style => style.name === trimmedName && style.id !== styleToEdit.id)) {
        alert('该风格名称已存在。');
        return;
    }
    
    if (styleToEdit.type === 'preset' || styleToEdit.id === 'custom') {
        saveCustomStyle(trimmedDesc, trimmedName);
    } else {
        const newStyles = allStyles.map(style =>
            style.id === styleToEdit.id 
                ? { ...style, name: trimmedName, description: trimmedDesc } 
                : style
        );
        const newOrder = newStyles.map(s => s.id);
        saveCustomStylesAndOrder(newStyles, newOrder);
    }
    
    handleCloseEditModal();
  };


  const handleToggleEditMode = useCallback(() => {
    setIsEditing(prev => {
      const newValue = !prev;
      console.log(newValue ? '进入编辑模式，isEditing: true' : '退出编辑模式，isEditing: false');
      return newValue;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            AI 视频描述词生成器
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            上传起始与结束帧，描述变换过程，生成平滑过渡的视频创意。
          </p>
        </header>

        <main className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 transition-all duration-300">
          <InputArea 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
            styles={allStyles}
            selectedStyleId={selectedStyleId}
            setSelectedStyleId={setSelectedStyleId}
            customStyleText={customStyleText}
            setCustomStyleText={setCustomStyleText}
            cameraTechniques={cameraTechniques}
            selectedCameraTechniques={selectedCameraTechniques}
            setSelectedCameraTechniques={setSelectedCameraTechniques}
            onDeleteCustomStyle={deleteCustomStyle}
            onRenameCustomStyle={renameCustomStyle}
            isFuseMode={isFuseMode}
            onToggleFuseMode={handleToggleFuseMode}
            fuseSelection={fuseSelection}
            onStyleClick={handleStyleClick}
            onConfirmFuse={handleConfirmFuse}
            isEditing={isEditing}
            onToggleEditMode={handleToggleEditMode}
          />
          <ResultDisplay 
            isInitial={isInitialState} 
            isLoading={isLoading} 
            result={result} 
            loadingText={isLoading && isFuseMode ? 'AI 正在融合风格...' : 'AI 正在创作中...'}
            progress={progress}
            error={error}
            onCloseError={handleCloseProgressError}
          />
          <HistoryDisplay history={history} />
        </main>
        
        <footer className="text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-4">
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              <GithubIcon />
            </a>
            <p>由 Gemini 强力驱动</p>
          </div>
        </footer>
      </div>
       <Modal
        isOpen={isFuseModalOpen}
        onClose={handleCloseFuseModal}
        title="命名新风格"
      >
        <div className="flex flex-col gap-4">
            <p className="text-gray-400">请为融合后的新风格命名：</p>
            <input
                type="text"
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="例如：史诗感快速剪辑"
                className="w-full p-3 bg-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500"
            />
            <button
                onClick={handleFuseStyles}
                disabled={!newStyleName.trim()}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                创建并保存
            </button>
        </div>
      </Modal>
      <Modal
        isOpen={!!styleToEdit}
        onClose={handleCloseEditModal}
        title={styleToEdit?.type === 'preset' || styleToEdit?.id === 'custom' ? "另存为新风格" : "编辑风格"}
      >
        <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="styleName" className="block text-sm font-medium text-gray-400 mb-1">风格名称</label>
              <input
                id="styleName"
                type="text"
                value={editedStyleName}
                onChange={(e) => setEditedStyleName(e.target.value)}
                placeholder="为你的风格命名"
                className="w-full p-3 bg-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-300 placeholder-gray-500"
              />
            </div>
             <div>
                <label htmlFor="styleDesc" className="block text-sm font-medium text-gray-400 mb-1">风格描述 (AI提示词)</label>
                <textarea
                  id="styleDesc"
                  value={editedStyleDesc}
                  onChange={(e) => setEditedStyleDesc(e.target.value)}
                  placeholder="详细描述这个风格的关键词、动态和运镜..."
                  className="w-full h-32 p-3 bg-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none text-gray-300 placeholder-gray-500"
                />
            </div>
            <button
                onClick={handleSaveStyleEdit}
                disabled={!editedStyleName.trim() || !editedStyleDesc.trim()}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                保存
            </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;