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
import styles from './Feed.module.css';

type ViewPost = FeedPost & {
  liked?: boolean;
  saved?: boolean;
  comments?: FeedComment[];
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

  const activePost = useMemo(
    () => posts.find((post) => post.id === activePostId) || null,
    [activePostId, posts],
  );

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

  const handleOpenComments = async (postId: number) => {
    setCommentsOpen(true);
    setCommentsLoading(true);
    setCommentsError(null);
    setActivePostId(postId);

    try {
      const fullPost = await getPost(postId);
      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? { ...post, comments: fullPost.comments || [], comments_count: fullPost.comments_count }
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
      setPosts((items) =>
        items.map((post) =>
          post.id === postId ? { ...post, liked: result.liked, likes_count: result.likes_count } : post,
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
      setPosts((items) => items.map((post) => (post.id === postId ? { ...post, saved: result.saved } : post)));
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

      setPosts((items) =>
        items.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          const cleanedComments = (post.comments || []).filter((item) => item.id !== optimisticComment.id);

          return {
            ...post,
            comments_count: result.comments_count,
            comments: [...cleanedComments, result.comment],
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
          <div className={styles.composerAvatar}>Y</div>
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
              likePending={likePendingId === post.id}
              savePending={savePendingId === post.id}
              onLike={handleLike}
              onOpenComments={handleOpenComments}
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