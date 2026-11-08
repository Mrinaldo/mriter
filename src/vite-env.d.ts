/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    saveProject: (data: { defaultPath?: string; data: any }) => Promise<{ canceled: boolean; filePath?: string }>;
    openProject: () => Promise<{ canceled: boolean; filePath?: string; data?: any }>;
    saveFile: (data: { filePath: string; content: string; isBinary?: boolean }) => Promise<boolean>;
    showSaveFileDialog: (options: {
      title: string;
      defaultName: string;
      filters: Array<{ name: string; extensions: string[] }>;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
    printToPDF: (options: any) => Promise<string | null>;
    minimizeWindow?: () => Promise<boolean>;
    maximizeWindow?: () => Promise<boolean>;
    closeWindow?: () => Promise<boolean>;
    isWindowMaximized?: () => Promise<boolean>;
    onWindowMaximizedChange?: (callback: (isMaximized: boolean) => void) => (() => void) | void;
    isWindowFullScreen?: () => Promise<boolean>;
    onWindowFullScreenChange?: (callback: (isFullScreen: boolean) => void) => (() => void) | void;
    onMenuAction?: (callback: (action: string) => void) => (() => void) | void;
    platform?: string;
    onMainMessage: (callback: (message: string) => void) => void;
  };
}
