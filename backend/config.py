# mysql settings
DATABASE = {
    'HOSTNAME': 'example.com',
    'PORT': '3306',
    'DATABASE': 'example_db',
    'USERNAME': 'root',
    'PASSWORD': 'mypassword'
}
MSEARCH_INDEX_NAME = 'instance/msearch'
MSEARCH_BACKEND = 'whoosh'

# app
SECRET_KEY = ''
ADMIN_KEY = ''
CORS_ORIGINS = [
    'http://localhost:3000', 
    'http://colorblockart.com:3000',
    'https://colorblock.art:3000'
]
START_HEIGHT = None

# chainweb
CHAINWEB = {
    'HOST': 'https://api.chainweb.com',
    'NETWORK': 'mainnet01',
    'CHAIN_ID': '0'
}

# url
PACT_URL = 'http://api.colorblockart.com'
PACT_SEND_URL = '{}/api/v1/send'.format(PACT_URL)
PACT_POLL_URL = '{}/api/v1/poll'.format(PACT_URL)
PACT_LOCAL_URL = '{}/api/v1/local'.format(PACT_URL)

# item
ITEM_MIN_SUPPLY = 1
ITEM_MAX_SUPPLY = 9999