#!/usr/bin/env bash
cd ${HOME}/mikro/frontend/Mikro
npm install
#npm run start
#npx react-scripts start
#node src/index.js
npx yarn build
npx yarn global add server
npx serve -s build -l 3000
$(which node) node_modules/react-scripts/scripts/start.js
