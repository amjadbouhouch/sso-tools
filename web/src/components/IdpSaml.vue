<template>
  <div>
    <p>You can use the details below to configure your SAML2-compatibile service providers to use this IdP as an identity source.</p>
    <v-alert type="info" class="mt-5">To start using a service provider with this IdP you will also need to register it on the <router-link style="color:white;" :to="`/idps/${idp._id}/sps`">Connected apps</router-link> page.</v-alert>
    
    <v-alert color="green" class="mt-5">For help in getting started with implementing SAML2, check out the <router-link style="color:white;" :to="`/idps/${idp._id}/saml/guide`">SAML2 guide</router-link>.</v-alert>

    <div style="margin-top:20px;" />
    <v-text-field readonly label="Sign-on URL (single login service through the HTTP redirect binding)" :model-value="`https://idp.sso.tools/${idp.code}/saml/login/request`" />
    <v-text-field readonly label="Logout URL (single logout service through the HTTP redirect binding)" :model-value="`https://idp.sso.tools/${idp.code}/saml/logout/request`" />
    <v-textarea :model-value="idp.saml.certificate" label="Signing certificate" readonly rows="6" style="font-size:11px;"/>
    <v-alert type="info" class="mt-5">
      <h4>Self-signed certificates</h4>
      <p>Please note that SSO Tools only issues self-signed certificates. This means that you may need to turn off signature validation on your service provider.</p>
    </v-alert>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPSAML',
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
