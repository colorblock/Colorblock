# for windows
$env:FLASK_APP = "run.py"  
$env:FLASK_ENV = "development"
python -m flask run

# for unix
export FLASK_APP=run.py
export FLASK_ENV=development
flask run --host=0.0.0.0