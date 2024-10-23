import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import fse from 'fs-extra';
import PQueue from 'p-queue';
import fetch from 'node-fetch';

function sha256(string) {
  return crypto
    .createHash('sha256')
    .update(string)
    .digest('hex');
}

function atob(string) {
  return Buffer.from(string, 'base64').toString();
}

export default class iCloudBackupPhotos {

  api = null;
  filepath = null;

  constructor({
    api = null,
    filepath = null,
    concurrency = 20,
  }) {
    this.api = api;
    this.filepath = filepath;
    this.queue = new PQueue({ concurrency });
  }

  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args);
  }

  async createBackup() {
    await fse.ensureDir(this.filepath);

    const photosService = this.api.getService('photos');
    const albums = await photosService.getAlbums();
    const album = albums.get('All Photos');

    await fse.ensureDir(path.join(this.filepath, 'All Photos'));

    const length = 100;
    let offset = 0;

    while (true) {
      const result = await album.endpointService.fetch('/records/query', {
        query: {
          filterBy: [
            {
              fieldName: 'startRank',
              fieldValue: {
                type: 'INT64',
                value: offset,
              },
              comparator: 'EQUALS',
            },
            {
              fieldName: 'direction',
              fieldValue: {
                type: 'STRING',
                value: 'ASCENDING',
              },
              comparator: 'EQUALS',
            },
          ],
          recordType: 'CPLAssetAndMasterByAssetDateWithoutHiddenOrDeleted',
        },
        resultsLimit: length * 2,
        desiredKeys: [
          'resOriginalRes',
          'recordName',
          'recordType',
          'filenameEnc',
        ],
        zoneID: {
          zoneName: 'PrimarySync',
        },
      });

      if (result.records.length > 0) {
        offset += length;
      } else {
        break;
      }

      for (const photo of result.records) {
        if (photo.recordType !== 'CPLMaster') continue;
        if (!photo.recordName) continue;
        if (!photo.fields) continue;
        if (!photo.fields.resOriginalRes) continue;
        if (!photo.fields.resOriginalRes.value) continue;
        if (!photo.modified) continue;
        if (!photo.modified.timestamp) continue;

        const fileExtension = atob(photo.fields.filenameEnc.value).split('.').pop().toLowerCase();
        const fileName = `${sha256(photo.recordName)}.${fileExtension}`;
        const url = photo.fields.resOriginalRes.value?.downloadURL;

        // Download the file
        await this.queue.add(async () => {
          const relativeFilepath = path.join('All Photos', fileName);
          const absoluteFilepath = path.join(this.filepath, relativeFilepath);

          try {
            // Check if already downloaded
            if (await fse.pathExists(absoluteFilepath)) {
              const stats = await fse.stat(absoluteFilepath);

              const localModified = new Date(stats.mtime);
              const cloudModified = new Date(photo.modified.timestamp);

              if (localModified.getTime() === cloudModified.getTime()) {
                // this.log(`⏩ ${relativeFilepath}`);
                return;
              }
            }

            // Save to disk
            const res = await fetch(url);
            await new Promise((resolve, reject) => {
              res.body.pipe(fs.createWriteStream(absoluteFilepath))
                .once('finish', resolve)
                .once('error', reject);
            });

            // Set file modification time
            const dateModified = new Date(photo.modified.timestamp);
            await fse.utimes(absoluteFilepath, dateModified, dateModified);

            this.log(`✅ ${relativeFilepath}`);
          } catch (err) {
            this.log(`❌ ${relativeFilepath}: ${err.stack}`);
          }
        });
      }
    }
  }

}