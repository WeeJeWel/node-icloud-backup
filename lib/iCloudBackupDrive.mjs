import fs from 'node:fs';
import path from 'node:path';

import fse from 'fs-extra';

export default class iCloudBackupDrive {

  api = null;
  filepath = null;

  constructor({
    api = null,
    filepath = null,
  }) {
    this.api = api;
    this.filepath = filepath;
  }

  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args);
  }

  async createBackup() {
    await fse.ensureDir(this.filepath);

    await this.api.requestServiceAccess('iclouddrive');
    const driveService = this.api.getService('drivews');

    const downloadFolderRecursive = async (node, relativePath = '/') => {
      const absolutePath = path.join(this.filepath, relativePath);
      await fse.ensureDir(absolutePath);

      for (const item of Object.values(node.items)) {
        switch (item.type) {
          case 'FILE': {
            const relativeFilepath = path.join(relativePath, `${item.name}.${item.extension}`);
            const absoluteFilepath = path.join(this.filepath, relativeFilepath);

            // If already downloaded
            if (await fse.pathExists(absoluteFilepath)) {
              const stats = await fse.stat(absoluteFilepath);

              const localModified = new Date(stats.mtime);
              const cloudModified = new Date(item.dateModified);

              // If not modified, continue
              if (localModified.getTime() === cloudModified.getTime()) continue;
            }

            // Download the file
            try {
              // Save to disk
              const file = await driveService.downloadFile(item);
              await new Promise((resolve, reject) => {
                file.pipe(fs.createWriteStream(absoluteFilepath))
                  .once('finish', resolve)
                  .once('error', reject);
              });

              // Set file modification time
              const dateModified = new Date(item.dateModified);
              await fse.utimes(absoluteFilepath, dateModified, dateModified);

              this.log(`✅ ${relativeFilepath}`);
            } catch (err) {
              this.log(`❌ ${relativeFilepath}: ${err.message}`);
            }
            break;
          }
          case 'FOLDER': {
            const relativeFilepath = path.join(relativePath, `${item.name}`);

            try {
              const folderNode = await driveService.getNode(item);
              await downloadFolderRecursive(folderNode, relativeFilepath);
            } catch (err) {
              console.error(`❌ ${relativeFilepath}: ${err.message}`);
            }
            break;
          }
        }
      };
    };

    const rootNode = await driveService.getNode();
    await downloadFolderRecursive(rootNode);
  }

}