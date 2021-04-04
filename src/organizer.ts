import fs from 'fs';
import path from 'path';

import { Promise as NodeID3, Tags } from 'node-id3';
import mkdirp from 'mkdirp';

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
    const directory = `${destinationFolder}/${artist}`;
    console.log(`creating folder ${directory}`);
    return mkdirp(directory);
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

function createFoldersAlbum(
  destinationFolder: string,
  musicInfo: Record<string, TagsWithFile[]>
) {
  const promises = Object.keys(musicInfo).map((artist) => {
    return Promise.all(
      musicInfo[artist].map((item) => {
        const directory = `${destinationFolder}/${artist}/${item.album}`;
        console.log(`creating folder ${directory}`);
        return mkdirp(directory);
      })
    );
  });

  return Promise.all(promises);
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
  const paths: Array<{
    [key: string]: { file: string; album?: string }[];
  }> = Object.keys(songsGroupedByArtist).map((key) => {
    return {
      [key]: songsGroupedByArtist[key].map((item) => {
        return { file: item.file, album: item.album };
      })
    };
  });

  const promises = paths.map((path) => {
    const artist = Object.keys(path)[0];
    const value = path[artist];

    const destinationPath = `${destinationFolder}/${artist}`;

    const promises = value.map(({ file, album }) => {
      const fileIndex = file.lastIndexOf('/');
      const fileName = file.slice(fileIndex + 1);
      const directory = `${destinationPath}/${album}`;

      if (existsFolder(directory)) {
        return copyFile(file, `${directory}/${fileName}`);
      }
    });

    return Promise.all(promises);
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
  console.log('Starting Task');
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

  console.log(`Copying ${files.length} files to ${destinationFolder}`);

  const musicData = await getMusicInfo(musicFolder, files);

  const artists = getArtistsFoldersName(musicData);

  await createFoldersBasedInArtists(destinationFolder, artists);

  const songsGroupedByArtist = getSongsGroupedByArtist(musicData);

  await createFoldersAlbum(destinationFolder, songsGroupedByArtist);

  await copyFilesToDestinationFolder(destinationFolder, songsGroupedByArtist);

  console.log('Task Finished');
}
