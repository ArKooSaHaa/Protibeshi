import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserPost } from '../hooks/useUserPosts';

interface FeedPostsListProps {
  posts: UserPost[];
  totalCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (postId: string) => Promise<void>;
}

const rowHeight = 180;
const viewportHeight = 540;
const overscan = 3;

export const FeedPostsList = ({ posts, totalCount, isLoading, hasMore, onLoadMore, onDelete }: FeedPostsListProps) => {
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;

  const windowedPosts = useMemo(() => {
    return posts.slice(startIndex, Math.min(posts.length, startIndex + visibleCount));
  }, [posts, startIndex, visibleCount]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <Card className="border-dashed border-slate-300">
        <CardContent className="py-14 text-center">
          <p className="text-lg">You haven't created any posts yet.</p>
          <p className="mt-1 text-sm text-slate-500">Share an update with your neighbors to get started.</p>
          <Button className="mt-5 bg-emerald-600 hover:bg-emerald-700">Create Post</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: viewportHeight }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
        <div style={{ height: startIndex * rowHeight }} />
        {windowedPosts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{post.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{post.description}</p>
              </div>
              <Badge variant={post.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {post.status}
              </Badge>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              <p>Posted {post.datePosted}</p>
              <p>Location: {post.location}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" type="button">
                <Eye className="size-4" />
                View
              </Button>
              <Button size="sm" variant="outline" type="button">
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" type="button" onClick={() => setSelectedDeleteId(post.id)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </motion.article>
        ))}
        <div style={{ height: Math.max(0, posts.length - (startIndex + windowedPosts.length)) * rowHeight }} />
      </div>

      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      ) : null}

      <AlertDialog open={Boolean(selectedDeleteId)} onOpenChange={(open) => !open && setSelectedDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this post?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!selectedDeleteId) {
                  return;
                }
                await onDelete(selectedDeleteId);
                setSelectedDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
