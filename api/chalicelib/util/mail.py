import os
import requests

def send(data):
  if 'from' not in data:
    data['from'] = 'SSO Tools <no_reply@mail.sso.tools>'
  if 'to_user' in data:
    user = data['to_user']
    data['to'] = user['firstName'] + ' <' + user['email'] + '>'
    del data['to_user']
  data['text'] += '\n\nFrom the team at SSO Tools\n\n\n\n--\n\nReceived this email in error? Please let us know by contacting hello@sso.tools'

  base_url = os.environ.get('MAILGUN_URL')
  api_key = os.environ.get('MAILGUN_KEY')
  if base_url and api_key:
    auth = ('api', api_key)
    try:
      response = requests.post(base_url, auth=auth, data=data)
      response.raise_for_status()
    except Exception as e:
      print(e)
      print('Unable to send email')
  else:
    print('Not sending email. Message pasted below.')
    print(data)


