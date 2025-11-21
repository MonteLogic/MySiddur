import { getGeneratedLayoutPath, loadGeneratedLayout, loadPrayerIndexForDate } from '../lib/custom-siddur-date-gen/layout-resolver';

console.log('='.repeat(60));
console.log('Testing Layout Resolver - Timezone Aware');
console.log('='.repeat(60));

// Use local date string to avoid timezone issues
const testDate1 = new Date('2025-11-21T12:00:00');
console.log('\n[Test 1] Path generation for Nov 21, 2025 (local time)');
console.log('Date object:', testDate1.toDateString());
const path1 = getGeneratedLayoutPath(testDate1);
console.log('Generated path:', path1);

// Test 2: Load existing layout
console.log('\n[Test 2] Loading existing layout');
const layout1 = loadGeneratedLayout(testDate1);
if (layout1) {
  console.log('✅ Successfully loaded layout');
  console.log('Sections:', Object.keys(layout1));
  console.log('Waking prayers:', layout1.wakingPrayers.length);
  console.log('Shacharis prayers:', layout1.shacharis.length);
  console.log('Mincha prayers:', layout1.mincha.length);
  console.log('Maariv prayers:', layout1.maariv.length);
  console.log('Retiring prayers:', layout1.retiringPrayers.length);
  
  // Show some sample prayers
  console.log('\nSample Shacharis prayers:');
  layout1.shacharis.slice(0, 3).forEach(p => console.log(`  - ${p.id}: ${p.title}`));
} else {
  console.log('❌ Failed to load layout');
}

// Test 3: Flatten and load for existing date
console.log('\n[Test 3] Flattened prayer index');
const index1 = loadPrayerIndexForDate(testDate1);
console.log('Total prayers:', Object.keys(index1).length);
console.log('Sample prayer IDs:', Object.keys(index1).slice(0, 5));

console.log('\n' + '='.repeat(60));
console.log('Testing Complete');
console.log('='.repeat(60));
