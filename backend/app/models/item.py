from app import db
from sqlalchemy.sql import func

class Item(db.Model):
    id = db.Column(db.String(), primary_key=True)
    title = db.Column(db.String())
    tags = db.Column(db.String())
    description = db.Column(db.String())
    creator = db.Column(db.String())
    owner = db.Column(db.String())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Item {}>'.format(self.title)