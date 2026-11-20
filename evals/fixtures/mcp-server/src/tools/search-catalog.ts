import { catalog } from "../catalog.js";

export function searchCatalog(query: string) {
  const normalized = query.trim().toLowerCase();
  return {
    content: catalog
      .filter((item) => item.name.toLowerCase().includes(normalized))
      .map((item) => ({ type: "text", text: `${item.id}: ${item.name}` })),
  };
}
