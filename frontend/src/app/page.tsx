import { ChatPanel } from "@/components/chat/chat-panel";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
	return (
		<div className="flex h-screen flex-col">
			<Navbar />
			<ChatPanel />
		</div>
	);
}
