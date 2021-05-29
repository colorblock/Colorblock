from flask import Blueprint, request, current_app as app
import requests
import json
from app import db
from app.models.user import User

security_blueprint = Blueprint('security', __name__)

@security_blueprint.route('/login', methods=['POST'])
def login():
    post_data = request.json
    account = post_data['account']
    local_cmd = post_data['cmds'][0]

    app.logger.debug(local_cmd)
    code = json.loads(local_cmd['cmd'])['payload']['exec']['code']
    verfiy_code = '(free.colorblock.validate-guard "{}")'.format(account)
    app.logger.debug(code)
    app.logger.debug(verfiy_code)
    app.logger.debug(verfiy_code == code)

    url = '{}/api/v1/local'.format(app.config['PACT_URL'])
    res = requests.post(url, json=local_cmd)
    data = res.json()['result']
    
    app.logger.debug(data)

    result = {
        'status': 'failure'
    }

    
    if data['status'] == 'success':
        result['status'] = 'success'
    
    return result