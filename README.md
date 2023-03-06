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

cd into the base directory and run `virtaulenv venv` (this assumes you want to name your virtual environment `venv`) to create a new virtual environment

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



### Dev SSO Startup:

Tabula Rasa requires use of the Kaart Single Sign On service (SSO) for the login process, and can be set up to work with either a dev clone of the SSO running locally, or with the live SSO itself at `my.kaart.com`

However, Setting up a dev version of the Kaart SSO can be challenging, and if the engineer in question does not need to modify the SSO, there is no real need to make them take the time to clone & set up a copy of the SSO, when they can use a test user account through the Live SSO instead

With that in mind, Tabula Rasa is set up to work with the live SSO API by default `my.kaart.com` using an engineering test account.

See the section `Setting up a local SSO instance` for detailed instructions on how to setup a dev copy of the SSO and change the environment variables in Tabula Rasa accordingly.

To start a local SSO instance:


CD into the `server` folder

Activate the virtual environment:
`source venv/bin/activate`  


Run command:
`flask run -p 5001 --reload`
- By convention we run the SSO in a dev environment on port 5001 so as not to conflict with other apps running locally, i.e Viewer(5002),Tabula Rasa(5003), Mikro(5004) and Gem(5000)

- The reload flag will restart flask if any changes are made to the API code base, recommended if work on the SSO is needed


### Dev Backend Startup:

Make sure your virtual environment is activated

cd into the backend folder

run command `flask run -p 5003 --reload`

- Tabula Rasa is set up to run it's API on port 5003 by default so as not to conflict with the conventional ports on which we run our dev versions of Viewer(5002), Mikro(5004) and Gem(5000).

- The reload flag will cause flask to reload if any changes are saved to the API codebase, highly recommend for dev work.

- See the `Changing Project Variables` section on how to change all of the project environment & port settings when you are ready to start modifying Tabula Rasa for you new project.





### DevFrontend Startup:

Make sure your node version and all of the required node packages are up to date.

run command:
`open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security`
-This opens a chrome browser in CORS unprotected mode for development (This allows us to use the `dev.` header on our local url which prevents all of the cross-origin problems caused by working in a local dev environment)

cd into the `frontend/mikro` folder

run command:
`DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start`

-The `DANGEROUSLY_DISABLE_HOST_CHECK` portion of the command allows us to use the `dev.` url flag mentioned previously

-This  will compile & start the front end client in the chrome browser on port 3000, if that port is taken node will suggest another.
(The frontend port changing doesn't require any changes to the codebase so we don't have a convention for what apps client run where, just let node suggest an open port) 

--IMPORTANT
-In the URL bar, add the `dev.` header to the beginning of the url, i.e. `dev.localhost:3000`
-As mentioned before, this is to prevent cross-origin issues related to the dev environment



