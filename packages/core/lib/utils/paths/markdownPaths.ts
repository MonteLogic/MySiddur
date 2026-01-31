// utils/markdownPaths.ts
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const process = require('process'); // Keep this if you explicitly need the 'process' module *functions* inside this utility, otherwise remove it too if only using globals like process.exit

/**
 * Finds all markdown files in a directory and generates a JSON file with their paths.
 * @param markdownDirectory - The absolute or relative path to the directory containing markdown files.
 * @param outputFilePath - The absolute or relative path where the JSON file should be saved.
 * @param baseDir - Optional base directory to make paths relative to in the output JSON.
 */
exports.generateMarkdownPaths = (
  markdownDirectory: string,
  outputFilePath: string,
  baseDir: string = ''
): void => {
  try {
    if (!fs.existsSync(markdownDirectory)) {
      console.error(`Error: Markdown directory not found at ${markdownDirectory}`);
      process.exit(1); // Use global process here
    }

    const files: string[] = glob.sync('**/*.md', { cwd: markdownDirectory });

    const pathsToOutput: string[] = baseDir
      ? files.map(file => path.relative(baseDir, path.join(markdownDirectory, file)))
      : files.map(file => path.join(markdownDirectory, file));

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonData = JSON.stringify(pathsToOutput, null, 2);

    fs.writeFileSync(outputFilePath, jsonData, 'utf-8');

    console.log(`Generated ${outputFilePath} with paths to ${pathsToOutput.length} markdown files.`);
  } catch (error) {
    console.error('An error occurred while generating markdown paths:', error);
    process.exit(1); // Use global process here
  }
};

// Add this empty export statement to satisfy --isolatedModules (if applicable) and ensure module scope
export {};