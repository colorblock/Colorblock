def get_error_response(message):
    return {
        'status': 'error',
        'data': message
    }

def get_success_response(data):
    return {
        'status': 'success',
        'data': data
    }