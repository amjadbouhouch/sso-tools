import datetime, jwt, bcrypt, os
from bson.objectid import ObjectId
from chalicelib.util import database, mail, errors

jwt_secret = os.environ.get('JWT_SECRET')

def create(data):
  email = data.get('email')
  first_name = data.get('firstName')
  last_name = data.get('lastName')
  password = data.get('password')
  if not email or len(email) < 6: raise errors.BadRequest('Your name or email is too short or invalid.')
  if not password or len(password) < 8: raise errors.BadRequest('Your password should be at least 8 characters.')
  email = email.lower()
  idps_to_claim = data.get('idpsToClaim', []) or []
  idps_to_claim = list(map(lambda i: ObjectId(i), idps_to_claim))
  db = database.get_db()
  existingUser = db.users.find_one({'email': email})
  if existingUser: raise errors.BadRequest('An account with this email already exists.')

  hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
  new_user = {
    'firstName': first_name,
    'lastName': last_name,
    'email': email,
    'password': hashed_password,
    'createdAt': datetime.datetime.utcnow()
  }
  result = db.users.insert_one(new_user)
  new_user['_id'] = result.inserted_id
  if len(idps_to_claim):
    db.idps.update({'_id': {'$in': idps_to_claim}, 'user': {'$exists': False}}, {'$set': {'user': new_user['_id']}}, multi=True)
  return {'token': generate_access_token(new_user['_id'])}

def enrol(data):
  if not data or 'token' not in data or 'password' not in data: raise errors.BadRequest('Invalid request')
  token = data.get('token')
  password = data.get('password')
  if not token: raise errors.BadRequest('Invalid token')
  if not password or len(password) < 8: raise errors.BadRequest('Your password should be at least 8 characters.')
  try:
    db = database.get_db()
    id = jwt.decode(data['token'], jwt_secret)['sub']
    user = db.users.find_one({'_id': ObjectId(id), 'tokens.enrolment': token})
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    db.users.update({'_id': user['_id']}, {'$set': {'password': hashed_password}, '$unset': {'tokens.enrolment': ''}})
    return {'token': generate_access_token(user['_id'])}
  except Exception as e:
    print(e)
    raise errors.BadRequest('Unable to enrol your account. Your token may be invalid or expired.')

def login(data):
  email = data.get('email')
  password = data.get('password')
  idps_to_claim = data.get('idpsToClaim', []) or []
  idps_to_claim = list(map(lambda i: ObjectId(i), idps_to_claim))

  db = database.get_db()
  user = db.users.find_one({'email': email.lower()})
  try:
    if user and bcrypt.checkpw(password.encode("utf-8"), user['password']):
      if len(idps_to_claim):
        db.idps.update({'_id': {'$in': idps_to_claim}, 'user': {'$exists': False}}, {'$set': {'user': user['_id']}}, multi=True)
      return {'token': generate_access_token(user['_id'])}
    else:
      raise errors.BadRequest('Your email or password is incorrect.')
  except Exception as e:
    print(e)
    raise errors.BadRequest('Your email or password is incorrect.')

def logout(user):
  db = database.get_db()
  db.users.update({'_id': user['_id']}, {'$pull': {'tokens.login': user['currentToken']}})
  return {'loggedOut': True}

def update_password(user, data):
  if not data: raise errors.BadRequest('Invalid request')
  if 'newPassword' not in data: raise errors.BadRequest('Invalid request')
  if len(data['newPassword']) < 8: raise errors.BadRequest('New password is too short')

  db = database.get_db()
  if 'currentPassword' in data:
    if not bcrypt.checkpw(data['currentPassword'].encode('utf-8'), user['password']):
      raise errors.BadRequest('Incorrect password')
  elif 'token' in data:
    try:
      id = jwt.decode(data['token'], jwt_secret, algorithms=['HS256'])['sub']
      user = db.users.find_one({'_id': ObjectId(id), 'tokens.passwordReset': data['token']})
      if not user: raise Exception
    except Exception as e:
      print(e)
      raise errors.BadRequest('There was a problem updating your password. Your token may be invalid or out of date')
  else:
    raise errors.BadRequest('Current password or reset token is required')
  if not user: raise errors.BadRequest('Unable to change your password')

  hashed_password = bcrypt.hashpw(data['newPassword'].encode("utf-8"), bcrypt.gensalt())
  db.users.update({'_id': user['_id']}, {'$set': {'password': hashed_password}, '$unset': {'tokens.passwordReset': ''}})
  return {'passwordUpdated': True}

def delete(user, password):
  if not password or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
    raise errors.BadRequest('Incorrect password')
  db = database.get_db()
  for idp in db.idps.find({'user': user['_id']}):
    db.idpSps.remove({'idp': idp['_id']})
    db.idpUsers.remove({'idp': idp['_id']})
    db.idpAttributes.remove({'idp': idp['_id']})
  db.idps.remove({'user': user['_id']})
  db.users.remove({'_id': user['_id']})
  return {'deletedUser': user['_id']}

def generate_access_token(user_id):
  payload = {
    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
    'iat': datetime.datetime.utcnow(),
    'sub': str(user_id)
  }
  token = jwt.encode(payload, jwt_secret, algorithm='HS256')
  db = database.get_db()
  db.users.update({'_id': user_id}, {'$addToSet': {'tokens.login': token}})
  return token

def get_user_context(token):
  if not token: return None
  try:
    payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
    id = payload['sub']
    if id:
      db = database.get_db()
      user = db.users.find_one({'_id': ObjectId(id), 'tokens.login': token})
      db.users.update({'_id': user['_id']}, {'$set': {'lastSeenAt': datetime.datetime.now()}})
      user['currentToken'] = token
      return user
  except Exception as e:
    print(e)
    return None

def reset_password(data):
  if not data or not 'email' in data: raise errors.BadRequest('Invalid request')
  if len(data['email']) < 5: raise errors.BadRequest('Your email is too short')
  db = database.get_db()
  user = db.users.find_one({'email': data['email'].lower()})
  if user:
    payload = {
      'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
      'iat': datetime.datetime.utcnow(),
      'sub': str(user['_id'])
    }
    token = jwt.encode(payload, jwt_secret, algorithm='HS256')
    mail.send({
      'to_user': user,
      'subject': 'Reset your password',
      'text': 'Dear {0},\n\nA password reset email was recently requested for your SSO Tools account. If this was you and you want to continue, please follow the link below:\n\n{1}\n\nThis link will expire after 24 hours.\n\nIf this was not you, then someone may be trying to gain access to your account. We recommend using a strong and unique password for your account.'.format(user['firstName'], 'https://sso.tools/password/reset?token=' + token)
    })
    db.users.update({'_id': user['_id']}, {'$set': {'tokens.passwordReset': token}})
  return {'passwordResetEmailSent': True}
