"""Short-term context only. No cross-conversation or inferred personal memory."""


def context(messages, enabled):
    if not enabled:
        return []
    return [
        {"role": m.role, "content": m.content[:2400]}
        for m in messages[-10:]
        if m.status == "complete"
    ]
