<template>
  <div>
    <h1>A guide to implementing SAML2 single sign-on</h1>
    <p>Setting-up SAML2 for the first time might seem a daunting task, but once you understand the flow you'll be easily able to implement single sign-on for your apps in no time.</p>

    <v-alert class="mt-8 mb-5">
      <h3>TL;DR?</h3>
      <p v-if="idp">If you're already familiar with SAML2, then <router-link :to="`/idps/${idp._id}/saml`">check out the available settings</router-link> to get started.</p>
      <p v-if="!idp">If you're already familiar with SAML2, then you can simply check out the settings from your SSO Tools IdP dashboard to get started.</p>
      <v-btn v-if="!idp" class="mt-8" to="/idps/new" color="primary" prepend-icon="mdi-rocket">Get started</v-btn>
    </v-alert>

    <h3>SAML2 Overview</h3>
    <p>SAML2 (Security Assertion Markup Language version 2) is a protocol that allows a service to authenticate a user via a federated identity provider. For example, if you work at and have a user account at a university, then you can often access your email and learning portals without needing additional accounts for each service. Often, it is SAML2 in the background powering this seamless experience.</p>
    
    <p class="mt-4">Many modern applications today instead make use of OAuth2 (which is also supported by SSO Tools). However, SAML2 is still widely used -- particularly in enterprise contexts.</p>

    <p class="mt-4">Under SAML2 the user logs-in directly with their identity provider (IdP), and authorizes the IdP to reveal information about them to the app. Once authorized, the IdP embeds the user information into an <em>assertion</em>, which is sent to the service. The app never sees the username and password used to login and only receives the information provided by the assertion from the IdP.</p>

    <h3 class="mt-8">A simplified SAML2 flow</h3>
    <p>A user "logging-in" via SAML2 will cause the following steps to occur.</p>
    <ol class="mt-5">
      <li>The user visits the app (e.g. a website or mobile app). The app shows an option to login via SAML2 against an IdP (e.g. "Login with single sign-on").</li>
      <li>The user selects this option and is redirected to the IdP to authenticate themselves. The request to the IdP includes a SAML2 login request parameter. Usually the login process would involve logging-in with a username and password on an IdP webpage.</li>
      <li>After authentication and authorization, the user is redirected back to the app automatically, and the IdP includes an <em>assertion</em> as a SAML2 login response.</li>
      <li>The app reads the login response to access the information about the user revealed by the IdP.</li>
      <li>The app can then match or setup an account for the user, and  log the user in.</li>
    </ol>

    <h3 class="mt-8">Implementing the SAML2 flow in your app</h3>
    <p>The following steps describe how to implement a simplified SAML2 SSO setup in your app using an IdP, such as one provided by SSO Tools.</p>

    <h4 class="mt-5">Step 1: Create an IdP and an app declaration</h4>
    <p>In SSO Tools, follow the steps to create a new IdP and app (service provider). In this guide we'll assume your IdP's issuer (code) is `myidp`.</p>
    <p class="mt-4">When creating your app, you'll need to provide an Entity ID (to match the ID of the SAML2 app) and an ACS/consumer URL (the URL that the user will be redirected to after successful authentication). If you don't know this right away, you can always change it later.</p>

    <h4 class="mt-5">Step 2: Redirect the user to the IdP to authenticate</h4>
    <p>In your app, create a button or link that redirects the user to the IdP's "sign-on URL". In SSO Tools, these take the form of "https://idp.sso.tools/ISSUER/saml/login/request", replacing "ISSUER" with the issuer code for your IdP (e.g. "myidp").</p>
    <p class="mt-4">Along with this request, you'll have to include some additional query parameters:</p>
    <ul class="mt-4">
      <li>`SAMLRequest`: The base64-encoded XML of the login request. See <a href="https://en.wikipedia.org/wiki/SAML_2.0#Authentication_Request_Protocol" target="_blank">this Wikipedia article</a> for more information.</li>
    </ul>
    <p class="mt-4">As such, an example request to redirect the user to on SSO Tools could look like the following:</p>
    <p class="mt-4">https://idp.sso.tools/myidp/saml/login/request?SAMLRequest=fZFfa8IwFMXfBb9DyXvaJtZ1...</p>

    <h4 class="mt-5">Step 3: The user authenticates</h4>
    <p>Your app can relax for a bit now, since the IdP now takes over in handling the user's authentication.</p>

    <h4 class="mt-5">Step 4: Receive the user back after authentication</h4>
    <p>Assuming all went well with the authentication, the IdP will now redirect the user back to your app by performing a HTTP POST request to the ACS URL you specified earlier. If you don't yet have an endpoint to handle this, then you should create one now and ensure this is registered for the ACS field in the app on SSO Tools.</p>
    <p class="mt-4">The POST request will include a `SAMLResponse` parameter. The value for this will be a base64-encoded XML structure, that can be read by your service's endpoint to find the information about the user.</p>
    <p class="mt-4">Using this information, your app can now either lookup an existing user, or create a new one, log that user in, and then redirect them to an appropriate page on your app.</p>

  </div>
</template>

<script>
export default {
  name: 'IDPSaml2',
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
