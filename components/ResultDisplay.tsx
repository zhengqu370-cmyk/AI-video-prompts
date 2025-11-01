import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon } from './Icons';
import type { ProgressStep } from '../App';

interface ResultDisplayProps {
  isInitial: boolean;
  isLoading: boolean;
  result: string;
  loadingText?: string;
  progress: ProgressStep[] | null;
  error: string | null;
  onCloseError: () => void;
}

const InitialMessage: React.FC = () => (
    <div className="text-left text-gray-400 space-y-4">
        <p className="font-bold text-lg text-gray-300">您好！欢迎使用AI视频描述词生成服务。</p>
        <p>请上传图片或描述您想要生成的AI视频内容，我会根据您的输入生成符合平台标准的描述词。</p>
        <p>请确保您的描述具体、详细，以便我为您提供更准确的服务。</p>
        <p className="text-sm text-gray-500">
            请注意，生成的描述词中将不包含任何违禁内容，包括但不限于色情、暴力、恐怖、种族歧视、政治敏感内容、水印、模糊、失焦、运动模糊、血腥、虐行动物、非法活动、毒品、武器、宗教极端主义、恐怖主义、虚假信息、误导性内容、侵犯版权、侵犯隐私等。
        </p>
    </div>
);

const LoadingState: React.FC<{text: string}> = ({ text }) => (
    <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg animate-pulse">{text}</p>
    </div>
);

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" aria-label="进行中"></div>
);

const DoneIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="已完成">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FailedIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="失败">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PendingIcon: React.FC = () => (
    <div className="w-5 h-5 border-2 border-gray-600 rounded-full" aria-label="等待中"></div>
);

const ProgressTracker: React.FC<{ progress: ProgressStep[]; error: string | null; onClose: () => void; }> = ({ progress, error, onClose }) => {
    const hasError = !!error;

    const getStatusIcon = (status: ProgressStep['status']) => {
        switch (status) {
            case 'in-progress':
                return <LoadingSpinner />;
            case 'done':
                return <DoneIcon />;
            case 'failed':
                return <FailedIcon />;
            case 'pending':
                return <PendingIcon />;
        }
    };
    
    // Don't render anything if there's no progress and no error.
    if (!progress?.length && !error) return null;

    return (
        <div className="w-full max-w-md flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
                {hasError ? '生成出错' : 'AI 正在创作中...'}
            </h3>
            {progress?.length > 0 && (
                <ul className="w-full space-y-3">
                    {progress.map((step, index) => (
                        <li key={index} className="flex items-center justify-between text-gray-400 transition-colors duration-300">
                            <span className={`
                                ${step.status === 'in-progress' ? 'text-purple-300 animate-pulse' : ''} 
                                ${step.status === 'done' ? 'text-gray-300' : ''} 
                                ${step.status === 'failed' ? 'text-red-400 font-semibold' : ''}
                            `}>
                                {step.name}
                            </span>
                            {getStatusIcon(step.status)}
                        </li>
                    ))}
                </ul>
            )}
            {hasError && (
                <div className="w-full mt-6 text-center">
                    <div className="text-red-300 bg-red-900/50 p-3 rounded-lg text-sm text-left whitespace-pre-wrap break-words font-sans">
                        <p className="font-bold mb-1">错误详情:</p>
                        {error.replace('生成失败: ', '')}
                    </div>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-semibold">
                        关闭
                    </button>
                </div>
            )}
        </div>
    );
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ isInitial, isLoading, result, loadingText = 'AI 正在创作中，请稍候...', progress, error, onCloseError }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);
    
    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
        }
    };
    
    const renderContent = () => {
        // Priority 1: Handle error states (validation or during generation)
        if (error) {
            return <ProgressTracker progress={progress} error={error} onClose={onCloseError} />;
        }

        // Priority 2: Handle loading states
        if (isLoading) {
            if (progress) {
                return <ProgressTracker progress={progress} error={null} onClose={onCloseError} />;
            }
            // Fallback for other loading modes like fusing
            return <LoadingState text={loadingText} />;
        }
        
        // Priority 3: Display result
        if (result) {
            return (
                <div className="relative w-full">
                    <pre className="whitespace-pre-wrap break-words font-sans text-gray-300 bg-gray-900 p-4 rounded-lg">
                        {result}
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        aria-label="复制到剪贴板"
                    >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                </div>
            );
        }

        // Priority 4: Initial welcome message
        if (isInitial) {
             return <InitialMessage />;
        }

        // Fallback empty state
        return null;
    };

    return (
        <div className="w-full min-h-[200px] bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex items-center justify-center">
            {renderContent()}
        </div>
    );
};