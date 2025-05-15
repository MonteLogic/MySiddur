import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs';
import { notFound } from 'next/navigation';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    categories?: string[]; // Add categories to frontmatter
    [key: string]: any;
  };
}

interface CategorySchema {
  categories: {
    [key: string]: {
      description: string;
      url: string;
    }[];
  };
}

async function getCategoryDetails(slug: string): Promise<{ name: string } | undefined> {
  try {
    const schemaPath = path.join(process.cwd(), 'blog-schema/categories-schema.json');
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema: CategorySchema = JSON.parse(schemaFile);

    for (const categoryName in schema.categories) {
      if (schema.categories.hasOwnProperty(categoryName)) {
        if (categoryName === slug) {
          return { name: formatTitle(categoryName) };
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error('Error reading categories schema:', error);
    return undefined;
  }
}

// Function to safely get blog posts
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');
    const postFolders = fs.readdirSync(postsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const posts: BlogPost[] = await Promise.all(
      postFolders.map(async (folderName) => {
        const mdxPath = path.join(postsDirectory, folderName, 'index.mdx');
        const mdPath = path.join(postsDirectory, folderName, 'index.md');

        let filePath = '';
        if (fs.existsSync(mdxPath)) {
          filePath = mdxPath;
        } else if (fs.existsSync(mdPath)) {
          filePath = mdPath;
        } else {
          return {
            slug: folderName,
            frontmatter: {
              title: formatTitle(folderName),
              status: 'private',
            },
          };
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);

        const frontmatter: BlogPost['frontmatter'] = {
          ...data,
          title: data.title || formatTitle(folderName),
          status: data.status === 'public' ? 'public' : 'private',
          categories: (data.categories as string[]) || [], // Ensure categories exist
        };

        return {
          slug: folderName,
          frontmatter,
        };
      })
    );

    return posts.sort((a, b) => {
      if (a.frontmatter.date && b.frontmatter.date) {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Error reading blog directory:', error);
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    throw error;
  }
}

// Helper function to format folder name into a title
function formatTitle(folderName: string): string {
  const titleWithoutDate = folderName.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to check if user can view a post
function canViewPost(userRole: string | undefined, postStatus: string): boolean {
  return postStatus === 'public' || userRole === 'Admin' || userRole === 'Contributor';
}

interface Props {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params: { slug } }: Props) {
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.publicMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const categoryDetails = await getCategoryDetails(slug);

  if (!categoryDetails) {
    notFound(); // This will render your Next.js 404 page
  }

  const allPosts = await getBlogPosts();
  const categoryPosts = allPosts.filter(post =>
    post.frontmatter.categories?.includes(slug) &&
    canViewPost(userRole, post.frontmatter.status || 'private')
  );

  if (categoryPosts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">{categoryDetails.name}</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-white">No posts found in this category.</p>
          <Link href="/blog" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Go back to the homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">{categoryDetails.name}</h1>

      <div className="space-y-6">
        {categoryPosts.map((post: BlogPost) => (
          <article
            key={post.slug}
            className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-400 hover:text-blue-300 no-underline"
                >
                  {post.frontmatter.title}
                </Link>
              </h2>

              {(userRole === 'Admin' || userRole === 'Contributor') && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  post.frontmatter.status === 'public'
                    ? 'bg-green-900/30 text-green-400 border border-green-800'
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                }`}>
                  {post.frontmatter.status}
                </span>
              )}
            </div>

            {post.frontmatter.description && (
              <p className="text-gray-300 mb-3">{post.frontmatter.description}</p>
            )}

            {post.frontmatter.date && (
              <div className="text-gray-400 text-sm mb-3">
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}

            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.frontmatter.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <Link
                href={`/blog/${post.slug}`}
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 no-underline"
              >
                Read more
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}