import { notFound } from 'next/navigation';
import { loadSiteData } from '@/lib/site-data';
import { strings, text } from '@/lib/content';
import { BackLink, ChipList, CoverFrame, ExternalLinks, GalleryGrid, ProseBlock } from '@/components/public/detail';
import { Reveal } from '@/components/ui/reveal';
import type { ContentRecord } from '@/types/content';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const content = await loadSiteData(); const project = content.projects.find(p => p.slug === slug); if (!project) notFound(); return { title: project.title, description: text(project.data, 'short_description') }; }
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteData();
  const project = content.projects.find(p => p.slug === slug);
  if (!project) notFound();
  return (
    <main id="main-content">
      <div className="container detail-top"><BackLink href="/projects" label="All projects" /></div>
      <ProjectHeader project={project} />
      <section className="section detail-body"><div className="container narrow">
        <CoverFrame src={text(project.data, 'cover_image')} title={project.title} kind="project" />
        {text(project.data, 'project_status') === 'Details pending' && <p className="notice">Further project specifications, team details and outcomes are awaiting confirmation.</p>}
        <ProseBlock title="Problem statement" body={text(project.data, 'problem_statement')} />
        <ProseBlock title="Research motivation" body={text(project.data, 'research_motivation')} />
        <ProseBlock title="Approach" body={text(project.data, 'research_approach')} />
        <ProseBlock title="Proposed solution" body={text(project.data, 'solution')} />
        {strings(project.data, 'technologies').length > 0 && <Reveal className="prose-block"><h2>Technology stack</h2><ChipList items={strings(project.data, 'technologies')} /></Reveal>}
        <Reveal className="prose-block"><h2>Team</h2><dl className="team-list">{text(project.data, 'mentor') && <div><dt>Faculty mentor</dt><dd>{text(project.data, 'mentor')}</dd></div>}{strings(project.data, 'contributors').length > 0 && <div><dt>Student contributors</dt><dd>{strings(project.data, 'contributors').join(', ')}</dd></div>}{text(project.data, 'research_year') && <div><dt>Research year</dt><dd>{text(project.data, 'research_year')}</dd></div>}</dl></Reveal>
        <GalleryGrid images={strings(project.data, 'gallery')} title={project.title} />
        <ExternalLinks links={[["GitHub repository", text(project.data, 'github_url')], ["Live demo", text(project.data, 'demo_url')], ["Publication", text(project.data, 'publication_url')]]} />
      </div></section>
    </main>
  );
}
function ProjectHeader({ project }: { project: ContentRecord }) {
  return (
    <section className="section detail-header"><div className="container"><Reveal>
      <p className="eyebrow">{text(project.data, 'category', 'Research project')}</p>
      <h1 className="detail-title">{project.title}</h1>
      <div className="detail-meta"><span className="badge badge-teal">{text(project.data, 'project_status', 'Research')}</span>{text(project.data, 'research_year') && <span>{text(project.data, 'research_year')}</span>}</div>
      <p className="detail-lead">{text(project.data, 'short_description')}</p>
    </Reveal></div></section>
  );
}
