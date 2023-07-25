<template>
  <div>
    <p>You can use the details below to configure your OAuth2-compatibile service providers to use this IdP as an identity source.</p>
    <v-alert type="info" class="mt-5">To start using a service provider with this IdP you will also need to register it on the <router-link style="color:white;" :to="`/idps/${idp._id}/sps`">Connected apps</router-link> page.</v-alert>

    <v-alert color="green" class="mt-5">For help in getting started with implementing OAuth2, check out the <router-link style="color:white;" :to="`/idps/${idp._id}/oauth/guide`">OAuth2 & OpenID Connect guide</router-link>.</v-alert>

    <div class=" mt-5 pa-5 bg-grey-lighten-3 rounded-lg">
      <h4>Authorization URL</h4>
      <p>This is where your app should redirect users in order to begin the single sign-on flow.</p>
      <v-text-field class="mt-3 mb-1" readonly label="Authorization URL" :model-value="`https://idp.sso.tools/${idp.code}/oauth2/authorize`" />
      <p>This URL should be accessed via HTTP <code>GET</code> and it expects the following parameters:</p>
      <ul class="ml-5 mt-2">
        <li><code>client_id</code>: The client ID for the app (available on the Connected apps page).</li>
        <li><code>scope</code>: A space-separated list of requested permissions (see available scopes below).</li>
        <li><code>redirect_uri</code>: The URL to send the user back to after authentication. This must match the one declared in the app settings on the Connected apps page.</li>
        <li><code>response_type</code>: This should just be set to the value "code".</li>
      </ul>

      <h4 class="mt-5">The following scopes can be requested</h4>
      <v-list lines="one" class="bg-transparent">
        <v-list-item prepend-icon="mdi-check-circle-outline"
          title="email"
          subtitle="To allow the service provider to request access to the user's email address"
        ></v-list-item>
        <v-list-item prepend-icon="mdi-check-circle-outline"
          title="profile"
          subtitle="To allow the service provider to request access to the user's name and other attributes"
        ></v-list-item>
        <v-list-item prepend-icon="mdi-check-circle-outline"
          title="openid"
          subtitle="The IdP will send an ID token, along with the access token, containing scoped profile claims"
        ></v-list-item>
      </v-list>

      <v-alert color="blue-lighten-4" class="mt-5"><strong>Coming soon:</strong> An "offline_access" scope for managing OAuth2 token-refresh flows.</v-alert>
    </div>

    <div class=" mt-5 pa-5 bg-grey-lighten-3 rounded-lg">
      <h4 >Token URL</h4>
      <p>This is the URL used to obtain an ID token and access token using the <code>code</code> returned from the IdP after authentication.</p>
      <v-text-field class="mt-3 mb-1" readonly label="Token URL" :model-value="`https://idp.sso.tools/${idp.code}/oauth2/token`" />
      <p>This URL should be accessed via HTTP <code>POST</code> with a body in JSON format containing the following fields:</p>
      <ul class="ml-5 mt-2">
        <li><code>code</code>: The code received back after authentication.</li>
        <li><code>client_id</code>: The client ID (as shown on the Connected apps page).</li>
        <li><code>client_secret</code>: The client secret (as shown on the Connected apps page).</li>
        <li><code>redirect_uri</code>: The same redirect URI we used earlier, again.</li>
        <li><code>grant_type</code>: This should be set to the value "authorization_code".</li>
      </ul>
      <p>The response is a JSON object containing an <code>access_token</code> field and a <code>id_token</code> field if the <code>openid</code> scope was requested.</p>
    </div>

    <div class=" mt-5 pa-5 bg-grey-lighten-3 rounded-lg">
      <h4>API endpoint URL</h4>
      <p>This URL represents an example API endpoint that can be called to check the validity of the <code>access_token</code>.</p>
      <v-text-field class="mt-3 mb-1" readonly label="Example API URL" :model-value="`https://idp.sso.tools/${idp.code}/api/users/me`" />
      <p>To call this, make an HTTP <code>GET</code> request to the URL with the <code>access_token</code> stored in the request's <code>Authorization</code> header.</p>
    </div>

  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPOAuth',
  props: ['idp'],
  data() {
    return {
    }
  },
  methods: {

  },
}
</script>

<style scoped>

</style>
