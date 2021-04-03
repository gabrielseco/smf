import fs from 'fs';

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

  console.log({ files });

  console.log('continue');
}
