export function readableName(): string {
  return (process.env.MYSTMD_READABLE_NAME ?? 'myst') as string;
}

export function binaryName(): string {
  return (process.env.MYSTMD_BINARY_NAME ?? 'myst') as string;
}

export function homeURL(): string {
  return (process.env.MYSTMD_HOME_URL ?? 'https://mystmd.org') as string;
}

export function isWhiteLabelled(): boolean {
  return ['MYSTMD_READABLE_NAME', 'MYSTMD_BINARY_NAME', 'MYSTMD_HOME_URL'].some(
    (name) => name in process.env,
  );
}
