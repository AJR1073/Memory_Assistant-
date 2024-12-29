export interface Verse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  createdBy?: string;
  createdAt?: Date;
  tags?: string[];
}

export interface Translation {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  isDefault?: boolean;
}

export const DEFAULT_TRANSLATIONS: Translation[] = [
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', isDefault: true },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV' },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV' },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT' },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB' },
];
