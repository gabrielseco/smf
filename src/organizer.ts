import fs from 'fs';

function existsFolder(directory: string) {
  return fs.existsSync(directory);
}

export function organizer({
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

  console.log('continue');
}
