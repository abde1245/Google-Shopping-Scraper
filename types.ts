
export interface Product {
  title: string;
  price_current: string;
  price_original: string | null;
  seller: string;
  rating_score: string | null;
  review_count: string | null;
  product_link: string | null;
  image_url: string | null;
}

export interface ParsedQuery {
  base_query: string;
  filters: string[];
}

export interface AvailableFilters {
  [category: string]: string[];
}
