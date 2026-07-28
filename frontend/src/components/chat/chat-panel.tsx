"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AIInput } from "@/components/ui/ai-input";
import { usePost } from "@/lib/api/hooks/mutation";
import { useGet } from "@/lib/api/hooks/query";
import type {
	ConversationDetail,
	QueryRequest,
	QueryResponse,
} from "@/types/api";
import type { ChatMessage } from "@/types/chat";

import { MessageList } from "./message-list";

type Props = {
	threadId: string;
	load: boolean;
};

export function ChatPanel({ threadId, load }: Props) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const idCounter = useRef(0);
	const { mutate, isPending } = usePost<QueryResponse, QueryRequest>("/query", {
		mutationKey: ["query", threadId],
	});

	const { data: history } = useGet<ConversationDetail>(
		`/conversations/${threadId}`,
		{ enabled: load, retry: false, queryKey: ["conversation", threadId] },
	);

	useEffect(() => {
		if (!history) return;
		setMessages(
			history.messages.map((m, i) => ({
				id: `h${i}`,
				role: m.role,
				content: m.content,
			})),
		);
		idCounter.current = history.messages.length;
	}, [history]);

	const nextId = useCallback(() => {
		idCounter.current += 1;
		return `m${idCounter.current}`;
	}, []);

	const updateMessage = useCallback(
		(id: string, patch: Partial<ChatMessage>) => {
			setMessages((prev) =>
				prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
			);
		},
		[],
	);

	const handleSend = useCallback(
		(text: string) => {
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
				{ query: text, thread_id: threadId },
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
		},
		[isPending, mutate, nextId, threadId, updateMessage],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<MessageList messages={messages} />
			<AIInput
				showMessages={false}
				placeholder="Ask a question about your documents…"
				onSend={handleSend}
				className="mx-auto max-w-3xl px-4 py-4"
			/>
		</div>
	);
}
