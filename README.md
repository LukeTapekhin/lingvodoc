LingvoDoc project
==================

This project is dedicated to natural languages and dialects documentation. It's the continuation of Dialeqt project
(which was written in C++/QT5/Pure SQL).
LingvoDoc is intended to provide natural language documentation service as Web-service and provides REST API and
ajax-based client application.


Dependancies
---------------

- pyramid (framework)

- sqlalchemy (ORM)


Running the project for development
---------------

- Create virtual python environment for Python (3.3+ recommended; 2.7+ should work too but is not tested)

- Declare env variable for your virtual environment: export VENV=<path to your virtual environment>

- cd <directory containing this file>

- $VENV/bin/python setup.py develop

- $VENV/bin/initialize_lingvodoc_db development.ini

- $VENV/bin/pserve development.ini

API documentation
---------------

/client_id
/version
/channel
/sync
/words
/word
/paradigms
/paradigm
/dictionaries
/dictionary (contains words, paradigms, corpus set etc)
/authors
/sound
/markup
