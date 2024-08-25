import path from 'node:path';

import iCloudJS from 'icloudjs';
import fse from 'fs-extra';
import input from 'input';

import iCloudBackupDrive from './iCloudBackupDrive.mjs';

export default class iCloudBackup {

  constructor({
    username = null,
    password = null,
    filepath = null,
  }) {
    if (!username) {
      throw new Error('Missing Username');
    }

    if (!password) {
      throw new Error('Missing Password');
    }

    if (!filepath) {
      throw new Error('Missing Filepath');
    }

    if (filepath.startsWith('~/')) {
      filepath = path.join(process.env.HOME, filepath.slice(2));
    }

    this.filepath = path.resolve(filepath);
    this.filepathCredentials = path.join(this.filepath, '.credentials');

    this.api = new iCloudJS.default({
      username,
      password,
      saveCredentials: false,
      trustDevice: true,
      authMethod: 'srp',
      dataDirectory: this.filepathCredentials,
    });

    this.drive = new iCloudBackupDrive({
      api: this.api,
      filepath: path.join(this.filepath, 'Drive'),
    });
  }

  async authenticate() {
    // Ensure directory exists
    await fse.ensureDir(this.filepathCredentials);

    // If already authenticated
    if (this.api.accountInfo) return;

    // Authenticate
    await this.api.authenticate();

    // Handle MFA
    if (this.api.status === 'MfaRequested') {
      const mfaCode = await input.text('2FA Code:');
      await this.api.provideMfaCode(mfaCode)
    }

    // Wait for ready
    await this.api.awaitReady;

    console.log(`✅ Authenticated as ${this.api.accountInfo.dsInfo.fullName}`);
  }

  async backupAll() {
    await Promise.all([
      this.backupDrive(),
    ]);
  }

  async backupDrive() {
    await this.authenticate();
    await this.drive.createBackup();
  }

}