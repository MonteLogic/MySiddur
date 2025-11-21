import { PrayerIndexEntry } from './generation-logic';

export interface PrayerBlob {
  id: string;
  name: string; // e.g., "Morning Blessings"
  prayers: PrayerIndexEntry[]; // The deterministic list of prayers in this blob
  schedule: {
    days: ('weekday' | 'shabbat' | 'yom-tov' | 'all')[]; // When this blob is active
    specialEvents?: string[]; // e.g., ['yom-kippur', 'rosh-chodesh']
  };
  grouping: string; // e.g., "shacharit", "mincha", "neilah" - for sorting/lumping
}

export const blobs: PrayerBlob[] = [
  {
    id: "morning-wakeup",
    name: "Wake Up Prayers",
    grouping: "shacharit-start",
    schedule: { days: ['all'] },
    prayers: [
      { id: "40-0rwa", title: "Modei Ani" },
      { id: "50-0rwa", title: "Netilat Yadayim" },
      { id: "1-0rwa", title: "Asher Yatzar (Who Formed) - Morning Version" },
      { id: "1-0rw1", title: "Elohai Neshamah (My G-d, the Soul)" }
    ]
  },
  {
    id: "morning-blessings",
    name: "Birchot HaShachar",
    grouping: "shacharit-blessings",
    schedule: { days: ['all'] },
    prayers: [
      { id: "2-0rwa", title: "Birchot HaShachar (Series of Morning Blessings)" },
      { id: "2-1rwa", title: "Birchot HaTorah (Blessings for Torah Study)" },
      { id: "10-0rw1", title: "Yehi Ratzon (Daily Guidance)" }
    ]
  },
  {
    id: "korbanot",
    name: "Korbanot",
    grouping: "shacharit-korbanot",
    schedule: { days: ['all'] },
    prayers: [
      { id: "80-1-pth-381-(full)", title: "Parashat HaTamid (The Daily Offering) - Morning Version" },
      { id: "1-1emk-924-(full)", title: "Eizehu Mekoman (Where is Their Place?)" },
      { id: "200-1-ryo-157-(full)", title: "Rabbi Yishmael Omer (Rabbi Yishmael Says) - Full" }
    ]
  },
  {
    id: "pesukei-dzimra-weekday",
    name: "Pesukei D'Zimra (Weekday)",
    grouping: "shacharit-pesukei",
    schedule: { days: ['weekday'] },
    prayers: [
      { id: "1-1rw1-brs", title: "Baruch She'amar (Blessed is He Who Spoke)" },
      { id: "400-1thm-533-(full)", title: "Tehilim (Psalms) 146-150" },
      { id: "10-1-yst-705-(full)", title: "Yishtabach (May He be Praised)" }
    ]
  },
  {
    id: "pesukei-dzimra-shabbat",
    name: "Pesukei D'Zimra (Shabbat)",
    grouping: "shacharit-pesukei",
    schedule: { days: ['shabbat', 'yom-tov'] },
    prayers: [
      { id: "1-1rw1-brs", title: "Baruch She'amar (Blessed is He Who Spoke)" },
      { id: "400-1thm-533-(full)", title: "Tehilim (Psalms) 146-150" },
      // In a real scenario, Shabbat adds many more psalms here
      { id: "10-1-yst-705-(full)", title: "Yishtabach (May He be Praised) - Shabbat Version" } 
      // Note: I manually changed the title here to simulate the variation
    ]
  }
];
