from datetime import datetime
from nacl.encoding import HexEncoder
import requests
import hashlib
import base64
import codecs
import nacl.bindings
import json

def hash_bin(s):
    """
    Perform blake2b256 hashing.
    """
    h = hashlib.blake2b(digest_size=32)
    h.update(s.encode('utf-8'))
    hex = h.hexdigest()
    return hex_to_bin(hex)


def hex_to_bin(h):
    """
    Convert hex string to binary.

    #Parameters:
    #   s (str): hex string
    
    #Returns
    #   str: binary value
    """

    if isinstance(h, str):
        h = h.encode('utf-8')
    return HexEncoder.decode(h)
 

def bin_to_hex(s):
    """
    Convert binary to hex.

    #Parameters:
    #   s (str): binary value

    #   str: hex string
    """

    if isinstance(s, str):
        s = s.encode('utf-8')
    return HexEncoder.encode(s)


def base64_url_to_hex(b):
    return base64.urlsafe_b64decode(b + '==').hex()


def hex_to_base64_url(hex):
    base = codecs.encode(codecs.decode(hex, 'hex'), 'base64').decode()
    url = base.split('=')[0].replace('+', '-').replace('/', '_')
    return url


def b64url_encode_arr(input):
    return hex_to_base64_url(bin_to_hex(input))
 
def mk_cap(role, description, name, args=[]):
    """
    Prepares a capability object to be signed with keyPairs using signing API.

    #Parameters
    #   role (str): role of the pact capability
    #   description (str): description of the pact capability
    #   name (str): name of pact capability to be signed
    #   args (list): array of arguments used in pact capability, default to empty list

    #Returns
    #   dict: A properly formatted cap object required in signingCmd
    """

    assert isinstance(role, str)
    assert isinstance(description, str)
    assert isinstance(name, str)
    assert isinstance(args, list)

    return {
        'role': role,
        'description': description,
        'cap': {
            'name': name,
            'args': args,
        },
    }

def mk_meta(sender, chain_id, gas_price, gas_limit, creation_time, ttl):
    """
    Prepare a chainweb-style public meta payload.

    #Parameters:
    #   sender (str): gas account
    #   chain_id (str): chain identifier
    #   gas_price (float/int): desired gas price
    #   gas_limit (float/int): desired gas limit
    #   creation_time (float/int): desired tx's time created in UNIX epoch time as seconds
    #   ttl (float/int): desired tx's time to live as seconds
    
    #Returns:
    #   dict: arguments, type-checked and properly named.
    """

    assert isinstance(sender, str)
    assert isinstance(chain_id, str)
    assert isinstance(gas_price, (float, int))
    assert isinstance(gas_limit, (float, int))
    assert isinstance(creation_time, (float, int))
    assert isinstance(ttl, (float, int))

    return {
        'creationTime': creation_time,
        'ttl': ttl,
        'gasLimit': gas_limit,
        'chainId': chain_id,
        'gasPrice': gas_price,
        'sender': sender,
    }


def mk_signer(kp):
    """
    Make an ED25519 "signer" array element for inclusion in a Pact payload.

    #Parameters:
    #    kp (dict): a ED25519 keypair and/or clist (list of `cap` in mk_cap)

    #Returns:
    #   dict: an object with pubKey, addr and scheme fields.
    """

    if kp.get('clist'):
        return {
            'clist': as_array(kp['clist']),
            'pubKey': kp['public_key'],
        }
    else:
        return {
            'pubKey': kp['public_key'],
        }


def attach_sig(msg, kp_array):
    """
    Attach signature to hashed data

    #Parameters:
    #   msg (str): some data to be passed to blake2b256
    #   key_pair (dict): signing ED25519 keypair

    #Returns:
    #   dict: "hash", "sig" (signature in hex format), and "public_key" public key values.
    """

    hsh_bin = hash_bin(msg)
    hsh = b64url_encode_arr(hsh_bin)
    if len(kp_array) == 0:
        return [{
            'hash': hsh, 
            'sig': None,
        }]
    else:
        return list(map(lambda kp: sign(msg, kp) if kp.get('public_key') and kp.get('secret_key') else {
            'hash': hsh,
            'sig': None,
            'public_key': kp['public_key'],
        }, kp_array))
 

def to_tweet_nacl_secret_key(key_pair):
    if not key_pair.get('public_key') or not key_pair.get('secret_key'):
        raise TypeError("Invalid Key_pair: expected to find keys of name 'secret_key' and 'public_key': {}".format(json.dumps(key_pair)))

    return hex_to_bin(key_pair['secret_key'] + key_pair['public_key'])


def as_array(single_or_list):
    if isinstance(single_or_list, list):
        return single_or_list
    else:
        return [single_or_list]


def sign(msg, key_pair):
    """
    Sign data using key pair.
    
    #Parameters:
    #   msg (str): some data to be passed to blake2b256
    #   key_pairs (dict): signing ED25519 keypair

    #Returns:
    #   dict: "hash", "sig" (signature in hex format), and "pubKey" public key value
    """

    if not key_pair.get('public_key') or not key_pair.get('secret_key'):
        raise TypeError("Invalid key_pair: expected to find keys of name 'secret_key' and 'public_key': {}".format(json.dumps(key_pair)))

    hsh_bin = hash_bin(msg)
    hsh = b64url_encode_arr(hsh_bin)
    signing_key = to_tweet_nacl_secret_key(key_pair)
    raw_signed = nacl.bindings.crypto_sign(hsh_bin, signing_key)

    crypto_sign_BYTES = nacl.bindings.crypto_sign_BYTES
    signature = bin_to_hex(raw_signed[:crypto_sign_BYTES])

    return {
        'hash': hsh, 
        'sig': signature.decode('utf-8'), 
        'public_key': key_pair['public_key'] 
    }


