import json, datetime
from flask import request
from flask_limiter.util import get_remote_address
from bson.objectid import ObjectId
from chalicelib.api import accounts

def get_user(required = True):
  headers = request.headers
  if not headers.get('Authorization') and required:
    raise errors.Unauthorized('This resource requires authentication')
  if headers.get('Authorization'):
    user = accounts.get_user_context(headers.get('Authorization').replace('Bearer ', ''))
    if user is None and required:
      raise errors.Unauthorized('Invalid token')
    return user
  return None

def limit_by_client():
  data = request.get_json()
  if data:
    if data.get('email'): return data.get('email')
    if data.get('token'): return data.get('token')
  return get_remote_address()

def limit_by_user():
  user = get_user(required = False)
  return user['_id'] if user else get_remote_address()

def filter_keys(obj, allowed_keys):
  filtered = {}
  for key in allowed_keys:
    if key in obj:
      filtered[key] = obj[key]
  return filtered

def build_updater(obj, allowed_keys):
  if not obj: return {}
  allowed = filter_keys(obj, allowed_keys)
  updater = {}
  for key in allowed:
    if not allowed[key]:
      if '$unset' not in updater: updater['$unset'] = {}
      updater['$unset'][key] = ''
    else:
      if '$set' not in updater: updater['$set'] = {}
      updater['$set'][key] = allowed[key]
  return updater

class MongoJsonEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
      return obj.isoformat()
    elif isinstance(obj, ObjectId):
      return str(obj)
    return json.JSONEncoder.default(self, obj)

def jsonify(*args, **kwargs):
  return json.dumps(dict(*args, **kwargs), cls=MongoJsonEncoder)
