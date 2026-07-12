"use client";

import dynamic from "next/dynamic";

const ChatShell = dynamic(
	() => import("@/components/chat/chat-shell").then((m) => m.ChatShell),
	{ ssr: false },
);

export default function Home() {
	return <ChatShell />;
}
