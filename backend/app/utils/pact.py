from flask import current_app as app
import requests

from app.utils.response import get_error_response, get_success_response

def send_req(post_cmd):
    return_data = {}

    # send data to pact url
    try:
        res = requests.post(app.config['PACT_SEND_URL'], json=post_cmd)
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
            return_data = get_success_response(result['result']['data']) 
            return_data['tx_id'] = result['txId']
        else:
            return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

    except Exception as e:
        app.logger.error(e)
        return_data = get_error_response('network error')

    app.logger.debug('return data: {}'.format(return_data))
    return return_data

def local_req(local_cmd):
    return_data = {}

    # send data to pact url
    try:
        res = requests.post(app.config['PACT_LOCAL_URL'], json=local_cmd)
        result = res.json()

        # pack return_data
        if result['result']['status'] == 'success':
            return_data = get_success_response(result['result']['data']) 
        else:
            return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

    except Exception as e:
        app.logger.error(e)
        return_data = get_error_response('network error')

    app.logger.debug('return data: {}'.format(return_data))
    return return_data