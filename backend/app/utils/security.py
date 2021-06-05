from flask import session, current_app as app
from functools import wraps
from app.utils.response import get_error_response, get_success_response

def login_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if session.get('logged_in'):
            return function(*args, **kwargs)
        else:
            return get_error_response('not logged')
    return wrapper

def admin_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if session.get('logged_as_admin'):
            return function(*args, **kwargs)
        else:
            return get_error_response('not admin')
    return wrapper

def validate_account(account):
    if account == session.get('account'):
        return get_success_response('account matched')
    else:
        return get_error_response('account is not matched, please login first')