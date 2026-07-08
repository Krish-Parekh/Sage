"use client";

import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

import { ChatMessage } from "./chat-message";

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
			<p className="text-lg font-medium">Ask about your documents</p>
			<p className="max-w-sm text-sm text-muted-foreground">
				Start a conversation below to search and get answers grounded in your
				documents.
			</p>
		</div>
	);
}

export function MessageList({ messages }: { messages: ChatMessageType[] }) {
	return (
		<MessageScrollerProvider scrollPreviousItemPeek={64}>
			{messages.length === 0 ? (
				<EmptyState />
			) : (
				<MessageScroller className="min-h-0 flex-1">
					<MessageScrollerViewport>
						<MessageScrollerContent className="mx-auto w-full max-w-3xl gap-5 px-4 py-6">
							{messages.map((message) => (
								<MessageScrollerItem
									key={message.id}
									messageId={message.id}
									scrollAnchor={message.role === "user"}
								>
									<ChatMessage message={message} />
								</MessageScrollerItem>
							))}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			)}
		</MessageScrollerProvider>
	);
}
