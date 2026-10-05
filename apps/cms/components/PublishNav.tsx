import { siteUrl } from '../lib/publish.ts';
import { PublishButton } from './PublishButton.tsx';

/**
 * The navigation's publish block, rendered on the server so the site's address
 * can come from the server's environment (lib/publish.ts) rather than be baked
 * into the admin's bundle — changing the domain is then a line in .env.
 */
export function PublishNav() {
  return <PublishButton siteUrl={siteUrl(process.env)} />;
}

export default PublishNav;
