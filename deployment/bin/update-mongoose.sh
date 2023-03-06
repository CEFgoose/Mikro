#!/usr/bin/env bash
cd ${HOME}/mikro
/usr/bin/git stash && /usr/bin/git pull && /usr/bin/git stash pop
cd backend
. venv/bin/activate
pip install -r requirements.txt
flask db upgrade

systemctl --user restart mikro-npm
