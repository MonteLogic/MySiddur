// Use require for CommonJS modules
const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// --- Vertex AI Client Initialization ---
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION;

if (!PROJECT_ID || !LOCATION) {
    throw new Error("GOOGLE_PROJECT_ID and GOOGLE_LOCATION must be defined in your .env.local file");
}

// Initialize the Vertex AI client
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = vertexAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: { responseMimeType: "application/json" }
});

const outputDirectory = path.join(process.cwd(), 'lib', 'prayers');

// Create a readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Starts the interactive script to get prayer details from the user.
 */
function startGenerator() {
    rl.question('Enter the full name of the prayer (e.g., Asher Yatzar): ', (prayerName) => {
        if (!prayerName.trim()) {
            console.error("❌ Prayer name cannot be empty.");
            rl.close();
            return;
        }

        rl.question(`What is the first Hebrew letter of "${prayerName}"? (e.g., א): `, (firstLetter) => {
            if (!firstLetter.trim()) {
                console.error("❌ First letter cannot be empty.");
                rl.close();
                return;
            }
            
            generatePrayerFile(prayerName, firstLetter).finally(() => {
                rl.close();
            });
        });
    });
}

/**
 * Generates the prayer JSON file using the Vertex AI Gemini API.
 * @param {string} prayerName - The name of the prayer.
 * @param {string} firstLetter - The first Hebrew letter of the prayer.
 */
async function generatePrayerFile(prayerName, firstLetter) {
    console.log(`\n⏳ Generating JSON for '${prayerName}'...`);
    
    const prompt = createJsonPrompt(prayerName, firstLetter);
    
    const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    try {
        const result = await model.generateContent(request);
        
        const jsonText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonText) {
            throw new Error("Received an empty or invalid response from the API.");
        }

        // In JS, we don't need to declare the type for parsedJson
        const parsedJson = JSON.parse(jsonText);
        const prayerId = Object.keys(parsedJson)[0];
        const formattedJson = JSON.stringify(parsedJson, null, 2);

        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }
        
        const safeFileName = prayerName.replace(/[\s()]/g, '-').toLowerCase();
        const outputFilename = path.join(outputDirectory, `${prayerId}_${safeFileName}.json`);
        
        fs.writeFileSync(outputFilename, formattedJson, 'utf-8');
        console.log(`✅ Success! File saved to: ${outputFilename}`);

    } catch (e) {
        // e is of type 'any' in JS, but checking if it's an Error is still good practice
        if (e instanceof Error) {
            console.error(`❌ Failed to generate '${prayerName}'. Error:`, e.message);
            console.error(e); // Log the full error for debugging
        } else {
            console.error(`❌ An unknown error occurred while generating '${prayerName}'.`);
        }
    }
}

/**
 * Creates the prompt for the Gemini API.
 * @param {string} prayerName - The name of the prayer.
 * @param {string} firstLetter - The first Hebrew letter of the prayer.
 * @returns {string} The formatted prompt string.
 */
function createJsonPrompt(prayerName, firstLetter) {
    const currentDate = new Date().toISOString();
    return `
      You are an expert in Hebrew liturgy and data formatting. Your task is to generate a JSON object for a given Jewish prayer with a word-by-word breakdown.
      The output must be a single, valid JSON object and nothing else.
      
      Strictly follow the structure, keys, and data types from the provided example. Generate a new unique 'prayer-id' using the scalable ID scheme: CATEGORY-SUBCATEGORY-PRAYERCODE.
      
      Now, using that exact same format, generate the complete JSON for the prayer: "${prayerName}".
      The first Hebrew letter of this prayer is "${firstLetter}".
      Set "date_modified" to "${currentDate}".
    `;
}

// --- Start the interactive script ---
startGenerator();
