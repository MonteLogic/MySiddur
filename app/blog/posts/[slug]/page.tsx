import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

// Define types
interface BlogPostParams {
  readonly slug: string;
}

interface Frontmatter {
  readonly title: string;
  readonly date?: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly author?: string;
  readonly status?: string;
  readonly [key: string]: unknown; // For additional frontmatter fields
}

// Custom components for MDX
const components = {
  // You can add custom components here to be used in MDX
  // Example: CustomAlert: (props) => <div className="bg-yellow-100 p-4">{props.children}</div>,
};

// Helper function to format folder name into a title
function formatTitle(folderName: string): string {
  // Remove date prefix if it exists (e.g., "12-20-2024-")
  const titleWithoutDate = folderName.replace(/^\d{2}-\d{2}-\d{4}-/, '');

  // Replace hyphens with spaces and capitalize each word
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Options for MDX processing - restructured to match required types
const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypePrettyCode],
};

// Helper function to check if user can view a post based on role and post status
function canViewPost(
  userRole: string | undefined,
  postStatus: string,
): boolean {
  // If the post is public, everyone can view it
  if (postStatus === 'public') {
    return true;
  }

  // If the post is private, only Admin and Contributor can view it
  return userRole === 'Admin' || userRole === 'Contributor';
}

// Helper function to get user role
async function getUserRole(userId: string | null): Promise<string | undefined> {
  if (!userId) {
    return undefined;
  }

  try {
    const user = await currentUser();
    return user?.publicMetadata?.role as string;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return undefined;
  }
}

// Helper function to get blog post content
function getBlogPostContent(slug: string): { filePath: string; isMdx: boolean } {
  const postsDirectory = path.join(process.cwd(), 'content/posts/');
  const postDirectory = path.join(postsDirectory, 'uncategorized', slug);

  const mdxPath = path.join(postDirectory, 'index.mdx');
  const mdPath = path.join(postDirectory, 'index.md');

  if (fs.existsSync(mdxPath)) {
    return { filePath: mdxPath, isMdx: true };
  } else if (fs.existsSync(mdPath)) {
    return { filePath: mdPath, isMdx: false };
  } else {
    throw new Error(`Blog post not found in uncategorized: ${slug}`);
  }
}

// Helper function to render blog post content
function renderBlogPostContent(
  frontmatter: Frontmatter,
  content: string,
  isMdx: boolean,
  userRole: string | undefined,
  postStatus: string,
) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href="/blog" className="text-blue-400 hover:text-blue-300">
          ← Back to all posts
        </Link>
      </div>

      <article className="prose prose-invert prose-lg max-w-none">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold text-white">
              {frontmatter.title}
            </h1>

            {(userRole === 'Admin' || userRole === 'Contributor') && (
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  postStatus === 'public'
                    ? 'border border-green-800 bg-green-900/30 text-green-400'
                    : 'border border-yellow-800 bg-yellow-900/30 text-yellow-400'
                }`}
              >
                {postStatus}
              </span>
            )}
          </div>

          {frontmatter.description && (
            <p className="mt-3 text-xl text-gray-300">
              {frontmatter.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {frontmatter.date && (
              <div className="text-gray-400">
                {new Date(frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}

            {frontmatter.author && (
              <div className="text-gray-400">By {frontmatter.author}</div>
            )}
          </div>

          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {frontmatter.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mdx-content">
          {isMdx ? (
            <MDXRemote
              source={content}
              components={components}
              options={{
                mdxOptions
              }}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown-content"
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </article>
    </div>
  );
}

// Helper function to render error page
function renderErrorPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href="/blog" className="text-blue-400 hover:text-blue-300">
          ← Back to all posts
        </Link>
      </div>

      <div className="rounded-lg border border-red-500 bg-red-900/20 p-6">
        <h1 className="mb-4 text-3xl font-bold text-red-500">
          Post Not Found
        </h1>
        <p className="text-white">
          This blog post could not be found in the uncategorized section or you
          do not have permission to view it.
        </p>
      </div>
    </div>
  );
}

// Blog post page component
export default async function BlogPost({ params }: Readonly<{ params: BlogPostParams }>) {
  const { slug } = params;
  const { userId } = await auth();
  const userRole = await getUserRole(userId);

  try {
    const { filePath, isMdx } = getBlogPostContent(slug);

    const source = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(source);

    // Ensure frontmatter always has a title property
    const frontmatter: Frontmatter = {
      title: data.title ?? formatTitle(slug),
      date: data.date,
      description: data.description,
      tags: data.tags,
      author: data.author,
      status: data.status,
      ...data,
    };

    const postStatus = frontmatter.status === 'public' ? 'public' : 'private';

    if (!canViewPost(userRole, postStatus)) {
      redirect('/blog');
    }

    return renderBlogPostContent(frontmatter, content, isMdx, userRole, postStatus);
  } catch (error) {
    console.error('Error rendering blog post:', error);
    return renderErrorPage();
  }
}