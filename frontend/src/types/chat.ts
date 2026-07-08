export type ChatRole = "user" | "assistant";

export type ChatMessage = {
	id: string;
	role: ChatRole;
	content: string;
	/** Marks an assistant message that is still awaiting a response. */
	pending?: boolean;
	/** Marks a message that failed to produce an answer. */
	error?: boolean;
};
