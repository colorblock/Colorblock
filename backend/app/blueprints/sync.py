from flask import Blueprint, request, current_app as app, jsonify
from datetime import datetime
import json
import time

from app import db
from app.models.block import Block
from app.utils.pact import local_req, build_local_cmd
from app.utils.chainweb import fetch_latest_block, fetch_previous_blocks, fetch_payloads

sync_blueprint = Blueprint('sync', __name__)

@sync_blueprint.route('/sync/<chain_id>')
def sync_block(chain_id):
    # fetch latest block
    latest_block = fetch_latest_block(chain_id)
    app.logger.debug('latest block: {}'.format(latest_block))

    # loop and verify each previous unverified block
    height_step = 40
    current_block_height = latest_block['height']
    current_block_hash = latest_block['hash']
    while True:
        # confirm whether there're unverified blocks
        verified_blocks = db.session.query(Block).filter((Block.block_height <= current_block_height) & (Block.block_height > current_block_height - height_step) & (Block.verified == True)).all()
        if len(verified_blocks) == height_step:
            # if all verified, then skip
            current_block_height -= height_step
            continue
        if current_block_height < app.config['START_HEIGHT']:
            # if less than START_HEIGHT
            break

        # fetch previous blocks
        previous_blocks = fetch_previous_blocks(current_block_hash, limit=height_step)
        app.logger.debug(previous_blocks)

        # fetch previous txs
        for block in previous_blocks:
            block['payload_hash'] = block['payloadHash']
        payloads = fetch_payloads(previous_blocks)
        app.logger.debug(payloads)

        # loop over payloads and verify each payload
        for payload in payloads:
            db_block = db.session.query(Block).filter(Block.hash == payload['hash']).first()
            if db_block and db_block.verified:
                app.logger.debug('block {} is verified'.format(payload['height']))
                continue
            else:
                # check whether tx contains colorblock
                if (app.config['ENV'] == 'production'):
                    outputs = [v for v in payload['outputs'] if 'colorblock' in v['module']['name']]
                else:
                    outputs = payload['outputs']
                app.logger.debug(outputs)
                is_verified = False
                if outputs == []:
                    is_verified = True
                else:
                    # loop each tx log and update latest data into colorblock db
                    tx_ids = [v['txId'] for v in outputs]
                    pact_data = {
                        'tx-ids': tx_ids
                    }
                    pact_code = '(free.colorblock-market.all-txlogs (read-msg "tx-ids"))'
                    local_cmd = build_local_cmd(pact_code, pact_data)
                    app.logger.debug(json.dumps(local_cmd))
                    data = local_req(local_cmd)
                    app.logger.debug(data)

                    is_verified = True

                if is_verified:
                    block = Block(
                        hash=payload['hash'],
                        chain_id=chain_id,
                        block_height=payload['height'],
                        block_time=datetime.fromtimestamp(payload['creationTime'] // 10 ** 6),
                        verified=True
                    )
                    db.session.add(block)
                    db.session.commit()
                    app.logger.debug('insert into db.block')

        time.sleep(2)
        sorted_blocks = sorted(previous_blocks, key=lambda x: x['height'])
        current_block_height = sorted_blocks[0]['height']
        current_block_hash = sorted_blocks[0]['hash']
        app.logger.debug('current block height: {}, hash: {}'.format(current_block_height, current_block_hash))

    return 'end of sync'



def update_ledger(item_id, user_id):
    pact_code = '(free.colorblock.details "{}:{}")'.format(item_id, user_id)
    local_cmd = build_local_cmd(pact_code)
    data = local_req(local_cmd)
    app.logger.debug(data)