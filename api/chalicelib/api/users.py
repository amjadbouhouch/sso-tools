from bson.objectid import ObjectId
from chalicelib.util import database, util, errors, mail

def me(user):
  db = database.get_db()
  return {
    '_id': user['_id'],
    'firstName': user.get('firstName'),
    'lastName': user.get('lastName'),
    'email': user.get('email'),
    'subscriptions': user.get('subscriptions', []),
  }

def get(user, id):
  db = database.get_db()
  if str(user['_id']) != id: raise errors.Forbidden('Not allowed')
  return db.users.find_one({'_id': ObjectId(id)}, {'firstName': 1, 'lastName': 1})

def update(user, id, data):
  if not data: raise errors.BadRequest('Invalid request')
  db = database.get_db()
  if str(user['_id']) != id: raise errors.Forbidden('Not allowed')
  update = {}
  if data.get('email') and data['email'] != user.get('email'):
    email = data['email'].lower()
    existing_user = db.users.find_one({'_id': {'$ne': user['_id']}, 'email': email})
    if existing_user: raise errors.BadRequest('This new email address is already in use')
    mail_content = 'Dear {0},\n\nThis email is to let you know that the email address for your SSO Tools account has been changed to: {1}.\n\nIf this was not you, and/or you believe your account has been compromised, please login as soon as possible and change your account password.'.format(user['firstName'], email)
    mail.send({
      'to_user': user,
      'subject': 'SSOTools Email Address Changed',
      'text': mail_content
    })
    mail.send({
      'to': email,
      'subject': 'SSOTools Email Address Changed',
      'text': mail_content
    })

    update['email'] = email
  if 'firstName' in data: update['firstName'] = data['firstName']
  if 'lastName' in data: update['lastName'] = data['lastName']
  if update:
    db.users.update({'_id': ObjectId(id)}, {'$set': update})
  return get(user, id)
