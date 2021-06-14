from flask import Blueprint, request, session, current_app as app
import json

from app import db
from app.models.user import User
from app.utils.response import get_error_response, get_success_response
from app.utils.pact import local_req, get_module_names
from app.utils.crypto import random
from app.utils.security import admin_required, login_required

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login_status', methods=['POST'])
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
    module_name = get_module_names()['colorblock']
    verfiy_code = '({}.validate-guard "{}")'.format(module_name, account)
    app.logger.debug('code: {}, verify_code: {}'.format(code, verfiy_code))
    if verfiy_code != code:
        return get_error_response('account and code is not matched')

    # set session
    result = local_req(local_cmd)
    if result['status'] == 'success':
        session['account'] = account
        session['logged_in'] = True
        app.logger.debug('after login, session = {}'.format(session))
        user = db.session.query(User).filter(User.id == account).first()
        if not user:
            return signup(account)
    elif 'row not found' in result['data']:
        result['data'] = 'Please make sure that the wallet assets are not empty'

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

@auth_blueprint.route('/logout', methods=['POST'])
@login_required
def logout():
    session['account'] = None
    session['logged_in'] = False
    return get_success_response('logout successfully')

@auth_blueprint.route('/login_admin/<seed>', methods=['GET'])
def login_admin(seed):
    file_path = app.config['ADMIN_SEED_PATH']
    f = open(file_path, 'r')
    check_seed = f.read()
    f.close()
    if seed == check_seed:
        session['logged_as_admin'] = True
        # clear seed
        f = open(file_path, 'w')
        f.write('')
        f.close()
        return get_success_response('login as admin successfully')
    else:
        return get_error_response('admin seed does not matched')

@auth_blueprint.route('/admin_status', methods=['GET'])
def admin_status():
    if session.get('logged_as_admin'):
        return get_success_response('yes')
    else:
        return get_error_response('not logged')

@auth_blueprint.route('/logout_admin', methods=['GET'])
@admin_required
def logout_admin():
    session['logged_as_admin'] = False
    return 'admin logged out'

@auth_blueprint.route('/admin_seed', methods=['GET'])
def admin_seed():
    seed = random()
    file_path = app.config['ADMIN_SEED_PATH']
    f = open(file_path, 'w')
    f.write(seed)
    f.close()
    return 'seed is generated'
