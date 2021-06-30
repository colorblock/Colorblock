from flask import current_app as app
import os
import copy
import numpy as np
from PIL import Image, ImageDraw
import tinify

def generate_image_from_item(item_data):
    colors = item_data['colors']
    rows = item_data['rows']
    cols = item_data['cols']
    frames = item_data['frames']
    intervals = item_data['intervals']
    item_id = item_data['itemId']

    unit = max(int(100 / cols), 1)
    width = unit * cols
    height = unit * rows

    img_list = []
    for frame_index in range(frames):
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)
        frame_size = rows * cols * 6
        partial_colors = colors[frame_size * frame_index: frame_size * (frame_index + 1)]

        for i in range(rows):
            index = i * cols * 6
            for j in range(cols):
                x0 = unit * j
                y0 = unit * i
                x1 = unit * (j + 1)
                y1 = unit * (i + 1)
                size = [x0, y0, x1, y1]

                start = j * 6 + index
                end = (j + 1) * 6 + index
                color = '#{}'.format(partial_colors[start: end])

                draw.rectangle(size, fill=color)

        img_list.append(img)

    first_img = img_list[0]
    if frames == 1:
        file_path = 'app/static/img/{}.png'.format(item_id)
        first_img.save(file_path)
    else:
        app.logger.debug(intervals)
        for index, v in enumerate(intervals):
            if type(v) == dict:
                intervals[index] = float(v['decimal'])
        intervals = [v * 1000 for v in intervals]
        file_path = 'app/static/img/{}.gif'.format(item_id)
        first_img.save(file_path, save_all=True, append_images=img_list[1:], duration=intervals, loop=0)

    return file_path

def hex_to_rgba(hex):
    h = hex.lstrip('#')
    return [int(h[i:i+2], 16) for i in (0, 2, 4)] + [1]

def rgba_to_hex(rgba):
    return '#' + ''.join(f'{i:02X}' for i in rgba[:3])

def generate_pixels_from_image(file_path, max_width=64, image_id=''):
    save_path = os.path.abspath(file_path)
    img_obj = Image.open(file_path)
    compressed = []
    try:
        frames = img_obj.n_frames
    except:
        frames = 1
    static = frames == 1
    intervals = []
    paths = []
    for i in range(frames):
        img_obj.seek(i)
        if not static:
            intervals.append(img_obj.info['duration'])
        image = np.array(img_obj)
        image_height = image.shape[0]
        image_width = image.shape[1]
        if image_width < max_width:
            compressed.append(copy.copy(img_obj))
        else:
            new_img = copy.copy(img_obj)
            path = 'app/static/img/tmp/{}-{}.png'.format(image_id, i)
            new_img.save(path)
            tinify.key = app.config['TINIFY_KEY']
            source = tinify.from_file(path)
            optimized_path = 'app/static/img/tmp/optimized-{}-{}.png'.format(image_id, i)
            resized = source.resize(
                method='scale',
                width=max_width
            )
            resized.to_file(optimized_path)
            new_img = Image.open(optimized_path)
            compressed.append(new_img)
            paths.append(path)
            paths.append(optimized_path)
            
    if frames == 1:
        compressed[0].save(file_path)
    else:
        compressed[0].save(file_path, save_all=True, append_images=compressed[1:], duration=intervals, loop=0)

    for img in compressed:
        img.close()
    for path in paths:
        # remove tmp files
        os.remove(path)
        
    return save_path
