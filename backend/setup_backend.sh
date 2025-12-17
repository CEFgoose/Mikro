#!/usr/bin/env sh
set -ex

function variables() {
	# This must be set to 0 when not testing a "new" setup
	DEBUG=0

	DATABASE_DIR="$(pwd)/test_db"

	# Load from environment or mikro.env file
	if [ -f "mikro.env" ]; then
		source mikro.env
	fi

	# Use environment variables with defaults for non-sensitive values only
	POSTGRES_DB="${POSTGRES_DB:-devel_mikro}"
	POSTGRES_USER="${POSTGRES_USER:-devel_mikro}"
	POSTGRES_ENDPOINT="${POSTGRES_ENDPOINT:-localhost}"
	POSTGRES_PORT="${POSTGRES_PORT:-5000}"

	# Password MUST be set via environment variable or mikro.env
	if [ -z "${POSTGRES_PASSWORD}" ]; then
		echo "ERROR: POSTGRES_PASSWORD must be set in environment or mikro.env file"
		echo "Create a mikro.env file with: POSTGRES_PASSWORD=your_secure_password"
		exit 1
	fi
}

function check_dependencies() {
	if [ ! -f "$(which brew)" ]; then
		echo "We need brew ( go to https://brew.sh/ to get it )"
	fi
	echo "We are now installing python (with pip), postgres, postgis, and geos from homebrew"
	brew install python postgres postgis geos || echo "We couldn't install all the dependencies. Issues may occur."
}

function database_setup() {
	export PGDATA="${DATABASE_DIR}"
	# IMPORTANT TODO REMOVE
	if [ -d "${PGDATA}" ] && [ ${DEBUG} -gt 0 ]; then
		rm -rf "${PGDATA}"
	fi

	if [ ! -d "${PGDATA}" ]; then
		mkdir -p "${PGDATA}"
		initdb "${PGDATA}"
		pg_ctl -D "${PGDATA}" -l logfile start
		createdb "${POSTGRES_DB}"
		createdb "$(whoami)"
		local commands=("CREATE USER \"${POSTGRES_USER}\" PASSWORD '${POSTGRES_PASSWORD}';"
				"CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"
				"\\c \"${POSTGRES_DB}\";"
				"CREATE EXTENSION postgis;")
		for command in "${commands[@]}"; do
			psql --dbname="${POSTGRES_DB}" --command="${command}" || echo "${command} didn't work"
		done
		export mikro_DB="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ENDPOINT}/${POSTGRES_DB}"
	else
		pg_ctl -D "${PGDATA}" -l logfile start
		export mikro_DB="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_ENDPOINT}/${POSTGRES_DB}"
	fi
	setup_python
	flask db upgrade
	#python3 manage.py db upgrade
}

function database_shutdown() {
	pg_ctl -D "${PGDATA}" stop -s -m fast
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
	FLASK_ENV=development flask run
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
