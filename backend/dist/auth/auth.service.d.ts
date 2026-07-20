import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    register(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        success: boolean;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }>;
    validateToken(token: string): Promise<any>;
}
