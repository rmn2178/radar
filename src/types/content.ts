export const collections = ['pages', 'members', 'events', 'projects', 'research_areas', 'quotes', 'achievements', 'navigation_items', 'site_settings'] as const;
export type Collection = typeof collections[number];
export type PublishStatus = 'draft' | 'published' | 'archived';
export type ContentData = Record<string, unknown>;
export interface ContentRecord {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  display_order: number;
  is_featured: boolean;
  data: ContentData;
  published_data?: ContentData | null;
  created_at?: string;
  updated_at?: string;
}
export const sectionTypes = ['hero', 'editorial', 'rich_text', 'image_text', 'gallery', 'quote', 'research', 'members', 'events', 'projects', 'achievements', 'statistics', 'timeline', 'vision', 'cta', 'contact', 'divider', 'spacer', 'image', 'columns'] as const;
export type SectionType = typeof sectionTypes[number];
export interface Section {
  id: string;
  type: SectionType;
  visible: boolean;
  variant: 'default' | 'light' | 'dark' | 'split';
  data: ContentData;
}
export interface PublicData {
  preview: boolean;
  pages: ContentRecord[];
  members: ContentRecord[];
  events: ContentRecord[];
  projects: ContentRecord[];
  research_areas: ContentRecord[];
  quotes: ContentRecord[];
  achievements: ContentRecord[];
  navigation_items: ContentRecord[];
  site_settings: ContentRecord[];
}
export interface MediaAsset {
  id: string; file_name: string; storage_path: string; public_url: string;
  mime_type: string; file_size: number; image_width: number | null; image_height: number | null;
  alt_text: string; caption: string; uploaded_by?: string; created_at?: string;
}
export interface Enquiry { id: string; name: string; email: string; subject: string; message: string; status: 'unread' | 'read' | 'resolved'; created_at: string }
export interface Revision { id: string; entity_type: string; entity_id: string; snapshot: ContentRecord; created_at: string }
export interface Activity { id: string; action: string; entity_type: string; entity_id: string; created_at: string }
export type FieldKind = 'text' | 'textarea' | 'email' | 'url' | 'image' | 'gallery' | 'list' | 'date' | 'number' | 'select' | 'checkbox';
export interface FieldDefinition { key: string; label: string; kind: FieldKind; required?: boolean; options?: string[]; help?: string }
export interface CollectionDefinition { label: string; singular: string; fields: FieldDefinition[] }
