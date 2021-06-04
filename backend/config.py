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
PIXEL_FILETYPES = ['jpg', 'png', 'gif', 'svg', 'bmp']
ADMIN_SEED_PATH = ''  # for auth
ITEM_DATA_PATH = ''   # for item upload manually

# chainweb
CHAINWEB = {
    'HOST': 'https://api.chainweb.com',
    'NETWORK': 'mainnet01',
    'CHAIN_ID': '0'
}

# url
PACT_SEND_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/send'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])
PACT_POLL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/poll'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])
PACT_LOCAL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/local'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])

# item
ITEM_MIN_SUPPLY = 1
ITEM_MAX_SUPPLY = 9999