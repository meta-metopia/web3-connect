import { execSync } from "child_process";
import * as crypto from "crypto";
import { writeFileSync } from "fs";
import { resolve } from "path";
import semver from "semver";

export default class GitVersionListPlugin {
  lastContentHash = null;
  constructor(options) {
    this.minVersion = options.minVersion;
    this.outputPath = options.outputPath;
  }

  getCurrentGitBranch() {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      "GitVersionListPlugin",
      (compilation, callback) => {
        try {
          // Get all git tags
          const tagsOutput = execSync("git tag", { encoding: "utf-8" });
          const tags = tagsOutput.split("\n").filter(Boolean);
          const currentBranch = this.getCurrentGitBranch();

          // Filter tags greater than minVersion
          const filteredTags = tags
            .filter((tag) => {
              try {
                return semver.valid(tag) && semver.gt(tag, this.minVersion);
              } catch {
                return false;
              }
            })
            .sort((a, b) => semver.compare(b, a));

          // Generate TypeScript content
          const content = `
// This file is auto-generated
export const gitVersions = ${JSON.stringify(filteredTags, null, 2)} as const;
export type GitVersion = typeof gitVersions[number];
export const currentBranch = "${currentBranch}";
`;

          const newContentHash = this.hashContent(content);
          if (newContentHash === this.lastContentHash) {
            //   // Skip writing to file if content has not changed
            callback();
            return;
          }
          // Write to file
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log(
            "generated gitVersions.ts with tags",
            filteredTags.length,
          );
          const outputPath = resolve(compiler.context, this.outputPath);
          writeFileSync(outputPath, content);
          this.lastContentHash = newContentHash;

          callback();
        } catch (error) {
          callback(error);
        }
      },
    );
  }

  hashContent(content) {
    return crypto.createHash("md5").update(content).digest("hex");
  }
}
