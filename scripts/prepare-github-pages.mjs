import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

// GitHub Pages has no rewrite rules. Serving the app shell as 404.html keeps
// clean history routes such as /download addressable on first navigation.
await copyFile(resolve("dist", "index.html"), resolve("dist", "404.html"));
