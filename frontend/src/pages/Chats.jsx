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
  const [messagesLoadedFor, setMessagesLoadedFor] = useState(null);

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
        if (active) {
          setMessagesLoadedFor(chatId);
          setLoading(false);
        }
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
  const activeConversation = conversations.find((conversation) => conversation.id === chatId);
  const activeParticipant = activeConversation ? otherParticipant(activeConversation) : null;
  const messagesLoading = Boolean(chatId && messagesLoadedFor !== chatId);

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-heading">
          <div><p className="eyebrow">PRIVATE COORDINATION</p><h1>Messages</h1><p className="page-lead">Conversations are only visible to their donor and hospital participants.</p></div>
        </header>
        {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
        <div className="chat-layout">
        <section className="panel chat-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR INBOX</p><h2>Conversations</h2></div><span className="count-badge">{conversations.length}</span></div>
          {loading && conversations.length === 0 ? <p className="loading-state" role="status">Loading conversations…</p> : conversations.length === 0 ? <div className="empty-state"><h3>No conversations yet</h3><p>When you connect through a blood request or donor match, the conversation will appear here.</p></div> : (
            <div className="conversation-list">{conversations.map((conversation) => {
            const participant = otherParticipant(conversation);
            return (
              <button className={`conversation-button${conversation.id === chatId ? " conversation-button--active" : ""}`} key={conversation.id} type="button" onClick={() => navigate(`/chats/${conversation.id}`)}>
                <strong>{conversation.title || participant?.name || "Conversation"}</strong>
                <span>{participant?.name || "Participant"}</span>
                {conversation.unreadCount > 0 && <small>{conversation.unreadCount} unread</small>}
              </button>
            );
          })}</div>
          )}
        </section>
        <section className="panel chat-panel">
          {chatId ? (
            <>
              <div className="panel-heading">
                <div><p className="eyebrow">CONVERSATION</p><h2>{activeParticipant?.name || "Messages"}</h2></div>
                <button className="button button--quiet" type="button" onClick={() => navigate("/chats")}>Back</button>
              </div>
              {messagesLoading ? <p className="loading-state" role="status">Loading messages…</p> : (
                <>
                  <div className="messages-list" aria-live="polite">
                    {messages.length === 0 ? <p>No messages yet. Start the conversation.</p> : messages.map((item) => {
                      const ownMessage = item.senderId === user?.id;
                      return (
                        <div className={`message-row${ownMessage ? " message-row--own" : ""}`} key={item.id}>
                          <div className="message-bubble">
                            <small>{ownMessage ? "You" : item.senderName}</small>
                            <p>{item.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form className="message-form" onSubmit={sendMessage}>
                    <label className="sr-only" htmlFor="chat-message">Write a message</label>
                    <input id="chat-message" required maxLength="4000" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" />
                    <button className="button button--primary" disabled={sending}>{sending ? "Sending…" : "Send"}</button>
                  </form>
                </>
              )}
            </>
          ) : <div className="empty-state"><h3>Select a conversation</h3><p>Choose a conversation to read messages and reply.</p></div>}
        </section>
        </div>
      </div>
    </main>
  );
}
