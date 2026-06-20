import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { db, isFirebaseConfigured } from "../../services/firebase";
import { collection, doc, onSnapshot, query, setDoc, orderBy } from "firebase/firestore";
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Trophy, MapPin } from "lucide-react";
import { PollutionStatCard } from "./stats/PollutionStatCard";
import { TopUsersCard, type TopUserEntry } from "./stats/TopUsersCard";
import { subscribeToCarbonAnalytics, type CarbonAnalyticsDoc } from "../../services/carbonAnalytics";

type CommunityComment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
  comments: CommunityComment[];
};

type RankedUser = TopUserEntry;

export const EcoActivityPanel: React.FC = () => {
  const { user, userProfile } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postDraft, setPostDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [analytics, setAnalytics] = useState<CarbonAnalyticsDoc | null>(null);

  useEffect(() => subscribeToCarbonAnalytics(setAnalytics), []);

  const topStates = useMemo(() => {
    const entries = Object.entries(analytics?.stateValues ?? {});
    return entries.sort((a, b) => a[1] - b[1]).slice(0, 10).map(([name, value]) => ({ name, avgPerCapitaCO2: value }));
  }, [analytics]);

  const topCities = useMemo(() => {
    const entries = analytics?.cityValues ?? [];
    return [...entries].sort((a, b) => a.value - b.value).slice(0, 10);
  }, [analytics]);

  const rankedUsers = useMemo<TopUserEntry[]>(() => {
    return [...users]
      .sort((a, b) => a.carbonScore - b.carbonScore || b.completedTasks - a.completedTasks || b.points - a.points)
      .slice(0, 10);
  }, [users]);

  const persistPosts = async (nextPosts: CommunityPost[]) => {
    setPosts(nextPosts);
    if (!isFirebaseConfigured || !db) return;

    try {
      await Promise.all(nextPosts.map((post) => setDoc(doc(db, "communityPosts", post.id), post, { merge: true })));
    } catch (err) {
      console.error("Failed to sync community posts:", err);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setPosts([]);
      setUsers([]);
      return;
    }

    const postsQuery = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
    const unsubscribePosts = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map((entry) => ({ ...(entry.data() as CommunityPost), id: entry.id })));
    }, (err) => console.error("Failed to subscribe to community posts:", err));

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snap) => {
      const mapped = snap.docs.map((entry) => {
        const data = entry.data() as any;
        return {
          uid: data.uid || entry.id,
          displayName: data.displayName || data.email || "Eco Citizen",
          state: data.state || "",
          city: data.city || "",
          carbonScore: Number(data.carbonScore) || 0,
          points: Number(data.points) || 0,
          streakCount: Number(data.streakCount) || 0,
          completedTasks: Number(data.completedTasks) || 0
        } as RankedUser;
      });
      setUsers(mapped);
    }, (err) => console.error("Failed to subscribe to user rankings:", err));

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, [userProfile]);

  const createPost = async () => {
    if (!user || !userProfile) return;
    const trimmed = postDraft.trim();
    if (!trimmed) return;
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length > 5000) throw new Error("Posts are limited to 5000 words.");

    const nextPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorId: user.uid,
      authorName: userProfile.displayName || "Eco Citizen",
      content: trimmed,
      createdAt: new Date().toISOString(),
      upvotes: [],
      downvotes: [],
      comments: []
    };

    await persistPosts([nextPost, ...posts]);
    setPostDraft("");
  };

  const votePost = async (postId: string, direction: "up" | "down") => {
    if (!user) return;
    const nextPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      const alreadyUpvoted = post.upvotes.includes(user.uid);
      const alreadyDownvoted = post.downvotes.includes(user.uid);

      let upvotes = post.upvotes.filter((id) => id !== user.uid);
      let downvotes = post.downvotes.filter((id) => id !== user.uid);

      if (direction === "up") {
        if (alreadyUpvoted) return { ...post, upvotes, downvotes };
        upvotes.push(user.uid);
      }

      if (direction === "down") {
        if (alreadyDownvoted) return { ...post, upvotes, downvotes };
        downvotes.push(user.uid);
      }

      return { ...post, upvotes, downvotes };
    });
    await persistPosts(nextPosts);
  };

  const addComment = async (postId: string) => {
    if (!user || !userProfile) return;
    const raw = (commentDrafts[postId] || "").trim();
    if (!raw) return;
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length > 500) throw new Error("Comments are limited to 500 words.");

    const nextPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      const nextComment: CommunityComment = {
        id: `comment_${Date.now()}`,
        userId: user.uid,
        userName: userProfile.displayName || "Eco Citizen",
        content: raw,
        createdAt: new Date().toISOString()
      };
      return { ...post, comments: [...post.comments, nextComment] };
    });

    await persistPosts(nextPosts);
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
  };

  const getScore = (post: CommunityPost) => post.upvotes.length - post.downvotes.length;
  const getUserVote = (post: CommunityPost) => {
    if (!user) return "none";
    if (post.upvotes.includes(user.uid)) return "up";
    if (post.downvotes.includes(user.uid)) return "down";
    return "none";
  };

  return (
    <div className="eco-activity-layout" style={{ display: "grid", gridTemplateColumns: "320px 1fr 380px", gap: "20px", alignItems: "start" }}>
      <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MessageSquare color="var(--color-primary)" size={20} />
            <h3 style={{ fontSize: "1.2rem" }}>Community</h3>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>Write a post in Community</div>
          <textarea
            value={postDraft}
            onChange={(e) => setPostDraft(e.target.value)}
            placeholder="Share an eco action, idea, or local observation..."
            rows={8}
            style={{ width: "100%", height: "180px", resize: "none", overflowY: "auto", padding: "14px", borderRadius: "var(--radius-sm)", background: "hsla(222, 47%, 7%, 0.55)", color: "var(--text-primary)", border: "1px solid var(--glass-border)" }}
          />
          <button className="btn btn-primary" onClick={createPost} style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "12px 16px" }}>
            <Send size={14} /> Post to Community
          </button>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>Posts are text-only and limited to 5000 words.</p>
        </section>

        <TopUsersCard users={rankedUsers} />
      </aside>

      <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1.2rem" }}>Live Community Feed</h3>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{posts.length} posts</span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: "18px", border: "1px dashed var(--glass-border)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", background: "hsla(222, 47%, 7%, 0.25)" }}>
            No posts yet. Be the first to start the conversation.
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} style={{ padding: "18px", borderRadius: "var(--radius-sm)", background: "hsla(222, 47%, 7%, 0.4)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <strong>{post.authorName}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(post.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button className={getUserVote(post) === "up" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => votePost(post.id, "up")} style={{ padding: "6px 10px", display: "flex", gap: "4px" }}>
                    <ThumbsUp size={14} /> {getScore(post)}
                  </button>
                  <button className={getUserVote(post) === "down" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => votePost(post.id, "down")} style={{ padding: "6px 10px", display: "flex", gap: "4px" }}>
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "0.98rem" }}>{post.content}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
                <strong style={{ fontSize: "0.9rem" }}>{post.comments.length} comments</strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={commentDrafts[post.id] || ""}
                    onChange={(e) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: e.target.value }))}
                    placeholder="Write a comment..."
                    maxLength={5000}
                    style={{ flex: 1, padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "hsla(222, 47%, 7%, 0.55)", color: "var(--text-primary)", border: "1px solid var(--glass-border)" }}
                  />
                  <button className="btn btn-primary" onClick={() => addComment(post.id)} style={{ whiteSpace: "nowrap" }}>
                    Comment
                  </button>
                </div>

                {post.comments.map((comment) => (
                  <div key={comment.id} style={{ padding: "10px 12px", borderRadius: "12px", background: "hsla(222, 47%, 7%, 0.45)", border: "1px solid var(--glass-border)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                      {comment.userName} · {new Date(comment.createdAt).toLocaleString()}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{comment.content}</div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <PollutionStatCard
          title="Top 10 States"
          icon={<Trophy color="var(--color-secondary)" size={20} />}
          description="Lower values are better here. These rankings are driven by the live analytics feed stored in Firestore."
          items={topStates.map((state, index) => ({ label: `${index + 1}. ${state.name}`, value: `${state.avgPerCapitaCO2} t/yr` }))}
        />

        <PollutionStatCard
          title="Top 10 Cities"
          icon={<MapPin color="var(--color-primary)" size={20} />}
          description="Lower values are better here too. These rankings are driven by the live analytics feed stored in Firestore."
          items={topCities.length ? topCities.map((city, index) => ({ label: `${index + 1}. ${city.name}`, value: `${city.state} · ${city.value} t/yr` })) : [{ label: "No live city data yet", value: "Connect your analytics endpoint" }]}
        />
      </aside>

      <style>{`
        @media (max-width: 1200px) {
          .eco-activity-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .eco-activity-layout { justify-items: center !important; gap: 16px !important; }
          .eco-activity-layout > aside,
          .eco-activity-layout > section { width: min(100%, 420px) !important; }
          .eco-activity-layout > aside { align-items: stretch !important; }
        }
        @media (max-width: 480px) {
          .eco-activity-layout { gap: 12px !important; }
          .eco-activity-layout > aside,
          .eco-activity-layout > section { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
