export function PreviewBanner() {
  return (
    <div className="preview-banner" role="status">
      <span className="preview-dot" aria-hidden="true" />
      Local content preview — Supabase is not connected. Publishing and sign-in are disabled until configured.
    </div>
  );
}
