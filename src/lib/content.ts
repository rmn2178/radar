import { z } from 'zod';
import { collections, sectionTypes, type Collection, type CollectionDefinition, type ContentData, type FieldDefinition, type Section } from '@/types/content';
const f = (key: string, label: string, kind: FieldDefinition['kind'] = 'text', options?: string[]): FieldDefinition => ({ key, label, kind, ...(options ? { options } : {}) });
export const definitions: Record<Collection, CollectionDefinition> = {
  members: { label: 'Members', singular: 'Member', fields: [f('designation','Designation'),f('department','Department'),f('category','Category','select',['Faculty','Student Members','Research Associates','External Collaborators']),f('biography','Biography','textarea'),f('profile_image','Portrait','image'),f('research_interests','Research interests','list'),f('email','Email','email'),f('linkedin_url','LinkedIn','url'),f('google_scholar_url','Google Scholar','url'),f('website_url','Website','url')] },
  events: { label:'Events',singular:'Event',fields:[f('category','Category','select',['Outreach','Workshops','Industrial Visits','Exhibitions','Knowledge Sharing','Other']),f('start_date','Start date','date'),f('end_date','End date','date'),f('venue','Venue'),f('short_description','Short description','textarea'),f('full_description','Full description','textarea'),f('outcomes','Outcomes','textarea'),f('cover_image','Cover image','image'),f('gallery','Gallery','gallery'),f('participants','Participants','list'),f('related_projects','Related project slugs','list'),f('registration_url','Registration URL','url'),f('external_report_url','Report URL','url')] },
  projects: { label:'Projects',singular:'Project',fields:[f('category','Category','select',['Medical Imaging','Healthcare AI','Assistive Technology','Biomedical Engineering','Other Research']),f('short_description','Short description','textarea'),f('problem_statement','Problem statement','textarea'),f('research_motivation','Research motivation','textarea'),f('research_approach','Research approach','textarea'),f('solution','Proposed solution','textarea'),f('technologies','Technology stack','list'),f('mentor','Faculty mentor'),f('contributors','Student contributors','list'),f('research_year','Research year','number'),f('project_status','Project status','select',['Details pending','Research','In development','Demonstrated','Completed']),f('cover_image','Cover image','image'),f('gallery','Gallery','gallery'),f('github_url','GitHub URL','url'),f('demo_url','Demo URL','url'),f('publication_url','Publication URL','url')] },
  research_areas:{label:'Research Areas',singular:'Research area',fields:[f('description','Short description','textarea'),f('extended_description','Extended description','textarea'),f('icon','Icon','select',['scan','brain','activity','radio','layers','heart']),f('cover_image','Cover image','image')]},
  quotes:{label:'Quotes',singular:'Quote',fields:[f('quote_text','Quotation','textarea'),f('attribution','Attribution'),f('attribution_role','Attribution role')]},
  achievements:{label:'Achievements',singular:'Achievement',fields:[f('person_name','Person'),f('achievement_type','Type','select',['Paper accepted','Paper uploaded','Publication','Presentation','Award','Certification','Collaboration','Other']),f('description','Description','textarea'),f('achievement_date','Verified date','date'),f('supporting_image','Supporting image','image'),f('external_url','Supporting URL','url')]},
  navigation_items:{label:'Navigation',singular:'Navigation link',fields:[f('url','Destination','url'),f('location','Location','select',['header','footer','both']),f('open_new_tab','Open in new tab','checkbox')]},
  site_settings:{label:'Website Settings',singular:'Settings',fields:[f('site_name','Website name'),f('site_tagline','Tagline'),f('institution','Institution'),f('initiative','Initiative'),f('radar_logo','RADAR logo','image'),f('rit_logo','RIT logo','image'),f('phone','Phone'),f('whatsapp_number','WhatsApp number'),f('email','Contact email','email'),f('address','Institution address','textarea'),f('department','Department'),f('maps_url','Google Maps URL','url'),f('linkedin_url','LinkedIn','url'),f('instagram_url','Instagram','url'),f('facebook_url','Facebook','url'),f('youtube_url','YouTube','url'),f('footer_description','Footer description','textarea'),f('seo_title','Default SEO title'),f('seo_description','Default SEO description','textarea'),f('social_image','Social preview image','image'),f('theme','Approved theme','select',['ivory','white']),f('header_variant','Header layout','select',['standard','compact']),f('footer_variant','Footer layout','select',['standard','compact']),f('button_style','Button style','select',['solid','outline'])]},
  pages:{label:'Page Builder',singular:'Page',fields:[f('seo_title','SEO title'),f('seo_description','SEO description','textarea')]}
};
export const sectionLabels: Record<Section['type'],string> = {hero:'Hero',editorial:'Editorial text',rich_text:'Rich text',image_text:'Image with text',gallery:'Image gallery',quote:'Quotation',research:'Research showcase',members:'Member showcase',events:'Event showcase',projects:'Project showcase',achievements:'Achievements',statistics:'Statistics',timeline:'Timeline',vision:'Vision and mission',cta:'Call to action',contact:'Contact information',divider:'Divider',spacer:'Spacer',image:'Full-width image',columns:'Two columns'};
const baseSectionFields = [f('eyebrow','Eyebrow'),f('heading','Heading'),f('description','Description','textarea')];
export function sectionFields(type: Section['type']): FieldDefinition[] {
  const buttons = [f('button_label','Primary button label'),f('button_url','Primary destination','url'),f('secondary_label','Secondary button label'),f('secondary_url','Secondary destination','url')];
  if(type==='divider'||type==='spacer') return [];
  if(type==='quote') return [f('quote_text','Quote text','textarea'),f('attribution','Attribution')];
  if(type==='gallery') return [...baseSectionFields,f('images','Images','gallery')];
  if(type==='image') return [f('image','Image','image'),f('image_alt','Alternative text'),f('caption','Caption')];
  if(type==='vision') return [...baseSectionFields,f('mission','Mission statements','list'),f('objectives','Objectives','list')];
  if(type==='statistics'||type==='timeline') return [...baseSectionFields,{...f('items','Items','list'),help:'One item per line: value or date | description. Only use verified information.'}];
  if(type==='columns') return [...baseSectionFields,f('second_heading','Second heading'),f('second_description','Second description','textarea')];
  if(type==='hero'||type==='editorial'||type==='image_text'||type==='cta') return [...baseSectionFields,...buttons,f('image','Image','image'),f('image_alt','Alternative text')];
  if(type==='rich_text') return [...baseSectionFields,f('body','Body text','textarea')];
  return [...baseSectionFields,f('limit','Number of items (0 for all)','number'),...buttons];
}
export function text(data: ContentData | undefined, key: string, fallback = ''): string { const value = data?.[key]; return typeof value === 'string' ? value : fallback; }
export function strings(data: ContentData | undefined, key: string): string[] { const value = data?.[key]; return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []; }
export function safeUrl(value: string): string { return /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(value) && !/[\u0000-\u0020\\]/.test(value) ? value : ''; }
const url = z.string().max(2048).refine(v => !v || !!safeUrl(v), 'Use a relative path or an http(s), mailto, or telephone link.');
const image = z.string().max(2048).refine(v=>!v || /^\/(?!\/)/.test(v) || /^https:\/\//.test(v),'Use a local image path or HTTPS image URL.');
function dataSchema(fields: FieldDefinition[]) {
  const shape: Record<string,z.ZodType> = {};
  for(const field of fields) {
    let schema: z.ZodType = z.string().max(field.kind==='textarea'?20000:2000);
    if(field.kind==='url') schema=url;
    if(field.kind==='image') schema=image;
    if(field.kind==='gallery') schema=z.array(image).max(100);
    if(field.kind==='list') schema=z.array(z.string().max(2000)).max(100);
    if(field.kind==='email') schema=z.union([z.literal(''),z.email()]);
    if(field.kind==='number') schema=z.union([z.number().int().min(0).max(9999),z.literal(''),z.null()]);
    if(field.kind==='checkbox') schema=z.boolean();
    if(field.kind==='date') schema=z.union([z.literal(''),z.iso.date(),z.null()]);
    if(field.kind==='select'&&field.options) schema=z.union([z.enum(field.options as [string,...string[]]),z.literal('')]);
    shape[field.key]=schema.optional();
  }
  return z.object(shape).strict();
}
export const sectionSchema = z.object({id:z.string().min(1).max(100),type:z.enum(sectionTypes),visible:z.boolean(),variant:z.enum(['default','light','dark','split']),data:z.record(z.string(),z.unknown())}).superRefine((section,ctx)=>{
  const result=dataSchema(sectionFields(section.type)).safeParse(section.data);
  if(!result.success) for(const issue of result.error.issues) ctx.addIssue({code:'custom',path:['data',...issue.path],message:issue.message});
});
export const recordEnvelopeSchema=z.object({id:z.uuid().optional(),title:z.string().trim().min(1).max(240),slug:z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),status:z.enum(['draft','published','archived']),display_order:z.number().int().min(0).max(100000),is_featured:z.boolean(),data:z.record(z.string(),z.unknown())}).strict();
export function recordSchema(collection:Collection){return recordEnvelopeSchema.superRefine((record,ctx)=>{
  const schema=collection==='pages'?dataSchema(definitions.pages.fields).extend({sections:z.array(sectionSchema).max(100)}):dataSchema(definitions[collection].fields);
  const result=schema.safeParse(record.data);
  if(!result.success) for(const issue of result.error.issues)ctx.addIssue({code:'custom',path:['data',...issue.path],message:issue.message});
  if(collection==='events'&&text(record.data,'end_date')&&(!text(record.data,'start_date')||text(record.data,'end_date')<text(record.data,'start_date')))ctx.addIssue({code:'custom',path:['data','end_date'],message:'End date requires a start date and cannot precede it.'});
});}
export const contactSchema=z.object({name:z.string().trim().min(2).max(120),email:z.email().max(254),subject:z.string().trim().min(3).max(180),message:z.string().trim().min(10).max(5000),website:z.string().max(0).optional()}).strict();
export function isCollection(value:string):value is Collection{return (collections as readonly string[]).includes(value);}
export function sections(data:ContentData):Section[]{ const result=z.array(sectionSchema).safeParse(data.sections);return result.success?result.data:[]; }
export function eventStatus(data:ContentData,today=new Date().toISOString().slice(0,10)){const start=text(data,'start_date');const end=text(data,'end_date')||start;return !start?'Date not recorded':end<today?'Completed':start>today?'Upcoming':'Ongoing';}
export function dateLabel(value:string){if(!value)return 'Date not recorded';return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`));}
export function slugify(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
