import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, JwtAuthGuard],
})
export class CartModule {}
