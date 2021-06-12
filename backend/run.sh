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
export PACT_MODULE_TEST = 1
flask run --host=0.0.0.0