/** Case studies live under their pillar: /services/{pillar}/{project} (path after the locale). */
export function projectPath(pillarSlug: string, projectSlug: string) {
  return `/services/${pillarSlug}/${projectSlug}`;
}
