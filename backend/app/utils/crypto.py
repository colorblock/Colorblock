from flask import current_app as app
from hashlib import blake2b
from datetime import datetime
import base64
import codecs
import shortuuid

def hash_id(key):
    return shortuuid.uuid(key)

def hash_item_id(key):
    prefix = app.config['ITEM_ID_PREFIX']
    return prefix + shortuuid.uuid(key)

def check_hash(key, id):
    return hash_id(key) == id

def check_item_hash(key, id):
    return hash_item_id(key) == id

def random():
    return shortuuid.uuid()

def base64_to_string(b):
    return base64.urlsafe_b64decode(b + '==').decode('utf-8')

def hex_to_base64_url(hex):
    base = codecs.encode(codecs.decode(hex, 'hex'), 'base64').decode()
    url = base.split('=')[0].replace('+', '-').replace('/', '_')
    return url