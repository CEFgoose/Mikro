#!/usr/bin/env bash

TOP_DIR="$(git rev-parse --show-toplevel)"
GIT_DIR="${TOP_DIR}/.git"
HOOKS_DIR="${GIT_DIR}/hooks"
PRE_COMMIT="${HOOKS_DIR}/pre-commit"

if [ ! -f "${PRE_COMMIT}" ]; then
    if [ -f "${PRE_COMMIT}.sample" ]; then
        cp "${PRE_COMMIT}.sample" "${PRE_COMMIT}"
    else
        echo "#!/bin/sh" > "${PRE_COMMIT}"
    fi
fi

BAD_LAST_LINE="exec git diff-index --check --cached \$against --"
LAST_LINE="$(tail -n1 "${PRE_COMMIT}")"
if [ "${LAST_LINE}" ==  "${BAD_LAST_LINE}" ]; then
    sed -i '' -e '$ d' "${PRE_COMMIT}"
    sed -i '' -e '$ d' "${PRE_COMMIT}"
fi

cat >>"${PRE_COMMIT}" << EOL
# Prettier for javascript files
FILES=\$(git diff --cached --name-only --diff-filter=ACMR "*.js" "*.jsx" | sed 's| |\\\\ |g')
if [ ! -z "\${FILES}" ]; then
    # Prettify all selected files
    echo "\${FILES}" | xargs ./front-end/viewer/node_modules/.bin/prettier --write
    if [ \$? -ne 0 ]; then exit 1; fi

    # Add back the modified/prettified files to staging
    echo "\${FILES}" | xargs git add
    if [ \$? -ne 0 ]; then exit 1; fi
fi

# Black/flake8 for python files
FILES=\$(git diff --cached --name-only --diff-filter=ACMR "*.py" | sed 's| |\\\\ |g')
if [ ! -z "\${FILES}" ];then
    # Run black on all selected files
    echo "\${FILES}" | xargs black -l 79 --exclude venv
    if [ \$? -ne 0 ]; then exit 1; fi
    echo "\${FILES}" | xargs flake8 --exclude venv
    if [ \$? -ne 0 ]; then exit 1; fi

    # Add back the modified files to staging
    echo "\${FILES}" | xargs git add
    if [ \$? -ne 0 ]; then exit 1; fi
fi

EOL

if [ "${LAST_LINE}" == "${BAD_LAST_LINE}" ]; then
cat >>"${PRE_COMMIT}" << EOL
# If there are whitespace errors, print the offending file names and fail.
exec git diff-index --check --cached \$against --
EOL
fi
