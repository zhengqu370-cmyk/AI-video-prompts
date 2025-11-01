
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon, SparklesIcon, CloseIcon, EditIcon, CheckIcon } from './Icons';
import type { Style } from '../App';
import { cameraTechniques as allCameraTechniques } from '../App';

interface InputAreaProps {
  onSubmit: (text: string, startFrame: File | null, endFrame: File | null, styleId: string, customStyleText: string, cameraTechniques: string[]) => void;
  isLoading: boolean;
  styles: Style[];
  selectedStyleId: string;
  setSelectedStyleId: (id: string) => void;
  customStyleText: string;
  setCustomStyleText: (text: string) => void;
  cameraTechniques: { id: string, name: string }[];
  selectedCameraTechniques: string[];
  setSelectedCameraTechniques: (techniques: string[]) => void;
  onDeleteCustomStyle: (id: string) => void;
  onRenameCustomStyle: (id: string, newName: string) => void;
  isFuseMode: boolean;
  onToggleFuseMode: () => void;
  fuseSelection: string[];
  onStyleClick: (style: Style) => void;
  onConfirmFuse: () => void;
  isEditing: boolean;
  onToggleEditMode: () => void;
}

const MultiSelectTags: React.FC<{
    options: { id: string; name: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
    disabled?: boolean;
}> = ({ options, selected, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const availableOptions = options.filter(opt => opt.id !== 'auto' && !selected.includes(opt.id));
    const selectedOptions = selected.map(id => options.find(opt => opt.id === id)).filter(Boolean);

    const handleSelect = (optionId: string) => {
        onChange([...selected, optionId]);
    };

    const handleDeselect = (optionId: string) => {
        onChange(selected.filter(id => id !== optionId));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex flex-wrap items-center gap-2 w-full p-2 bg-gray-900 border-2 border-gray-700 rounded-lg transition-colors min-h-[48px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500'}`}
            >
                {selectedOptions.length === 0 && <span className="text-gray-500 px-2">{placeholder}</span>}
                {selectedOptions.map(option => option && (
                    <div key={option.id} className="flex items-center gap-1 bg-purple-800 text-purple-100 text-sm font-medium px-2 py-1 rounded">
                        <span>{option.name}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeselect(option.id);
                            }}
                            className="text-purple-200 hover:text-white"
                            aria-label={`移除 ${option.name}`}
                        >
                            <CloseIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
            </div>
            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableOptions.length > 0 ? availableOptions.map(option => (
                        <div
                            key={option.id}
                            onClick={() => {
                                handleSelect(option.id);
                                setIsOpen(false);
                            }}
                            className="px-4 py-2 text-gray-300 hover:bg-purple-600 cursor-pointer"
                        >
                            {option.name}
                        </div>
                    )) : <div className="px-4 py-2 text-gray-500">无可用的选项</div>}
                </div>
            )}
        </div>
    );
};

const ImageUploadBox: React.FC<{
  label: string;
  imagePreview: string | null;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
  disabled?: boolean;
}> = ({ label, imagePreview, onFileChange, onClear, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileChange(file || null);
  };
  
  const triggerFileSelect = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div 
      onClick={!imagePreview ? triggerFileSelect : undefined}
      className={`relative w-full p-4 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors ${!imagePreview && !disabled ? 'cursor-pointer hover:border-purple-500 hover:text-purple-400' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={disabled}
      />
       <span className="absolute top-2 left-3 text-xs font-bold text-gray-500 bg-gray-800 px-1">{label}</span>
      {imagePreview ? (
        <div className="relative w-full max-w-xs">
          <img src={imagePreview} alt={`${label} preview`} className="rounded-lg max-h-32 w-auto mx-auto" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold hover:bg-red-700 transition-transform transform hover:scale-110"
            disabled={disabled}
            aria-label={`清除${label}`}
          >
            &times;
          </button>
        </div>
      ) : (
        <>
          <UploadIcon />
          <p className="mt-2 text-sm">{label}</p>
        </>
      )}
    </div>
  );
};


export const InputArea: React.FC<InputAreaProps> = ({ 
  onSubmit, 
  isLoading, 
  styles, 
  selectedStyleId,
  customStyleText,
  setCustomStyleText,
  cameraTechniques,
  selectedCameraTechniques,
  setSelectedCameraTechniques,
  onDeleteCustomStyle, 
  onRenameCustomStyle,
  isFuseMode,
  onToggleFuseMode,
  fuseSelection,
  onStyleClick,
  onConfirmFuse,
  isEditing,
  onToggleEditMode,
}) => {
  const [text, setText] = useState<string>('');
  const [startFrameFile, setStartFrameFile] = useState<File | null>(null);
  const [startFramePreview, setStartFramePreview] = useState<string | null>(null);
  const [endFrameFile, setEndFrameFile] = useState<File | null>(null);
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null);
  
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const handleFileChange = (file: File | null, type: 'start' | 'end') => {
    if (type === 'start') {
        setStartFrameFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setStartFramePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setStartFramePreview(null);
        }
    } else {
        setEndFrameFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEndFramePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setEndFramePreview(null);
        }
    }
  };

  const handleClearImage = (type: 'start' | 'end') => {
    if (type === 'start') {
      handleFileChange(null, 'start');
    } else {
      handleFileChange(null, 'end');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text, startFrameFile, endFrameFile, selectedStyleId, customStyleText, selectedCameraTechniques);
  };

  const handleDeleteCustomStyle = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteCustomStyle(id);
  };

  const handleStartEditing = (style: Style) => {
    setEditingStyleId(style.id);
    setEditingText(style.name);
  };

  const handleCancelEditing = () => {
    setEditingStyleId(null);
    setEditingText('');
  };

  const handleSaveRename = () => {
    if (editingStyleId) {
      onRenameCustomStyle(editingStyleId, editingText);
    }
    handleCancelEditing();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveRename();
    } else if (event.key === 'Escape') {
      handleCancelEditing();
    }
  };
  
  const isFormDisabled = isLoading || isFuseMode;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="描述变换过程或动态效果，例如：魔法般地变换..."
          className="w-full h-28 p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none text-gray-300 placeholder-gray-500"
          disabled={isFormDisabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploadBox
            label="起始帧 (Start Frame)"
            imagePreview={startFramePreview}
            onFileChange={(file) => handleFileChange(file, 'start')}
            onClear={() => handleClearImage('start')}
            disabled={isFormDisabled}
        />
        <ImageUploadBox
            label="结束帧 (End Frame)"
            imagePreview={endFramePreview}
            onFileChange={(file) => handleFileChange(file, 'end')}
            onClear={() => handleClearImage('end')}
            disabled={isFormDisabled}
        />
      </div>


      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-400">指定运镜技巧 (可多选)</label>
        <MultiSelectTags
          options={allCameraTechniques}
          selected={selectedCameraTechniques}
          onChange={setSelectedCameraTechniques}
          placeholder="点击选择或组合运镜技巧..."
          disabled={isFormDisabled}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-400">选择动态风格</label>
           <div className="flex items-center gap-2">
            {isFuseMode ? (
              <>
                <button
                  type="button"
                  onClick={onConfirmFuse}
                  disabled={isLoading || fuseSelection.length < 2}
                  className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon />
                  确认融合
                </button>
                <button
                  type="button"
                  onClick={onToggleFuseMode}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50"
                >
                  <CloseIcon className="w-4 h-4" />
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onToggleEditMode}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <CloseIcon className="w-4 h-4" />
                      取消编辑
                    </>
                  ) : (
                    <>
                      <EditIcon className="w-4 h-4" />
                      编辑风格
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onToggleFuseMode}
                  disabled={isLoading || isEditing}
                  className="flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50"
                >
                  <SparklesIcon />
                  开始融合
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {styles.map(style => {
              const isSelectedForFuse = fuseSelection.includes(style.id);
              return (
                <div 
                  key={style.id}
                  className="relative group flex-shrink-0"
                  title={style.description}
                >
                  {editingStyleId === style.id ? (
                    <div className="flex items-center gap-1 bg-gray-700 rounded-lg pr-1 min-w-[120px]">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveRename}
                        autoFocus
                        className="pl-4 py-2 text-sm bg-gray-900 border-2 border-purple-500 rounded-l-lg focus:outline-none text-white w-40"
                      />
                      <button type="button" onClick={handleSaveRename} className="p-1 rounded-full text-green-400 hover:bg-green-500/20"><CheckIcon /></button>
                      <button type="button" onClick={handleCancelEditing} className="p-1 rounded-full text-gray-400 hover:bg-red-500/20"><CloseIcon className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onStyleClick(style)}
                        disabled={isLoading}
                        className={`min-w-[120px] justify-center text-center px-4 py-2 text-sm rounded-lg transition-all duration-200 w-full
                          ${ isEditing 
                              ? 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800 hover:ring-blue-500'
                              : isFuseMode 
                                ? `transform-gpu hover:scale-105 ${isSelectedForFuse 
                                    ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-yellow-400 scale-105' 
                                    : ''
                                }`
                                : ''
                          }
                          ${ selectedStyleId === style.id && !isFuseMode && !isEditing ? 'bg-purple-600 text-white font-semibold shadow-lg' : 
                            style.type === 'custom' ? (selectedStyleId === style.id && !isFuseMode && !isEditing ? 'bg-teal-600 text-white font-semibold shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600') :
                            style.id === 'custom' ? 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700' :
                            'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }
                        `}
                      >
                        <span className="truncate block">{style.name}</span>
                      </button>
                      {style.type === 'custom' && !isFuseMode && !isEditing && (
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-700 rounded-r-lg h-full">
                          <button
                            type="button"
                            onClick={() => handleStartEditing(style)}
                            disabled={isLoading}
                            className="p-2 h-full rounded-l-none text-gray-400 hover:bg-gray-600 hover:text-white"
                            aria-label={`重命名风格 "${style.name}"`}
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomStyle(e, style.id)}
                            disabled={isLoading}
                            className="p-2 h-full rounded-r-lg text-gray-400 hover:bg-red-500 hover:text-white"
                            aria-label={`删除风格 "${style.name}"`}
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
          })}
        </div>
        {selectedStyleId === 'custom' && !isFuseMode && (
          <div className="relative mt-2">
            <textarea
              value={customStyleText}
              onChange={(e) => setCustomStyleText(e.target.value)}
              placeholder="请详细描述您想要的风格，例如：像王家卫电影那样，充满情绪和氛围感..."
              className="w-full h-20 p-3 bg-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none text-gray-300 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isFormDisabled || !startFrameFile}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading && !isFuseMode ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>处理中...</span>
          </>
        ) : (
          <>
            <SparklesIcon />
            <span>生成描述词</span>
          </>
        )}
      </button>
    </form>
  );
};
