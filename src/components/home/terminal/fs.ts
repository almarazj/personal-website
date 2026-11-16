export type FileKind = 'md' | 'txt' | 'json';
export interface FileNode {
  t: 'f';
  kind: FileKind;
  body?: string;
  json?: unknown;
  /** Where `open` takes the visitor. */
  href?: string;
}
export interface DirNode {
  t: 'd';
  c: Record<string, FsNode>;
  href?: string;
}
export type FsNode = FileNode | DirNode;

export const pathLabel = (path: readonly string[]) => '~' + (path.length ? `/${path.join('/')}` : '');
export const absPath = (user: string, path: readonly string[]) => `/home/${user}` + (path.length ? `/${path.join('/')}` : '');

/** Resolves `p` against `cwd`; `/` and `~` both mean home, and `..` stops there. */
export function resolve(home: DirNode, cwd: readonly string[], p = ''): { node: FsNode; path: string[] } | null {
  const path = p.startsWith('~') || p.startsWith('/') ? [] : [...cwd];
  for (const seg of p.replace(/^~/, '').split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') path.pop();
    else path.push(seg);
  }
  let node: FsNode = home;
  for (const seg of path) {
    if (node.t !== 'd' || !Object.hasOwn(node.c, seg)) return null;
    node = node.c[seg];
  }
  return { node, path };
}

/** Bytes as `ls -l` shows them. */
export function nodeSize(n: FsNode): number {
  if (n.t === 'd') return 4096;
  if (n.body != null) return new TextEncoder().encode(n.body).length;
  return JSON.stringify(n.json, null, 2).length;
}
