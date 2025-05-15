// scripts/generate.ts
// Use CommonJS require for the utility file and built-in modules
const { generateMarkdownPaths } = require('../utils/paths/markdownPaths');
const path = require('path');
// const process = require('process'); // REMOVE THIS LINE - Use the global 'process' directly

// Get the project root using the global process.cwd()
const projectRoot = process.cwd(); // Use global process here

// Define your markdown directory and output file path relative to the project root
// *** IMPORTANT: Make sure this path is correct for your project structure ***
const markdownSourceDir = path.join(projectRoot, 'MoL-blog-content', 'posts'); // **Adjust this path if necessary**
const outputJsonFile = path.join(projectRoot, 'blog-schema/file-paths/markdown-paths.json'); // **Adjust this path if necessary**

// Use projectRoot as the base directory for paths in the output JSON
const baseDirectoryForPaths = projectRoot;

// Call the utility function
generateMarkdownPaths(markdownSourceDir, outputJsonFile, baseDirectoryForPaths);

// Add this empty export statement to satisfy --isolatedModules
export {};