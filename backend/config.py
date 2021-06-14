# mysql settings
DATABASE = {
    'HOSTNAME': {
        'local': 'localhost',
        'dev': 'localhost',
        'prod': 'localhost',
    },
    'PORT': '3306',
    'DATABASE': 'example_db',
    'USERNAME': 'root',
    'PASSWORD': 'mypassword'
}
MSEARCH_INDEX_NAME = 'instance/msearch'
MSEARCH_BACKEND = 'whoosh'

# app
SECRET_KEY = ''
CORS_ORIGINS = [
    'http://localhost:3000'
]
PIXEL_FILETYPES = ['jpg', 'png', 'gif', 'svg', 'bmp']
ADMIN_SEED_PATH = 'instance/seed.txt'  # for auth
ITEM_DATA_PATH = 'instance/item.txt'   # for item upload manually
TINIFY_KEY = ''

LOG_FILE_PATH = 'instance/app.log'

# chainweb
CHAINWEB = {
    'HOST': 'https://api.chainweb.com',
    'NETWORK': 'mainnet01',
    'CHAIN_ID': '0'
}
COLORBLOCK_CUTE = {
    'address': '=COLOR=BLOCK=',
    'public': 'b5401dffe11c55d07261fb99bc9974974874ff667f6100b27fc135eb6f3bc2b2'
}
START_HEIGHT = 1674433

# pact
PACT_SEND_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/send'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])
PACT_POLL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/poll'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])
PACT_LISTEN_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/listen'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])
PACT_LOCAL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/local'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK'], CHAINWEB['CHAIN_ID'])

MODULES = {
    'test': {
        'colorblock': 'free.colorblock-test',
        'colorblock-market': 'free.colorblock-market-test',
        'colorblock-gas-payer': 'free.colorblock-gas-station-test.GAS_PAYER',
    },
    'prod': {
        'colorblock': 'free.colorblock',
        'colorblock-market': 'free.colorblock-market',
        'colorblock-gas-payer': 'free.colorblock-gas-station.GAS_PAYER',
    },
}
ACCOUNTS = {
    'test': {
        'gas-payer': 'colorblock-gas-payer-test',
        'market-pool': 'colorblock-market-pool-test',
    },
    'prod': {
        'gas-payer': 'colorblock-gas-payer',
        'market-pool': 'colorblock-market-pool',
    },
}

# item
ITEM_MIN_SUPPLY = 1
ITEM_MAX_SUPPLY = 9999
ITEM_MAX_TITLE_LENGTH = 32
ITEM_MAX_DESCRIPTION_LENGTH = 3000
