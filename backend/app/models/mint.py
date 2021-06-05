from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Mint(db.Model):
    
    __tablename__ = 'mint'

    id: int
    chain_id: int
    block_height: int
    block_hash: str
    block_time: str
    tx_id: int
    tx_hash: str
    tx_status: str
    item_id: str
    user_id: str
    supply: int
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
    user_id = db.Column(db.String)
    supply = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Mint {}>'.format(self.id)
