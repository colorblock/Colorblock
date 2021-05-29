from flask import Blueprint, request, session, current_app as app
import json

from flask.helpers import url_for

from app import db
from app.models.user import User
from app.utils.response import get_error_response, get_success_response
from app.utils.pact import local_req

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login_status', methods=['GET'])
def login_status():
    if session.get('logged_in'):
        return get_success_response(session['account'])
    else:
        return get_error_response('not logged')

@auth_blueprint.route('/login', methods=['POST'])
def login():
    post_data = request.json
    account = post_data['account']
    local_cmd = post_data['cmds'][0]
    app.logger.debug('account: {}, local_cmd: {}'.format(account, local_cmd))

    # validate code
    code = json.loads(local_cmd['cmd'])['payload']['exec']['code']
    verfiy_code = '(free.colorblock.validate-guard "{}")'.format(account)
    app.logger.debug('code: {}, verify_code: {}'.format(code, verfiy_code))
    if verfiy_code != code:
        return get_error_response('account and code is not matched')

    # set session
    result = local_req(local_cmd)
    if result['status'] == 'success':
        session['account'] = account
        session['logged_in'] = True
        user = db.session.query(User).filter(User.id == account).first()
        if not user:
            return signup(account)

    return result

def signup(account):
    try:
        user = User(
            id=account,
            address=account
        )
        db.session.add(user)
        db.session.commit()
        return get_success_response('signup successfully')
    except Exception as e:
        app.logger.exception(e)
        return get_error_response('db error: {}'.format(e))