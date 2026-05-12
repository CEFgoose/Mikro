# NEW MIKRO

## Overview:

This is a complete rebuild of the Mikro OSM micropayments platform by Kaart using the Tabula rasa app as a jumping off point

## Design:

The Mikro backend is built in python3 using a variety of Python packages and the Flask web framework.

A PostgreSQL database with the PostGIS extension is used in this application.

The front end utilizes Javascript with the React library for building the user interface.

Styled-component modules are also used in order to write CSS within JS in a reusable way.

## Development:

Development should not occur on the Tabula Rasa platform directly.

The idea here is to have a "Blank Slate" app that a Kaart engineer can easily and quickly clone, set up & have running in a dev environment within an hour, including sign on functionality through the Kaart Single Sign On Service (SSO)

Once Tabula Rasa is up and running, the engineer in question should immediately change every instance of the name "Tabula Rasa" within the codebase to whatever they wish to name the new project, create a new git repo & commit the codebase before making any changes. This will hopefully prevent any unintentional changes to the Tabula Rasa Codebase itself.

### Virtual Environment Setup:

Typically we use Virtualenv to set up our virtual environment for development.

cd into the base directory and run `virtualenv venv` (this assumes you want to name your virtual environment `venv`) to create a new virtual environment

Run `source venv/bin/activate` to activate the virtual environment. substitute `venv` for the name of your virtual environment if you named it something other than `venv`

### Node Packages Installation:

cd into the `frontend/mikro` folder

Double check the `package.json` file to make sure that the versions of all of the node packages listed are the most current available
(hovering over the version number will pop up a tooltip showing the most recent release version)

run command `npm install` or `yarn install` depending on your preference.

### Python Packages Installation:

cd into the `backend` folder

Double check the `requirements.txt` file to make sure that the versions of all of the python libraries listed are the most current available.
(hovering over the version number will pop up a tooltip showing the most recent release version)

Make sure virtual environment activated.

run the following command to install all of the python library requirements:
`pip3 install -r requirements.txt`

### Dev Backend Startup:

Make sure your virtual environment is activated

cd into the backend folder

run command `flask run -p 5004 --reload`

- Tabula Rasa is set up to run it's API on port 5003 by default so as not to conflict with the conventional ports on which we run our dev versions of Viewer(5002), Mikro(5004) and Gem(5000).

- The reload flag will cause flask to reload if any changes are saved to the API codebase, highly recommend for dev work.

- See the `Changing Project Variables` section on how to change all of the project environment & port settings when you are ready to start modifying Tabula Rasa for you new project.



