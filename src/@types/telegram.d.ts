
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      allows_write_to_pm?: boolean;
      is_premium?: boolean;
    };
    receiver?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    chat?: {
      id: number;
      type: string;
      title: string;
      username?: string;
      photo_url?: string;
    };
    chat_type?: string;
    chat_instance?: string;
    start_param?: string;
    can_send_after?: number;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText(text: string): void;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  
  BackButton: {
    isVisible: boolean;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
    show(): void;
    hide(): void;
  };
  
  SettingsButton: {
    isVisible: boolean;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
    show(): void;
    hide(): void;
  };
  
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  
  CloudStorage: {
    setItem(key: string, value: string, callback?: (error: string | null, success: boolean) => void): void;
    getItem(key: string, callback: (error: string | null, value: string | null) => void): void;
    getItems(keys: string[], callback: (error: string | null, values: { [key: string]: string }) => void): void;
    removeItem(key: string, callback?: (error: string | null, success: boolean) => void): void;
    removeItems(keys: string[], callback?: (error: string | null, success: boolean) => void): void;
    getKeys(callback: (error: string | null, keys: string[]) => void): void;
  };
  
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void): void;
  
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void): void;
  
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  
  showScanQrPopup(params: {
    text?: string;
  }, callback?: (text: string) => void): void;
  
  closeScanQrPopup(): void;
  
  readTextFromClipboard(callback?: (text: string) => void): void;
  
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (shared: boolean) => void): void;
  
  shareToStory(media_url: string, params?: {
    text?: string;
    widget_link?: {
      url: string;
      name?: string;
    };
  }): void;
  
  onEvent(eventType: 'themeChanged' | 'viewportChanged' | 'mainButtonClicked' | 'backButtonClicked' | 'settingsButtonClicked' | 'invoiceClosed' | 'popupClosed' | 'qrTextReceived' | 'clipboardTextReceived' | 'writeAccessRequested' | 'contactRequested', eventHandler: (eventData?: any) => void): void;
  offEvent(eventType: string, eventHandler: (eventData?: any) => void): void;
  
  sendData(data: string): void;
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
