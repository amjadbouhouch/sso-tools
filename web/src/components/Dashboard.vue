<template>
  <div>
    <v-container fluid="true">
      <h1>Welcome back<span v-if="user">, {{user.firstName}}</span></h1>

      <div class="d-block d-sm-flex mt-10">
        <div class="mr-sm-4 mb-4" style="max-width: 350px">
          <v-alert icon="mdi-party-popper" v-if="!loggedIn" class="mb-5">
            <h3>Want to help out?</h3>
            <p>SSO Tools is provided for free but costs money to maintain, build, and run. If you find it useful then you may like to consider supporting it!</p>
            <v-btn block class="mt-3 umami--click--support-button-dashboard" prepend-icon="mdi-coffee" href="https://ko-fi.com/wilw88" target="_blank" rel="noopener noreferrer">Buy me a coffee</v-btn>
          </v-alert>

          <v-alert v-if="loggedIn" color="primary" icon="mdi-flash">
            <h3>Thanks for being a member!</h3>
            <p>If you need any support with SSO Tools, or with connecting applications using SAML2, please get in touch with us.</p>
          </v-alert>

          <v-alert v-if="!loggedIn" color="orange-darken-3" >
            <h3>Hey! Listen!</h3>
            <p class="mb-4">You're currently using SSO Tools in sandbox mode as a non-member.</p>
            <p>This is fine but you'll lose access to your IDPs and other settings when your session ends. You can login or create a new account to save your work.</p>
            <div class="mt-5">
              <v-btn class="mr-2" color="teal" dark v-on:click="register">Register</v-btn>
              <v-btn v-on:click="login">Login</v-btn>
            </div>
          </v-alert>
        </div>

        <div class="flex-grow-1">
          <div style="text-align:center;margin-top:50px;" v-if="loading">
            <v-progress-circular indeterminate color="primary" :size="50"></v-progress-circular>
          </div>

          <div v-if="!idps.length && !loading" class="text-center">
            <h3 class="mb-5">You don't yet have any IdPs</h3>
            <v-btn to='/idps/new' color="primary">Create your first IdP</v-btn>
            <img :src="emptyImage" style="width:100%;max-width:400px;display:block;margin:20px auto;" />
          </div>

          <div v-if="idps.length">
            <div class="d-flex justify-space-between">
              <h2>Your IDPs</h2>
              <v-btn to='/idps/new' color="primary" v-if="idps.length">Create a new IDP</v-btn>
            </div>
            <div class="mt-10 d-flex flex-wrap">
              <div class="w-50 pa-2" v-for="idp in idps" :key="idp._id">
                <v-card :to="`/idps/${idp._id}`">
                  <v-card-title primary-title>
                    <h3 class="headline mb-0">{{idp.name}}</h3>
                  </v-card-title>
                  <v-card-text>https://idp.sso.tools/{{idp.code}}</v-card-text>
                  <v-card-actions>
                    <v-btn :to="`/idps/${idp._id}`" flat color="primary" prepend-icon="mdi-cog">Manage</v-btn>
                  </v-card-actions>
                </v-card>
              </div>
            </div>
          </div>
        </div>
      </div>

    </v-container>
  </div>
</template>

<script>
import api from '../api';
import emptyImage from '../assets/empty.png';

export default {
  name: 'Dashboard',
  data() {
    return {
      idps: [], emptyImage, loading: false
    }
  },
  computed: {
    user () {
      const user = this.$store.state.user;
      if (user)
        api.req('GET', `/idps`, null, resp => {
          this.idps = resp.idps;
        });
      return user;
    },
    loggedIn () {
      return this.$store.state.loggedIn;
    },
  },
  created (){
    let unsavedIdps = [];
    try { unsavedIdps = JSON.parse(localStorage.getItem('idps')); }
    catch (err) { unsavedIdps = []; }
    this.loading = true;
    api.req('GET', `/idps${(unsavedIdps && unsavedIdps.length) ? `?include=${unsavedIdps.join(',')}` : ''}`, null, resp => {
      this.idps = resp.idps;
      this.loading = false;
    });
  },
  methods: {
    register() {
      this.$store.commit('openRegister', true);
    },
    login() {
      this.$store.commit('openLogin', true);
    },
  },
}
</script>

<style scoped>

</style>
