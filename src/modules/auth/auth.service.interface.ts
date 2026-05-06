import { RegisterDto } from './dto/register.dto';
import { Tokens } from './utils/jwt/jwt.service';

export interface IAuthService {
    register(data: RegisterDto): Promise<Tokens>,
}
