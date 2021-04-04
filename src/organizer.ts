import fs from 'fs';
import path from 'path';

import { Promise as NodeID3, Tags } from 'node-id3';
import mkdirp from 'mkdirp';
import copyfiles from 'copyfiles';

function existsFolder(directory: string) {
  return fs.existsSync(directory);
}

async function scanMusicFolder(directory: string) {
  const EXTENSIONS = ['.mp3'];
  try {
    const files = await fs.promises.readdir(directory);
    return files.filter((file) => {
      return EXTENSIONS.includes(path.extname(file).toLowerCase());
    });
  } catch (err) {
    console.log('err scanning files');
  }
}

async function getMusicInfo(musicFolder: string, files: string[]) {
  const musicInfo = [];

  for (const file of files) {
    const fileData = await NodeID3.read(`${musicFolder}/${file}`);

    musicInfo.push({ ...fileData, file: `${musicFolder}/${file}` });
  }

  return musicInfo;
}

function getArtistsFoldersName(musicInfo: Tags[]) {
  const artists = musicInfo.map((musicItem) => {
    return musicItem.artist?.split(',')[0].trim() as string;
  });

  return new Set([...artists]);
}

async function createFoldersBasedInArtists(
  destinationFolder: string,
  artists: Set<string>
) {
  const promises = [...artists].map((artist) => {
    return mkdirp(`${destinationFolder}/${artist}`);
  });

  return Promise.all(promises);
}

type TagsWithFile = Tags & { file: string };

function getSongsGroupedByArtist(musicInfo: TagsWithFile[]) {
  const songsGroupedByArtist = musicInfo.reduce((acc, item) => {
    const artistName = item.artist?.split(',')[0].trim() as string;
    const accumulatedSongs = acc[artistName] ? acc[artistName] : [];
    return {
      ...acc,
      [artistName]: [...accumulatedSongs, item]
    };
  }, {} as Record<string, TagsWithFile[]>);

  return songsGroupedByArtist;
}

function copyFile(src: string, destination: string) {
  return new Promise<void>((resolve, reject) => {
    fs.copyFile(src, destination, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

async function copyFilesToDestinationFolder(
  destinationFolder: string,
  songsGroupedByArtist: Record<string, TagsWithFile[]>
) {
  const paths: Array<{ [key: string]: string[] }> = Object.keys(
    songsGroupedByArtist
  ).map((key) => {
    return {
      [key]: songsGroupedByArtist[key].map((item) => item.file)
    };
  });

  const promises = paths.map((path) => {
    const artist = Object.keys(path)[0];
    const value = path[artist];

    const destinationPath = `${destinationFolder}/${artist}`;

    const promises = value.map((file) => {
      const fileIndex = file.lastIndexOf('/');
      const fileName = file.slice(fileIndex);
      return copyFile(file, `${destinationPath}/${fileName}`);
    });

    return promises;
  });

  return Promise.all(promises);
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

  if (!files || files.length === 0) {
    throw new Error(`Couldn't find any files`);
  }

  const musicData = await getMusicInfo(musicFolder, files);

  const artists = getArtistsFoldersName(musicData);

  await createFoldersBasedInArtists(destinationFolder, artists);

  const songsGroupedByArtist = getSongsGroupedByArtist(musicData);

  await copyFilesToDestinationFolder(destinationFolder, songsGroupedByArtist);
}
