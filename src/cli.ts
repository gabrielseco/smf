#!/usr/bin/env node

import program from 'commander';

import { organizer } from './organizer';

const packageJSON = require('../package.json'); // eslint-disable-line

function executeCli(): void {
  const searchFolder = '';
  const destinationFolder = '';
  program.version(packageJSON.version);

  program
    .command('organize')
    .description('organizes your music')
    .action(function () {
      organizer({ searchFolder, destinationFolder });
    });

  program.parse(process.argv);
}

executeCli();
