import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdvancedFeedFilters } from "../hooks/useAdvancedFeedFilters";
import { FilterToggle } from "./filters/FilterToggle";
import { AdvancedFilterPanel } from "./filters/AdvancedFilterPanel";
import { ActiveFilterTags } from "./filters/ActiveFilterTags";
import styles from "./FeedAdvancedFilters.module.css";

export const FeedAdvancedFilters = ({ compact = false, showTags = true }) => {
  const isMobile = useIsMobile();
  const { state, options, actions } = useAdvancedFeedFilters();

  const isOpen = isMobile ? state.isMobileFiltersOpen : state.isAdvancedFiltersOpen;

  return (
    <div className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ""}`}>
      <FilterToggle
        isOpen={isOpen}
        activeFilterCount={state.activeFilterCount}
        onToggle={() => actions.toggleFilters(isMobile)}
        compact={compact}
      />

      <AdvancedFilterPanel
        id="advanced-feed-filters"
        isOpen={isOpen}
        isMobile={isMobile}
        options={options}
        state={state}
        actions={actions}
        onClose={() => {
          if (isMobile) {
            actions.closeMobileFilters();
            return;
          }

          actions.toggleAdvancedFilters();
        }}
      />

      {showTags && (
        <ActiveFilterTags
          activeTags={state.activeTags}
          onRemoveTag={actions.removeTag}
          onClearAll={actions.clearAllFilters}
        />
      )}
    </div>
  );
};
