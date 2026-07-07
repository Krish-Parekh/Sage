"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePost } from "@/lib/api/hooks/mutation";
import type { QueryRequest, QueryResponse } from "@/types/api";

export default function Home() {
	const [query, setQuery] = useState("");
	const {
		mutate,
		data: response,
		error,
		isPending,
	} = usePost<QueryResponse, QueryRequest>("/query");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!query.trim() || isPending) return;
		mutate({ query, thread_id: "default" });
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16">
			<h1 className="text-2xl font-semibold">Enterprise RAG</h1>

			<form onSubmit={handleSubmit} className="flex gap-2">
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Ask a question about your documents…"
				/>
				<Button type="submit" disabled={isPending || !query.trim()}>
					{isPending ? "Asking…" : "Ask"}
				</Button>
			</form>

			{error && <p className="text-sm text-red-600">{error.message}</p>}

			{response && (
				<div className="flex flex-col gap-6">
					<section className="flex flex-col gap-2">
						<h2 className="text-sm font-medium text-muted-foreground">
							Answer
						</h2>
						<p className="whitespace-pre-wrap">{response.answer}</p>
					</section>

					{response.results.length > 0 && (
						<section className="flex flex-col gap-3">
							<h2 className="text-sm font-medium text-muted-foreground">
								Sources ({response.results.length})
							</h2>
							{response.results.map((chunk) => (
								<div
									key={`${chunk.source}:${chunk.score}`}
									className="rounded-md border p-3 text-sm"
								>
									<div className="mb-1 flex justify-between text-xs text-muted-foreground">
										<span>{chunk.source}</span>
										<span>{chunk.score.toFixed(3)}</span>
									</div>
									<p className="whitespace-pre-wrap">{chunk.text}</p>
								</div>
							))}
						</section>
					)}
				</div>
			)}
		</main>
	);
}
