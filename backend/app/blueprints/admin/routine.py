from math import log
from flask import Blueprint, request, current_app as app, jsonify
from datetime import datetime
import json
import time
import os

from app import db, search
from app.models.item import Item
from app.models.user import User
from app.models.ledger import Ledger
from app.models.deal import Deal
from app.models.transfer import Transfer
from app.models.mint import Mint
from app.models.block import Block
from app.utils.crypto import hash_id
from app.utils.render import generate_image_from_item
from app.utils.pact import local_req, build_local_cmd
from app.utils.security import admin_required
from app.utils.chainweb import fetch_latest_block, fetch_previous_blocks, fetch_payloads
from app.utils.tools import get_datetime_from_timestamp

routine_blueprint = Blueprint('routine', __name__)

@routine_blueprint.route('/sync/<chain_id>', methods=['POST'])
@admin_required
def sync_block(chain_id):
    # fetch latest block
    latest_block = fetch_latest_block(chain_id)
    app.logger.debug('latest block: {}'.format(latest_block))

    # constants
    module_name_dict = get_module_names()
    module_name_list = list(module_name_dict.values())
    
    # loop and verify each previous unverified block
    height_step = 50
    current_block_height = latest_block['height']
    current_block_hash = latest_block['hash']
    while True:
        if current_block_height < app.config['START_HEIGHT']:
            # if less than START_HEIGHT, then job is finished
            break
        # confirm whether there're unverified blocks
        fetched_blocks = db.session.query(Block).filter(Block.block_height <= current_block_height, Block.block_height > current_block_height - height_step).all()
        fetched_block_hashes = [v.hash for v in fetched_blocks]
        verified_blocks = [v for v in fetched_blocks if v.verified == True]
        app.logger.debug('fetched_blocks len: {}, verified_blocks len: {}'.format(len(fetched_blocks), len(verified_blocks)))
        if len(verified_blocks) == height_step:
            # if all verified, then skip
            sorted_blocks = sorted(fetched_blocks, key=lambda x: x.block_height)
            current_block_height = sorted_blocks[0].block_height
            current_block_hash = sorted_blocks[0].hash
            app.logger.debug('all blocks verified, ready for next turn, current block height: {}, hash: {}'.format(current_block_height, current_block_hash))

            continue

        # fetch previous blocks
        previous_blocks = fetch_previous_blocks(current_block_hash, limit=height_step)
        
        # fetch previous txs
        for block in previous_blocks:
            block['payload_hash'] = block['payloadHash']
        payloads = fetch_payloads(previous_blocks)

        # loop over payloads and verify each payload
        for payload in payloads:
            if payload['height'] < app.config['START_HEIGHT']:
                continue

            db_block = db.session.query(Block).filter(Block.hash == payload['hash']).first()
            if db_block and db_block.verified:
                app.logger.debug('block {} is verified, skip'.format(payload['height']))
                continue
            else:
                # block info
                block_hash = payload['hash']
                block_height = payload['height'],
                block_time = get_datetime_from_timestamp(payload['creationTime'])
                relevant = False

                # handle events
                to_varify_input_indexes = []
                for index, output in enumerate(payload['outputs']):
                    # tx info
                    tx_id = output['txId']
                    tx_hash = output['reqKey']
                    tx_status = output['result']['status']
                    meta_data = {
                        'chain_id': chain_id,
                        'block_hash': block_hash,
                        'block_height': block_height,
                        'block_time': block_time,
                        'tx_id': tx_id,
                        'tx_hash': tx_hash,
                        'tx_status': tx_status,
                    }

                    if 'colorblock' in json.dumps(output):
                        app.logger.debug('output: {}'.format(output))
                        if tx_status == 'success':
                            to_varify_input_indexes.append(index)

                    events = output.get('events', [])
                    for event in events:
                        module_name = '{}.{}'.format(event['module']['namespace'], event['module']['name'])
                        # check whether tx contains colorblock
                        if module_name in module_name_list:
                            # create id combined with tx_hash and event
                            combined_info = 'tx_hash: {}, event: {}'.format(tx_hash, event)
                            event['event_id'] = hash_id(combined_info)

                            event_name = event['name']
                            item_id = event['params'][0]
                            if event_name == 'TRANSFER':
                                update_transfer(meta_data, event)
                            elif event_name == 'MINT':
                                update_mint(meta_data, event)
                                if tx_status == 'success':
                                    update_item(item_id)
                            elif event_name == 'RELEASE':
                                (item_id, seller, price, amount) = event['params']
                                update_release(item_id, seller, price, amount)
                            elif event_name == 'RECALL':
                                (item_id, seller) = event['params']
                                update_recall(item_id)
                            elif event_name == 'PURCHASE':
                                (item_id, buyer, sender, price, amount) = event['params']
                                update_purchase(item_id, buyer, sender, price, amount)
                    
                filtered_tx_ids = []
                for index, input in enumerate(payload['inputs']):
                    if index in to_varify_input_indexes:
                        app.logger.debug('input: {}, index: {}'.format(input, index))
                        relevant = True
                        tx_id = payload['outputs'][index]['txId']
                        filtered_tx_ids.append(tx_id)

                if filtered_tx_ids != []:
                    # loop each tx log and update latest data into colorblock db
                    pact_data = {
                        'tx-ids': filtered_tx_ids
                    }
                    pact_code = '({}.all-txlogs (read-msg "tx-ids"))'.format(module_name_dict['colorblock-market'])
                    local_cmd = build_local_cmd(pact_code, pact_data)
                    app.logger.debug(json.dumps(local_cmd))
                    result = local_req(local_cmd)
                    data = result['data']
                    for record in data:
                        for ledger_id in record['ledger']:
                            update_ledger(ledger_id)
                        for deal_id in record['deals']:
                            update_deal(deal_id)

                hash = payload['hash']
                if hash in fetched_block_hashes:
                    block = fetched_blocks[fetched_block_hashes.index(hash)]
                    block.verified = True
                else:
                    block = Block(
                        hash=payload['hash'],
                        chain_id=chain_id,
                        block_height=payload['height'],
                        block_time=get_datetime_from_timestamp(payload['creationTime']),
                        relevant=relevant,
                        verified=True
                    )
                    db.session.add(block)

        # commit to blockchain
        db.session.commit()
        app.logger.debug('insert into db.block')

        # ready for next round
        time.sleep(10)
        sorted_blocks = sorted(previous_blocks, key=lambda x: x['height'])
        current_block_height = sorted_blocks[0]['height']
        current_block_hash = sorted_blocks[0]['hash']
        app.logger.debug('finished, current block height: {}, hash: {}'.format(current_block_height, current_block_hash))

    return 'end of sync'

