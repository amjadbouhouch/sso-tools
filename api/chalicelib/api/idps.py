from uuid import uuid4
import bcrypt, re, random, string
from OpenSSL import crypto
import pymongo
from bson.objectid import ObjectId
from chalicelib.util import database, errors

forbidden_codes = ['', 'app', 'my', 'www', 'support', 'mail', 'email', 'dashboard', 'ssotools', 'myidp']

def create_self_signed_cert(name):
  # create a key pair
  k = crypto.PKey()
  k.generate_key(crypto.TYPE_RSA, 1024)

  # create a self-signed cert
  cert = crypto.X509()
  cert.get_subject().C = "GB"
  cert.get_subject().O = "SSO Tools"
  cert.get_subject().OU = name
  cert.gmtime_adj_notBefore(0)
  cert.gmtime_adj_notAfter(20*365*24*60*60)
  cert.set_issuer(cert.get_subject())
  cert.set_pubkey(k)
  cert.sign(k, 'sha256')
  dumped = crypto.dump_certificate(crypto.FILETYPE_PEM, cert)
  dumped_key = crypto.dump_privatekey(crypto.FILETYPE_PEM, k)
  return {'cert': dumped, 'key': dumped_key}

def can_manage_idp(user, idp):
  if not idp: return False
  if not user: return not idp.get('user')
  if user: return idp.get('user') == user['_id'] or not idp.get('user')

def create(user, data):
  db = database.get_db()
  if not data or not data.get('code') or not data.get('name'): return errors.BadRequest('Name and issuer are required')
  code = data.get('code').lower().strip()

  if not len(code) or code in forbidden_codes or db.idps.find_one({'code': code}):
    raise errors.BadRequest('The issuer is invalid or is already in use')
  if not re.match(r'^([a-zA-Z0-9\-_]+)$', code): raise errors.BadRequest('The IdP issuer is invalid. Please just use letters, numbers, hyphens, and underscores.')

  x509 = create_self_signed_cert(data['name'])
  idp = {
    'name': data.get('name'),
    'code': code,
    'saml': {
      'certificate': x509['cert'].decode('utf-8'),
      'privateKey': x509['key'].decode('utf-8')
    }
  }
  if user: idp['user'] = user['_id']
  result = db.idps.insert_one(idp)
  idp['_id'] = result.inserted_id

  create_user(user, idp['_id'], {'email': 'joe@example.com', 'firstName': 'Joe', 'lastName': 'Bloggs', 'password': 'password'})
  create_user(user, idp['_id'], {'email': 'jane@example.com', 'firstName': 'Jane', 'lastName': 'Doe', 'password': 'password'})
  create_attribute(user, idp['_id'], {'name': 'Group', 'defaultValue': 'staff', 'samlMapping': 'group'})

  return idp

def get(user, include):
  db = database.get_db()
  if include: include = list(map(lambda i: ObjectId(i), include.split(',')))
  else: include = []

  if user: query = {'$or': [{'user': user['_id']}, {'_id': {'$in': include}, 'user': {'$exists': False}}]}
  else: query = {'_id': {'$in': include}, 'user': {'$exists': False}}
  idps = list(db.idps.find(query, {'name': 1, 'code': 1}))
  return {'idps': idps}

