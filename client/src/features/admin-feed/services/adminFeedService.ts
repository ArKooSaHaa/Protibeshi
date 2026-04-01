import { mockAdminFeedPosts } from '../data/mockAdminFeedPosts';
import type { AdminFeedPost } from '../types/adminFeed.types';

const MOCK_RESPONSE_DELAY_MS = 900;

const clonePost = (post: AdminFeedPost): AdminFeedPost => ({
  ...post,
  user: { ...post.user },
  reports: post.reports.map((report) => ({ ...report })),
});

export const fetchAdminFeedPosts = async (): Promise<AdminFeedPost[]> => {
  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), MOCK_RESPONSE_DELAY_MS);
  });

  return mockAdminFeedPosts.map(clonePost);
};
