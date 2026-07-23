import { Body, Controller, Post, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiSearchDto } from './dto/ai-search.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('search')
  search(@Body() body: AiSearchDto, @Req() req: any) {
    return this.aiService.search(body.query.trim(), Boolean(body.useAI), req.ip || 'anonymous');
  }
}
