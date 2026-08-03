import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updateProfile(req: any, dto: UpdateUserDto): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getAddresses(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    createAddress(req: any, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(): Promise<{
        success: boolean;
        data: any;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: any;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