def get_module_names():
    mode = app.config['mode']
    modules = app.config['MODULES']
    return modules[mode]

def update_ledger(ledger_id):
    app.logger.debug('now update ledger: {}'.format(ledger_id))
    (item_id, user_id) = ledger_id.split(':')
    pact_code = '({}.details "{}" "{}")'.format(get_module_names()['colorblock'], item_id, user_id)
    local_cmd = build_local_cmd(pact_code)
    result = local_req(local_cmd)
    data = result['data']
    asset_id = hash_id(ledger_id)
    balance = data['balance']
    ledger = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()
    app.logger.debug('before modification, ledger = {}'.format(ledger))
    if ledger:
        ledger.balance = balance
        db.session.commit()
    else:
        ledger = Ledger(
            id=ledger_id,
            asset_id=asset_id,
            item_id=item_id,
            user_id=user_id,
            balance=balance
        )
        db.session.add(ledger)
        db.session.commit()
    app.logger.debug('after modification, ledger = {}'.format(ledger))

def update_deal(deal_id):
    app.logger.debug('now update deal: {}'.format(deal_id))
    pact_code = '({}.deal-details "{}")'.format(get_module_names()['colorblock-market'], deal_id)
    local_cmd = build_local_cmd(pact_code)
    result = local_req(local_cmd)
    data = result['data']
    app.logger.debug(data)
    (item_id, user_id) = deal_id.split(':')
    price = data['price']
    total_amount = data['total']
    remain_amount = data['remain']
    open = data['open']
    deal = db.session.query(Deal).filter(Deal.id == deal_id).first()
    app.logger.debug('before modification, deal = {}'.format(deal))
    if deal:
        deal.price = price
        deal.total = total_amount
        deal.remain = remain_amount
        deal.open = open
        db.session.commit()
    else:
        deal = Deal(
            id=deal_id,
            item_id=item_id,
            user_id=user_id,
            price=price,
            total=total_amount,
            remain=remain_amount,
            open=open
        )
        db.session.add(deal)
        db.session.commit()
    app.logger.debug('after modification, deal = {}'.format(deal))

