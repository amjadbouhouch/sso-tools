<template>
  <div>
    <v-card>
      <v-card-title primary-title><h3>Basic information</h3></v-card-title>

      <v-card-text>
        <h5>IDP host</h5>
        <p>The URL of your IDP on the Internet. This forms the basis of your <router-link :to="`/idps/${idp._id}/saml`">SSO configuration</router-link>.</p>
        <v-text-field :model-value="`https://idp.sso.tools/${idp.code}`" label="IDP host" variant="solo" readonly/>

        <h5>SAML2 configuration</h5>
        <v-btn :to='`/idps/${idp._id}/saml`'>See SAML2 configuration</v-btn>
      </v-card-text>
    </v-card>
    <div style="margin-bottom:20px;" />

    <v-card>
      <v-card-title primary-title><h3>Delete IDP</h3></v-card-title>
      <v-card-text>Deleting this IDP will immediately and irreversibly remove the Identity Provider, its registered Service Providers, and any users associated with the IDP.</v-card-text>
      <v-card-actions>
        <v-btn v-on:click="deleteIDP" color='red'>Delete</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleting" max-width="290">
      <v-card>
        <v-card-title class="headline">Really delete this IDP?</v-card-title>
        <v-card-text>This will immediately de-register this IDP's Service Provider information, users, and other settings before deleting the Identity Provider.</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleting = false">Cancel</v-btn>
          <v-btn :loading="deletingProgress" dark color="green darken-1" @click="deleteConfirm">Delete IDP</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPHome',
  props: ['idp'],
  data() {
    return {
      deleting: false,
      deletingProgress: false,
    }
  },
  methods: {
    deleteIDP (){
      this.deleting = true;
    },
    deleteConfirm (event) {
      this.deletingProgress = true;
      api.req('DELETE', `/idps/${this.$route.params.id}`, null, resp => {
        this.deletingProgress = false;
        this.deleting = false;
        this.$router.push('/dashboard');
      }, err => {
        console.log(err);
        this.deletingProgress = false;
      });
    }
  },
}
</script>

<style scoped>

</style>
