## DEV ##
# for windows
$env:FLASK_APP = "run.py"
$env:FLASK_ENV = "development"
# if pact module is in test
$env:PACT_MODULE_TEST = 1
python -m flask run

# for unix
export FLASK_APP=run.py
export FLASK_ENV=development
# if pact module is in test
export PACT_MODULE_TEST=1
flask run --host=0.0.0.0


## PRODUCTION & MODULE TEST ##
gunicorn run:app --workers=2 --bind 0.0.0.0:5000 -e PACT_MODULE_TEST=1 --log-file instance/app.log --log-level DEBUG --reload --worker-class gevent

## PRODUCTION & MODULE PROD ##
gunicorn run:app --workers=2 --bind 0.0.0.0:5000 -e PACT_MODULE_TEST=0 --log-file instance/app.log --log-level DEBUG --reload --worker-class gevent
