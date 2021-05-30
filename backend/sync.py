# This script has the duty of sync data between colorblock database and chainweb

import requests
import time

class SyncBot:

    def run(self):
        url = 'http://localhost:5000/sync'
        while True:
            requests(url)
            time.sleep(1)
            

if __name__ == '__main__':
    bot = SyncBot()
    bot.run()