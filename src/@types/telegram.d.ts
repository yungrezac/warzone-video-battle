
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            auth_date: number;
            hash: string;
          };
        };
      };
    };
  }
}

export {};
