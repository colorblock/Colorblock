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
    'NETWORK_ID': 'mainnet01',
    'TTL': 600,
    'GAS_LIMIT': 150000,
    'GAS_PRICE': 1 / 10 ** 12,
    'CHAIN_ID': '7',
}
COLORBLOCK_CUTE = {
    'address': '=COLOR=BLOCK=',
    'public': 'b5401dffe11c55d07261fb99bc9974974874ff667f6100b27fc135eb6f3bc2b2'
}
START_HEIGHT = 1674433

# pact
RETRY_TIMES = 5

API_HOST = '{}/chainweb/0.0/{}/chain/{}/pact'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK_ID'], CHAINWEB['CHAIN_ID'])
PACT_SEND_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/send'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK_ID'], CHAINWEB['CHAIN_ID'])
PACT_POLL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/poll'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK_ID'], CHAINWEB['CHAIN_ID'])
PACT_LISTEN_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/listen'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK_ID'], CHAINWEB['CHAIN_ID'])
PACT_LOCAL_URL = '{}/chainweb/0.0/{}/chain/{}/pact/api/v1/local'.format(CHAINWEB['HOST'], CHAINWEB['NETWORK_ID'], CHAINWEB['CHAIN_ID'])

MODULES = {
    'test': {
        'colorblock': 'free.colorblock-test',
        'colorblock-market': 'free.colorblock-market-test',
        'colorblock-gas-payer': 'free.colorblock-gas-station-test',
    },
    'prod': {
        'colorblock': 'free.colorblock',
        'colorblock-market': 'free.colorblock-market',
        'colorblock-gas-payer': 'free.colorblock-gas-station',
    },
}
ACCOUNTS = {
    'test': {
        'gas-payer': 'colorblock-gas-payer-test',
        'market-pool': 'colorblock-market-pool-test',
        'verifier': 'colorblock-official-verifier',
    },
    'prod': {
        'gas-payer': 'colorblock-gas-payer',
        'market-pool': 'colorblock-market-pool',
        'verifier': 'colorblock-official-verifier',
    },
}

# item
ITEM_ID_PREFIX = 'CB'
ITEM_MIN_SUPPLY = 1
ITEM_MAX_SUPPLY = 9999
ITEM_MAX_TITLE_LENGTH = 64
ITEM_MAX_DESCRIPTION_LENGTH = 3000
ITEM_MIN_FRAME_COLS = 2
ITEM_MIN_FRAME_ROWS = 2
