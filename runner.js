import { createSyncFn } from "synckit";
import { fileURLToPath } from "url";

// the worker path must be absolute
const syncFn = createSyncFn(
  fileURLToPath(new URL("./worker.js", import.meta.url)),
);

const result = syncFn(1, 2, 3);

console.log(result); // [1, 2, 3]
