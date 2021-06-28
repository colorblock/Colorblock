from flask import Blueprint, request, session, current_app as app
import json

from app import db
from app.models.user import User
from app.utils.pact_lang_api import b64url_encode_arr, base64_url_to_hex, fetch_local, hash_bin, mk_meta, verify
from app.utils.response import get_error_response, get_success_response
from app.utils.pact import local_req, get_module_names
from app.utils.crypto import random
from app.utils.security import admin_required, login_required

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/login_status', methods=['POST'])
def login_status():
    if session.get('logged_in'):
        return get_success_response(session['address'])
    else:
        return get_error_response('not logged')

@auth_blueprint.route('/login', methods=['POST'])
def login():
    post_data = request.json
    address = post_data['address']
    app.logger.debug('address: {}, post_data: {}'.format(address, post_data))

    # validate code
    pact_code = '(coin.details "{}")'.format(address)
    cmd = {
        'pact_code': pact_code,
        'env_data': {},
        'key_pairs': [],
        'nonce': '',
        'meta': mk_meta('','',0.1,1000,0,0),
        'network_id': app.config['CHAINWEB']['NETWORK_ID']
    }
    result = fetch_local(cmd, app.config['API_HOST'])['result']
    
    if result['status'] == 'success':
        public_key = result['data']['guard']['keys'][0]
        if public_key != post_data['public_key']:
            app.logger.debug('address and public key is not matched, {}'.format(result))
            return get_error_response('address and public key is not matched')
        
        sigs_data = post_data['sigs']
        sigs = sigs_data['sigs'][0]['sig']
        hash = sigs_data['hash']
        hashed_key = b64url_encode_arr(hash_bin(public_key))
        if hash != hashed_key:
            app.logger.debug('hash and public key is not matched, {}, {}'.format(hash, public_key))
            return get_error_response('hash and public key is not matched')

        if verify(hash, sigs, public_key):
            user = db.session.query(User).filter(User.address == address).first()
            if not user:
                id = random()
                result = signup(id, address, public_key)
            else:
                id = user.id
                result = get_success_response('login successfully')

            session['user_id'] = id
            session['address'] = address
            session['public_key'] = public_key
            session['logged_in'] = True
            app.logger.debug('after login, session = {}'.format(session))
        else:
            app.logger.debug('sigs and public key is not matched, {}, {}'.format(sigs, public_key))
            return get_error_response('sigs and public key is not matched')

    elif 'row not found' in result['data']:
        result['data'] = 'Wallet is not registered'

    return result

def signup(id, address, public_key):
    try:
        user = User(
            id=id,
            address=address,
            public_key=public_key
        )
        db.session.add(user)
        db.session.commit()
        return get_success_response('signup successfully')
    except Exception as e:
        app.logger.exception(e)
        return get_error_response('db error: {}'.format(e))

@auth_blueprint.route('/logout', methods=['POST'])
def logout():
    session['address'] = None
    session['public_key'] = None
    session['logged_in'] = False
    app.logger.debug('after logout, session = {}'.format(session))
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
