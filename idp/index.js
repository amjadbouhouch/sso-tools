const express = require('express')
const { ObjectId } = require('mongodb'); // or ObjectID
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const database = require('./database.js');
const idp = require('./idp.js');

JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const SCOPES = {
  'openid': 'SSO Tools will issue a token containing your basic account details to the service provider',
  'email': 'Allow the service provider to read the email address associated with your account',
  'profile': 'Allow the service provider to read the name and other attributes associated with your account',
};

function pageTemplate(content) {
  return `<!DOCTYPE html><html><head>
    <title>SSO Tools IDP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="icon" href="https://sso.tools/icon.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
  </head><body> <div class="container">${content}</div></body></html>`;
}

function loginForm(res, postPath, requestId, currentIdp, currentSp, error) {
  res.status(error ? 401 : 200).send(
    pageTemplate(
      `<h2>${currentSp ? `Login to access ${currentSp.name}`:'Login'}</h2><h5>You're authenticating with ${currentIdp ? currentIdp.name: ''}</h5>
      ${error ? `<p style="color:red;">${error}</p>` : ''}
      <form method="post" action="/${currentIdp && currentIdp.code}/${currentSp ? postPath : 'login'}">
      <input name="email" type="email" placeholder="Email address"/> <input name="password" type="password" placeholder="Password"/>
      <input name="requestId" type="hidden" value="${requestId}" />
      <button type="submit" value="Login" class="waves-effect waves-light btn">Login</button>
      </form>`
    ),
  );
}

function confirmScopes(res, user, scope, requestId, currentIdp, currentSp, error) {
    const requestScopes = [];
    scope.forEach(s => {
      if (SCOPES[s]) requestScopes.push(SCOPES[s]);
    });
    const requestScopesHtml = requestScopes.map(s => s && `<p>- ${s}</p>`).join(' ');
    res.status(error ? 401 : 200).send(
      pageTemplate(
        `<h2>${currentSp?.name} is requesting access to your ${currentIdp?.name} account</h2>
        ${user ? `<p>You're currently logged-in as ${user.firstName} ${user.lastName}</p>` : ''}
        <h5>Please confirm that you authorize the following:</h5>
        ${requestScopesHtml}
        <form method="post" action="/${currentIdp?.code}/oauth2/confirm">
        <input name="requestId" type="hidden" value="${requestId}" />
        <button type="submit" value="Login" class="waves-effect waves-light btn">Authorize</button>
        </form>`
      ),
    );
  }


function errorPage(res, message, status) {
  res.status(status || 400).send(pageTemplate(`<h4>There was a problem fulfilling your request.</h3><h4>${message}</h4>`));
}

function errorJson(res, message, status) {
  res.status(status || 400).json({ success: false, message: message });
}

async function getIdp(code) {
  const idpCode = code && code.toLowerCase();
  if (!idpCode) return null;
  const Idps = await database.collection('idps');
  return await Idps.findOne({code: idpCode});
}

async function getUser(req, currentIdp) {
  const cookie = req.cookies;
  if (cookie && cookie.sessionId) {
    const IdpUsers = await database.collection('idpUsers');
    return await IdpUsers.findOne({'sessionIds': cookie.sessionId, idp: currentIdp._id});
  }
  return null;
}

async function getAttributes(idp) {
  const IdpAttributes = await database.collection('idpAttributes');
  const attributesCur = await IdpAttributes.find({ idp: idp._id });
  const customAttributes = [];
  await attributesCur.forEach(a => customAttributes.push(a));
  return customAttributes;
}

async function sendAssertion(res, user, requestId, thisIdp, thisSp, sessionId) {
  const attributes = {
    'firstName': user.firstName,
    'lastName': user.lastName,
    'email': user.email,
  };

  const customAttributes = await getAttributes(thisIdp);
  customAttributes.forEach(a => {
    const key = a.samlMapping || a.name;
    if (key) {
      const value = (user.attributes && user.attributes[a._id]) || a.defaultValue;
      if (value) attributes[key] = value;
    }
  });

  const rawAssertion = {
    key: thisIdp.saml.privateKey,
    cert: thisIdp.saml.certificate,
    issuer: `https://idp.sso.tools/${thisIdp.code}`,
    recipient: thisSp.recipient || thisSp.callbackUrl,
    audiences: thisSp.entityId,
    inResponseTo: requestId,
    authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified',
    nameIdentifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    nameIdentifier: user.email,
    sessionExpiration: new Date(Date.now() + parseInt(10000) * 1000 * 60).toISOString(),
    sessionIndex: ('sso_tools_session' + (Math.random() * 10000000)).replace('.', '_'),
    lifetimeInSeconds: 600,
    attributes: attributes
  };
  const rawResponse = {
    instant: new Date().toISOString().trim(),
    issuer: `https://idp.sso.tools/${thisIdp.code}`,
    inResponseTo: requestId,
    destination: thisSp.callbackUrl,
    assertion: rawAssertion,
    samlStatusCode: 'urn:oasis:names:tc:SAML:2.0:status:Success',
    samlStatusMessage: 'Login successful',
  };
  const Requests = await database.collection('requests');
  await Requests.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    type: 'loginResponse',
    data: rawResponse,
  });

  rawResponse.assertion = idp.createAssertion(rawAssertion);
  const response = idp.createResponse(rawResponse);
  const encoded = Buffer.from(response).toString('base64');

  res.append('Set-Cookie', `sessionId=${sessionId}; Path=/`);
  res.send(
    pageTemplate(
      `<h3>Authentication successful</h3><h5>Contacting the Service Provider...</h5>
      <form action="${thisSp.callbackUrl}" method="post">
        <input type="hidden" name="SAMLResponse" value="${encoded}" />
      </form>
      <script>document.querySelector('form').submit();</script>`
    )
  );
}

