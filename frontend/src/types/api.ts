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

export type ConversationSummary = {
	thread_id: string;
	title: string | null;
	created_at: string;
	updated_at: string;
};

export type MessageOut = {
	role: "user" | "assistant";
	content: string;
	created_at: string;
};

export type ConversationDetail = {
	thread_id: string;
	title: string | null;
	messages: MessageOut[];
};
