import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

export function ChatMessage({ message }: { message: ChatMessageType }) {
	const isUser = message.role === "user";

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-2",
				isUser ? "items-end" : "items-start",
			)}
		>
			{message.pending ? (
				<span className="shimmer py-1 text-sm text-muted-foreground">
					Generating response…
				</span>
			) : (
				<div
					className={cn(
						"max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
						isUser
							? "rounded-br-sm bg-primary text-primary-foreground"
							: "rounded-bl-sm bg-muted text-foreground",
						message.error && "bg-destructive/10 text-destructive",
					)}
				>
					{message.content}
				</div>
			)}
		</div>
	);
}