// IdP dashboard
app.get('/:code', async (req, res) => {
  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);
  const user = await getUser(req, thisIdp);

  const sps = [];
  if (user) {
    const IdpSps = await database.collection('idpSps');
    const cur = await IdpSps.find({idp: thisIdp._id}, {name: 1, serviceUrl: 1, entityId: 1});
    await cur.forEach(s => sps.push(s));
  }
  res.send(pageTemplate(`<div>
    <h2>Welcome to ${thisIdp.name}</h2>
    ${user ? `
      <p>You're logged-in as ${user.firstName} ${user.lastName}</p>
      <a class='btn' style="float:right;" href="/${thisIdp.code}/logout">Logout of ${thisIdp.name}</a>
      <div style="clear:both;margin: 20px auto;"></div>
      ${sps.length > 0 ? `
        <h4>Available Service Providers</h4>
        <table>
          <thead><tr><th>Name</th><th></th></thead>
          <tbody>
            ${sps.map(s =>
              `<tr>
              <td>${s.name}</td>
              <td style="text-align:right;"><a class='btn blue' href="${s.serviceUrl}">Visit Service</a><a class='btn green' href="https://idp.sso.tools/${thisIdp.code}/saml/login/initiate?entityId=${s.entityId}" style="margin-left: 10px;">IDP-initiated login</a></td></tr>`
            )}
          </tbody>
        </table>
      ` : `
        <h4>This IDP has no Service Providers registered</h4>
      `}
    ` : `
      <h4>You're not currently logged-in to this IDP</h4>
      <h5 style="margin-top: 40px;">Login below</h5>
      <form method="post" action="/${thisIdp.code}/login">
      <input name="email" type="email" placeholder="Email address"/> <input name="password" type="password" placeholder="Password"/>
      <button type="submit" value="Login" class="waves-effect waves-light btn">Login</button>
      </form>
    `}
  </div>`));
});


/*
    SAML2 HANDLERS
*/

