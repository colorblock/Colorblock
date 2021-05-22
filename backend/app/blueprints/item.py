from flask import Blueprint, request, current_app as app
import requests
import time

item_blueprint = Blueprint('item', __name__)

@item_blueprint.route('/', methods=['GET'])
def get_item():
    app.logger.debug('123')
    return 'asd'

@item_blueprint.route('/', methods=['POST'])
def submit_item():
    data = request.json
    url = '{}/api/v1/send'.format(app.config['PACT_URL'])
    try:
        res = requests.post(url, json=data)
        request_key_data = res.json()
        request_key = request_key_data['requestKeys'][0]

        time.sleep(1)

        url = '{}/api/v1/poll'.format(app.config['PACT_URL'])
        res = requests.post(url, json=request_key_data)
        result = res.json()[request_key]['result']
        
        app.logger.debug(result)
        if result['status'] == 'success':
            return 'success'
        else:
            return ''
    except Exception as e:
        app.logger.error(e)
        return 'network error'