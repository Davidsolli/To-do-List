

import { ToastService } from '../services/ToastService';

declare global {
    interface Window {
        toast: ToastService;
    }
    const toast: ToastService;

    namespace NodeJS {
        interface ProcessEnv {
            API_URL: string;
        }
    }
}