import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path'; // Ensure path is imported
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc'; // For Server Components
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
// import { notFound } from 'next/navigation'; // Optional: for a custom 404 trigger

// --- Type Definitions ---
interface BlogPostParams {
  slug: string;
}

interface Frontmatter {
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
  author?: string;
  status?: string;
  componentSets?: string[];
  [key: string]: any;
}

// --- Helper Functions (Ideally, move to a shared 'utils/blog.ts' file) ---

/**
 * Generates a "base" URL-friendly slug from a given file path.
 * For index.md files, uses the immediate parent directory name.
 * For other .md files, uses the filename without extension.
 * Collision handling (e.g., appending -1, -2) is done by the calling functions.
 */
function generateBaseSlug(filePathFromJson: string): string {
  const postsBaseDirString = 'MoL-blog-content/posts/';
  let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

  let relativePathToPostsDir: string;
  if (normalizedFilePath.startsWith(postsBaseDirString)) {
    relativePathToPostsDir = normalizedFilePath.substring(
      postsBaseDirString.length,
    );
  } else {
    console.warn(
      `Path "${normalizedFilePath}" (from JSON: "${filePathFromJson}") does not start with "${postsBaseDirString}". Slug generation might be affected.`,
    );
    relativePathToPostsDir = normalizedFilePath;
  }

  const fileExtension = path.posix.extname(relativePathToPostsDir);
  const baseFilename = path.posix.basename(
    relativePathToPostsDir,
    fileExtension,
  );

  let slugCandidate: string;
  if (baseFilename.toLowerCase() === 'index') {
    const parentDirName = path.posix.basename(
      path.posix.dirname(relativePathToPostsDir),
    );
    slugCandidate =
      parentDirName === '.' || parentDirName === '' ? 'home' : parentDirName;
  } else {
    slugCandidate = baseFilename;
  }

  const slug = slugCandidate
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  if (!slug) {
    const pathHash = Buffer.from(filePathFromJson)
      .toString('hex')
      .substring(0, 8);
    console.warn(
      `Generated empty base slug for path: ${filePathFromJson}. Using fallback: post-${pathHash}`,
    );
    return `post-${pathHash}`;
  }
  return slug;
}

/**
 * Formats a name (like a filename or directory name) into a nice title.
 */
function formatTitle(namePart: string): string {
  const titleWithoutDate = namePart.replace(/^\d{2}-\d{2}-\d{4}-/, '');
  return titleWithoutDate
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Checks if the current user can view a post.
 */
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined,
): boolean {
  const effectiveStatus = postStatus === 'public' ? 'public' : 'private';
  if (effectiveStatus === 'public') return true;
  return userRole === 'Admin' || userRole === 'Contributor';
}

// --- MDX Configuration ---
const mdxComponents = {
  /* Your custom MDX components */
};
const mdxProcessingOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]], // Or your preferred theme
};

// --- Data Fetching Logic ---

/**
 * Processes a list of file paths to generate final unique slugs and associated data.
 * This function is a precursor to getPostDataBySlug and generateStaticParams.
 */
function getAllPostsWithUniqueSlugs(): Array<{
  filePath: string;
  uniqueSlug: string;
  baseSlug: string;
}> {
  const jsonFilePath = path.join(
    process.cwd(),
    'blog-schema/file-paths/markdown-paths.json',
  );
  if (!fs.existsSync(jsonFilePath)) {
    console.error(
      'CRITICAL: markdown-paths.json not found for generating post list:',
      jsonFilePath,
    );
    return [];
  }

  try {
    const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const markdownFilePaths: string[] = JSON.parse(jsonFileContent);

    const postsData: Array<{
      filePath: string;
      uniqueSlug: string;
      baseSlug: string;
    }> = [];
    const slugOccurrences: { [key: string]: number } = {};

    for (const filePath of markdownFilePaths) {
      const trimmedPath = filePath.trim();
      const baseSlug = generateBaseSlug(trimmedPath);
      let uniqueSlug: string;

      if (slugOccurrences[baseSlug] === undefined) {
        slugOccurrences[baseSlug] = 0;
        uniqueSlug = baseSlug;
      } else {
        slugOccurrences[baseSlug]++;
        uniqueSlug = `${baseSlug}-${slugOccurrences[baseSlug]}`;
      }
      postsData.push({ filePath: trimmedPath, uniqueSlug, baseSlug });
    }
    return postsData;
  } catch (error) {
    console.error('Error processing markdown paths for unique slugs:', error);
    return [];
  }
}

