export type Item = {
  name: string;
  slug: string;
  description?: string;
};

export const getSecondMenu = (
  userId: string,
  isAdmin: boolean = false,
): { name: string; items: Item[] }[] => {
  const menuItems: Item[] = [
    {
      name: 'Home',
      slug: '/',
      description: 'Home page showing a summary view.',
    },
    {
      name: 'My Profile',
      slug: 'profile',
      description: 'My Profile page.',
    },
    {
      name: 'Customize Siddur',
      slug: 'customize-siddur',
      description: 'Print Custom Siddur',
    },
    {
      name: 'Visual Prayer Editor',
      slug: 'visual-prayer-editor-0',
      description: 'Edit and upload prayer JSONs',
    },
  ];

  // Only add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({
      name: 'Prayer Admin (Admin)',
      slug: 'admin',
      description: 'Manage system and automated functions',
    });
  }

  menuItems.push(
    {
      name: 'Nusach',
      slug: 'nusach-viz',
      description: 'Prayer Order (Nusach) Information',
    },
    {
      name: 'Team Schedule',
      slug: 'main/schedule',
      description: 'Schedule page.',
    },
    {
      name: 'Employees',
      slug: 'employees',
      description: 'Employees page.',
    },
    {
      name: 'Time Card',
      slug: 'main/timecard',
      description: 'Generate time card.',
    },
    // {
    //   name: 'Daily Summaries',
    //   slug: 'main/summary',
    //   description: 'Daily summaries for the routes.',
    // },
    {
      name: 'Settings',
      slug: 'settings',
      description: 'Settings',
    },
    {
      name: 'Routes',
      slug: 'main/routes',
      description: 'Truck Routes',
    },
    {
      name: 'Documentation',
      slug: 'docs',
      description: 'CBud Documentation',
    },
    {
      name: 'Blog',
      slug: 'blog',
      description: 'CBud Documentation',
    },
  );

  return [
    {
      name: 'Menu',
      items: menuItems,
    },
  ];
};


// Updated to respect the passed-in database ID
export const useResolveSlug = () => {
  return (item: Item): string => {
    // Don't modify the slug if it's already set with a specific ID
    if (item.slug.startsWith('employees/')) {
      return item.slug;
    }
    return item.slug;
  };
};