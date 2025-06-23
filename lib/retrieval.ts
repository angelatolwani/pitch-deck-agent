import { VectorizeService } from "@/lib/vectorize";

export class RetrievalService {
  private vectorizeService: VectorizeService;

  constructor() {
    this.vectorizeService = new VectorizeService();
  }

  async searchDocuments(query: string): Promise<string> {
    try {
      const documents = await this.vectorizeService.retrieveDocuments(query);
      const contextDocuments = this.vectorizeService.formatDocumentsForContext(documents);
      return contextDocuments || "No relevant documents found.";
    } catch (error) {
      console.error("Retrieval failed:", error);
      return "Unable to retrieve relevant documents at this time.";
    }
  }
}
