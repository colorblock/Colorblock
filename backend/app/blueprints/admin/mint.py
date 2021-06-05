from flask import Blueprint, request, current_app as app
from PIL import Image
import json
import copy
import time

from app.utils.security import admin_required
from app.utils.render import hex_to_rgba, rgba_to_hex
from app.utils.crypto import hash_id
from app.utils.pact import build_unsigned_send_cmd, get_accounts, get_module_names

mint_blueprint = Blueprint('mint', __name__)

@mint_blueprint.route('/', methods=['POST'])
@admin_required
def mint_item():
    # generate many new images from genesis colorblock
    f = open('instance/gredients.txt', 'r')
    text = f.read()
    f.close()

    # constant
    green = (64, 224, 208)
    orange = (254, 140, 0)
    red = (255, 0, 128)

    text = text.replace('name', '"name"').replace('colors', '"colors"')
    app.logger.debug(text)
    gredients = json.loads(text)
    app.logger.debug(gredients)
    for gredient in gredients:
        # create rgba list
        name = gredient['name']
        colors = gredient['colors']
        rgb_list = []
        for color in colors:
            app.logger.debug(color)
            if len(color) == 7:
                rgba = tuple(hex_to_rgba(color))
                rgb = rgba[:3]
                rgb_list.append(rgb)
        
        if len(rgb_list) <= 1:
            continue
        app.logger.debug(rgb_list)
        rgb_list = rgb_list[:3]
        rgba_count = len(rgb_list)
        if rgba_count == 2:
            middle = tuple((rgb_list[0][i] + rgb_list[1][i]) // 2 for i in range(3))
            rgb_list = [rgb_list[0], middle, rgb_list[1]]

        # read image
        img_obj = Image.open('app/static/img/colorblock.gif')
        width = img_obj.width
        height = img_obj.height
        frames = img_obj.n_frames
        new_image_list = []
        rgba_list = []
        for i in range(frames):
            # transform
            img_obj.seek(i)
            new_img = copy.copy(img_obj)
            img_data = new_img.convert('RGB')
            for y in range(height):
                for x in range(width):
                    pixel = img_data.getpixel((x, y))
                    to_write = True
                    if pixel == green:
                        pixel = rgb_list[0]
                    elif pixel == orange:
                        pixel = rgb_list[1]
                    elif pixel == red:
                        pixel = rgb_list[2]
                    else:
                        to_write = False

                    if to_write:
                        img_data.putpixel((x, y), pixel)
                    rgba_list.append(pixel)
            
            new_image_list.append(img_data)

        # write image
        title = '{}-in-{}'.format('colorblock', name)
        first_img = new_image_list[0]
        if frames == 1:
            first_img.save('app/static/img/colorblock/{}.png'.format(title))
        else:
            intervals = [200 for v in range(frames)]
            first_img.save('app/static/img/colorblock/{}.gif'.format(title), save_all=True, append_images=new_image_list[1:], duration=intervals, loop=0)
        
        # constants
        modules = get_module_names()
        accounts = get_accounts()

        # write cmd
        colors = ''.join([rgba_to_hex(rgba)[1:] for rgba in rgba_list])
        item_id = hash_id(colors)
        supply = 2.0
        cmd_config = {
            'public_key': app.config['COLORBLOCK_CUTE']['public'],
            'capabilities': [
                {
                    'name': '{}.MINT'.format(modules['colorblock']),
                    'args': [item_id, '=COLOR=BLOCK=', supply]
                }, 
                {
                    'name': modules['colorblock-gas-payer'],
                    'args': ['hi', {'int': 1}, 1.0]
                }
            ],
            'gas_limit': 50000,
            'gas_price': 1 / 10 ** 12,
            'sender': accounts['gas-payer'],
        }
        data = {
            'id': item_id,
            'title': title,
            'colors': colors,
            'rows': height,
            'cols': width,
            'frames': frames,
            'intervals': [v/1000 for v in intervals],
            'supply': supply,
            'account': app.config['COLORBLOCK_CUTE']['address'],
            'accountKeyset': {
                'keys': [app.config['COLORBLOCK_CUTE']['public']],
                'pred': 'keys-all',
            },
        }
        code = '(free.colorblock-test.create-item (read-msg "id") (read-msg "title") (read-msg "colors") (read-integer "rows") (read-integer "cols") (read-integer "frames") (read-msg "intervals") (read-msg "account")  (read-msg "supply") (read-keyset "accountKeyset"))'
        output_path = 'app/static/yaml/{}.yaml'.format(title)
        build_unsigned_send_cmd(code, pact_data=data, cmd_config=cmd_config, output_path=output_path)

        app.logger.debug('{} finished'.format(title))
        time.sleep(0.2)

    return 'all finished'

