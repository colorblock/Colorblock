from flask import Blueprint, request, current_app as app, jsonify
from datetime import datetime
import json
import time

from app import db, search
from app.models.item import Item
from app.models.user import User
from app.models.ledger import Ledger
from app.models.transfer import Transfer
from app.models.block import Block
from app.utils.crypto import hash_id
from app.utils.pact import local_req, build_local_cmd
from app.utils.security import admin_required
from app.utils.chainweb import fetch_latest_block, fetch_previous_blocks, fetch_payloads

routine_blueprint = Blueprint('routine', __name__)

@routine_blueprint.route('/sync/<chain_id>', methods=['POST'])
@admin_required
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
                # block info
                block_hash = payload['hash']
                block_height = payload['height'],
                block_time = datetime.fromtimestamp(payload['creationTime'] // 10 ** 6)

                # handle events
                for output in payload['outputs']:
                    # tx info
                    tx_id = output['txId']
                    tx_hash = output['reqKey']
                    tx_status = output['result']['status']

                    events = output['events']
                    for event in events:
                        module_name = '{}.{}'.format(event['module']['namesapce'], event['module']['name'])
                        # check whether tx contains colorblock
                        if module_name in ('free.colorblock', 'free.colorblock-market'):
                            # create id combined with tx_hash and event
                            combined_info = 'tx_hash: {}, event: {}'.format(tx_hash, event)
                            event_id = hash_id(combined_info)

                            event_name = event['name']
                            if event_name == 'TRANSFER':
                                (item_id, sender, receiver, amount) = event['params']
                                amount = int(amount)
                                transfer = Transfer(
                                    id=event_id,
                                    chain_id=chain_id,
                                    block_hash=block_hash,
                                    block_height=block_height,
                                    block_time=block_time,
                                    tx_id=tx_id,
                                    tx_hash=tx_hash,
                                    tx_status=tx_status,
                                    item_id=item_id,
                                    sender=sender,
                                    receiver=receiver,
                                    amount=amount
                                )
                                db.session.add(transfer)
                                db.session.commit()
                    
                outputs = [v for v in payload['outputs'] if v and 'colorblock' in v['module']['name']]
                app.logger.debug(outputs)

                if outputs != []:
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
    ledger_id = '{}:{}'.format(item_id, user_id)
    pact_code = '(free.colorblock.details "{}")'.format(ledger_id)
    local_cmd = build_local_cmd(pact_code)
    data = local_req(local_cmd)
    app.logger.debug(data)
    balance = data['balance']
    ledger = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()
    if ledger:
        ledger.balance = balance
        db.session.commit()
    else:
        ledger = Ledger(
            id=ledger_id,
            item_id=item_id,
            user_id=user_id,
            balance=balance
        )
        db.session.add()
        db.session.commit()


# use this task to update existing data
@routine_blueprint.route('/msearch/update/item', methods=['POST'])
@admin_required
def update_item_index():
    search.create_index(Item, update=True)

@routine_blueprint.route('/msearch/update/user', methods=['POST'])
@admin_required
def update_user_index():
    search.create_index(User, update=True)