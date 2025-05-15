import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs';

interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string[];
    componentSets?: string[];
    [key: string]: any; // For additional frontmatter fields
  };
}

// Function to recursively get all markdown files within a directory
const getAllMarkdownFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllMarkdownFiles(filePath, arrayOfFiles);
    } else if (file === 'index.md' || file === 'index.mdx') {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

// Function to safely get blog posts, with fallback for production environments
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // Path to your submodule posts directory
    const postsDirectory = path.join(process.cwd(), 'MoL-blog-content/posts');

    // Get all index.md and index.mdx files within the posts directory and its subdirectories
    const allMarkdownFiles = getAllMarkdownFiles(postsDirectory);

    // Process each markdown file
    const posts: BlogPost[] = allMarkdownFiles.map(filePath => {
      // Extract the folder name (slug) from the file path
      const parts = filePath.split(path.sep);
      const folderName = parts[parts.length - 2];

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Parse frontmatter using gray-matter
      const { data } = matter(fileContent);

      // Create a properly typed frontmatter object with required title
      const frontmatter: BlogPost['frontmatter'] = {
        ...data,
        // Ensure title exists in frontmatter
        title: data.title ?? formatTitle(folderName),
        // If status is not explicitly set to "public", treat as private
        status: data.status === 'public' ? ['public'] : ['private']
      };

      return {
        slug: folderName,
        frontmatter
      };
    });

    // Sort posts by date if available (newest first)
    return posts.sort((a, b) => {
      if (a.frontmatter.date && b.frontmatter.date) {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Error reading blog directory:', error);

    // Return an empty array in production if the directory doesn't exist
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    throw error;
  }
}

// Helper function to format folder name into a title
function formatTitle(folderName: string): string {
  // Remove date prefix if it exists (e.g., "12-20-2024-")
  const titleWithoutDate = folderName.replace(/^\d{2}-\d{2}-\d{4}-/, '');

  // Replace hyphens with spaces and capitalize each word
  return titleWithoutDate
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to check if user can view a post based on role and post status
function canViewPost(userRole: string | undefined, postStatus: string | undefined): boolean {
  // If the post status is explicitly 'public', everyone can view it
  if (postStatus === 'public') {
    return true;
  }

  // If the post is private or has no status, only Admin and Contributor can view it
  return postStatus !== 'public' && (userRole === 'Admin' || userRole === 'Contributor');
}

export default async function BlogPage() {
  const { userId } = auth();
  let userRole: string | undefined;

  // Get user role directly from Clerk metadata
  if (userId) {
    try {
      const user = await currentUser();
      // Access publicMetadata for the role
      userRole = user?.publicMetadata?.role as string;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  const allPosts = await getBlogPosts();

  // Filter posts based on user role
  const visiblePosts = allPosts.filter(post =>
    canViewPost(userRole, Array.isArray(post.frontmatter.status) ? post.frontmatter.status[0] : post.frontmatter.status)
  );

  if (visiblePosts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-white">
            {userId
              ? "No blog posts are currently available to view."
              : "Please sign in to view blog posts or check back later for public content."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">CBud Blog</h1>

      <div className="space-y-6">
        {visiblePosts.map((post: BlogPost) => (
          <article
            key={post.slug}
            className="bg-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-3">
                <Link
                  href={`/blog/posts/${post.slug}`}
                  className="text-blue-400 hover:text-blue-300 no-underline"
                >
                  {post.frontmatter.title}
                </Link>
              </h2>

              {/* Show status badge for Admin and Contributor */}
              {(userRole === 'Admin' || userRole === 'Contributor') && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  Array.isArray(post.frontmatter.status) && post.frontmatter.status[0] === 'public'
                    ? 'bg-green-900/30 text-green-400 border border-green-800'
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                }`}>
                  {Array.isArray(post.frontmatter.status) ? post.frontmatter.status[0] : post.frontmatter.status}
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
                href={`/blog/posts/${post.slug}`}
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