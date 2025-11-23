# Proofreading Scripts

This directory contains a collection of Node.js scripts designed to proofread and standardize the text content within the prayer database and related files.

## Scripts

### 1. `fix-holy-names.js`
**Purpose:** Automatically standardizes references to holy names.
**Functionality:**
- Scans the `prayer/prayer-database` directory and `prayer/prayer-content/ashkenazi-prayer-info.json`.
- Parses JSON files to specifically target the `full-english` field and English values in `Word Mappings`.
- Replaces instances of "God" with "G-d".
- Replaces instances of "Lord" with "L-rd".
- Replaces instances of "Adonai" with "Ad-nai".
- **Note:** This script modifies files in place.

**Usage:**
```bash
node proof-reading-scripts/fix-holy-names.js
```

### 2. `check-hebrew-in-english.js`
**Purpose:** Enforces consistent casing for transliterated Hebrew words.
**Functionality:**
- Uses `hebrew-words.json` as the source of truth for correct spelling and capitalization.
- Scans the target files (JSON and text) for any case-insensitive matches of the words in the list.
- Parses JSON files to specifically target the `full-english` field and English values in `Word Mappings`.
- Reports any instances where the casing in the text does not match the casing in `hebrew-words.json` (e.g., finding "shabbos" when "Shabbos" is required).
- **Note:** This script is read-only and logs issues to the console.

**Usage:**
```bash
node proof-reading-scripts/check-hebrew-in-english.js
```

### 3. `check-capitalization.js`
**Purpose:** Identifies potentially misplaced capital letters in the middle of sentences.
**Functionality:**
- Scans for capitalized words that are NOT:
    - At the start of a sentence.
    - In the `hebrew-words.json` allowed list.
    - In a hardcoded ignore list (e.g., "I", "G-d").
- Parses JSON files to specifically target the `full-english` field and English values in `Word Mappings`.
- **Modes:**
    - **Default:** Reports potential issues to the console.
    - **Interactive (`--interactive`):** Prompts the user for each finding, allowing them to lowercase the word, skip it, or quit.

**Usage:**
```bash
# Report only
node proof-reading-scripts/check-capitalization.js

# Interactive fix mode
node proof-reading-scripts/check-capitalization.js --interactive
```

### 4. `add-full-english.js`
**Purpose:** Populates the `full-english` field in prayer JSON files.
**Functionality:**
- **Single Mode:** Takes a prayer ID, finds the corresponding JSON file, and populates `full-english` from `Word Mappings`.
- **All Mode (`--all`):** Recursively scans `prayer/prayer-database` and updates all prayer JSON files.
- Concatenates the English translation from the `Word Mappings` in numerical order.

**Usage:**
```bash
# Process a single prayer
node proof-reading-scripts/add-full-english.js <prayer-id>
# Example: node proof-reading-scripts/add-full-english.js 50-0rwa

# Process all prayers
node proof-reading-scripts/add-full-english.js --all
```

### 5. `verify-scripts.js`
**Purpose:** Verifies the functionality of the proofreading scripts.
**Functionality:**
- Sets up a temporary test environment with sample files containing known issues.
- Runs the other scripts against these sample files.
- Checks if the scripts correctly identify and fix the issues.
- Cleans up the test environment.

**Usage:**
```bash
node proof-reading-scripts/verify-scripts.js
```

## Configuration Files

### `hebrew-words.json`
A JSON array of strings containing the authoritative list of Hebrew transliterated words. This list is used by:
- `check-hebrew-in-english.js` to enforce casing.
- `check-capitalization.js` to whitelist these words (ignoring their capitalization).
