// Returns yyyy-mm-dd
export function getFormattedDate(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}
