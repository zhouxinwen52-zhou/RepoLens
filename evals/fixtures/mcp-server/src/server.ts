import { searchCatalog } from "./tools/search-catalog.js";

type ToolRequest = {
  method: "tools/call";
  params: { name: string; arguments: { query?: string } };
};

export function createCatalogServer() {
  return {
    async handle(input: unknown): Promise<unknown> {
      const request = input as ToolRequest;
      if (request.method !== "tools/call" || request.params.name !== "search_catalog") {
        throw new Error("Unsupported MCP request");
      }

      return searchCatalog(request.params.arguments.query ?? "");
    },
  };
}
