def get_error_response(message):
    return {
        'status': 'error',
        'message': message
    }

def get_success_response(message):
    return {
        'status': 'success',
        'message': message
    }