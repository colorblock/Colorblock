from flask import Blueprint, request, session, current_app as app
import json

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
        app.logger.debug(session)

    return result
