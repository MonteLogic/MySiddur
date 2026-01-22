'use client';
import { Tab } from '#/ui/tab';
import { useState } from 'react';

export type Item = {
  text: string;
  slug?: string;
  segment?: string;
  parallelRoutesKey?: string;
};

export const TabGroupDynamic = ({
  path,
  parallelRoutesKey,
  onTabChange,
}: {
  path: string;
  parallelRoutesKey?: string;
  onTabChange: (item: Item) => void;
}) => {
  const items: Item[] = [
    { text: 'Main' },
    { text: 'Schedule', slug: 'schedule' },
    { text: 'Summary', slug: 'summary' },
    { text: 'Timecard', slug: 'timecard' },
    { text: 'Payments', slug: 'payments' },
    { text: 'Routes', slug: 'routes' },
  ];

  const [activeTab, setActiveTab] = useState(items[0]);

  const handleTabClick = (item: Item) => {
    setActiveTab(item);
    onTabChange(item);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Tab
          key={path + item.slug}
          item={item}
          path={path}
          parallelRoutesKey={parallelRoutesKey}
          isActive={activeTab.text === item.text}
          onClick={() => handleTabClick(item)}
        />
      ))}
    </div>
  );
};
