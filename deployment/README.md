# Deployment

## Setup

First copy the files in the `bin` directory to a path in the `PATH` environment variable.

Then, copy the `systemd` directory to the systemd config path for the user that the server will be running as (for example, `/home/$(whoami)/.config/systemd/user`).

## Install

As the user that you installed the systemd units as, run

```
$ systemctl --user enable --now mikro-update.timer
$ systemctl --user enable --now mikro-flask.service
$ systemctl --user enable --now mikro-npm.service # This is currently broken
```

While the `mikro-npm.service` is broken, you _must_ run `npm install && npm run start` in the mikro `front-end/viewer` directory.