// Received login request from SP
app.get('/:code/saml/login/request', async (req, res) => {
  try{
    const request = req.query.SAMLRequest;
    const relayState = req.query.relayState;
    const info = idp.parseRequest({}, request);

    if (relayState) { }
    if (info.logout) {
      return errorPage(res, 'This endpoint cannot be used to handle logout requests. Please use /logout/request instead.');
    }

    if (info.login) {
      const thisIdp = await getIdp(req.params.code);
      if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);
      const IdpSps = await database.collection('idpSps');
      const thisSp = await IdpSps.findOne({idp: thisIdp._id, entityId: info.login.issuer});
      if (!thisSp) return errorPage(res, `The Service Provider requesting authentication is not currently registered with the IDP ${thisIdp.name}. If you think you are seeing this message in error, please check your Service Provider configuration. For reference, the issuer of the authentication request is "${info.login.issuer}"`);

      const Requests = await database.collection('requests');
      await Requests.insertOne({
        createdAt: new Date(),
        idp: thisIdp._id,
        sp: thisSp._id,
        type: 'loginRequest',
        data: info.login
      });

      if (!info.login.forceAuthn) {
        const user = await getUser(req, thisIdp);
        if (user) {
          const sessionId = uuidv4();
          const IdpUsers = await database.collection('idpUsers');
          await IdpUsers.updateOne({_id: user._id}, {$addToSet: {sessionIds: sessionId}});
          return await sendAssertion(res, user, info.login.id, thisIdp, thisSp, sessionId);
        }
      }
      return loginForm(res, 'saml/login', info.login.id, thisIdp, thisSp);
    }
  }
  catch(err) {
    console.log(err)
    return errorPage(res, 'The request from your service provider could not be understood.');
  }
});

// Received logout request from SP
app.get('/:code/saml/logout/request', async (req, res) => {
  try{
    const request = req.query.SAMLRequest;
    const relayState = req.query.RelayState;
    const thisIdp = await getIdp(req.params.code);
    if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`);
    const info = idp.parseRequest({ issuer: `https://idp.sso.tools/${thisIdp.code}` }, request);

    if (info.login) {
      return errorPage(res, 'This endpoint cannot be used to handle login requests. Please use /login/request instead.');
    }
    if (info.logout) {
      const fields = info.logout;

      const IdpSps = await database.collection('idpSps');
      const thisSp = await IdpSps.findOne({idp: thisIdp._id, entityId: fields.issuer});
      if (!thisSp) return errorPage(res, `The Service Provider requesting authentication is not currently registered with the IDP ${thisIdp.name}. If you think you are seeing this message in error, please check your Service Provider configuration. For reference, the issuer of the authentication request is "${fields.issuer}"`);

      const Requests = await database.collection('requests');
      await Requests.insertOne({
        createdAt: new Date(),
        idp: thisIdp._id,
        sp: thisSp._id,
        type: 'logoutRequest',
        data: info.logout
      });

      if (!fields.nameId) return errorPage(res, 'No NameID was included in the logout request.');
      const user = await getUser(req, thisIdp);
      if (!user) return errorPage(res, 'The user is not currently logged-in with this IDP.', 401);
      if (user.email.toLowerCase() !== fields.nameId.toLowerCase()) return errorPage(res, 'The currently logged-in user does not match the user making the logout request.', 403);

      const IdpUsers = await database.collection('idpUsers');
      await IdpUsers.updateOne({_id: user._id}, {$unset: {sessionIds: ''}});

      const encodedResponse = Buffer.from(fields.response).toString('base64');
      return {
        statusCode: 302,
        headers: {
          'Location': `${thisSp.serviceUrl ? `${thisSp.serviceUrl}?SAMLResponse=${encodedResponse}` : `/${thisIdp.code}`}`,
          'Set-Cookie': 'sessionId=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      };
    }
  }
  catch(err) {
    console.log(err);
    return errorPage(res, 'The request from your service provider could not be understood.');
  }
});

// IdP-initiated login (i.e. clicked button on IdP dashboard)
app.get('/:code/saml/login/initiate', async (req, res) => {
  if (!req.query.entityId) return errorPage(res, 'No entityId was provided');
  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);
  const user = await getUser(req, thisIdp);
  if (!user) return errorPage(res, 'You aren\'t currently logged-in.', 401);
  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({idp: user.idp, entityId: req.query.entityId });
  if (!thisSp) return errorPage(res, 'There is no SP with the given EntityID', 404);

  const sessionId = uuidv4();
  const IdpUsers = await database.collection('idpUsers');
  await IdpUsers.updateOne({_id: user._id}, {$addToSet: {sessionIds: sessionId}});

  return await sendAssertion(res, user, null, thisIdp, thisSp, sessionId);
});

// SP-initiated login (i.e. if login to IdP required first)
app.post('/:code/saml/login', async (req, res) => {
  const Requests = await database.collection('requests');
  const request = await Requests.findOne({'data.id': req.body.requestId});
  if (!request) return loginForm(res, 'saml/login', req.body.requestId, null, null, 'This login request is not valid.');

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);

  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({idp: thisIdp._id, entityId: request.data.issuer});
  if (!thisSp) return errorPage(res, `The Service Provider requesting authentication is not currently registered with the IDP ${thisIdp.name}. If you think you are seeing this message in error, please check your Service Provider configuration. For reference, the issuer of the authentication request is "${request.data.issuer}"`);

  const IdpUsers = await database.collection('idpUsers');
  const user = await IdpUsers.findOne({email: req.body.email.toLowerCase(), idp: thisIdp._id });

  if (!user || !bcrypt.compareSync(req.body.password, user.password.toString())) {
    return loginForm(res, 'saml/login', req.body.requestId, thisIdp, thisSp, 'The email address or password is incorrect. Remember that you need to login as a user registered with the IDP, and not your SSO Tools account.');
  }
  const sessionId = uuidv4();
  await IdpUsers.updateOne({_id: user._id}, {$addToSet: {sessionIds: sessionId}});

  return await sendAssertion(res, user, request.data.id, thisIdp, thisSp, sessionId);
});


