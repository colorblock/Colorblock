# mysql settings
HOSTNAME = 'example.com'
PORT = '3306'
DATABASE = 'example_db'
USERNAME = 'root'
PASSWORD = 'mypassword'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# app
SECRET_KEY = ''
CORS_ORIGINS = [
    'http://localhost:3000', 
    'http://colorblockart.com:3000',
    'https://colorblock.art:3000'
]

# url
PACT_URL = 'http://api.colorblockart.com'
PACT_SEND_URL = '{}/api/v1/send'.format(PACT_URL)
PACT_POLL_URL = '{}/api/v1/poll'.format(PACT_URL)
PACT_LOCAL_URL = '{}/api/v1/local'.format(PACT_URL)

# item
ITEM_MIN_SUPPLY = 1
ITEM_MAX_SUPPLY = 9999