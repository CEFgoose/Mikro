#!/usr/bin/env bash
set -ex

function variables() {
	# This must be set to 0 when not testing a "new" setup
	DEBUG=0

	DATABASE_DIR="$(pwd)/test_db"
	POSTGRES_DB="devel_mikro"
	POSTGRES_USER="devel_mikro"
	#TODO change the password
	POSTGRES_PASSWORD="mikro"
	POSTGRES_ENDPOINT="localhost"
	POSTGRES_PORT=5000
    if [ -f "mikro.env" ]; then
	    source mikro.env
       fi
}

function check_dependencies() {
	if [ ! -f "$(which apt)" ]; then
		echo "Something has gone terribly wrong! The world is on fire!"
	fi
	echo "We are now installing python (with pip), postgres, postgis, and geos via apt"
	sudo apt install python postgresql-10 postgis libgeos-dev || echo "We couldn't install all the dependencies. Issues may occur."
}

function database_setup() {
	export PGDATA="${DATABASE_DIR}"
	# IMPORTANT TODO REMOVE
	if [ -d "${PGDATA}" ] && [ ${DEBUG} -gt 0 ]; then
		rm -rf "${PGDATA}"
	fi

	if [ ! -d "${PGDATA}" ]; then
		mkdir -p "${PGDATA}"
		#initdb "${PGDATA}"
		#pg_ctl -D "${PGDATA}" -l logfile start
		sudo -u postgres createdb "${POSTGRES_DB}"
		#createdb "$(whoami)"
		local commands=("CREATE USER \"${POSTGRES_USER}\" PASSWORD '${POSTGRES_PASSWORD}';"
				"CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"
				"\\c \"${POSTGRES_DB}\";"
				"CREATE EXTENSION postgis;")
		for command in "${commands[@]}"; do
			sudo -u postgres psql --dbname="${POSTGRES_DB}" --command="${command}" || echo "${command} didn't work"
		done
		export mikro_DB="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ENDPOINT}/${POSTGRES_DB}"
	else
		#pg_ctl -D "${PGDATA}" -l logfile start
		export mikro_DB="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ENDPOINT}/${POSTGRES_DB}"
	fi
	setup_python
	#flask db upgrade
	#python3 manage.py db upgrade
}

function database_shutdown() {
	echo "pg_ctl -D "${PGDATA}" stop -s -m fast"
}

function setup_python() {
	local VENV="./venv"
	if [ -d "${VENV}" ] && [ ${DEBUG} -gt 1 ]; then
		rm -rf "${VENV}"
	fi
	if [ ! -d "${VENV}" ]; then
		python3 -m venv "${VENV}"
		. "${VENV}/bin/activate"
		pip install -r requirements.txt
	else
		. "${VENV}/bin/activate"
	fi
}

function start_server() {
	setup_python
	flask run
	#python3 manage.py runserver -d -r
}

function main() {
	trap "database_shutdown; jobs -p | xargs kill -QUIT" EXIT SIGTERM
	variables
	check_dependencies
	database_setup
	start_server
}
main $@

