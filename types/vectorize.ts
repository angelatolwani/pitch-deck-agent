export interface VectorizeDocument {
  chunk_id: string;
  id: string;
  org_id: string;
  origin: string;
  origin_id: string;
  pipeline_id: string;
  similarity: number;
  source: string;
  source_display_name: string;
  text: string;
  total_chunks: string;
  unique_source: string;
  relevancy: number;
}

export interface VectorizeResponse {
  question: string;
  documents: VectorizeDocument[];
  averageRelevancy: number;
  ndcg: number;
} 