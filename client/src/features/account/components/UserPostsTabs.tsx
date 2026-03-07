import { AnimatePresence, motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AccountPostTab, UserPost } from '../hooks/useUserPosts';
import { ComplaintPostsList } from './ComplaintPostsList';
import { FeedPostsList } from './FeedPostsList';
import { MarketplacePostsList } from './MarketplacePostsList';
import { ReliefPostsList } from './ReliefPostsList';
import { RentPostsList } from './RentPostsList';
import { ServicePostsList } from './ServicePostsList';

interface UserPostsTabsProps {
  tabs: Array<{ key: AccountPostTab; label: string }>;
  activeTab: AccountPostTab;
  posts: UserPost[];
  totalCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onTabChange: (tab: AccountPostTab) => void;
  onLoadMore: () => void;
  onDeletePost: (tab: AccountPostTab, postId: string) => Promise<void>;
}

const motionConfig = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2 },
};

export const UserPostsTabs = ({
  tabs,
  activeTab,
  posts,
  totalCount,
  isLoading,
  hasMore,
  onTabChange,
  onLoadMore,
  onDeletePost,
}: UserPostsTabsProps) => {
  const renderTabContent = (tab: AccountPostTab) => {
    const sharedProps = {
      posts,
      totalCount,
      isLoading,
      hasMore,
      onLoadMore,
      onDelete: (postId: string) => onDeletePost(tab, postId),
    };

    if (tab === 'feed') return <FeedPostsList {...sharedProps} />;
    if (tab === 'marketplace') return <MarketplacePostsList {...sharedProps} />;
    if (tab === 'rent') return <RentPostsList {...sharedProps} />;
    if (tab === 'services') return <ServicePostsList {...sharedProps} />;
    if (tab === 'complaints') return <ComplaintPostsList {...sharedProps} />;
    return <ReliefPostsList {...sharedProps} />;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Your Content</h2>
          <p className="text-sm text-slate-500">Manage all posts from one dashboard.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AccountPostTab)}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="min-w-max bg-slate-100">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} {...motionConfig}>
            {tabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                {activeTab === tab.key ? renderTabContent(tab.key) : null}
              </TabsContent>
            ))}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </section>
  );
};
