from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Transfer(db.Model):
    
    __tablename__ = 'transfer'

    id: int
    chain_id: int
    block_height: int
    block_hash: str
    block_time: str
    tx_id: int
    tx_hash: str
    tx_status: str
    item_id: str
    sender: str
    receiver: str
    amount: int
    created_at: str
    updated_at: str

    id = db.Column(db.Integer, primary_key=True)
    chain_id = db.Column(db.Integer)
    block_height = db.Column(db.Integer)
    block_hash = db.Column(db.String)
    block_time = db.Column(db.DateTime)
    tx_id = db.Column(db.Integer)
    tx_hash = db.Column(db.String)
    tx_status = db.Column(db.String)
    item_id = db.Column(db.String)
    sender = db.Column(db.String)
    receiver = db.Column(db.String)
    amount = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Item {}>'.format(self.title)
