// Next conclave details. Admin-editable later (P6); a constant for now.
export interface Conclave {
  edition: string;
  date: string; // ISO 8601
  city: string;
  venue: string;
}

export const nextConclave: Conclave = {
  edition: "Conclave XII",
  date: "2026-09-12T10:00:00+05:30",
  city: "Mumbai",
  venue: "The Altus Pavilion",
};
