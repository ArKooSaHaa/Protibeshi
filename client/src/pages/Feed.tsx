import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  FeedApiError,
  FeedComment,
  FeedPost,
  commentPost,
  createPost,
  getPost,
  getPosts,
  likePost,
  reportPost,
  savePost,
} from '@/api/feedApi';
import { PostCard } from '@/components/feed/PostCard';
import { PostComments } from '@/components/feed/PostComments';
import { CreatePostModal, CreatePostPayload } from '@/components/feed/CreatePostModal';
import { fetchAccountProfile } from '@/features/account/services/accountService';
import styles from './Feed.module.css';

type ViewPost = FeedPost & {
  liked?: boolean;
  saved?: boolean;
  comments?: FeedComment[];
};

type CurrentAccountProfile = {
  id: number | null;
  name: string | null;
  avatarUrl: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof FeedApiError)) {
    return fallback;
  }

  const validationErrors = (error.data as { errors?: Record<string, string[] | string> } | null)?.errors;
  if (validationErrors) {
    const firstError = Object.values(validationErrors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] || error.message || fallback;
    }

    if (typeof firstError === 'string' && firstError) {
      return firstError;
    }
  }

  if (error.status === 401) {
    return 'Please sign in again to continue.';
  }

  return error.message || fallback;
};

const sortByRecent = (items: ViewPost[]) => {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
  });
};

const sanitizePosts = (items: FeedPost[]): ViewPost[] => {
  return items.filter((post) => {
    if (!post || typeof post !== 'object') {
      return false;
    }

    const hasValidId = typeof post.id === 'number';
    const hasTitle = typeof post.title === 'string' && post.title.trim().length > 0;
    const hasContent = typeof post.content === 'string' && post.content.trim().length > 0;

    return hasValidId && hasTitle && hasContent;
  });
};