def prepare_exec_cmd(pact_code, env_data, key_pairs=[], nonce=datetime.now().isoformat(), meta=mk_meta('','',0,0,0,0), network_id=None):
    """
    Prepare an ExecMsg pact command for use in send or local execution.
    To use in send, wrap result with 'mkSingleCommand'.
    
    #Parameters:
    #    keyPairs (list or dict): array or single ED25519 keypair and/or clist (list of `cap` in mkCap)
    #    nonce (str): nonce value for ensuring unique hash - default to current time
    #    pactCode (str): pact code to execute - required
    #    envData (dict): JSON of data in command - not required
    #    meta (dict): public meta information, see mk_meta
    
    #Returns:
    #    dict: valid pact API command for send or local use.
    """

    assert isinstance(nonce, str)
    assert isinstance(pact_code, str)
    assert isinstance(key_pairs, list)

    kp_array = as_array(key_pairs)
    signers = list(map(mk_signer, kp_array))
    cmd_json = {
        'networkId': network_id,
        'payload': {
            'exec': {
                'data': env_data or {},
                'code': pact_code,
            }
        },
        'signers': signers,
        'meta': meta,
        'nonce': nonce,
    }
    print(cmd_json)
    cmd = json.dumps(cmd_json)
    print(cmd)

    sigs = attach_sig(cmd, kp_array)
    return mk_single_cmd(sigs, cmd)


def pull_sig(s):
    if not s.get('sig'):
        raise TypeError("Expected to find keys of name 'sig' in {}".format(json.dumps(s)))

    return {
        'sig': s['sig']
    }
 

def pull_and_check_hashs(sigs):
    hsh = sigs[0]['hash']
    for sig in sigs:
        if sig['hash'] != hsh:
            raise Exception("Sigs for different hashes found: {}".format(json.dumps(sigs)))

    return hsh


def mk_single_cmd(sigs, cmd):
    """
    Makes a single command given signed data.

    #Parameters
    #   sigs (list): array of signature objects, see 'sign'
    #   cmd (str): stringified JSON blob used to create hash

    #Returns
    #   dict: valid Pact API command for send or local use.
    """

    assert isinstance(sigs, list)
    assert isinstance(cmd, str)

    return {
        'hash': pull_and_check_hashs(sigs),
        'sigs': list(map(pull_sig, filter(lambda sig: sig['sig'], sigs))),
        'cmd': cmd,
    }


def verify(hash, sigs, public_key):
    msg = base64_url_to_hex(hash)
    smessage = hex_to_bin(sigs + msg)
    msg_bin = nacl.bindings.crypto_sign_open(smessage, hex_to_bin(public_key))
    msg_result = bin_to_hex(msg_bin).decode('utf-8')
    return msg == msg_result


def parse_res(res):
    """
    Parses raw response from server into JSON or TEXT
    """

    if res.ok:
        return res.json()
    else:
        return res.text


def send_signed(signed_cmd, api_host):
    """
    Sends a signed Pact ExecCmd to a running Pact server and retrieves tx result.

    #Parameters
    #   signed_cmd (dict): valid pact API command for send or local use
    #   api_host (str): apiHost host running Pact server

    #Returns
    #   dict: Request key of the tx received from pact server
    """

    cmd = {
        'cmds': [ signed_cmd ]
    }
    res = requests.post('{}/api/v1/send'.format(api_host), json=cmd)
    return parse_res(res)


def fetch_listen(listen_cmd, api_host):
    """
    Listen for result of Pact command on a Pact server and retrieve tx result.

    #Parameters
    #   listen_cmd (dict): reqest key of tx to listen
    #   api_host (str): host running Pact server

    #Returns
    #   dict: Object containing tx result from pact server
    """

    res = requests.post('{}/api/v1/listen'.format(api_host), json=listen_cmd)
    return parse_res(res)

def fetch_local(local_cmd, api_host):
    """
    Sends Local Pact command to a local Pact server and retrieves local tx result.

    # Parameters
    #   local_cmd (dict): a single cmd to execute locally
    #   api_host (str): host running Pact server

    #Returns
    #   dict: tx result received from pact server
    """
    
    res = fetch_local_raw(local_cmd, api_host)
    return parse_res(res)

def fetch_local_raw(local_cmd, api_host):
    """
    Sends Local Pact command to a local Pact server and retrieves raw response.

    # Parameters
    #   local_cmd (dict): a single cmd to execute locally
    #   api_host (str): host running Pact server

    #Returns
    #   res: Raw Response from Pact Server
    """

    if not api_host:
        raise Exception('Pact.fetch.local(): No apiHost provided')

    key_pairs = local_cmd.get('key_pairs')
    nonce = local_cmd.get('nonce')
    pact_code = local_cmd.get('pact_code')
    env_data = local_cmd.get('env_data')
    meta = local_cmd.get('meta')
    network_id = local_cmd.get('network_id')

    cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, nonce, meta, network_id)
    res = requests.post('{}/api/v1/local'.format(api_host), json=cmd)
    return res

