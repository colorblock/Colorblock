from PIL import Image, ImageDraw

def generate_image_from_item(item_data):
    cells = item_data['cells']
    rows = item_data['rows']
    cols = item_data['cols']
    frames = item_data['frames']
    intervals = item_data['intervals']
    id = item_data['id']

    unit = 100
    width = unit * cols
    height = unit * rows

    img_list = []
    for frame_index in range(frames):
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)
        frame_size = rows * cols * 6
        partial_cells = cells[frame_size * frame_index: frame_size * (frame_index + 1)]

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
                color = '#{}'.format(partial_cells[start: end])

                draw.rectangle(size, fill=color)

        img_list.append(img)

    first_img = img_list[0]
    if frames == 1:
        first_img.save('static/img/{}.png'.format(id))
    else:
        intervals = [v * 1000 for v in intervals]
        first_img.save('static/img/{}.gif'.format(id), save_all=True, append_images=img_list[1:], duration=intervals, loop=0)
