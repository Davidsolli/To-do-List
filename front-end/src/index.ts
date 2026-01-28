import './styles/main.css';
import { app } from './App';
import { toast } from './services/ToastService';

(window as any).toast = toast;

document.addEventListener('DOMContentLoaded', () => {
    app.start();
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        const link = target.closest('a[data-link]') as HTMLAnchorElement | null;

        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) app.navigate(href);
        }
    });
});