import { UserEntity } from './domain/user.entity';
import { CreateUserDto } from './dto/create-user.dto';


export interface IUsersService {
    create(createUserDto: CreateUserDto): Promise<UserEntity>;
}
