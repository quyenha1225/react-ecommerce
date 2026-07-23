import { HttpException, HttpStatus, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AiSearchResultModel } from './models/ai-search.model';

type ProductRow = {
  id: number; slug: string; name: string; price: number; category: string;
  brand: string | null; image_url: string | null; description: string | null;
  stock: number;
};

@Injectable()
export class AiService {
  private readonly requests = new Map<string, { count: number; resetAt: number }>();
  private catalogCache: { data: ProductRow[]; expiresAt: number } | null = null;
  private readonly answerCache = new Map<string, { data: AiSearchResultModel; expiresAt: number }>();
  constructor(private readonly db: DataSource, private readonly config: ConfigService) {}

  async search(query: string, useAI: boolean, clientKey: string): Promise<AiSearchResultModel> {
    const startedAt=Date.now();
    this.checkRateLimit(clientKey, useAI ? 12 : 60);
    const cacheKey=`${useAI?'ai':'standard'}:${this.normalize(query)}`;
    const cached=this.answerCache.get(cacheKey);
    if(cached&&cached.expiresAt>Date.now()) return {...cached.data,latencyMs:Date.now()-startedAt};
    const catalog=await this.getCatalog();

    if (!useAI) {
      const normalized=this.normalize(query), tokens=normalized.split(/\s+/).filter(x=>x.length>1);
      const products=catalog.map(p=>({p,score:this.score(p,tokens,normalized)})).filter(x=>x.score>0)
        .sort((a,b)=>b.score-a.score).slice(0,10).map(x=>this.publicProduct(x.p));
      const result:AiSearchResultModel={mode:'standard',query,products,total:products.length,latencyMs:Date.now()-startedAt};
      this.setAnswerCache(cacheKey,result,60_000);return result;
    }

    const apiKey=this.config.get<string>('GEMINI_API_KEY');
    let result:AiSearchResultModel;
    if(!apiKey) result=this.heuristicRecommendation(query,catalog);
    else try{result=await this.withDeadline(this.geminiRecommendation(query,this.prefilterCatalog(query,catalog),apiKey),5_000)}catch(error){console.warn('Gemini fallback:',error instanceof Error?error.message:'unknown');result=this.heuristicRecommendation(query,catalog)}
    result.latencyMs=Date.now()-startedAt;this.setAnswerCache(cacheKey,result,result.aiAvailable?180_000:30_000);return result;
  }

  private async getCatalog():Promise<ProductRow[]>{
    if(this.catalogCache&&this.catalogCache.expiresAt>Date.now()) return this.catalogCache.data;
    const data:ProductRow[]=await this.db.query(`
      SELECT p.product_id id,p.product_slug slug,p.product_name name,p.base_price price,
             c.category_name category,b.brand_name brand,pi.image_url,p.product_description description,
             COALESCE(v.current_stock,0) stock
      FROM products p
      JOIN categories c ON c.category_id=p.category_id
      LEFT JOIN brands b ON b.brand_id=p.brand_id
      LEFT JOIN product_images pi ON pi.product_id=p.product_id AND pi.is_thumbnail=TRUE
      LEFT JOIN vw_product_stock v ON v.product_id=p.product_id
      WHERE p.product_status='ACTIVE'
      ORDER BY p.created_at DESC LIMIT 100`);
    this.catalogCache={data,expiresAt:Date.now()+30_000};return data;
  }

