#!/usr/bin/env node

import fs from 'fs';

import { program } from 'commander';
import iCloudBackup from '../lib/iCloudBackup.mjs';

// Get Version from package.json
const { version } = JSON.parse(await fs.promises.readFile(new URL('../package.json', import.meta.url)));

program
  .version(version)
  .option('-u, --username <username>', 'Apple ID Username')
  .option('-p, --password <password>', 'Apple ID Password')
  .option('-f, --filepath <filepath>', 'Backup Filepath')
  .option('-s, --services <services>', 'Services to backup', value => {
    return value.split(',').map(value => value.trim());
  }, ['drive'],
  )
  .parse();

const options = program.opts();

const icloudBackup = new iCloudBackup({
  username: options.username ?? process.env.ICLOUD_BACKUP_USERNAME,
  password: options.password ?? process.env.ICLOUD_BACKUP_PASSWORD,
  filepath: options.filepath ?? process.env.ICLOUD_BACKUP_FILEPATH,
});

await Promise.all([
  options.services.includes('drive') && icloudBackup.backupDrive(),
]);