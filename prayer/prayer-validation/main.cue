
import (
	"encoding/json" // CUE's built-in JSON library
	"app/source_data/0-waking-prayers.json" // Import your index file
	"app/source_data/mem-prayers.json"      // Import your detailed file
)

// --- Schema Definitions ---
// A schema that matches the structure of "Modei Ani" in your index file
#IndexPrayer: {
	"prayer-id": string
	file:         string // The path to the detailed file
	// ... add other fields like hebrew, english, etc. if you want to validate them
}

// A schema that matches the structure of "40-0rwa" in your detailed file
#DetailedPrayer: {
	"prayer-id":    string
	"prayer-title": string
	"Word Mappings": {[string]: {
		hebrew:  string
		english: string
	}}
}

// --- Data Validation ---
// 1. Validate the structure of the imported JSON files
// The '&' operator merges the data with the schema, causing an error if they don't match.
let validatedIndex = waking_prayers & {
	"Waking Prayers": "Modei Ani": #IndexPrayer
}
let validatedDetails = mem_prayers & {
	"40-0rwa": #DetailedPrayer
}

// --- Cross-File Linking Logic ---
// 2. Extract the data we need for the cross-file check
let modeiAniFromIndex = validatedIndex."Waking Prayers"."Modei Ani"
let expectedPrayerID = modeiAniFromIndex."prayer-id"

// 3. Perform the check: Use the ID from the index file to look up the
//    corresponding prayer in the detailed file.
let prayerFromDetails = validatedDetails[expectedPrayerID]

// 4. Final Assertion: This is the core validation.
//    Check that the "prayer-id" inside the detailed prayer object
//    is the same as its key (which we got from the index file).
//    This check will fail if the IDs are mismatched.
check: prayerFromDetails."prayer-id" == expectedPrayerID