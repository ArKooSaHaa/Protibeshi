import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
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

interface RentPostsListProps {
  posts: UserPost[];
  totalCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (postId: string) => Promise<void>;
}

export const RentPostsList = ({ posts, totalCount, isLoading, hasMore, onLoadMore, onDelete }: RentPostsListProps) => {
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
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
            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[180px_1fr]"
          >
            <img src={post.imageUrl} alt={post.title} className="h-40 w-full rounded-lg object-cover" />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{post.title}</h3>
                <Badge variant={post.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {post.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{post.description}</p>
              <div className="text-xs text-slate-500">
                <p>Price: {post.price}</p>
                <p>Bedrooms: {post.bedrooms ?? 'N/A'}</p>
                <p>Location: {post.location}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" type="button">
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => setSelectedDeleteId(post.id)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
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
            <AlertDialogTitle>Delete this rent listing?</AlertDialogTitle>
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
