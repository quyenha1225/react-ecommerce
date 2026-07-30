export interface AiProductModel {
  id: number;
  slug: string;
  name: string;
  price: number;
  category: string;
  brand: string | null;
  image_url: string | null;
  stock: number;
}

export interface AiSearchResultModel {
  mode: 'ai' | 'standard';
  provider?: 'gemini' | 'local-fallback';
  aiAvailable?: boolean;
  query: string;
  summary?: string;
  criteria?: string[];
  products: AiProductModel[];
  total?: number;
  latencyMs: number;
}
