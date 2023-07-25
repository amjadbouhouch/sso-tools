<template>
  <div>
    <h1>A guide to OAuth2 and OpenID Connect</h1>
    <p>Setting-up an OAuth2 app for the first time might seem daunting, but once you understand the flow you'll be easily able to implement single sign-on and OAuth2-based API access for your apps in no time.</p>

    <v-alert class="mt-8 mb-5">
      <h3>TL;DR?</h3>
      <p v-if="idp">If you're already familiar with OAuth2 and OpenID Connect, then <router-link :to="`/idps/${idp._id}/oauth`">check out the available URLs and scopes</router-link> to get started.</p>
      <p v-if="!idp">If you're already familiar with OAuth2 and OpenID Connect, then you can simply check out the available URLs and scopes directly from your SSO Tools IdP dashboard to get started.</p>
      <v-btn v-if="!idp" class="mt-8" to="/idps/new" color="primary" prepend-icon="mdi-rocket">Get started</v-btn>
    </v-alert>

    <h3>OAuth2 Overview</h3>
    <p>OAuth2 allows services to work together to enable single sign-on, or two allow the two services to communicate with each other on a user's behalf. When you choose options like "login with Facebook" or "connect to Stripe", OAuth2 is what is powering the interactions behind the scenes.</p>

    <p class="mt-4">Under OAuth2 the user logs-in directly with their identity provider (IdP), and authorizes the IdP to reveal information about them declared in the "scope" (such as a user ID, email address, or even profile information). This information can then be used by the calling service provider ("app") in order to provision the user with an account or to log the user in. The app never sees the username and password used to login and only has access to the information declared in the scope authorized by the user.</p>

    <p class="mt-4">Some IDPs may also issue an "access token" during the authentication process. This token can be used for ongoing communication between the two services. For example, the app might use the access token to retrieve or update the user's profile on the IdP, or carry out other actions (such as handling a payment with Stripe).</p>

    <h3 class="mt-8">What is the OpenID Connect part about?</h3>
    <p>OpenID Connect acts as an extension to OAuth2. Implementations of this standard seem to vary, but the general idea is that the calling app requests an additional "openid" scope from the IdP. If granted, the IdP will issue a special ID token, encoded with useful information about the user, back to the app after a successful authorization is complete.</p>
    <p class="mt-4">Under this approach, the app can avoid having to do additional lookups (using the access token) to the IdP in order to retrieve the required user profile information to log the user in.</p>
    <p class="mt-4">SSO Tools supports OAuth2 with or without OpenID Connect.</p>

    <h3 class="mt-8">A simplified OAuth2 flow</h3>
    <p>A user "logging-in" via OAuth2 will cause the following steps to occur.</p>
    <ol class="mt-5">
      <li>The user visits the app (e.g. a website or mobile app). The app shows an option to login via OAuth2 (e.g. "Login with Facebook" or "Login with Your App").</li>
      <li>The user selects this option and is redirected to the IdP (e.g. "Facebook" or "Your App") to authenticate themselves. Usually this would involve logging-in with a username and password. The app includes a list of scopes to ask for in its request.</li>
      <li>After a successful login, the IdP displays the scopes requested by the app, and asks the user to authorize the IdP to provide the requested information or permissions on the user's behalf.</li>
      <li>After authorization, the user is redirected back to the app armed with a special "authorization code".</li>
      <li>The app reads this code and uses this to request a token directly from the IdP.</li>
      <li>The IdP responds with an ID token (if the "openid" scope was requested) and - usually - an access token.</li>
      <li>The app can read the ID token to retrieve user details in order to match or setup an account for the user, and to log the user in. If an access token is also included, the app can use this for ongoing communication with the IdP if required.</li>
    </ol>

    <h3 class="mt-8">Implementing the OAuth2 flow in your app</h3>
    <p>The following steps describe how to implement OAuth2 SSO in your app using an IdP, such as one provided by SSO Tools.</p>

    <h4 class="mt-5">Step 1: Create an IdP and an app declaration</h4>
    <p>In SSO Tools, follow the steps to create a new IdP and app (service provider). In this guide we'll assume your IdP's issuer (code) is `myidp`.</p>
    <p class="mt-4">When creating your app, you'll need to provide a "redirect URI". This the place the user will be redirected back to after successful authentication. If you don't know this right away, you can always change it later.</p>

    <h4 class="mt-5">Step 2: Redirect the user to the IdP to authenticate</h4>
    <p>In your app, create a button or link that redirects the user to the IdP's "authorization URL". In SSO Tools, these take the form of "https://idp.sso.tools/ISSUER/oauth2/authorize", replacing "ISSUER" with the issuer code for your IdP (e.g. "myidp").</p>
    <p class="mt-4">Along with this request, you'll have to include some additional query parameters:</p>
    <ul class="mt-4">
      <li>`client_id`: The client ID for the app generated by your IdP (this can be found on the IdP's connected apps page).</li>
      <li>`scope`: The space-separated list of requested permissions.</li>
      <li>`redirect_uri`: The URL to send the user back to after authentication. This must match the one declared in the app settings on the IdP.</li>
      <li>`response_type`: This should just be set to the value "code".</li>
    </ul>
    <p class="mt-4">For the scope parameter, SSO Tools currently supports "email" (to allow reading the user's email address), "profile" (to allow reading the user's name and profile information), and "openid" (to receive an ID token after authentication).</p>
    <p class="mt-4">As such, an example request to redirect the user to on SSO Tools could look like the following:</p>
    <p class="mt-4">https://idp.sso.tools/myidp/oauth2/authorize?client_id=abc123&scope=profile%20email%20openid&redirect_uri=https://myapp.com/oauth/callback&response_type=code</p>

    <h4 class="mt-5">Step 3: The user authenticates</h4>
    <p>Your app can relax for a bit now, since the IdP now takes over in handling the user's authentication and seeking approval for the scopes your app has requested.</p>

    <h4 class="mt-5">Step 4: Receive the user back after authentication</h4>
    <p>Assuming all went well with the authentication, the IdP will now redirect the user back to your app at the redirect URI you specified. If you don't yet have a route to handle this, then you should create one now and ensure this is registered in the app on SSO Tools and included in your request in Step 2.</p>
    <p class="mt-4">When the user arrives back, they'll have a `code` parameter in their request URL. For example, if your redirect URI is "https://myapp.com/oauth/callback" your app will receive a request at "https://myapp.com/oauth/callback?code=xzy321"</p>
    <p class="mt-4">Your app should read this code and make it available for the next step</p>

    <h4 class="mt-5">Step 5: Request a token from the IdP</h4>
    <p>Next, your app will need to make a request directly to the IdP on its "token" endpoint. On SSO Tools, these endpoints look like "https://idp.sso.tools/ISSUER/oauth2/token". To this endpoint, your app should send an HTTP `POST` request containing the following data in JSON format:</p>
    <ul class="mt-4">
      <li>`code`: The code received in Step 4.</li>
      <li>`client_id`: The client ID (as shown on the connected apps page).</li>
      <li>`client_secret`: The client secret (as shown on the connected apps page).</li>
      <li>`redirect_uri`: The same redirect URI we used earlier, again.</li>
      <li>`grant_type`: This should be set to the value "authorization_code".</li>
    </ul>
    <p class="mt-4">For example, given the information above, a sample token request could look like this:</p>
    <pre class="mt-4">
POST https://idp.sso.tools/myidp/oauth2/token
Accept: application/json
Content-Type: application/json

{
  "code": "xyz321",
  "client_id": "abc123",
  "client_secret": "SECRET",
  "redirect_uri": "https://myapp.com/oauth/callback",
  "grant_type": "authorization_code"
}
    </pre>
    <p class="mt-4">Assuming all went well, the response to the request should contain an `access_token` field (containing a string representing an access token usable against the SSO Tools API for the IdP). If the "openid" scope was requested the response will also include an "id_token" field (containing a string representing a JWT that can be decoded to retrieve the user profile information requested by the scope).</p>

    <h4 class="mt-5">Step 6 (optional): Interact with the IdP's API</h4>
    <p>Depending on your setup, Step 5 might be the last step needed to complete single sign-on with OAuth2 and OpenID Connect. If your app needs to then communicate with an API for additional data flow (e.g. to power an integration), then read on.</p>
    <p class="mt-4">The "access_token" received in Step 5 can now be used against the IdP's API in order to retrieve the user's information. To do so, include the access token in the Authorization header and send off a request to "https://idp.sso.tools/ISSUER/api/users/me".</p>
    <p class="mt-4">For example, given the above information, your request could look like this:</p>
    <pre class="mt-4">
GET https://idp.sso.tools/myidp/api/users/me
Accept: application/json
Authorization: ACCESSTOKEN
    </pre>
    <p class="mt-4">Assuming all went well, the IdP will respond with information about the current user, as defined in the requested scopes.</p>

  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPOAuth',
  props: ['idp'],
  data() {
    return {
      idp: this.idp,
    }
  },
  methods: {

  },
}
</script>

<style scoped>

</style>
