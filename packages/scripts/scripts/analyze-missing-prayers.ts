import * as fs from 'fs';
import * as path from 'path';

interface PrayerIndexEntry {
  id: string;
  title: string;
}

interface PrayerBlob {
  id: string;
  name: string;
  prayers: PrayerIndexEntry[];
  applicability: {
    days: string[];
  };
  grouping: string;
}

// Load all blob files
function loadBlobs(): PrayerBlob[] {
    const blobsDir = path.join(__dirname, '../../../core/lib/custom-siddur-date-gen/blobs');
    const files = fs.readdirSync(blobsDir).filter(f => f.endsWith('.json'));
    const blobs: PrayerBlob[] = [];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(blobsDir, file), 'utf-8');
        const blob = JSON.parse(content) as PrayerBlob;
        blobs.push(blob);
    }
    return blobs;
}

// Get all prayer IDs from blobs
function getAllPrayerIds(): Set<string> {
    const blobs = loadBlobs();
    const prayerIds = new Set<string>();
    
    for (const blob of blobs) {
        for (const prayer of blob.prayers) {
            prayerIds.add(prayer.id);
        }
    }
    
    return prayerIds;
}

// Check if prayer exists in database
function prayerExistsInDatabase(prayerId: string): boolean {
    const prayerDbDir = path.join(__dirname, '../../../prayer/prayer/prayer-database');
    
    // Search recursively for JSON files containing this ID
    function searchDirectory(dir: string): boolean {
        if (!fs.existsSync(dir)) return false;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (searchDirectory(fullPath)) return true;
            } else if (item.endsWith('.json')) {
                // Check if filename contains the prayer ID
                if (item.includes(prayerId)) {
                    return true;
                }
                
                // Also check file contents
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const data = JSON.parse(content);
                    if (data.id === prayerId || data.prayer_id === prayerId) {
                        return true;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
        return false;
    }
    
    return searchDirectory(prayerDbDir);
}

// Main analysis
console.log('Analyzing Missing Prayers from Prayer Database\n');
console.log('='.repeat(60));

const allPrayerIds = getAllPrayerIds();
const missingPrayers: Array<{id: string, title: string, blob: string}> = [];
const existingPrayers: string[] = [];

const blobs = loadBlobs();
for (const blob of blobs) {
    for (const prayer of blob.prayers) {
        const exists = prayerExistsInDatabase(prayer.id);
        
        if (!exists) {
            missingPrayers.push({
                id: prayer.id,
                title: prayer.title,
                blob: blob.name
            });
        } else {
            existingPrayers.push(prayer.id);
        }
    }
}

console.log(`\nTotal Prayers Referenced: ${allPrayerIds.size}`);
console.log(`Existing in Database: ${existingPrayers.length}`);
console.log(`Missing from Database: ${missingPrayers.length}\n`);

if (missingPrayers.length > 0) {
    console.log('MISSING PRAYERS:\n');
    console.log('ID'.padEnd(30) + 'Title'.padEnd(50) + 'Blob');
    console.log('-'.repeat(110));
    
    for (const prayer of missingPrayers) {
        console.log(
            prayer.id.padEnd(30) + 
            prayer.title.substring(0, 48).padEnd(50) + 
            prayer.blob
        );
    }
}

console.log('\n' + '='.repeat(60));
console.log('\nTo create a Kosher full-day Siddur, these prayers must be added to the database.');