async function getPostDataBySlug(urlSlug: string): Promise<{
  filePath: string;
  isMdx: boolean;
  frontmatter: Frontmatter;
  content: string;
} | null> {
  const allPostsMeta = getAllPostsWithUniqueSlugs();
  const foundPostMeta = allPostsMeta.find((p) => p.uniqueSlug === urlSlug);

  if (!foundPostMeta) {
    console.warn(`No matching file found for unique slug: "${urlSlug}"`);
    return null;
  }

  const { filePath } = foundPostMeta;
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(
      `File path from JSON ("${filePath}") exists, but actual file not found at: "${fullPath}"`,
    );
    return null;
  }

  try {
    const source = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(source);
    const frontmatter = data as Frontmatter;

    // Default title if not present, using original filename/dirname
    if (!frontmatter.title) {
      const postsBaseDirString = 'MoL-blog-content/posts/';
      let originalNormalizedPath = filePath.replace(/\\/g, '/');
      let originalRelativePath = originalNormalizedPath.startsWith(
        postsBaseDirString,
      )
        ? originalNormalizedPath.substring(postsBaseDirString.length)
        : originalNormalizedPath;

      const fileExt = path.posix.extname(originalRelativePath);
      const baseFName = path.posix.basename(originalRelativePath, fileExt);
      let titleSourceName: string;
      if (baseFName.toLowerCase() === 'index') {
        const pDirName = path.posix.basename(
          path.posix.dirname(originalRelativePath),
        );
        titleSourceName =
          pDirName === '.' || pDirName === '' ? 'Home' : pDirName;
      } else {
        titleSourceName = baseFName;
      }
      frontmatter.title = formatTitle(titleSourceName);
    }

    const fileExtension = path.extname(fullPath).toLowerCase();
    return {
      filePath: fullPath,
      isMdx: fileExtension === '.mdx',
      frontmatter,
      content,
    };
  } catch (error) {
    console.error(
      `Error reading or processing file "${filePath}" for slug "${urlSlug}":`,
      error,
    );
    return null;
  }
}

// --- Generate Static Paths ---
export async function generateStaticParams(): Promise<BlogPostParams[]> {
  const allPostsMeta = getAllPostsWithUniqueSlugs();
  const params = allPostsMeta.map((p) => ({ slug: p.uniqueSlug }));

  console.log(
    `Generated ${params.length} static params for blog posts using unique slugs.`,
  );
  return params;
}

// --- Blog Post Page Component ---
export default async function BlogPostPage({
  params,
}: {
  params: BlogPostParams;
}) {
  const { slug: urlSlug } = params;
  const { userId } = auth();
  let userRole: string | undefined;

  if (userId) {
    try {
      const user = await currentUser();
      userRole = user?.publicMetadata?.role as string;
    } catch (error) {
      console.error(`Error fetching user role for slug "${urlSlug}":`, error);
    }
  }

  try {
    const postData = await getPostDataBySlug(urlSlug);

    if (!postData) {
      console.error(`Post data not found for slug: "${urlSlug}".`);
      // For a standard 404, you might import and call notFound() from 'next/navigation';
      // notFound();
      throw new Error(
        `Blog post "${urlSlug}" not found or could not be processed.`,
      );
    }

    const { isMdx, frontmatter, content } = postData;

    if (!canViewPost(userRole, frontmatter.status)) {
      console.log(
        `User (Role: ${
          userRole || 'Guest'
        }) denied access to post "${urlSlug}" (Status: ${
          frontmatter.status
        }). Redirecting.`,
      );
      redirect('/blog');
    }

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-blue-400 transition-colors hover:text-blue-300"
          >
            ← Back to all posts
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          {' '}
          {/* Apply prose classes here */}
          <header className="mb-10 border-b border-gray-700 pb-8">
            {/* ... (article header and content rendering, same as your last provided version) ... */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                {frontmatter.title}
              </h1>
              {(userRole === 'Admin' || userRole === 'Contributor') &&
                frontmatter.status && (
                  <span
                    className={`mt-1 self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium sm:mt-0 ${
                      frontmatter.status === 'public'
                        ? 'border border-green-700 bg-green-900/50 text-green-300'
                        : 'border border-yellow-700 bg-yellow-900/50 text-yellow-300'
                    }`}
                  >
                    {frontmatter.status}
                  </span>
                )}
            </div>
            {frontmatter.description && (
              <p className="mt-4 text-xl text-gray-400">
                {frontmatter.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              {frontmatter.date && (
                <span>
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              {frontmatter.author && <span>By {frontmatter.author}</span>}
            </div>
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          <div className="mdx-content">
            {isMdx ? (
              // @ts-ignore
              <MDXRemote
                source={content}
                components={mdxComponents}
                // @ts-ignore
                options={{ mdxOptions: mdxProcessingOptions }}
              />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            )}
          </div>
        </article>
      </div>
    );
  } catch (error: any) {
    console.error(
      `Error rendering blog post for slug "${urlSlug}":`,
      error.message,
    );
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <div className="mb-6">
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to all posts
          </Link>
        </div>
        <div className="rounded-lg border border-red-700 bg-red-900/30 p-8">
          <h1 className="mb-4 text-2xl font-bold text-red-400">Post Error</h1>
          <p className="text-gray-300">
            The post you were looking for ({urlSlug}) could not be loaded.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-4 text-xs text-gray-500">
              Details: {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
