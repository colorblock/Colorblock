# This script has the duty of sync data between colorblock database and chainweb

import requests
import time

import instance.config as settings

class SyncBot:

    def __init__(self):
        self.s = requests.Session()

    def login_as_admin(self):
        url = 'http://localhost:5000/admin_seed'
        res = self.s.get(url)
        file_path = settings.ADMIN_SEED_PATH
        f = open(file_path, 'r')
        seed = f.read()
        f.close()
        url = 'http://localhost:5000/login_admin/{}'.format(seed)
        res = self.s.get(url)
        print(res.text)

    def run(self):
        url = 'http://localhost:5000/routine/sync/0'
        res = self.s.post(url)
        print(res.text)
            

if __name__ == '__main__':
    bot = SyncBot()
    bot.login_as_admin()
    print('admin logged successfully')
    bot.run()