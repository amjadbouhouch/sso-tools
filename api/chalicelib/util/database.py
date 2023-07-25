import os
from pymongo import MongoClient

db = None

def get_db():
  global db
  if not db:
    db = MongoClient(os.environ.get('MONGO_URL'))[os.environ.get('MONGO_DATABASE')]
  return db
