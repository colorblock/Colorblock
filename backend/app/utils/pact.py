from flask import current_app as app
import requests

def send_req(post_data):
    return_data = {}

    # send data to pact url
    try:
        res = requests.post(app.config['PACT_SEND_URL'], json=post_data)
        app.logger.debug('SEND response text: {}'.format(res.text))

        # extract request key
        request_key_data = res.json()
        request_key = request_key_data['requestKeys'][0]
        app.logger.debug('request key: {}'.format(request_key))

        # fetch result for request key
        res = requests.post(app.config['PACT_POLL_URL'], json=request_key_data)
        app.logger.debug('POLL response text: {}'.format(res.text))

        # extract result
        result = res.json()[request_key]
        app.logger.debug('result: {}'.format(result))

        # pack return_data
        if result['result']['status'] == 'success':
            return_data = {
                'status': 'success',
                'data': result['result']['data'],
                'tx_id': result['txId']
            }
        else:
            return_data = {
                'status': 'failure',
                'data': result['result']['error']['message'],
                'tx_id': None
            }

    except Exception as e:
        app.logger.error(e)
        return_data = {
            'status': 'error',
            'data': 'network error',
            'tx_id': None
        }

    app.logger.debug('return data: {}'.format(return_data))
    return return_data