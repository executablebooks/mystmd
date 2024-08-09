export function getDate(object: undefined | Date | string | { toDate: () => Date }): Date {
  if (object == null) {
    return new Date();
  }
  if (object instanceof Date) {
    return object;
  }
  if (typeof object === 'string') {
    return new Date(object);
  }
  if (object?.toDate !== undefined) {
    return object.toDate();
  }
  throw new Error(`Could not parse date: ${object}`);
}

function formatISODateString(date: Date): string {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // Format the date as a machine-readable date
  const isoString = utcDate.toISOString();
  const match = isoString.match(/^\d+-\d+-\d+/);
  return match![0];
}

export function formatDate(date: Date | { toDate: () => Date }): string {
  if (date instanceof Date) {
    return formatISODateString(date);
  }
  if (date?.toDate !== undefined) {
    return formatISODateString(date.toDate());
  }
  if (typeof date === 'string') {
    return formatDate(getDate(date));
  }
  return null as any; // This will parse in JS into a Date.now()
}
