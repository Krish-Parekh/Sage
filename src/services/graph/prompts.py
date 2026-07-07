from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

_PLANNER_SYSTEM = (
    "You are the planner for a retrieval-augmented assistant over a Kubernetes "
    "documentation corpus. Given the conversation, decide whether the latest "
    "user turn needs a document lookup, and produce a self-contained search "
    "query. Prefer 'retrieve' whenever factual/technical grounding would help."
)

_RESPONDER_SYSTEM = (
    "You are a helpful assistant. Answer the user's latest question using the "
    "conversation and the retrieved context below. Ground your answer in the "
    "context and cite sources inline as [source]. If the context is empty or "
    "insufficient, say so plainly instead of inventing details.\n\n"
    "Retrieved context:\n{context}"
)

PLANNER_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", _PLANNER_SYSTEM),
        MessagesPlaceholder("messages"),
    ]
)

RESPONDER_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", _RESPONDER_SYSTEM),
        MessagesPlaceholder("messages"),
    ]
)
