import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthService implements OnModuleInit {
    private jwtService;
    private dataSource;
    private readonly attempts;
    constructor(jwtService: JwtService, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    register(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        token: string;
        user: {
            id: any;
            name: string;
            email: string;
            role: string;
        };
    }>;
    login(email: string, password: string): Promise<{
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
    validateToken(token: string): Promise<any>;
    private recordFailure;
    private logLogin;
}
