<template>
  <div>
    <v-container class="ml-auto mr-auto" style="max-width: 600px">
          <div v-if="page === 0">
            <div style="text-align:center; margin-bottom: 30px;">
              <h1 class="mb-10">Create a new identity provider (IdP)</h1>
              <p>IdPs are the core of the single sign-on system. They maintain user identities (profile information and passwords) and are where the actual user authentication takes place.</p>
              <p>You can connect your apps (service providers) to your IdP in order to give them single sign-on functionality.</p>
            </div>

            <h3>Name</h3>
            <p>A human-friendly identifier you can use to recognise the IdP.</p>
            <v-text-field v-model="name" label="Friendly name" required autofocus ></v-text-field>

            <h3>Issuer name</h3>
            <p>This is a unique machine-friendly name (letters and numbers only) for your IdP. We'll use this to host your IdP on the internet, and it can always be changed later.</p>
            <v-text-field v-model="code" label="Issuer" required placeholder="myidp" prefix="https://idp.sso.tools/" ></v-text-field>

            <v-alert type="info" :value="true" v-if="!loggedIn">
              <h3>Not logged-in</h3>
              <p>You're currently in the SSO Tools sandbox, which means that if you end your browser session you'll lose access to your IdP. If you want to come back to continue working on this IdP at a later date, we recommend creating an account to secure it and to save your progress.</p>
            </v-alert>

            <v-alert type="error" v-if="error">
              <h3>Could not create IdP</h3>
              <p>{{error}}</p>
            </v-alert>
            <div style="text-align:center;margin-top:20px;">
              <v-btn :loading="creating" color='primary' v-on:click="create">Next</v-btn>
            </div>
          </div>

          <div v-if="page === 1" style="text-align:center;">

            <h4>Step 2</h4>
            <h1>Register a user</h1>
            <p>Register a user with {{name}}. This user will be able to login via your IdP and access your connected apps.</p>
            <p>You can always add more users later.</p>

            <p class="mt-10"><strong>Note that you cannot use your normal SSO Tools account to authenticate against your IdP.</strong> You can safely use dummy information for your users, since we won't be emailing them!</p>

            <div class="d-block d-sm-flex flex-wrap mt-10 mb-10">
                <v-text-field class="mr-2" autofocus v-model="newUser.firstName" label="First name" required placeholder="Jane"></v-text-field>
                <v-text-field class="mr-2" v-model="newUser.lastName" label="Last name" required placeholder="Doe"></v-text-field>
                <v-text-field class="mr-2" v-model="newUser.email" label="Email address" required placeholder="jane@example.com"></v-text-field>
                <v-text-field class="mr-2" v-model="newUser.password" label="Account password" required type='password' placeholder="password"></v-text-field>
            </div>
            <v-btn @click="skip" class="mr-2">Skip this step</v-btn>
            <v-btn :loading="creating" color='primary' v-on:click="createUser">Next</v-btn>
          </div>

          <div v-if="page === 2" style="text-align:center;">
            <h4>Step 3</h4>
            <h1>Create an app</h1>
            <p>If you already have an app you'd like to connect to SSO Tools, you can add it below.</p>
            <p>You can find and modify its SSO settings later.</p>

            <div class="d-block d-sm-flex flex-wrap mt-10 mb-10">
              <v-text-field class="mr-2" label="Friendly name" required autofocus v-model="newSP.name" hint="To help you identify this SP." placeholder="My Service"/>
              <v-text-field label="Service URL" v-model="newSP.serviceUrl" hint="Your app's URL" placeholder="https://myapp.com"/>
            </div>
            <v-btn @click="skip" class="mr-2">Skip this step</v-btn>
            <v-btn :loading="creating" color='primary' v-on:click="createSP">Next</v-btn>
          </div>

          <div v-if="page === 3" class="w-100 mt-15 ml-auto mr-auto text-center">
            <h1>All done!</h1>
            <p>Your new IdP is ready.</p>

            <h3 class="ma-10">What would you like to do now?</h3>

            <div class="mb-5"> <v-btn color='primary' :to="`/idps/${this._id}`">View IdP</v-btn></div>

            <div class="d-block d-sm-flex flex-wrap mt-10 justify-center">
              <v-btn class="ma-2" fluid :to="`/idps/${this._id}/saml`">View SAML2 setup</v-btn>
              <v-btn class="ma-2" :to="`/idps/${this._id}/users`">Add more users</v-btn>
              <v-btn class="ma-2" :to="`/idps/${this._id}/sps`">Manage apps</v-btn>
            </div>
          </div>

    </v-container>

  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'NewIDP',
  data() {
    return {
      page: 0,
      _id: null,
      name: 'Untitled IdP',
      code: '',
      newUser: {firstName: '', lastName: '', email: '', password: ''},
      newSP: { name: '', entityId: '', serviceUrl: '', callbackUrl: '', logoutUrl: '', logoutCallbackUrl: '' },
      error: null,
      creating: false,
    }
  },
  computed: {
    loggedIn() { return this.$store.state.loggedIn; }
  },
  methods: {
    skip () {
      this.page = this.page + 1;
    },
    create (event) {
      if (this.name && this.code) {
        this.error = null;
        this.creating = true;
        const data = {name: this.name, code: this.code};
        api.req('POST', '/idps', data, resp => {
          //this.$router.push('/dashboard');
          this.page = this.page + 1;
          this.creating = false;
          this._id = resp._id;
          if (!this.$store.state.loggedIn) {
            const storedIdps = localStorage.getItem('idps');
            let idps = [];
            if (storedIdps) idps = JSON.parse(storedIdps);
            idps.push(resp._id);
            localStorage.setItem('idps', JSON.stringify(idps));
          }
        }, err => {
          this.error = err.message;
          this.creating = false;
        });
      }
    },
    createUser () {
      const { firstName, lastName, email, password } = this.newUser;
      const data = {firstName, lastName, email, password};
      if (firstName && lastName && email && password) {
        this.creating = true;
        api.req('POST', `/idps/${this._id}/users`, data, resp => {
          this.creating = false;
          this.page = this.page + 1;
        }, err => {
          this.creating = false;
        });
      }
    },
    createSP (event) {
      const { name, entityId, serviceUrl, callbackUrl, logoutUrl, logoutCallbackUrl } = this.newSP;
      const data = {name, entityId, serviceUrl, callbackUrl, logoutUrl, logoutCallbackUrl};
      this.creating = true;
      api.req('POST', `/idps/${this._id}/sps`, data, resp => {
        this.creating = false;
        this.page = this.page + 1;
      }, err => {
        this.creating = false;
      });
    },
  },
}
</script>

<style scoped>

</style>
