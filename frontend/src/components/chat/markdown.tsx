import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Markdown = memo(function Markdown({
	content,
}: {
	content: string;
}) {
	return (
		<div className="typeset typeset-chat">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					// Let wide tables scroll instead of forcing the bubble wider.
					table: ({ node: _node, ...props }) => (
						<div className="typeset-scroll">
							<table {...props} />
						</div>
					),
					// Open links in a new tab; markdown links are external here.
					a: ({ node: _node, ...props }) => (
						<a target="_blank" rel="noreferrer" {...props} />
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
});
