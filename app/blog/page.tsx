import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path'; // Ensure path is imported
import matter from 'gray-matter';
import { auth, currentUser } from '@clerk/nextjs';

interface BlogPost {
  slug: string; // This will be the final, unique slug
  frontmatter: {
    title: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    status?: string;
    componentSets?: string[];
    [key: string]: any;
  };
}

// --- Helper Functions (Ideally, move to a shared 'utils/blog.ts' file) ---

/**
 * Generates a "base" URL-friendly slug from a given file path.
 * For index.md files, uses the immediate parent directory name.
 * For other .md files, uses the filename without extension.
 */
function generateBaseSlug(filePathFromJson: string): string {
    const postsBaseDirString = 'MoL-blog-content/posts/';
    let normalizedFilePath = filePathFromJson.replace(/\\/g, '/').trim();

    let relativePathToPostsDir: string;
    if (normalizedFilePath.startsWith(postsBaseDirString)) {
        relativePathToPostsDir = normalizedFilePath.substring(postsBaseDirString.length);
    } else {
        console.warn(`Path "${normalizedFilePath}" (from JSON: "${filePathFromJson}") does not start with "${postsBaseDirString}". Slug generation might be affected.`);
        relativePathToPostsDir = normalizedFilePath;
    }

    const fileExtension = path.posix.extname(relativePathToPostsDir);
    const baseFilename = path.posix.basename(relativePathToPostsDir, fileExtension);

    let slugCandidate: string;
    if (baseFilename.toLowerCase() === 'index') {
        const parentDirName = path.posix.basename(path.posix.dirname(relativePathToPostsDir));
        slugCandidate = (parentDirName === '.' || parentDirName === '') ? 'home' : parentDirName; 
    } else {
        slugCandidate = baseFilename;
    }
    
    const slug = slugCandidate
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    
    if (!slug) {
        // Fallback for an empty slug, though unlikely with the above logic
        const pathHash = Buffer.from(filePathFromJson).toString('hex').substring(0, 8);
        console.warn(`Generated empty base slug for path: ${filePathFromJson}. Using fallback: post-${pathHash}`);
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

// --- Main function to get blog posts ---

async function getBlogPosts(): Promise<BlogPost[]> {
  console.log('Starting getBlogPosts function for listing page...');
  try {
    const jsonFilePath = path.join(process.cwd(), 'blog-schema/file-paths/markdown-paths.json');
    if (!fs.existsSync(jsonFilePath)) {
      console.error('CRITICAL: markdown-paths.json not found at:', jsonFilePath);
      return [];
    }

    const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const markdownFilePaths: string[] = JSON.parse(jsonFileContent);
    console.log(`Found ${markdownFilePaths.length} paths in JSON file.`);

    // Step 1: Generate base slugs and gather necessary info for each path
    const processedPaths = markdownFilePaths.map((filePathFromJson, index) => {
        const currentFilePath = filePathFromJson.trim();
        if (filePathFromJson !== currentFilePath) {
            console.warn(`[${index}] Path "${filePathFromJson}" had leading/trailing whitespace. Trimmed.`);
        }

        const baseSlug = generateBaseSlug(currentFilePath);

        // Determine titleSource from original path structure
        const postsBaseDirString = 'MoL-blog-content/posts/';
        let originalNormalizedPath = currentFilePath.replace(/\\/g, '/');
        let originalRelativePath = originalNormalizedPath.startsWith(postsBaseDirString)
            ? originalNormalizedPath.substring(postsBaseDirString.length)
            : originalNormalizedPath;

        const originalFileExt = path.posix.extname(originalRelativePath);
        const originalBaseFileNameForTitle = path.posix.basename(originalRelativePath, originalFileExt);
        const originalParentDirName = path.posix.basename(path.posix.dirname(originalRelativePath)); 

        let titleSourceName: string;
        if (originalBaseFileNameForTitle.toLowerCase() === 'index') {
            titleSourceName = (originalParentDirName && originalParentDirName !== '.') ? originalParentDirName : originalBaseFileNameForTitle;
        } else {
            titleSourceName = originalBaseFileNameForTitle;
        }
        
        return {
            filePath: currentFilePath,
            baseSlug: baseSlug,
            titleSourceName: titleSourceName,
            originalIndex: index // Keep original index for stable suffixing if needed later, though current logic relies on iteration order
        };
    });

    // Step 2: Create unique slugs and process each file
    const posts: BlogPost[] = [];
    const slugOccurrences: { [key: string]: number } = {};

    for (const item of processedPaths) {
        const { filePath, baseSlug, titleSourceName, originalIndex } = item;
        
        let finalUniqueSlug: string;
        if (slugOccurrences[baseSlug] === undefined) {
            slugOccurrences[baseSlug] = 0;
            finalUniqueSlug = baseSlug;
        } else {
            slugOccurrences[baseSlug]++;
            finalUniqueSlug = `${baseSlug}-${slugOccurrences[baseSlug]}`;
        }
        console.log(`[${originalIndex}] File: "${filePath}", BaseSlug: "${baseSlug}", FinalUniqueSlug: "${finalUniqueSlug}"`);

        const fullMarkdownPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(fullMarkdownPath)) {
          console.error(`[${originalIndex}] ERROR: File not found at full path: "${fullMarkdownPath}" (should have been caught earlier if paths are static). Skipping.`);
          continue;
        }

        let fileContentRead;
        try {
          fileContentRead = fs.readFileSync(fullMarkdownPath, 'utf8');
        } catch (readError) {
          console.error(`[${originalIndex}] ERROR: Could not read file content for "${fullMarkdownPath}":`, readError);
          continue;
        }
        
        const { data: parsedFrontmatter } = matter(fileContentRead);
        
        const frontmatter: BlogPost['frontmatter'] = {
          ...(parsedFrontmatter as object),
          title: parsedFrontmatter.title ?? formatTitle(titleSourceName),
          status: parsedFrontmatter.status === 'public' ? 'public' : 'private',
        };
        
        posts.push({
          slug: finalUniqueSlug,
          frontmatter,
        });
    }
    
    console.log(`Successfully processed ${posts.length} posts with unique slugs.`);

    return posts.sort((a, b) => {
      if (a.frontmatter.date && b.frontmatter.date) {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }
      if (a.frontmatter.date) return -1;
      if (b.frontmatter.date) return 1;
      return 0;
    });

  } catch (error) {
    console.error('CRITICAL ERROR in getBlogPosts:', error);
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    throw error;
  }
}

// Helper function to check if user can view a post based on role and post status
// (This is the same as in your provided code)
function canViewPost(
  userRole: string | undefined,
  postStatus: string | undefined,
): boolean {
  if (postStatus === 'public') {
    return true;
  }
  return (
    postStatus !== 'public' &&
    (userRole === 'Admin' || userRole === 'Contributor')
  );
}

// --- BlogPage Component (Main Page Structure) ---
// (This is largely the same as your provided code, with updated Link href)
export default async function BlogPage() {
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

  const allPosts = await getBlogPosts();
  console.log(`Total posts returned by getBlogPosts for listing: ${allPosts.length}`);

  const visiblePosts = allPosts.filter((post) =>
    canViewPost(userRole, post.frontmatter.status)
  );
  console.log(`Total visible posts after role/status filtering: ${visiblePosts.length}`);

  if (visiblePosts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-8 text-3xl font-bold text-white">CBud Blog</h1>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-white">
            {userId
              ? 'No blog posts are currently available to view.'
              : 'Please sign in to view blog posts or check back later for public content.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold text-white">CBud Blog</h1>
      <div className="space-y-6">
        {visiblePosts.map((post: BlogPost) => (
          <article
            key={post.slug}
            className="rounded-lg border border-gray-800 bg-black p-6 transition-colors hover:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <h2 className="mb-3 text-xl font-semibold">
                {/* UPDATED Link href to match /blog/[slug] structure */}
                <Link
                  href={`/blog/${post.slug}`} 
                  className="text-blue-400 no-underline hover:text-blue-300"
                >
                  {post.frontmatter.title}
                </Link>
              </h2>
              {(userRole === 'Admin' || userRole === 'Contributor') && post.frontmatter.status && (
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium self-start ${
                    post.frontmatter.status === 'public'
                      ? 'border border-green-700 bg-green-900/50 text-green-300'
                      : 'border border-yellow-700 bg-yellow-900/50 text-yellow-300'
                  }`}
                >
                  {post.frontmatter.status}
                </span>
              )}
            </div>
            {post.frontmatter.description && (
              <p className="mb-3 text-gray-300">
                {post.frontmatter.description}
              </p>
            )}
            {post.frontmatter.date && (
              <div className="mb-3 text-sm text-gray-400">
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {post.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div>
              {/* UPDATED Link href to match /blog/[slug] structure */}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-blue-400 no-underline hover:text-blue-300"
              >
                Read more<span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}