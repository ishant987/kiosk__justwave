import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';

const root = process.cwd();
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg']);
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const sourceExtensions = new Set(['.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.ts', '.tsx']);
const cwebpBin = process.env.CWEBP_BIN || 'cwebp';
const quality = process.env.WEBP_QUALITY || '82';

const walk = (directory, matcher, files = []) => {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      walk(path, matcher, files);
    } else if (matcher(path)) {
      files.push(path);
    }
  }

  return files;
};

const toWebpPath = (path) => join(dirname(path), `${basename(path, extname(path))}.webp`);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const imageFiles = walk(root, (path) => rasterExtensions.has(extname(path).toLowerCase()));

for (const imagePath of imageFiles) {
  const outputPath = toWebpPath(imagePath);
  execFileSync(cwebpBin, ['-quiet', '-q', quality, imagePath, '-o', outputPath], { stdio: 'inherit' });
  console.log(`converted ${relative(root, imagePath)} -> ${relative(root, outputPath)}`);
}

const convertedImages = imageFiles
  .map((imagePath) => ({
    fromName: basename(imagePath),
    toName: basename(toWebpPath(imagePath)),
    webpPath: toWebpPath(imagePath)
  }))
  .filter(({ webpPath }) => existsSync(webpPath));

const sourceFiles = walk(root, (path) => sourceExtensions.has(extname(path).toLowerCase()));

for (const sourcePath of sourceFiles) {
  let content = readFileSync(sourcePath, 'utf8');
  const original = content;

  for (const { fromName, toName } of convertedImages) {
    content = content.replace(new RegExp(escapeRegExp(fromName), 'g'), toName);
  }

  if (content !== original) {
    writeFileSync(sourcePath, content);
    console.log(`updated references in ${relative(root, sourcePath)}`);
  }
}
