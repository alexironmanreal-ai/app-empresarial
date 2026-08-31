/**
 * Guest side of the preview postMessage bridge.
 * Noops when not embedded in Grok preview.
 */

export function collectRoutePathsFromTree(routeTree: unknown): string[] {
  const paths: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (typeof node.fullPath === "string") paths.push(node.fullPath);
    const children = node.children ?? node._fileChildren ?? [];
    const list = Array.isArray(children) ? children : Object.values(children);
    for (const c of list) walk(c);
  }
  walk(routeTree);
  return [...new Set(paths)].filter(Boolean);
}

export function installPreviewHostBridge(_opts: {
  navigate: (path: string) => void;
  getRoutePaths: () => string[];
}): () => void {
  // Noop outside Grok embedder
  return () => {};
}
