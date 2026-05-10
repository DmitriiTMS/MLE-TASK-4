import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';

export interface IUsersService {
    create(createUserDto: CreateUserDto): Promise<UserEntity>;
}
