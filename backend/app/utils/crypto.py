from hashlib import blake2b
import base64
import codecs

def hash_id(input_str):
    h = blake2b(digest_size=8)
    input_bytes = str.encode(input_str)
    h.update(input_bytes)
    return h.hexdigest()

def check_hash(input_str, id):
    return hash_id(input_str) == id

def base64_to_string(b):
    return base64.b64decode(b + '==').decode('utf-8')

def hex_to_base64_url(hex):
    base = codecs.encode(codecs.decode(hex, 'hex'), 'base64').decode()
    url = base.split('=')[0].replace('+', '-').replace('/', '_')
    return url