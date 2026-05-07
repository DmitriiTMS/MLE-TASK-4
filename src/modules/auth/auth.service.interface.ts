import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IGetMe } from './types/types';
import { Tokens } from './utils/jwt/jwt.service';

export interface IAuthService {
    register(data: RegisterDto): Promise<Tokens>;
    login(data: LoginDto): Promise<Tokens>;
    getMe(id: number): Promise<IGetMe>;
    refreshTokens(refreshToken: string): Promise<Tokens>;
}
