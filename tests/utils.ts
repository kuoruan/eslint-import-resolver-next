import path from "path";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL(".", import.meta.url));

export function getSingleRepoPath(subpath = ""): string {
  return path.join(root, "fixtures/singlerepo", subpath);
}

export function getMonoRepoPath(subpath = ""): string {
  return path.join(root, "fixtures/monorepo", subpath);
}
