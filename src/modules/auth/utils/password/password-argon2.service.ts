import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IPasswordService } from './password.interface';

@Injectable()
export class PasswordArgon2Service implements IPasswordService {
    async hash(password: string): Promise<string> {
        try {
            return await argon2.hash(password);
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to hash password: ${error.message}`);
            }
            throw new Error('Failed to hash password: Unknown error');
        }
    }

    async verify(hash: string, plainPassword: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, plainPassword);
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to verify password: ${error.message}`);
            }
            throw new Error('Failed to verify password: Unknown error');
        }
    }
}
