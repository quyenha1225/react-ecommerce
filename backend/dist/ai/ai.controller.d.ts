import { AiService } from './ai.service';
import { AiSearchDto } from './dto/ai-search.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    search(body: AiSearchDto, req: any): Promise<import("./models/ai-search.model").AiSearchResultModel>;
}
