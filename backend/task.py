# This script has the duty of sync data between colorblock database and chainweb

import requests
import time
from datetime import datetime

import config as settings

class TaskBot:

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

    def admin_status(self):
        url = 'http://localhost:5000/admin_status'
        res = self.s.get(url)
        result = res.json()
        print(result)
        return result['status'] == 'success'

    def run(self):
        while True:
            print('now start sync, dt = {}'.format(datetime.now()))
            url = 'http://localhost:5000/routine/sync/0'
            try:
                res = self.s.post(url)
                print(res.text)
            except Exception as e:
                print(e)

            time.sleep(60)

    def generate_images(self):
        url = 'http://localhost:5000/routine/generate_images'
        res = self.s.post(url)
        print(res.text)

    def mint(self):
        url = 'http://localhost:5000/mint'
        res = self.s.post(url)
        print(res.text)

    def index(self):
        url = 'http://localhost:5000/routine/msearch/update/item'
        res = self.s.post(url)
        print(res.text)
        url = 'http://localhost:5000/routine/msearch/update/user'
        res = self.s.post(url)
        print(res.text)

    def migrate(self):
        url = 'http://localhost:5000/routine/migrate'
        res = self.s.post(url)

    def update(self):
        item_id = 'EH4zibPsYeAoeZU6gsmi77'
        user_id = 'colormaster'
        combined_asset_id = '{}:{}'.format(item_id, user_id)
        description = "Generated from https://avatars.dicebear.com/"
        url = 'http://localhost:5000/routine/update/item'
        res = self.s.post(url, json={
            'item_id': item_id,
            'item_info': {
                'description': description
            }
        })
        print(res.text)

        url = 'http://localhost:5000/routine/update/asset'
        res = self.s.post(url, json={
            'combined_asset_id': combined_asset_id,
        })
        print(res.text)


if __name__ == '__main__':
    bot = TaskBot()
    if not bot.admin_status():
        print('now login as admin')
        bot.login_as_admin()
    else:
        print('admin logged successfully')
    #bot.run()
    #bot.mint()
    #bot.index()
    #bot.generate_images()
    #bot.migrate()
    bot.update()
