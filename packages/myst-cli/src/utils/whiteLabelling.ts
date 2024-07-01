export function readableName(): string {
  if ('MYSTMD_READABLE_NAME' in process.env) {
    const name = process.env.MYSTMD_READABLE_NAME as string;
    return `${name} (via myst)`;
  } else {
    return 'myst';
  }
}

export function binaryName(): string {
  return (process.env.MYSTMD_BINARY_NAME ?? 'myst') as string;
}

export function homeURL(): string {
  return (process.env.MYSTMD_HOME_URL ?? 'https://mystmd.org') as string;
}

export function baseConfigs(): string[] {
  const rawConfigsString = (process.env.MYSTMD_BASE_CONFIGS ?? '') as string;
  return rawConfigsString
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length);
}

export function isWhiteLabelled(): boolean {
  return ['MYSTMD_READABLE_NAME', 'MYSTMD_BINARY_NAME'].some((name) => name in process.env);
}
