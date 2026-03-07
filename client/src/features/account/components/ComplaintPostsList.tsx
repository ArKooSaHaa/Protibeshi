import { useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { UserPost } from '../hooks/useUserPosts';

interface ComplaintPostsListProps {
  posts: UserPost[];
  totalCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (postId: string) => Promise<void>;
}

const priorityClass: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const ComplaintPostsList = ({
  posts,
  totalCount,
  isLoading,
  hasMore,
  onLoadMore,
  onDelete,
}: ComplaintPostsListProps) => {
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

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
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-lg">You haven't created any posts yet.</p>
        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Create Post</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{post.title}</h3>
              <Badge className="capitalize" variant={post.status === 'pending' ? 'secondary' : 'default'}>
                {post.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">{post.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2 py-0.5 capitalize ${priorityClass[post.priority ?? 'medium']}`}
              >
                Priority: {post.priority}
              </span>
              <span className="text-slate-500">Location: {post.location}</span>
              <span className="text-slate-500">Posted {post.datePosted}</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
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
            <AlertDialogTitle>Delete this complaint post?</AlertDialogTitle>
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
