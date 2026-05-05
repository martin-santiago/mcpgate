export function isNodeVersionSupported(): boolean {
  const [majorVersion] = process.versions.node.split('.')
  return Number(majorVersion) >= 22
}
