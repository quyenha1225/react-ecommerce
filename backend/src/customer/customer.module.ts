import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [AuthModule],
  controllers: [CustomerController],
  providers: [CustomerService, JwtAuthGuard],
})
export class CustomerModule {}
