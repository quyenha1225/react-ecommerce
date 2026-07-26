import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: any;
            name: string;
            email: string;
            role: string;
            permissions: never[];
        };
    }>;
    login(body: LoginDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            permissions: any;
        };
    }>;
}
