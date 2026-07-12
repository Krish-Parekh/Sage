import type { RealtimeChannel } from "@supabase/supabase-js";
import { createCollection } from "@tanstack/react-db";

import { getFetcher } from "@/lib/api/fetcher";
import { createClient } from "@/lib/supabase/client";
import type { ConversationSummary } from "@/types/api";

type Row = {
	thread_id: string;
	title: string | null;
	created_at: string;
	updated_at: string;
};

type Event = { type: "insert" | "update" | "delete"; row: Row };

function toRow(record: Record<string, unknown>): Row {
	return {
		thread_id: record.thread_id as string,
		title: (record.title as string | null) ?? null,
		created_at: record.created_at as string,
		updated_at: record.updated_at as string,
	};
}

export const conversationsCollection = createCollection<ConversationSummary>({
	id: "conversations",
	getKey: (c) => c.thread_id,
	sync: {
		sync: ({ begin, write, commit, markReady }) => {
			const supabase = createClient();
			const seen = new Set<string>();
			let ready = false;
			const buffer: Event[] = [];
			let channel: RealtimeChannel | null = null;

			const apply = (evt: Event) => {
				const key = evt.row.thread_id;
				begin();
				if (evt.type === "delete") {
					if (seen.has(key)) write({ type: "delete", value: evt.row });
					seen.delete(key);
				} else if (seen.has(key)) {
					write({ type: "update", value: evt.row });
				} else {
					write({ type: "insert", value: evt.row });
					seen.add(key);
				}
				commit();
			};

			const start = async () => {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) supabase.realtime.setAuth(session.access_token);

				channel = supabase
					.channel("conversations")
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "conversations" },
						(payload) => {
							const type = payload.eventType.toLowerCase() as Event["type"];
							const record = type === "delete" ? payload.old : payload.new;
							const evt = {
								type,
								row: toRow(record as Record<string, unknown>),
							};
							if (ready) apply(evt);
							else buffer.push(evt);
						},
					)
					.subscribe();

				try {
					const rows = await getFetcher<ConversationSummary[]>("/conversations");
					begin();
					for (const row of rows) {
						write({ type: "insert", value: row });
						seen.add(row.thread_id);
					}
					commit();
					markReady();
					ready = true;
					for (const evt of buffer) apply(evt);
					buffer.length = 0;
				} catch {
					markReady();
				}
			};

			const { data: authSub } = supabase.auth.onAuthStateChange(
				(_event, session) => {
					if (session) supabase.realtime.setAuth(session.access_token);
				},
			);

			void start();

			return () => {
				authSub.subscription.unsubscribe();
				if (channel) supabase.removeChannel(channel);
			};
		},
	},
});
