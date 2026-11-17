import { execSync } from 'node:child_process';
import pkg from '../../package.json';

/** The commit the site is built from, read at build time; null without a git checkout. */
export const commit: string | null = (() => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
})();

/** The release tag the site is built from (CodeBuild names it in the webhook trigger), or the tag on HEAD; null when untagged. */
export const tag: string | null = (() => {
  const trigger = process.env.CODEBUILD_WEBHOOK_TRIGGER;
  if (trigger?.startsWith('tag/')) return trigger.slice('tag/'.length);
  try {
    return execSync("git describe --tags --exact-match --match 'v*'", { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
})();

export const repoUrl = `https://github.com/${pkg.repository.replace(/^github:/, '')}`;
