import { expect } from 'chai';
import { Validator } from '../src/utils/Validator';

describe('Validator Utils', () => {

    describe('isEmpty', () => {
        it('should return true for empty string', () => {
            expect(Validator.isEmpty('')).to.be.true;
        });

        it('should return true for null or undefined', () => {
            expect(Validator.isEmpty(undefined)).to.be.true;
        });

        it('should return false for valid string', () => {
            expect(Validator.isEmpty('hello')).to.be.false;
        });
    });

    describe('isEmail', () => {
        it('should return true for valid email', () => {
            expect(Validator.isEmail('test@example.com')).to.be.true;
        });

        it('should return false for invalid email', () => {
            expect(Validator.isEmail('invalid-email')).to.be.false;
        });
    });

    describe('isPasswordStrong', () => {
        it('should return true for strong password', () => {
            expect(Validator.isPasswordStrong('StrongP@ss1')).to.be.true;
        });

        it('should return false for weak password (too short)', () => {
            expect(Validator.isPasswordStrong('Weak1!')).to.be.false;
        });

        it('should return false for weak password (no number)', () => {
            expect(Validator.isPasswordStrong('NoNumberAndSpecial!')).to.be.false;
        });

        it('should return false for password without uppercase', () => {
            expect(Validator.isPasswordStrong('weakpass1!')).to.be.false;
        });

        it('should return false for password without lowercase', () => {
            expect(Validator.isPasswordStrong('WEAKPASS1!')).to.be.false;
        });
    });

});
