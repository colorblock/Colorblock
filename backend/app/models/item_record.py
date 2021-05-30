from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class Item_record(db.Model):
    id: str
    item_id: str
    user_id: str
    block_height: int
    block_hash: str
    tx_hash: str
    tx_id: int
    created_at: str
    updated_at: str

    id = db.Column(db.String(), primary_key=True)
    item_id = db.Column(db.String())
    user_id = db.Column(db.String())
    block_height = db.Column(db.Integer())
    block_hash = db.Column(db.String())
    tx_hash = db.Column(db.String())
    tx_id = db.Column(db.Integer())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Item_record {}>'.format(self.id)