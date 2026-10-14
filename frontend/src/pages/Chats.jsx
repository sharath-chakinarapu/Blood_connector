import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import { apiErrorMessage, fromApiRole } from "../api/domain";
import { useAuth } from "../auth/useAuth";

export default function Chats() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user } = useAuth();
  const role = fromApiRole(user?.role);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await API.get("/chats");
      setConversations(data);
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load conversations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await API.get("/chats");
        if (!active) return;
        setConversations(data);
        setError("");
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError, "Unable to load conversations."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!chatId) return undefined;
    let active = true;
    const load = async () => {
      try {
        const { data } = await API.get(`/chats/${chatId}/messages?page=0&size=50`);
        await API.patch(`/chats/${chatId}/read`);
        const conversationResponse = await API.get("/chats");
        if (!active) return;
        setMessages(data.content);
        setConversations(conversationResponse.data);
        setError("");
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError, "Unable to load messages."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [chatId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !chatId) return;
    setSending(true);
    try {
      const { data } = await API.post(`/chats/${chatId}/messages`, { message: draft.trim() });
      setMessages((current) => [...current, data]);
      setDraft("");
      setError("");
      await loadConversations();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to send message."));
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = (conversation) => role === "donor" ? conversation.hospital : conversation.donor;

  return (
    <main style={{ background: "#fdf2f2", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(260px, 0.8fr) 1.2fr", gap: 20 }}>
        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h1 style={{ marginTop: 0 }}>Conversations</h1>
          {loading && conversations.length === 0 ? <p>Loading conversations…</p> : conversations.length === 0 ? <p>No conversations yet. Start one from a blood request or donor match.</p> : conversations.map((conversation) => {
            const participant = otherParticipant(conversation);
            return (
              <button key={conversation.id} type="button" onClick={() => navigate(`/chats/${conversation.id}`)} style={{ display: "block", width: "100%", textAlign: "left", padding: 14, marginBottom: 10 }}>
                <strong>{conversation.title || participant?.name || "Conversation"}</strong>
                <div>{participant?.name || "Participant"}</div>
                {conversation.unreadCount > 0 && <span>{conversation.unreadCount} unread</span>}
              </button>
            );
          })}
        </section>
        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          {chatId ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <h2>Messages</h2>
                <button type="button" onClick={() => navigate("/chats")}>Back to conversations</button>
              </div>
              {loading ? <p>Loading messages…</p> : (
                <>
                  <div style={{ minHeight: 300, maxHeight: "60vh", overflowY: "auto", padding: 12, background: "#fff7f7", borderRadius: 12 }}>
                    {messages.length === 0 ? <p>No messages yet. Start the conversation.</p> : messages.map((item) => {
                      const ownMessage = item.senderId === user?.id;
                      return (
                        <div key={item.id} style={{ display: "flex", justifyContent: ownMessage ? "flex-end" : "flex-start", marginBottom: 12 }}>
                          <div style={{ maxWidth: "80%", padding: 12, background: ownMessage ? "#b91c1c" : "#e2e8f0", color: ownMessage ? "white" : "#111827", borderRadius: 12 }}>
                            <small>{ownMessage ? "You" : item.senderName}</small>
                            <div>{item.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form onSubmit={sendMessage} style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <input required maxLength="4000" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" style={{ flex: 1 }} />
                    <button disabled={sending}>{sending ? "Sending…" : "Send"}</button>
                  </form>
                </>
              )}
            </>
          ) : <p>Select a conversation to view messages.</p>}
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
        </section>
      </div>
    </main>
  );
}
