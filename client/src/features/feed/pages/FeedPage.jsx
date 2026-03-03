import React from "react";
import { PostComposer } from "../components/PostComposer";
import { FeedAdvancedFilters } from "../components/FeedAdvancedFilters";
import { FeedSummaryHeader } from "../components/FeedSummaryHeader";
import { FeedCard } from "../components/FeedCard";
import { UpcomingEventsPanel } from "../components/UpcomingEventsPanel";
import { NeighborhoodMood } from "../components/NeighborhoodMood";
import { useFeedStore } from "../store/feedStore";
import styles from "./FeedPage.module.css";

export const FeedPage = () => {
  const filteredPosts = useFeedStore((state) => state.filteredPosts);

  return (
    <div className={styles.feedPage}>
      <main className={styles.centerColumn}>
        <PostComposer />
        <div className={styles.actionRow}>
          <FeedAdvancedFilters compact showTags={false} />
          <div className={styles.summaryRight}>
            <FeedSummaryHeader />
          </div>
        </div>

        <div className={styles.feedList}>
          {filteredPosts.map((post, index) => (
            <FeedCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </main>

      <aside className={styles.rightColumn}>
        <NeighborhoodMood />
        <UpcomingEventsPanel />
      </aside>
    </div>
  );
};