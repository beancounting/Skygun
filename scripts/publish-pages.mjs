import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run only for an explicitly approved release. Uploads the static build without
// switching the source branch, merging main, or changing repository visibility.
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'skygun-pages-'));
const indexEnvironment = { ...process.env, GIT_INDEX_FILE: join(temporary, 'index') };
const git = (args, options = {}) => execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options }).trim();
try {
  const lookup = spawnSync('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/gh-pages'], { cwd: root, encoding: 'utf8' });
  if (lookup.status !== 0 && lookup.status !== 2) throw new Error(`Could not check publishing branch: ${lookup.stderr}`);
  const previous = lookup.status === 0 ? lookup.stdout.trim().split(/\s+/)[0] : null;
  if (previous) git(['fetch', 'origin', 'refs/heads/gh-pages']);

  git(['read-tree', '--empty'], { env: indexEnvironment });
  const add = (path, hash) => git(['update-index', '--add', '--cacheinfo', `100644,${hash},${path}`], { env: indexEnvironment });
  async function stage(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const relative = prefix + entry.name;
      if (entry.isDirectory()) await stage(path, relative + '/');
      else if (entry.isFile()) add(relative, git(['hash-object', '-w', path]));
      else throw new Error(`Unexpected non-file in production output: ${relative}`);
    }
  }
  await stage(join(root, 'dist'));
  add('.nojekyll', git(['hash-object', '-w', '--stdin'], { input: '' }));
  const tree = git(['write-tree'], { env: indexEnvironment });
  if (previous && tree === git(['rev-parse', `${previous}^{tree}`])) {
    console.log('The publishing branch already contains this exact build.');
  } else {
    const source = git(['rev-parse', '--short', 'HEAD']);
    const commit = git(['commit-tree', tree, ...(previous ? ['-p', previous] : []), '-m', `Publish Skygun build from ${source}`]);
    // A normal fast-forward push rejects concurrent changes; never force-push.
    git(['push', 'origin', `${commit}:refs/heads/gh-pages`], { stdio: ['pipe', 'pipe', 'inherit'] });
    console.log(`Uploaded static build to gh-pages (${commit}).`);
  }
  console.log('GitHub Pages must use gh-pages / (root). Uploading the branch alone does not enable Pages or verify the public site.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