export const Feed = () => {
  const [posts, setPosts] = useState<ViewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [likePendingId, setLikePendingId] = useState<number | null>(null);
  const [savePendingId, setSavePendingId] = useState<number | null>(null);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSubmitting, setCommentsSubmitting] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<number | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [composerImageFailed, setComposerImageFailed] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<CurrentAccountProfile | null>(null);

  const getStringAtPath = (source: Record<string, unknown>, path: string) => {
    const segments = path.split('.');
    let current: unknown = source;

    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return null;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === 'string' && current.trim() ? current.trim() : null;
  };

  const resolveUserImageUrl = (rawPath: string | null | undefined) => {
    if (!rawPath) {
      return null;
    }

    const normalizedPath = rawPath.replace(/\\/g, '/').trim();
    if (!normalizedPath) {
      return null;
    }

    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    if (normalizedPath.startsWith('/')) {
      return `${baseUrl}${normalizedPath}`;
    }
    if (normalizedPath.startsWith('storage/')) {
      return `${baseUrl}/${normalizedPath}`;
    }
    if (normalizedPath.startsWith('public/storage/')) {
      return `${baseUrl}/${normalizedPath.replace(/^public\//, '')}`;
    }

    return `${baseUrl}/storage/${normalizedPath}`;
  };

  const extractUserPhoto = (source: Record<string, unknown> | null | undefined) => {
    if (!source) {
      return null;
    }

    const fields = [
      'avatar',
      'avatar_url',
      'avatarUrl',
      'profile_picture_url',
      'profilePictureUrl',
      'photo',
      'profile_photo',
      'profile_photo_url',
      'profilePicture',
      'profile.avatar',
      'profile.avatar_url',
      'profile.profile_picture_url',
      'profile.photo',
    ];

    for (const field of fields) {
      const value = getStringAtPath(source, field);
      if (value) {
        return resolveUserImageUrl(value);
      }
    }

    return null;
  };

  const getLocalUser = () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const keys = ['user', 'auth_user', 'authUser', 'currentUser', 'profile'];
    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  const activePost = useMemo(
    () => posts.find((post) => post.id === activePostId) || null,
    [activePostId, posts],
  );

  const localUser = useMemo(() => getLocalUser(), []);

  const composerName = useMemo(() => {
    if (currentProfile?.name) {
      return currentProfile.name;
    }

    const localName = localUser ? getStringAtPath(localUser, 'name') || getStringAtPath(localUser, 'user.name') : null;
    if (localName) {
      return localName;
    }

    const fromFeed = posts.find((post) => post.user?.name)?.user?.name;
    return fromFeed || 'You';
  }, [currentProfile?.name, localUser, posts]);

  const composerPhoto = useMemo(() => {
    if (currentProfile?.avatarUrl) {
      const resolved = resolveUserImageUrl(currentProfile.avatarUrl);
      if (resolved) {
        return resolved;
      }
    }

    const localPhoto = extractUserPhoto(localUser || undefined);
    if (localPhoto) {
      return localPhoto;
    }

    for (const post of posts) {
      const candidate = extractUserPhoto((post.user || undefined) as Record<string, unknown> | undefined);
      if (candidate) {
        return candidate;
      }
    }

    return null;
  }, [currentProfile?.avatarUrl, localUser, posts]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPosts();
      setPosts(sortByRecent(sanitizePosts(response)));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to load neighborhood feed.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCurrentProfile = async () => {
      try {
        const profile = await fetchAccountProfile();
        if (!mounted) {
          return;
        }

        const parsedId = typeof profile.id === 'number' ? profile.id : Number(profile.id);
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();

        setCurrentProfile({
          id: Number.isNaN(parsedId) ? null : parsedId,
          name: profile.full_name || fullName || profile.username || null,
          avatarUrl: profile.profile_picture_url || null,
        });
      } catch {
        if (mounted) {
          setCurrentProfile(null);
        }
      }
    };

    void loadCurrentProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenComments = async (postId: number) => {
    setCommentsOpen(true);
    setCommentsLoading(true);
    setCommentsError(null);
    setActivePostId(postId);

    try {
      const fullPost = await getPost(postId);
      if (!fullPost || typeof fullPost !== 'object') {
        throw new Error('Invalid post response.');
      }

      const safeComments = Array.isArray(fullPost.comments) ? fullPost.comments : [];
      const safeCommentsCount =
        typeof fullPost.comments_count === 'number' ? fullPost.comments_count : safeComments.length;

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? { ...post, comments: safeComments, comments_count: safeCommentsCount }
            : post,
        ),
      );
    } catch (requestError) {
      setCommentsError(getErrorMessage(requestError, 'Failed to load comments.'));
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    const previous = posts;
    const target = posts.find((item) => item.id === postId);
    if (!target) {
      return;
    }

    const nextLiked = !target.liked;
    const optimisticLikes = nextLiked ? target.likes_count + 1 : Math.max(target.likes_count - 1, 0);

    setLikePendingId(postId);
    setPosts((items) =>
      items.map((post) =>
        post.id === postId ? { ...post, liked: nextLiked, likes_count: optimisticLikes } : post,
      ),
    );

    try {
      const result = await likePost(postId);
      const nextServerLiked = typeof result?.liked === 'boolean' ? result.liked : nextLiked;
      const nextServerLikesCount =
        typeof result?.likes_count === 'number' ? result.likes_count : optimisticLikes;

      setPosts((items) =>
        items.map((post) =>
          post.id === postId
            ? { ...post, liked: nextServerLiked, likes_count: nextServerLikesCount }
            : post,
        ),
      );
    } catch (requestError) {
      setPosts(previous);
      setError(getErrorMessage(requestError, 'Unable to update like right now.'));
    } finally {
      setLikePendingId(null);
    }
  };

  const handleSave = async (postId: number) => {
    const previous = posts;
    const target = posts.find((item) => item.id === postId);
    if (!target) {
      return;
    }

    setSavePendingId(postId);
    setPosts((items) => items.map((post) => (post.id === postId ? { ...post, saved: !post.saved } : post)));

    try {
      const result = await savePost(postId);
      const nextSaved = typeof result?.saved === 'boolean' ? result.saved : !target.saved;
      setPosts((items) => items.map((post) => (post.id === postId ? { ...post, saved: nextSaved } : post)));
    } catch (requestError) {
      setPosts(previous);
      setError(getErrorMessage(requestError, 'Unable to save this post.'));
    } finally {
      setSavePendingId(null);
    }
  };

  const handleCommentSubmit = async (postId: number, comment: string) => {
    const previous = posts;
    const optimisticComment: FeedComment = {
      id: Date.now() * -1,
      comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 0,
        name: 'You',
      },
    };

    setCommentsSubmitting(true);
    setCommentsError(null);

    setPosts((items) =>
      items.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        return {
          ...post,
          comments_count: post.comments_count + 1,
          comments: [...(post.comments || []), optimisticComment],
        };
      }),
    );

    try {
      const result = await commentPost(postId, comment);
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid comment response.');
      }

      const nextComment = result.comment;
      const hasCommentObject = !!nextComment && typeof nextComment === 'object';
      if (!hasCommentObject) {
        throw new Error('Comment was not returned by server.');
      }

      const nextCommentsCount =
        typeof result.comments_count === 'number' ? result.comments_count : (previous.find((p) => p.id === postId)?.comments_count || 0) + 1;

      setPosts((items) =>
        items.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          const cleanedComments = (post.comments || []).filter((item) => item.id !== optimisticComment.id);

          return {
            ...post,
            comments_count: nextCommentsCount,
            comments: [...cleanedComments, nextComment],
          };
        }),
      );
    } catch (requestError) {
      setPosts(previous);
      setCommentsError(getErrorMessage(requestError, 'Unable to add comment.'));
    } finally {
      setCommentsSubmitting(false);
    }
  };

  const handleReport = async (postId: number, reason: string) => {
    await reportPost(postId, reason);
  };

  const handleCreatePost = async (payload: CreatePostPayload): Promise<boolean> => {
    setCreatingPost(true);
    setCreatePostError(null);

    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('content', payload.content);
    formData.append('short_description', payload.short_description);
    formData.append('label', payload.label);

    if (payload.location.trim()) {
      formData.append('location', payload.location.trim());
    }

    const postType = payload.label.toLowerCase() === 'emergency' ? 'emergency' : 'community';
    formData.append('post_type', postType);

    if (payload.image) {
      formData.append('image', payload.image);
    }

    try {
      const createdPost = await createPost(formData);
      const safeCreatedPost = sanitizePosts([createdPost]);
      if (safeCreatedPost.length > 0) {
        setPosts((previous) => sortByRecent([{ ...safeCreatedPost[0], liked: false, saved: false }, ...previous]));
      }
      setCreateModalOpen(false);
      return true;
    } catch (requestError) {
      setCreatePostError(getErrorMessage(requestError, 'Unable to create post.'));
      return false;
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.centerColumn}>
        <section className={styles.composerCard}>
          <div className={styles.composerAvatar}>
            {composerPhoto && !composerImageFailed ? (
              <img
                src={composerPhoto}
                alt={composerName}
                className={styles.composerAvatarImage}
                onError={() => setComposerImageFailed(true)}
              />
            ) : (
              composerName.charAt(0).toUpperCase()
            )}
          </div>
          <button type="button" className={styles.composerButton} onClick={() => setCreateModalOpen(true)}>
            What's happening in your neighborhood?
          </button>
          <button type="button" className={styles.quickPostBtn} onClick={() => setCreateModalOpen(true)}>
            <Plus size={15} /> Post
          </button>
        </section>

        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 size={18} className={styles.spin} />
            Loading neighborhood posts...
          </div>
        ) : null}

        {!loading && error ? <p className={styles.errorBanner}>{error}</p> : null}

        {!loading && posts.length === 0 ? (
          <div className={styles.emptyState}>No posts yet in your neighborhood</div>
        ) : null}

        <section className={styles.feedList}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentProfile?.id ?? null}
              currentUserName={currentProfile?.name ?? null}
              currentUserAvatarUrl={currentProfile?.avatarUrl ?? null}
              likePending={likePendingId === post.id}
              savePending={savePendingId === post.id}
              onLike={handleLike}
              onOpenComments={handleOpenComments}
              onSubmitComment={handleCommentSubmit}
              onSave={handleSave}
              onReport={handleReport}
            />
          ))}
        </section>
      </main>

      <PostComments
        open={commentsOpen}
        loading={commentsLoading}
        submitting={commentsSubmitting}
        post={activePost}
        error={commentsError}
        onClose={() => {
          setCommentsOpen(false);
          setCommentsError(null);
        }}
        onSubmitComment={handleCommentSubmit}
      />

      <CreatePostModal
        open={createModalOpen}
        submitting={creatingPost}
        error={createPostError}
        onClose={() => {
          setCreateModalOpen(false);
          setCreatePostError(null);
        }}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};