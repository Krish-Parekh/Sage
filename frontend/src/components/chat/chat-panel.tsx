"use client";

import { useRef, useState } from "react";
import { nanoid } from "nanoid";

import { AIInput } from "@/components/ui/ai-input";
import { usePost } from "@/lib/api/hooks/mutation";
import type { QueryRequest, QueryResponse } from "@/types/api";
import type { ChatMessage } from "@/types/chat";

import { MessageList } from "./message-list";

export function ChatPanel() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const idCounter = useRef(0);
	const threadIdRef = useRef(nanoid());
	const { mutate, isPending } = usePost<QueryResponse, QueryRequest>("/query");

	const nextId = () => {
		idCounter.current += 1;
		return `m${idCounter.current}`;
	};

	function updateMessage(id: string, patch: Partial<ChatMessage>) {
		setMessages((prev) =>
			prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
		);
	}

	function handleSend(text: string) {
		if (isPending) return;
		const userMessage: ChatMessage = {
			id: nextId(),
			role: "user",
			content: text,
		};
		const assistantId = nextId();
		const pendingMessage: ChatMessage = {
			id: assistantId,
			role: "assistant",
			content: "",
			pending: true,
		};
		setMessages((prev) => [...prev, userMessage, pendingMessage]);

		mutate(
			{ query: text, thread_id: threadIdRef.current },
			{
				onSuccess: (data) => {
					updateMessage(assistantId, {
						content: data.answer || "No answer was returned.",
						pending: false,
					});
				},
				onError: (error) => {
					updateMessage(assistantId, {
						content: error.message,
						pending: false,
						error: true,
					});
				},
			},
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<MessageList messages={messages} />
			<div className="bg-background/60">
				<AIInput
					showMessages={false}
					placeholder="Ask a question about your documents…"
					onSend={(text) => handleSend(text)}
					className="mx-auto max-w-3xl px-4 py-4"
				/>
			</div>
		</div>
	);
}
