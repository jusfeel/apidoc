#!/usr/bin/env node

"use strict";

/**
 * Development watch script for apidoc
 * Watches both source files (example/) and template files (template/)
 * and rebuilds documentation when changes are detected
 */

const path = require("path");
const chokidar = require("chokidar");
const apidoc = require(path.join(__dirname, "..", "lib", "index"));

const exampleDir = path.join(__dirname, "..", "example");
const templateDir = path.join(__dirname, "..", "template");
const outputDir = path.join(__dirname, "..", "dev-output");

const options = {
  src: [exampleDir],
  dest: outputDir,
  template: templateDir,
  verbose: true,
  debug: true,
  colorize: true,
};

let buildInProgress = false;
let buildTimeout = null;

/**
 * Build documentation
 */
function build() {
  if (buildInProgress) {
    console.log("[watch] Build already in progress, queuing next build...");
    return;
  }

  buildInProgress = true;
  console.log("[watch] Building documentation...");

  const result = apidoc.createDoc(options);

  if (result === false) {
    console.error("[watch] Build failed!");
  } else {
    const d = new Date();
    console.log(`[watch] Build completed at ${d.toLocaleTimeString()}`);
  }

  buildInProgress = false;
}

/**
 * Debounced build function
 */
function debouncedBuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }

  buildTimeout = setTimeout(() => {
    build();
  }, 500); // Wait 500ms after last change
}

// Initial build
console.log("Starting development watch mode...");
console.log(`Watching source files: ${exampleDir}`);
console.log(`Watching template files: ${templateDir}`);
console.log(`Output directory: ${outputDir}`);
console.log("");

build();

// Watch source files (example directory)
const sourceWatcher = chokidar.watch(exampleDir, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

sourceWatcher
  .on("change", (filePath) => {
    console.log(
      `[watch] Source file changed: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  })
  .on("add", (filePath) => {
    console.log(
      `[watch] Source file added: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  })
  .on("unlink", (filePath) => {
    console.log(
      `[watch] Source file removed: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  });

// Watch template files
const templateWatcher = chokidar.watch(templateDir, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

templateWatcher
  .on("change", (filePath) => {
    console.log(
      `[watch] Template file changed: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  })
  .on("add", (filePath) => {
    console.log(
      `[watch] Template file added: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  })
  .on("unlink", (filePath) => {
    console.log(
      `[watch] Template file removed: ${path.relative(process.cwd(), filePath)}`
    );
    debouncedBuild();
  });

console.log("[watch] Watch mode active. Press Ctrl+C to stop.\n");

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[watch] Stopping watch mode...");
  sourceWatcher.close();
  templateWatcher.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[watch] Stopping watch mode...");
  sourceWatcher.close();
  templateWatcher.close();
  process.exit(0);
});
