export interface PrayerIndexEntry {
  id: string;
  title: string;
}

export interface PrayerIndexBySections {
  wakingPrayers: PrayerIndexEntry[];
  shacharis: PrayerIndexEntry[];
  mincha: PrayerIndexEntry[];
  maariv: PrayerIndexEntry[];
  retiringPrayers: PrayerIndexEntry[];
}