  private async geminiRecommendation(query:string,catalog:ProductRow[],apiKey:string):Promise<AiSearchResultModel> {
    const model=this.config.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';
    const safeCatalog=catalog.map(p=>({id:Number(p.id),name:p.name,category:p.category,brand:p.brand,price:Number(p.price),stock:Number(p.stock),description:p.description?.slice(0,90)}));
    const prompt=`Tư vấn mua hàng bằng tiếng Việt, chỉ dùng catalog. Chọn tối đa 4 ID đúng nhu cầu/ngân sách, ưu tiên còn hàng. Summary tối đa 2 câu, mỗi criteria tối đa 8 từ. Không bịa dữ liệu.\nNhu cầu: ${query}\nCatalog: ${JSON.stringify(safeCatalog)}`;
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:AbortSignal.timeout(7000),
      body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,maxOutputTokens:512,thinkingConfig:{thinkingLevel:'LOW'},responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{summary:{type:'STRING'},productIds:{type:'ARRAY',items:{type:'INTEGER'},maxItems:4},criteria:{type:'ARRAY',items:{type:'STRING'},maxItems:4}},required:['summary','productIds','criteria']}}})
    });
    if(!response.ok){const detail=await response.text();console.error('Gemini error',response.status,detail.slice(0,300));throw new ServiceUnavailableException('Gemini đang bận, vui lòng thử lại');}
    const data:any=await response.json();const text=data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('')||'{}';
    let parsed:any;try{parsed=JSON.parse(text)}catch{throw new ServiceUnavailableException('Gemini trả về dữ liệu không hợp lệ')}
    const ids:number[]=[...new Set<number>((Array.isArray(parsed.productIds)?parsed.productIds:[]).map((id:any)=>Number(id)))].slice(0,5);
    const byId=new Map(catalog.map(p=>[Number(p.id),p]));const products=ids.map(id=>byId.get(id)).filter(Boolean).map(p=>this.publicProduct(p!));
    return {mode:'ai',provider:'gemini',aiAvailable:true,query,summary:this.compactText(parsed.summary,220),criteria:Array.isArray(parsed.criteria)?parsed.criteria.slice(0,4).map((x:any)=>this.compactText(x,60)):[],products,latencyMs:0};
  }

  private heuristicRecommendation(query:string,catalog:ProductRow[]):AiSearchResultModel{
    const normalized=this.normalize(query),tokens=normalized.split(/\s+/).filter(x=>x.length>1);const millions=normalized.match(/(\d{1,3})\s*(?:trieu|tr)/);const budget=millions?Number(millions[1])*1_000_000:null;const minimumBudget=/(?:tren|tu)\s*\d/.test(normalized);
    const ranked=catalog.map(p=>{let score=this.score(p,tokens,normalized);const category=this.normalize(p.category);if(normalized.includes(category))score+=20;if(budget&&(minimumBudget?Number(p.price)>=budget:Number(p.price)<=budget))score+=10;if(budget&&(minimumBudget?Number(p.price)<budget:Number(p.price)>budget))score-=8;if(Number(p.stock)>0)score+=2;return{p,score}}).sort((a,b)=>b.score-a.score).slice(0,5);
    return {mode:'ai',provider:'local-fallback',aiAvailable:false,query,summary:'Gợi ý nhanh theo nhu cầu, ngân sách và tồn kho hiện tại.',criteria:[budget?`${minimumBudget?'Giá từ':'Ngân sách đến'} ${budget.toLocaleString('vi-VN')} ₫`:'Phù hợp từ khóa','Ưu tiên còn hàng'],products:ranked.map(x=>this.publicProduct(x.p)),latencyMs:0};
  }

  private prefilterCatalog(query:string,catalog:ProductRow[]){const normalized=this.normalize(query),tokens=normalized.split(/\s+/).filter(x=>x.length>1),ranked=catalog.map(p=>({p,score:this.score(p,tokens,normalized)+(Number(p.stock)>0?1:0)})).sort((a,b)=>b.score-a.score);const relevant=ranked.filter(x=>x.score>1);return (relevant.length>=8?relevant:ranked).slice(0,24).map(x=>x.p);}
  private compactText(value:any,max:number){const text=String(value||'').replace(/\s+/g,' ').trim();return text.length>max?`${text.slice(0,max-1).trim()}…`:text;}
  private setAnswerCache(key:string,data:AiSearchResultModel,ttl:number){if(this.answerCache.size>100)this.answerCache.clear();this.answerCache.set(key,{data,expiresAt:Date.now()+ttl});}
  private async withDeadline<T>(task:Promise<T>,milliseconds:number):Promise<T>{let timer:NodeJS.Timeout;const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Gemini timeout')),milliseconds)});try{return await Promise.race([task,timeout])}finally{clearTimeout(timer!);}}

  private score(p:ProductRow,tokens:string[],full:string){const hay=this.normalize(`${p.name} ${p.category} ${p.brand||''} ${p.description||''}`);let score=hay.includes(full)?20:0;for(const token of tokens)if(hay.includes(token))score+=token.length>5?4:2;return score;}
  private normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  private publicProduct(p:ProductRow){return{id:Number(p.id),slug:p.slug,name:p.name,price:Number(p.price),category:p.category,brand:p.brand,image_url:p.image_url,stock:Number(p.stock)};}
  private checkRateLimit(key:string,limit:number){const now=Date.now(),current=this.requests.get(key);if(current&&current.resetAt>now&&current.count>=limit)throw new HttpException('Bạn tìm kiếm quá nhanh, vui lòng đợi một phút',HttpStatus.TOO_MANY_REQUESTS);this.requests.set(key,current&&current.resetAt>now?{...current,count:current.count+1}:{count:1,resetAt:now+60_000});}
}
