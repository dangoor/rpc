


export function hasChromeExtensionApi(): boolean;
export function isContentScript(): boolean;
export function sendRuntimeMessage(payload: any, cb?: (...args: any) => any): void;
export function sendMessageToTab(tabId: number, payload: any, cb?: (...args: any) => any): void;
export function warnIfErrorCb(): (...args: any) => void;
export function addMessageListener(listener: (payload: any, sender: any) => void): void;
export function removeMessageListener(listener: (payload: any, sender: any) => void): void;
export function getChromeRuntimeId(): string;