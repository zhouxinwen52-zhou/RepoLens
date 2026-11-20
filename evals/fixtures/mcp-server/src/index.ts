import { createCatalogServer } from "./server.js";

const server = createCatalogServer();

export async function handleRequest(request: unknown): Promise<unknown> {
  return server.handle(request);
}
