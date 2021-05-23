from hashlib import blake2b

def hash_id(input_str):
    h = blake2b(digest_size=8)
    input_bytes = str.encode(input_str)
    h.update(input_bytes)
    return h.hexdigest()

def check_hash(input_str, id):
    return hash_id(input_str) == id