/*
    OAUTH2 HANDLERS
*/

// Handle requests to SP-initiated login for OAuth2
app.get('/:code/oauth2/authorize', async (req, res) => {
  const clientId = req.query.client_id;
  const scope = req.query.scope && req.query.scope.split(' ');
  const redirectUri = req.query.redirect_uri;
  const responseType = req.query.response_type;
  if (!clientId) return errorPage(res, 'No client ID was provided');
  if (!redirectUri) return errorPage(res, 'Redirect URI is required');
  if (responseType !== 'code') return errorPage(res, 'Response type must equal "code"');

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);
  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({ oauth2ClientId: clientId });
  if (!thisSp) return errorPage(res, 'The client ID you provided is invalid');

  if (thisSp.oauth2RedirectUri !== redirectUri) return errorPage(res, `The Redirect URI specified doesn't match what is registered for this service provider`, 400);

  const OauthRequests = await database.collection('oauthRequests');
  const result = await OauthRequests.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    type: 'authorizeRequest',
    scope: scope,
    redirectUri: redirectUri,
    clientId: clientId,
    data: {
      clientId: clientId,
      scope: scope,
      redirectUri: redirectUri,
      responseType: responseType,
    }
  });

  const user = await getUser(req, thisIdp);
  if (!user) {
    return loginForm(res, 'oauth2/login', result.insertedId, thisIdp, thisSp, `Please login to ${thisIdp.name} in order to continue to ${thisSp.name}`);
  }
  return await confirmScopes(res, user, scope, result.insertedId, thisIdp, thisSp);
});

// Handle Oauth2 login form
app.post('/:code/oauth2/login', async (req, res) => {
  const OauthRequests = await database.collection('oauthRequests');
  const request = await OauthRequests.findOne({'_id': ObjectId(req.body.requestId)});
  if (!request) return loginForm(res, 'oauth2/login', req.body.requestId, null, null, 'This login request is not valid.');

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);

  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({idp: thisIdp._id, _id: request.sp});
  if (!thisSp) return errorPage(res, `The Service Provider requesting authentication is not currently registered with the IDP ${thisIdp.name}. If you think you are seeing this message in error, please check your Service Provider configuration.`);

  const IdpUsers = await database.collection('idpUsers');
  const user = await IdpUsers.findOne({email: req.body.email.toLowerCase(), idp: thisIdp._id });

  if (!user || !bcrypt.compareSync(req.body.password, user.password.toString())) {
    return loginForm(res, 'oauth2/login', req.body.requestId, thisIdp, thisSp, 'The email address or password is incorrect. Remember that you need to login as a user registered with the IDP, and not your SSO Tools account.');
  }
  const sessionId = uuidv4();
  await IdpUsers.updateOne({_id: user._id}, {$addToSet: {sessionIds: sessionId}});
  res.append('Set-Cookie', `sessionId=${sessionId}; Path=/`);

  return await confirmScopes(res, user, request.scope, req.body.requestId, thisIdp, thisSp);
});

