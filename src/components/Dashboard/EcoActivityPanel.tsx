import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { db, isFirebaseConfigured } from "../../services/firebase";
import { collection, doc, onSnapshot, query, setDoc, orderBy } from "firebase/firestore";
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Trophy, MapPin, Users } from "lucide-react";
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

type RankedUser = {
  uid: string;
  displayName: string;
  state: string;
  city: string;
  carbonScore: number;
  points: number;
  streakCount: number;
  completedTasks: number;
};

export const EcoActivityPanel: React.FC = () => {
  const { user, userProfile } = useUser();
  const [activeTab, setActiveTab] = useState<"community">("community");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postDraft, setPostDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [analytics, setAnalytics] = useState<CarbonAnalyticsDoc | null>(null);
  
  // Validation error states
  const [postError, setPostError] = useState<string | null>(null);
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  useEffect(() => subscribeToCarbonAnalytics(setAnalytics), []);

  const topStates = useMemo(() => {
    const entries = Object.entries(analytics?.stateValues ?? {});
    return entries
      .sort((a, b) => a[1] - b[1]) // lower average per capita is less polluted
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const topCities = useMemo(() => {
    const entries = analytics?.cityValues ?? [];
    return [...entries]
      .sort((a, b) => a.value - b.value) // lower value is less polluted
      .slice(0, 10);
  }, [analytics]);

  const rankedUsers = useMemo<RankedUser[]>(() => {
    // Sort by lowest carbon score (less carbon emissions)
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
        const d = entry.data() as any;

        // robustly read possible field names for completed tasks and streaks
        const completedRaw = d.completedTasks ?? d.completed_tasks ?? d.tasksCompleted ?? d.completed ?? (d.profile && (d.profile.completedTasks ?? d.profile.completed_tasks));
        const streakRaw = d.streakCount ?? d.streak_count ?? d.streak;

        return {
          uid: d.uid || entry.id,
          displayName: d.displayName || d.email || "Eco Citizen",
          state: d.state || "",
          city: d.city || "",
          carbonScore: Number(d.carbonScore ?? d.carbon_score) || 0,
          points: Number(d.points ?? d.exp) || 0,
          streakCount: Number(streakRaw) || 0,
          completedTasks: Number(completedRaw) || 0
        } as RankedUser;
      });

      // If the currently-signed in user has a more up-to-date profile, prefer that value for display
      if (userProfile) {
        const idx = mapped.findIndex((u) => u.uid === userProfile.uid);
        if (idx !== -1) mapped[idx].completedTasks = Number(userProfile.completedTasks) || mapped[idx].completedTasks;
      }

      setUsers(mapped);
    }, (err) => console.error("Failed to subscribe to user rankings:", err));

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, [userProfile]);

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const createPost = async () => {
    if (!user || !userProfile) return;
    setPostError(null);
    const trimmed = postDraft.trim();
    if (!trimmed) return;
    
    const wordCount = getWordCount(trimmed);
    if (wordCount > 5000) {
      setPostError(`Your post exceeds the limit of 5000 words (currently ${wordCount} words).`);
      return;
    }

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
        if (alreadyUpvoted) {
          // toggle off
        } else {
          upvotes.push(user.uid);
        }
      }

      if (direction === "down") {
        if (alreadyDownvoted) {
          // toggle off
        } else {
          downvotes.push(user.uid);
        }
      }

      return { ...post, upvotes, downvotes };
    });
    await persistPosts(nextPosts);
  };

  const addComment = async (postId: string) => {
    if (!user || !userProfile) return;
    
    // Clear previous errors for this post
    setCommentErrors((prev) => ({ ...prev, [postId]: "" }));
    
    const raw = (commentDrafts[postId] || "").trim();
    if (!raw) return;
    
    const wordCount = getWordCount(raw);
    if (wordCount > 500) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]: `Comments are limited to 500 words (currently ${wordCount} words).`
      }));
      return;
    }

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
    <div className="eco-activity-layout" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
      {/* Left Column: Tab list and Community Tab View */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
        {/* Navigation Tabs (Dashboard styling) */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", minWidth: 0 }}>
          <button
            className={`btn ${activeTab === "community" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("community")}
            style={{ padding: "10px 18px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <MessageSquare size={16} /> Community
          </button>
        </div>

        {activeTab === "community" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Create Post Section */}
            <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MessageSquare color="var(--color-primary)" size={20} />
                <h3 style={{ fontSize: "1.2rem" }}>Create a post</h3>
              </div>
              <textarea
                value={postDraft}
                onChange={(e) => setPostDraft(e.target.value)}
                placeholder="Share your latest eco action, ideas, or carbon-saving observation..."
                rows={5}
                style={{
                  width: "100%",
                  resize: "none",
                  padding: "14px",
                  borderRadius: "var(--radius-sm)",
                  background: "hsla(222, 47%, 7%, 0.55)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--glass-border)",
                  fontSize: "0.95rem"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "0.82rem", color: postDraft.trim() ? (getWordCount(postDraft) > 5000 ? "var(--color-danger)" : "var(--text-muted)") : "var(--text-muted)" }}>
                  Words: {postDraft.trim() ? getWordCount(postDraft) : 0} / 5000 limit
                </span>
                <button className="btn btn-primary" onClick={createPost} style={{ display: "flex", gap: "8px", padding: "10px 16px" }}>
                  <Send size={14} /> Post to Feed
                </button>
              </div>
              {postError && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginTop: "4px" }}>
                  {postError}
                </div>
              )}
            </section>

            {/* Live Feed */}
            <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "1.2rem" }}>Live Community Feed</h3>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{posts.length} posts</span>
              </div>

              {posts.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", border: "1px dashed var(--glass-border)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", background: "hsla(222, 47%, 7%, 0.15)", fontSize: "0.95rem" }}>
                  No posts yet. Be the first to start the conversation!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      style={{
                        padding: "18px",
                        borderRadius: "var(--radius-sm)",
                        background: "hsla(222, 47%, 7%, 0.4)",
                        border: "1px solid var(--glass-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                            color: "#111827",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.95rem"
                          }}>
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.95rem" }}>{post.authorName}</strong>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(post.createdAt).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Reddit-like Voting System (Only one selected at a time) */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "hsla(222, 47%, 7%, 0.3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", padding: "2px" }}>
                          <button
                            className="interactive"
                            onClick={() => votePost(post.id, "up")}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "6px 10px",
                              display: "flex",
                              alignItems: "center",
                              color: getUserVote(post) === "up" ? "var(--color-primary)" : "var(--text-muted)",
                              transition: "color 0.2s"
                            }}
                            title="Upvote"
                          >
                            <ThumbsUp size={14} style={{ marginRight: "4px" }} />
                            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{getScore(post)}</span>
                          </button>
                          <button
                            className="interactive"
                            onClick={() => votePost(post.id, "down")}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "6px 10px",
                              display: "flex",
                              alignItems: "center",
                              color: getUserVote(post) === "down" ? "var(--color-danger)" : "var(--text-muted)",
                              transition: "color 0.2s"
                            }}
                            title="Downvote"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>

                      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: "0.96rem", margin: 0, color: "var(--text-primary)" }}>{post.content}</p>

                      {/* Comments section */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "14px" }}>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{post.comments.length} Comments</strong>
                        
                        <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: e.target.value }))}
                              placeholder="Write a comment... (max 500 words)"
                              style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "var(--radius-sm)",
                                background: "hsla(222, 47%, 7%, 0.55)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--glass-border)",
                                fontSize: "0.9rem"
                              }}
                            />
                            <button className="btn btn-primary" onClick={() => addComment(post.id)} style={{ whiteSpace: "nowrap", padding: "8px 16px", fontSize: "0.88rem" }}>
                              Comment
                            </button>
                          </div>
                          {commentErrors[post.id] && (
                            <div style={{ color: "var(--color-danger)", fontSize: "0.82rem" }}>
                              {commentErrors[post.id]}
                            </div>
                          )}
                        </div>

                        {post.comments.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            {post.comments.map((comment) => (
                              <div
                                key={comment.id}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "hsla(222, 47%, 7%, 0.25)",
                                  border: "1px solid var(--glass-border)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px"
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                  <strong>{comment.userName}</strong>
                                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                                  {comment.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Right Column: Stats Side Panels styled like Green Shop Panel in Dashboard */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
        {/* States Stats Panel */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0, 230, 153, 0.1)",
              border: "1px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)"
            }}>
              <Trophy size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Least Polluted States</h4>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Top 10 states in India (avg tCO2e/yr) - 2024</div>
              <a href="https://kerala.data.gov.in/resource/stateut-wise-details-forest-cover-and-tree-cover-india-indian-state-forest-report-isfr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline", fontSize: "0.7rem", marginTop: "2px", display: "inline-block" }}>
                Source: https://kerala.data.gov.in/resource/stateut-wise-details-forest-cover-and-tree-cover-india-indian-state-forest-report-isfr
              </a>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topStates.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px 0" }}>Loading state data...</div>
            ) : (
              topStates.map((state, index) => (
                <div
                  key={`state-${state.name}`}
                  className="interactive"
                  style={{
                    background: "hsla(222, 47%, 7%, 0.4)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "var(--color-secondary)"
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{state.name}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)" }}>
                    {state.value.toFixed(2)} t
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cities Stats Panel */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0, 230, 153, 0.1)",
              border: "1px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)"
            }}>
              <MapPin size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Least Polluted Cities</h4>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Top 10 cities in India (avg tCO2e/yr) - 2026</div>
              <a href="https://www.data.gov.in/resource/real-time-air-quality-index-various-locations" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline", fontSize: "0.7rem", marginTop: "2px", display: "inline-block" }}>
                Source: https://www.data.gov.in/resource/real-time-air-quality-index-various-locations
              </a>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topCities.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px 0" }}>Loading city data...</div>
            ) : (
              topCities.map((city, index) => (
                <div
                  key={`city-${city.name}`}
                  className="interactive"
                  style={{
                    background: "hsla(222, 47%, 7%, 0.4)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "var(--color-secondary)"
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>{city.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{city.state}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)" }}>
                    {city.value.toFixed(2)} t
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Stats Panel */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0, 230, 153, 0.1)",
              border: "1px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)"
            }}>
              <Users size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Top Performers</h4>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Top 10 users by lowest carbon score</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rankedUsers.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px 0" }}>Loading user rankings...</div>
            ) : (
              rankedUsers.map((rankedUser, index) => (
                <div
                  key={`user-${rankedUser.uid}`}
                  className="interactive"
                  style={{
                    background: "hsla(222, 47%, 7%, 0.4)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "var(--color-secondary)"
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>{rankedUser.displayName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {rankedUser.city || "Unknown city"} · {rankedUser.completedTasks || 0} tasks · {rankedUser.streakCount || 0} day streak
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)" }}>
                    {rankedUser.carbonScore.toFixed(2)} t
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .eco-activity-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
