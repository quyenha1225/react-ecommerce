import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }>;
}
