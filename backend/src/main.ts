import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS cho phép Frontend kết nối
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Chạy backend ở port 3001 để tránh trùng với ReactJS
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  await app.listen(Number(process.env.PORT) || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
