from flask import jsonify
from datetime import datetime
import time
import math

def get_datetime_from_timestamp(ts, utc=True):
    ts = int(ts)
    digit_len = math.floor(math.log10(ts))
    if digit_len == 12:
        ts = ts // pow(10, 3)
    elif digit_len == 15:
        ts = ts // pow(10, 6)

    if utc:
        return datetime.utcfromtimestamp(ts)
    else:
        return datetime.fromtimestamp(ts)

def jsonify_data(data):
    return jsonify(data).json

def current_timestamp():
    return int(time.time())

def current_utc_string():
    return datetime.utcnow().isoformat()[:-3]+'Z'

def dt_from_ts(ts):
    if len(str(ts)) == 16 and ts == int(ts):
        ts = ts // 10 ** 3 / 10 ** 3
    elif len(str(ts)) == 13 and ts == int(ts):
        ts = ts / 10 ** 3
    return datetime.utcfromtimestamp(ts)