# iCloud Backup

[![NPM Version](https://img.shields.io/npm/v/icloud-backup)](https://npmjs.com/package/icloud-backup)
[![Sponsor](https://img.shields.io/github/sponsors/weejewel)](https://github.com/sponsors/WeeJeWel)
[![Build & Publish NPM Package](https://github.com/WeeJeWel/node-icloud-backup/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/WeeJeWel/node-icloud-backup/actions/workflows/npm-publish.yml)
[![Build & Publish Docker Image](https://github.com/WeeJeWel/node-icloud-backup/actions/workflows/ghcr-publish.yml/badge.svg)](https://github.com/WeeJeWel/node-icloud-backup/actions/workflows/ghcr-publish.yml)

This module automatically downloads your iCloud Drive & Photos to the local filesystem.

This tool will output the following directory structure:

```
.
└── Drive
    └── <...>
└── Photos
    └── All Photos
        └── <.png|.jpg|.mov|...>
    └── My Album
        └── <Symbolic link to All Photos>
    └── My Shared Album
        └── <Symbolic link to All Photos>
    └── ...
```

## Why?

Apple makes great services, but there are many horror stories of people locked out of their accounts. So be safe, and keep your data backed up!

## Usage

### 1. Run

#### Node.js

If you have Node.js already installed, run:

```bash
$ npx -y icloud-backup \
  --username "john.doe@gmail.com" \
  --password "abcd efgh ijkl mnop" \
  --filepath "~/Backups/iCloud/" \
  --services "drive,photos"
```

> The first time you will need to enter your 2FA code manually.

> Hint: You can schedule this in a cronjob for automated backups.

#### Docker

If you prefer Docker, this is an example how to run: 

```bash
$ docker run -it \
  --env ICLOUD_BACKUP_USERNAME="john.doe@gmail.com" \
  --env ICLOUD_BACKUP_PASSWORD="abcd efgh ijkl mnop" \
  --env ICLOUD_BACKUP_FILEPATH="/backups" \
  --volume="~/Backups/iCloud/:/backups/" \
  ghcr.io/weejewel/icloud-backup
```

> Hint: when automating this within a cronjob, remove `-it` after the first run.

## Credits

Most hard work is done by [@foxt](https://github.com/foxt) in [icloud.js](https://github.com/foxt/icloud.js). Please [sponsor them](https://github.com/sponsors/foxt)!

## Also see

Looking to backup Google Mail, Calendar & Contacts in a similar way? See [Google Backup](https://github.com/WeeJeWel/node-google-backup).
