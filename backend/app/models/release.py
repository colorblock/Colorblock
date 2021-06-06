from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Release(db.Model):

    id: int
    chain_id: int
    block_height: int
    block_hash: str
    block_time: str
    tx_id: int
    tx_hash: str
    tx_status: str
    item_id: str
    seller: str
    price: float
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
    seller = db.Column(db.String)
    price = db.Column(db.Numeric)
    amount = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Release {}>'.format(self.id)
