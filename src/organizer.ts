import fs from 'fs';

import { Promise as NodeID3 } from 'node-id3';

function existsFolder(directory: string) {
  return fs.existsSync(directory);
}

async function scanMusicFolder(directory: string) {
  try {
    const files = await fs.promises.readdir(directory);
    return files;
  } catch (err) {
    console.log('err scanning files');
  }
}

async function getMusicInfo(musicFolder: string, files: string[]) {
  const musicInfo = [];

  for (const file of files) {
    const fileData = await NodeID3.read(`${musicFolder}/${file}`);

    musicInfo.push(fileData);
  }

  return musicInfo;
}

export async function organizer({
  musicFolder,
  destinationFolder
}: {
  musicFolder: string;
  destinationFolder: string;
}) {
  if (!existsFolder(musicFolder)) {
    throw new Error(`Music folder ${musicFolder} could not be found`);
  }

  if (!existsFolder(destinationFolder)) {
    throw new Error('Destination folder cannot be found');
  }

  const files = await scanMusicFolder(musicFolder);

  if (!files) {
    throw new Error(`Couldn't find any files`);
  }

  const musicData = await getMusicInfo(musicFolder, files);

  console.log(musicData);
}