def get_one(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: raise errors.NotFound('The IdP could not be found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t view this IdP')
  idp['users'] = list(db.idpUsers.find({'idp': idp['_id']}, {'firstName': 1, 'lastName': 1, 'email': 1}))
  return idp

def update(user, id, data):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t edit this IdP')

  if 'code' in data:
    code = data.get('code').lower().strip()
    if not len(code) or code in forbidden_codes or db.idps.find_one({'code': code, '_id': {'$ne': id}}):
      raise errors.BadRequest('This code is invalid or is already in use')
    if not re.match(r'^([a-zA-Z0-9\-_]+)$', code): raise errors.BadRequest('The IdP issuer is invalid. Please just use letters, numbers, hyphens, and underscores.')
  else: code = idp['code']
  update_data = {
    'name': data.get('name', idp['name']),
    'code': code
  }
  db.idps.update_one({'_id': id}, {'$set': update_data})
  return get_one(user, id)

def delete(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t delete this IdP')
  db.idps.remove({'_id': id })
  return {'deletedIDP': id}


#### SPs

def create_sp(user, id, data):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t manage this IdP')

  sp = {
    'name': data.get('name'),
    'type': 'saml',
    'entityId': data.get('entityId'),
    'serviceUrl': data.get('serviceUrl'),
    'callbackUrl': data.get('callbackUrl'),
    'logoutUrl': data.get('logoutUrl'),
    'logoutCallbackUrl': data.get('logoutCallbackUrl'),
    'oauth2ClientId': str(uuid4()),
    'oauth2ClientSecret': str(''.join(random.choices(string.ascii_uppercase + string.digits, k=32))),
    'oauth2RedirectUri': data.get('oauth2RedirectUri'),
    'idp': id
  }
  result = db.idpSps.insert_one(sp)
  sp['_id'] = result.inserted_id
  return sp

def update_sp(user, id, sp_id, data):
  id = ObjectId(id)
  sp_id = ObjectId(sp_id)
  db = database.get_db()
  existing = db.idpSps.find_one(sp_id)
  if not existing: return errors.NotFound('SP not found')
  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  update_data = {
    'name': data.get('name'),
    'entityId': data.get('entityId'),
    'serviceUrl': data.get('serviceUrl'),
    'callbackUrl': data.get('callbackUrl'),
    'logoutUrl': data.get('logoutUrl'),
    'logoutCallbackUrl': data.get('logoutCallbackUrl'),
    'oauth2RedirectUri': data.get('oauth2RedirectUri'),
  }
  db.idpSps.update({'_id': sp_id}, {'$set': update_data})
  return db.idpSps.find_one({'_id': sp_id}, {'name': 1, 'entityId': 1, 'serviceUrl': 1, 'callbackUrl': 1, 'logoutUrl': 1, 'logoutCallbackUrl': 1})

def get_sps(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  sps = list(db.idpSps.find({'idp': id}))
  return {'sps': sps}

def delete_sp(user, id, sp_id):
  id = ObjectId(id)
  sp_id = ObjectId(sp_id)
  db = database.get_db()

  existing = db.idpSps.find_one(sp_id)
  if not existing: return errors.NotFound('SP not found')

  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  db.idpSps.remove({'_id': sp_id})
  return {'deletedIDPSP': sp_id}


#### Users

def create_user(user, id, data):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  password = data['password']
  hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
  new_user = {
    'firstName': data.get('firstName'),
    'lastName': data.get('lastName'),
    'email': data['email'],
    'password': hashed_password,
    'attributes': data.get('attributes', {}),
    'idp': id
  }

  result = db.idpUsers.insert_one(new_user)
  new_user['_id'] = result.inserted_id
  del new_user['password']
  return new_user

def update_user(user, id, user_id, data):
  id = ObjectId(id)
  user_id = ObjectId(user_id)
  db = database.get_db()
  existing = db.idpUsers.find_one(user_id)
  if not existing: return errors.NotFound('User not found')
  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  update_data = {
    'firstName': data.get('firstName', existing.get('firstName')),
    'lastName': data.get('lastName', existing.get('lastName')),
    'email': data.get('email', existing.get('email')),
    'attributes': data.get('attributes', existing.get('attributes', {}))
  }
  if data.get('password'):
    hashed_password = bcrypt.hashpw(data['password'].encode("utf-8"), bcrypt.gensalt())
    update_data['password'] = hashed_password
  db.idpUsers.update({'_id': user_id}, {'$set': update_data})
  return db.idpUsers.find_one({'_id': user_id}, {'firstName': 1, 'lastName': 1, 'email': 1, 'attributes': 1})

def get_users(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t manage this IdP')

  users = list(db.idpUsers.find({'idp': id}, {'firstName': 1, 'lastName': 1, 'email': 1, 'attributes': 1}))
  return {'users': users}

def delete_user(user, id, user_id):
  id = ObjectId(id)
  user_id = ObjectId(user_id)
  db = database.get_db()
  existing = db.idpUsers.find_one(user_id)
  if not existing: return errors.NotFound('User not found')
  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  db.idpUsers.remove({'_id': user_id})
  return {'deletedUser': user_id}


#### Attributes

def create_attribute(user, id, data):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')
  if not data or 'name' not in data: return errors.BadRequest('Attribute name is required')

  new_attr = {
    'name': data.get('name'),
    'defaultValue': data.get('defaultValue'),
    'samlMapping': data.get('samlMapping'),
    'idp': id
  }

  result = db.idpAttributes.insert_one(new_attr)
  new_attr['_id'] = result.inserted_id
  return new_attr

def update_attribute(user, id, attr_id, data):
  id = ObjectId(id)
  attr_id = ObjectId(attr_id)
  db = database.get_db()
  existing = db.idpAttributes.find_one(attr_id)
  if not existing: return errors.NotFound('Attribute not found')
  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  update_data = {
    'name': data.get('name', existing.get('name')),
    'defaultValue': data.get('defaultValue', existing.get('defaultValue')),
    'samlMapping': data.get('samlMapping', existing.get('samlMapping')),
  }
  db.idpAttributes.update({'_id': attr_id}, {'$set': update_data})
  return db.idpAttributes.find_one({'_id': attr_id})

def get_attributes(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t manage this IdP')

  attributes = list(db.idpAttributes.find({'idp': id}))
  return {'attributes': attributes}

def delete_attribute(user, id, attr_id):
  id = ObjectId(id)
  attr_id = ObjectId(attr_id)
  db = database.get_db()
  existing = db.idpAttributes.find_one(attr_id)
  if not existing: return errors.NotFound('Attribute not found')
  idp = db.idps.find_one(existing['idp'])
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t update this IdP')

  db.idpAttributes.remove({'_id': attr_id})
  return {'deletedAttribute': attr_id}

def get_logs(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t access this IdP')
  logs = list(db.requests.find({'idp': id}).sort('createdAt', pymongo.DESCENDING).limit(30))
  sps = list(db.idpSps.find({'idp': id}, {'name': 1}))
  for log in logs:
    if log.get('data', {}).get('assertion', {}).get('key'):
      log['data']['assertion']['key'] = 'REDACTED'
    for sp in sps:
      if log['sp'] == sp['_id']:
        log['spName'] = sp['name']
        break
  return {'logs': logs}

def get_oauth_logs(user, id):
  id = ObjectId(id)
  db = database.get_db()
  idp = db.idps.find_one(id)
  if not idp: return errors.NotFound('IDP not found')
  if not can_manage_idp(user, idp): raise errors.Forbidden('You can\'t access this IdP')
  logs = list(db.oauthRequests.find({'idp': id}).sort('createdAt', pymongo.DESCENDING).limit(30))
  sps = list(db.idpSps.find({'idp': id}, {'name': 1}))
  for log in logs:
    for sp in sps:
      if log['sp'] == sp['_id']:
        log['spName'] = sp['name']
        break
  return {'logs': logs}