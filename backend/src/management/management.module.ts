import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

@Module({imports:[AuthModule],controllers:[ManagementController],providers:[ManagementService,JwtAuthGuard]})
export class ManagementModule{}
