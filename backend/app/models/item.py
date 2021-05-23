from app import db

class Item(db.Model):
    id = db.Column(db.String(32), primary_key=True)
    title = db.Column(db.String(64))
    tags = db.Column(db.String(64))
    description = db.Column(db.String(1000))
    creator = db.Column(db.String(64))
    owner = db.Column(db.String(64))

    def __repr__(self) -> str:
        return '<Item {}>'.format(self.title)