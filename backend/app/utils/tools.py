from datetime import datetime
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
