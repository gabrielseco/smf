import fs from 'fs';

export function existsFolder(directory: string) {
  return fs.existsSync(directory);
}

export function copyFile(src: string, destination: string) {
  return new Promise<void>((resolve, reject) => {
    fs.copyFile(src, destination, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}
