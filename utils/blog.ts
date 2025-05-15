// utils/blog.ts or lib/blog.ts
import fs from 'fs';
import path from 'path';

interface CategorySchema {
  categories: {
    [key: string]: {
      description: string;
      url: string;
    }[];
  };
}

function formatTitle(folderName: string): string {
  const titleWithoutDate = folderName.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getBlogCategoryTabs(): Promise<
  { text: string; href?: string }[]
> {
  try {
    const schemaPath = path.join(
      process.cwd(),
      'blog-schema/categories-schema.json',
    );
    if (!fs.existsSync(schemaPath)) {
      console.error('Error: categories-schema.json not found.');
      return [{ text: 'Home', href: '/blog' }];
    }
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema: CategorySchema = JSON.parse(schemaFile);

    const tabs: { text: string; href?: string }[] = [
      { text: 'Home', href: '/blog' },
    ];

    for (const categorySlug in schema.categories) {
      if (schema.categories.hasOwnProperty(categorySlug)) {
        tabs.push({
          text: formatTitle(categorySlug),
          href: `/blog/categories/${categorySlug}`, // Construct the correct category URL
        });
      }
    }

    return tabs;
  } catch (error) {
    console.error('Error reading categories schema:', error);
    return [{ text: 'Home', href: '/blog' }];
  }
}