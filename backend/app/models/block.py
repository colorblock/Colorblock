from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class Block(db.Model):
    hash: str
    chain_id: int
    block_height: int
    block_time: str
    verified: bool
    created_at: str
    updated_at: str

    hash = db.Column(db.String(), primary_key=True)
    chain_id = db.Column(db.Integer())
    block_height = db.Column(db.Integer())
    block_time = db.Column(db.DateTime())
    verified = db.Column(db.Boolean())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Block {}>'.format(self.hash)