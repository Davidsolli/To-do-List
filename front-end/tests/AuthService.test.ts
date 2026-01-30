import { expect } from 'chai';
import { AuthService } from '../src/services/AuthService';
import { ApiService } from '../src/services/ApiService';

// Mock do LocalStorage
class LocalStorageMock {
    private store: { [key: string]: string } = {};

    getItem(key: string) {
        return this.store[key] || null;
    }

    setItem(key: string, value: string) {
        this.store[key] = value.toString();
    }

    removeItem(key: string) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

// Injetando no global
(global as any).localStorage = new LocalStorageMock();

describe('AuthService', () => {
    let originalPost: any;

    before(() => {
        // Salva o método original para restaurar depois
        originalPost = ApiService.post;
    });

    after(() => {
        ApiService.post = originalPost;
    });

    beforeEach(() => {
        localStorage.clear();
    });

    describe('isAuthenticated', () => {
        it('should return false if no user in localStorage', () => {
            expect(AuthService.isAuthenticated()).to.be.false;
        });

        it('should return true if user exists in localStorage', () => {
            localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Lucas' }));
            expect(AuthService.isAuthenticated()).to.be.true;
        });
    });

    describe('login', () => {
        it('should store user in localStorage on successful login', async () => {
            const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };

            // Mockando ApiService.post
            ApiService.post = async <T>() => {
                return { message: 'ok', user: mockUser } as unknown as T;
            };

            const user = await AuthService.login('email@test.com', '123456');

            expect(user).to.deep.equal(mockUser);
            expect(localStorage.getItem('user')).to.equal(JSON.stringify(mockUser));
        });
    });

    describe('logout', () => {
        it('should remove user from localStorage', async () => {
            localStorage.setItem('user', 'some-data');

            // Mockando ApiService.post (logout não retorna nada relevante aqui)
            ApiService.post = async <T>() => { return undefined as unknown as T; };

            await AuthService.logout();

            expect(localStorage.getItem('user')).to.be.null;
        });
    });
});
