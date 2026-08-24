type FirestoreTimestampLike = { toDate: () => Date };

const isFirestoreTimestamp = (value: unknown): value is FirestoreTimestampLike =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as FirestoreTimestampLike).toDate === "function";

export const formatDisplayDate = (
  value?: string | FirestoreTimestampLike | null,
) => {
  if (!value) return "";
  const parsed = isFirestoreTimestamp(value) ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};
