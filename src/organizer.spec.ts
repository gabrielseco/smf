import { promises } from 'fs';

import { getArtistsFoldersName, scanMusicFolder } from './organizer';

jest.mock('fs');

describe('Organizer', () => {
  describe('Scan files', () => {
    it('should return an empty array', async () => {
      expect.assertions(1);
      (promises.readdir as jest.Mock).mockImplementation(() =>
        Promise.resolve([])
      );
      const files = scanMusicFolder('');

      expect(files).resolves.toEqual([]);
    });

    it('should return an array of files that are not .mp3', async () => {
      expect.assertions(1);
      (promises.readdir as jest.Mock).mockImplementation(() =>
        Promise.resolve(['hello.txt', 'hello.css', 'hello.js'])
      );
      const files = scanMusicFolder('');

      expect(files).resolves.toEqual([]);
    });

    it('should return the files that are allowed to filter', () => {
      expect.assertions(1);
      (promises.readdir as jest.Mock).mockImplementation(() =>
        Promise.resolve(['hello.txt', 'hello.css', 'hello.js', 'hello.mp3'])
      );
      const files = scanMusicFolder('');

      expect(files).resolves.toEqual(['hello.mp3']);
    });
  });

  describe('getArtistsFoldersName', () => {
    it('should output an array of unique artists', () => {
      const artists = getArtistsFoldersName([
        {
          artist: 'Nicky Romero'
        },
        {
          artist: 'Nicky Romero'
        },
        {
          artist: 'Timmo Hendricks'
        },
        {
          artist: 'Timmo Hendricks'
        }
      ]);

      expect(artists).toEqual(new Set(['Nicky Romero', 'Timmo Hendricks']));
    });
  });
});
