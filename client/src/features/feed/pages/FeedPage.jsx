import React from "react";
import { FeedSidebarFilters } from "../components/FeedSidebarFilters";
import { PostComposer } from "../components/PostComposer";
import { FeedSummaryHeader } from "../components/FeedSummaryHeader";
import { FeedCard } from "../components/FeedCard";
import { UpcomingEventsPanel } from "../components/UpcomingEventsPanel";
import { NeighborhoodMood } from "../components/NeighborhoodMood";
import { useFeedStore } from "../store/feedStore";
import styles from "./FeedPage.module.css";

export const FeedPage = () => {
  const { filteredPosts } = useFeedStore();

  return (
    <div className={styles.feedPage}>
      
      {/* LEFT SIDEBAR */}
      <aside className={styles.leftColumn}>
        <FeedSidebarFilters />
      </aside>

      {/* CENTER FEED */}
      <main className={styles.centerColumn}>
        <PostComposer />
        <FeedSummaryHeader />

        <div className={styles.feedList}>
          {filteredPosts.map((post, index) => (
            <FeedCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className={styles.rightColumn}>
        <NeighborhoodMood />
        <UpcomingEventsPanel />
      </aside>
    </div>
  );
};