def update_item(item_id):        
    item = db.session.query(Item).filter(Item.id == item_id).first()
    if item:
        return

    app.logger.debug('now update item: {}'.format(item_id))
    pact_code = '({}.item-details "{}")'.format(get_module_names()['colorblock'], item_id)
    local_cmd = build_local_cmd(pact_code)
    result = local_req(local_cmd)
    app.logger.debug(result)
    if result['status'] != 'success':
        return result
    
    item_data = result['data']
    item_data['frames'] = item_data['frames']['int']
    item_data['cols'] = item_data['cols']['int']
    item_data['rows'] = item_data['rows']['int']
    item_data['id'] = item_id
    item_type = 1 if item_data['frames'] > 1 else 0

    # add into db
    item = Item(
        id=item_id,
        title=item_data['title'],
        type=item_type,
        creator=item_data['creator'],
        supply=item_data['supply']
    )
    db.session.add(item)
    db.session.commit()

    # save image
    file_type = 'gif' if item.type == 1 else 'png'
    file_path = 'app/static/img/{}.{}'.format(item.id, file_type)
    if not os.path.exists(file_path):
        generate_image_from_item(item_data)

def update_transfer(meta_data, event):
    (item_id, sender, receiver, amount) = event['params']
    amount = int(amount)
    transfer_id = event['event_id']
            
    transfer = db.session.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        transfer = Transfer(
            id=transfer_id,
            chain_id=meta_data['chain_id'],
            block_hash=meta_data['block_hash'],
            block_height=meta_data['block_height'],
            block_time=meta_data['block_time'],
            tx_id=meta_data['tx_id'],
            tx_hash=meta_data['tx_hash'],
            tx_status=meta_data['tx_status'],
            item_id=item_id,
            sender=sender,
            receiver=receiver,
            amount=amount
        )
        db.session.add(transfer)
        db.session.commit()

def update_mint(meta_data, event):
    app.logger.debug('now update mint, {}, {}'.format(meta_data, event))
    (item_id, user_id, supply) = event['params']
    supply = int(supply)
    mint_id = event['event_id']
            
    mint = db.session.query(Mint).filter(Mint.id == mint_id).first()
    if not mint:
        mint = Mint(
            id=mint_id,
            chain_id=meta_data['chain_id'],
            block_hash=meta_data['block_hash'],
            block_height=meta_data['block_height'],
            block_time=meta_data['block_time'],
            tx_id=meta_data['tx_id'],
            tx_hash=meta_data['tx_hash'],
            tx_status=meta_data['tx_status'],
            item_id=item_id,
            user_id=user_id,
            supply=supply
        )
        db.session.add(mint)
        db.session.commit()

def update_release(item_id, seller, price, amount):
    pass

def update_recall(item_id, seller):
    pass

def update_purchase(item_id, buyer, seller, price, amount):
    pass



# use this task to update existing data
@routine_blueprint.route('/msearch/update/item', methods=['POST'])
@admin_required
def update_item_index():
    search.create_index(Item, update=True)

@routine_blueprint.route('/msearch/update/user', methods=['POST'])
@admin_required
def update_user_index():
    search.create_index(User, update=True)