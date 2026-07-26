import { DataSource } from 'typeorm';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
export declare class UsersService {
    private dataSource;
    constructor(dataSource: DataSource);
    findAll(): Promise<{
        success: boolean;
        data: any;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: any;
    }>;
    updateProfile(userId: number, dto: UpdateUserDto): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