// Handle Oauth2 scope confirmation
app.post('/:code/oauth2/confirm', async (req, res) => {
  const OauthRequests = await database.collection('oauthRequests');
  const request = await OauthRequests.findOne({'_id': ObjectId(req.body.requestId)});
  if (!request) return loginForm(res, 'oauth2/login', req.body.requestId, null, null, 'This login request is not valid.');

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);

  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({idp: thisIdp._id, _id: request.sp});
  if (!thisSp) return errorPage(res, `The Service Provider requesting authentication is not currently registered with the IDP ${thisIdp.name}. If you think you are seeing this message in error, please check your Service Provider configuration.`);

  const user = await getUser(req, thisIdp);
  if (!user) {
    return loginForm(res, 'oauth2/login', req.body.requestId, thisIdp, thisSp, 'You need to be logged-in to access this page.');
  }

  const oauthCode = crypto.randomBytes(16).toString('hex');
  await OauthRequests.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    type: 'authorizedScope',
    scope: request.scope,
    redirectUri: request.redirectUri,
    clientId: request.clientId,
    code: oauthCode,
    data: request,
  });

  const OauthSessions = await database.collection('oauthSessions');
  await OauthSessions.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    user: user._id,
    scope: request.scope,
    code: oauthCode,
    data: {
      scope: request.scope,
      clientId: request.clientId,
      code: oauthCode,
    }
  });

  res.redirect(`${request.redirectUri}?code=${oauthCode}`);
});

// Handle Oauth2 token request
app.post('/:code/oauth2/token', async (req, res) => {
  const clientId = req.body.client_id;
  const clientSecret = req.body.client_secret;
  const code = req.body.code;
  const redirectUri = req.body.redirect_uri;
  const grantType = req.body.grant_type;
  if (!clientId) return errorJson(res, 'Client ID is required');
  if (!clientSecret) return errorJson(res, 'Client secret is required');
  if (!redirectUri) return errorJson(res, 'Redirect URI is required');
  if (!code) return errorJson(res, 'Authorization code is required');
  if (grantType !== 'authorization_code') return errorJson(res, 'Grant type must equal "authorization_code"');

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorJson(res, `There is no IDP service available at this URL.`, 404);

  const OauthSessions = await database.collection('oauthSessions');
  const oauthSession = await OauthSessions.findOne({code: code, idp: thisIdp._id});
  if (!oauthSession) return errorJson(res, `No valid OAuth2 session is available with these details.`, 404);
  if (oauthSession.consumed) return errorJson(res, 'This session code has already been redeemed. Please repeat the authorization process to obtain a new code.');

  const IdpSps = await database.collection('idpSps');
  const thisSp = await IdpSps.findOne({_id: oauthSession.sp, oauth2ClientId: clientId, oauth2ClientSecret: clientSecret});
  if (!thisSp) return errorJson(res, `A service provider matching your information could not be found. Please check your client ID and secret`);
  if (thisSp.oauth2RedirectUri !== redirectUri) return errorJson(res, `The Redirect URI specified doesn't match what is registered for this service provider`, 400);

  const IdpUsers = await database.collection('idpUsers');
  const user = await IdpUsers.findOne({_id: oauthSession.user});
  if (!user) return errorJson(res, 'Could not find the user associated with this session', 404);

  // Prepare ID Token (if in scope) and access token
  const returnData = {};
  if (oauthSession.scope.indexOf('openid') > -1) {
    const claims = {sub: user._id};
    if (oauthSession.scope.indexOf('email') > -1) claims.email = user.email;
    if (oauthSession.scope.indexOf('profile') > -1) {
      claims.given_name = user.firstName;
      claims.family_name = user.lastName;
      const customAttributes = await getAttributes(thisIdp);
      customAttributes.forEach(a => {
        const key = a.samlMapping || a.name;
        if (key) {
          const value = (user.attributes && user.attributes[a._id]) || a.defaultValue;
          if (value) claims[key] = value;
        }
      });
    }
    returnData['id_token'] = jwt.sign(claims, JWT_SECRET);
  }
  returnData['access_token'] = crypto.randomBytes(40).toString('hex');

  const OauthRequests = await database.collection('oauthRequests');
  await OauthRequests.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    type: 'tokenRequest',
    scope: oauthSession.scope,
    code: code,
    data: {
      scope: oauthSession.scope,
      code: code,
      clientId: clientId,
      clientSecret: 'REDACTED',
      redirectUri: redirectUri,
      grantType: grantType,
    }
  });
  await OauthRequests.insertOne({
    createdAt: new Date(),
    idp: thisIdp._id,
    sp: thisSp._id,
    type: 'tokenResponse',
    scope: oauthSession.scope,
    data: returnData,
  });
  await OauthSessions.updateOne({_id: oauthSession._id}, {$set: {consumed: true, accessToken: returnData['access_token']}});

  res.json(returnData);
});

