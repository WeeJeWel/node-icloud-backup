import fs from 'node:fs';
import path from 'node:path';

import fse from 'fs-extra';

export default class iCloudBackupPhotos {

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

    const photosService = this.api.getService('photos');
    const albums = await photosService.getAlbums();
    const album = albums.get("Favorites");

    // for (const album of albums.values()) {
    console.log(album);
    const relativeFilepath = path.join('/', `${album.name}`);
    const absoluteFilepath = path.join(this.filepath, relativeFilepath);

    const photos = await album.getPhotos();
    console.log(photos);
    //   break;
    // }
  }

}