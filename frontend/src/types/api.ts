/** Request/response shapes for the RAG backend API. */

export type Chunk = {
	text: string;
	source: string;
	score: number;
};

export type QueryRequest = {
	query: string;
	thread_id: string;
};

export type QueryResponse = {
	answer: string;
	results: Chunk[];
};
