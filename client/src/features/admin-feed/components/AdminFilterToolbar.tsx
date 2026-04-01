import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Filter } from 'lucide-react';
import type { AdminFilterTab } from '../types/adminFeed.types';

interface AdminFilterToolbarProps {
  activeTab: AdminFilterTab;
  onTabChange: (tab: AdminFilterTab) => void;
}

const tabItems: Array<{ value: AdminFilterTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'reported', label: 'Reported' },
];

export const AdminFilterToolbar = ({
  activeTab,
  onTabChange,
}: AdminFilterToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeLabel = useMemo(() => {
    return tabItems.find((item) => item.value === activeTab)?.label ?? 'All';
  }, [activeTab]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <section className="afd-toolbar-inline" aria-label="Post filters">
      <div className="afd-toolbar-simple" ref={dropdownRef}>
        <motion.button
          type="button"
          className="afd-filter-btn afd-ripple-btn"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen((previous) => !previous)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <Filter size={15} />
          <span>Filter: {activeLabel}</span>
          <ChevronDown size={15} className={isOpen ? 'afd-chevron-open' : ''} />
        </motion.button>

        {isOpen ? (
          <div className="afd-filter-menu" role="menu" aria-label="Feed status filter options">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={`afd-filter-menu-item ${isActive ? 'afd-filter-menu-item-active' : ''}`}
                  onClick={() => {
                    onTabChange(tab.value);
                    setIsOpen(false);
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};
