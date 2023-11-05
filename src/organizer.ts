import { promises } from 'fs';
import path from 'path';

import { Promise as NodeID3, Tags } from 'node-id3';
import mkdirp from 'mkdirp';

import { existsFolder, copyFile } from './utils';

type TagsWithFile = Tags & { file: string };

export async function scanMusicFolder(directory: string) {
  const EXTENSIONS = ['.mp3'];
  try {
    const files = await promises.readdir(directory);
    return files.filter((file) => {
      return EXTENSIONS.includes(path.extname(file).toLowerCase());
    });
  } catch (err) {
    console.log('err scanning files', err);
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

async function updateTagsSongs(musicInfo: TagsWithFile[]) {
  for (let index = 0; index < musicInfo.length; index++) {
    const tags = await NodeID3.read(musicInfo[index].file, { noRaw: true });
    delete (tags as any).image?.type;
    delete (tags as any).image?.mime;

    await NodeID3.update(
      {
        ...tags,
        unsynchronisedLyrics: undefined,
        copyright: '',
        artistUrl: [],
        audioSourceUrl: '',
        comment: undefined,
        trackNumber: undefined,
        partOfSet: undefined
      },
      musicInfo[index].file
    );
  }
}

export function getArtistsFoldersName(musicInfo: Tags[]) {
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

async function copyFilesToDestinationFolder(
  destinationFolder: string,
  songsGroupedByArtist: Record<string, TagsWithFile[]>
) {
  const filePaths: Array<{
    [key: string]: { file: string; album?: string; title?: string }[];
  }> = Object.keys(songsGroupedByArtist).map((key) => {
    return {
      [key]: songsGroupedByArtist[key].map((item) => {
        return { file: item.file, album: item.album, title: item.title };
      })
    };
  });

  const promises = filePaths.map((filePath) => {
    const artist = Object.keys(filePath)[0];
    const value = filePath[artist];

    const destinationPath = `${destinationFolder}/${artist}`;

    const promises = value.map(({ file, album, title }) => {
      const extension = path.extname(file).toLowerCase();
      const directory = `${destinationPath}/${album}`;
      const fileNameModified = `${title}${extension}`;

      if (existsFolder(directory)) {
        return copyFile(file, `${directory}/${fileNameModified}`);
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
  try {
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

    await updateTagsSongs(musicData);

    const artists = getArtistsFoldersName(musicData);

    await createFoldersBasedInArtists(destinationFolder, artists);

    const songsGroupedByArtist = getSongsGroupedByArtist(musicData);

    await createFoldersAlbum(destinationFolder, songsGroupedByArtist);

    await copyFilesToDestinationFolder(destinationFolder, songsGroupedByArtist);

    console.log('Task Finished');
  } catch (error) {
    console.log(error);
  }
}
