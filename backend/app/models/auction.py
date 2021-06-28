from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue
from app import db

@dataclass
class Auction(db.Model):
    id: str
    item_id: str
    user_id: int
    starting_price: float
    increment: float
    reserve_price: float
    quantity: int
    deposit: float
    start_time: str
    end_time: str
    hammer_price: float
    winner: str
    status: int
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    item_id = db.Column(db.String)
    user_id = db.Column(db.Integer)
    starting_price = db.Column(db.Numeric)
    increment = db.Column(db.Numeric)
    reserve_price = db.Column(db.Numeric)
    quantity = db.Column(db.Integer)
    deposit = db.Column(db.Numeric)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    hammer_price = db.Column(db.Numeric)
    winner = db.Column(db.String)
    status = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Auction {}>'.format(self.id)