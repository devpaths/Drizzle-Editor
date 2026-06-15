import "dotenv/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors(),
});

const PORT = 4000;
server.listen(PORT);
console.log(`Server running on http://localhost:${PORT}`);
