export function readableName(): string {
  return (process.env.MYSTMD_READABLE_NAME ?? "myst") as string;
}

export function binaryName(): string {
  return (process.env.MYSTMD_BINARY_NAME ?? "myst") as string;
}

export function helpURL(): string {
  return (process.env.MYSTMD_HELP_URL ?? "https://mystmd.org") as string;
}
