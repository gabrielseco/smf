#!/usr/bin/env node

import path from 'path';
import { homedir } from 'os';

import program from 'commander';

import { organizer } from './organizer';

const packageJSON = require('../package.json'); // eslint-disable-line

function executeCli(): void {
  const home = homedir();
  const musicFolder = path.resolve(home + '/Desktop/music');
  const destinationFolder = path.resolve(home + '/Desktop/musica');
  program.version(packageJSON.version);

  program
    .command('organize')
    .description('organizes your music')
    .action(function () {
      organizer({ musicFolder, destinationFolder });
    });

  program.parse(process.argv);
}

executeCli();