// Handle API request to get user's profile
app.get('/:code/api/users/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return errorJson(res, 'This resource requires authorization', 403);

  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorJson(res, `There is no IDP service available at this URL.`, 404);

  const OauthSessions = await database.collection('oauthSessions');
  const oauthSession = await OauthSessions.findOne({accessToken: authHeader, idp: thisIdp._id});
  if (!oauthSession) return errorJson(res, `The acceess token provided is not valid.`, 403);
  console.log(oauthSession);

  const IdpUsers = await database.collection('idpUsers');
  const user = await IdpUsers.findOne({_id: oauthSession.user});
  if (!user) return errorJson(res, 'Could not find the user associated with this session', 404);

  const returnData = {id: user._id};
  if (oauthSession.scope.indexOf('email') > -1) returnData.email = user.email;
  if (oauthSession.scope.indexOf('profile') > -1) {
    returnData.firstName = user.firstName;
    returnData.lastName = user.lastName;
    const customAttributes = await getAttributes(thisIdp);
    customAttributes.forEach(a => {
      const key = a.samlMapping || a.name;
      if (key) {
        const value = (user.attributes && user.attributes[a._id]) || a.defaultValue;
        if (value) returnData[key] = value;
      }
    });
  }

  res.json(returnData);
});

/*
    GENERAL LOGIN / LOGOUT HANDLERS
*/

// Login to IdP
app.post('/:code/login', async (req, res) => {
  const thisIdp = await getIdp(req.params.code);
  if (!thisIdp) return errorPage(res, `There is no IDP service available at this URL.`, 404);

  const IdpUsers = await database.collection('idpUsers');
  const user = await IdpUsers.findOne({email: req.body.email.toLowerCase(), idp: thisIdp._id });

  if (!user || !bcrypt.compareSync(req.body.password, user.password.toString())) {
    return loginForm(res, 'login', 'null', thisIdp, null, 'The email address or password is incorrect. Remember that you need to login as a user registered with the IDP, and not your SSO Tools account.');
  }
  const sessionId = uuidv4();
  await IdpUsers.updateOne({_id: user._id}, {$addToSet: {sessionIds: sessionId}});
  res.append('Set-Cookie', `sessionId=${sessionId}; Path=/`);
  res.redirect(`/${thisIdp.code}`);
});

// Logout of IdP
app.get('/:code/logout', async (req, res) => {
  const thisIdp = await getIdp(req.params.code);
  const user = await getUser(req, thisIdp);
  if (user) {
    const IdpUsers = await database.collection('idpUsers');
    await IdpUsers.updateOne({_id: user._id}, {$unset: {sessionIds: ''}});
  }
  res.append('Set-Cookie', 'sessionId=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.redirect(`/${thisIdp.code}`);
});

const port = 6001;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
