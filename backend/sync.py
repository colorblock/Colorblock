# This script has the duty of sync data between colorblock database and chainweb

import requests
import time

import instance.config as settings

class SyncBot:

    def __init__(self):
        self.s = requests.Session()

    def login_as_admin(self):
        url = 'http://localhost:5000/login_admin'
        data = {
            'admin_key': settings.ADMIN_KEY
        }
        res = self.s.post(url, json=data)
        print(res.text)

    def check_admin_status(self):
        url = 'http://localhost:5000/admin_status'
        res = self.s.get(url)
        return res.json()['status'] == 'success'

    def run(self):
        url = 'http://localhost:5000/routine/sync/0'
        res = self.s.post(url)
        print(res.text)
            

if __name__ == '__main__':
    bot = SyncBot()
    bot.login_as_admin()
    print('admin logged successfully')
    bot.run()