<template>
  <div id="app">
    <v-app class="d-flex flex-row">

      <div class="d-flex justify-space-between align-center pl-4 pr-4 pt-2 pb-2 bg-indigo-lighten-5">
        <div>
          <router-link :to="loggedIn ? '/dashboard' : '/'">
            <img :src="logo" style="height:50px;"/>
          </router-link>
        </div>
        <div class="d-none d-sm-flex align-center">
          <div>
            <v-btn color='indigo-lighten-2' class='mr-2 umami--click--support-button-navbar' variant='outlined' prepend-icon="mdi-party-popper" v-if="loggedIn" href="https://ko-fi.com/wilw88" target="_blank" rel="noopener noreferrer">Support SSO Tools</v-btn>
            <v-btn flat to="/dashboard" class="mr-4" color="primary" variant='outline'>Dashboard</v-btn>
            <v-btn color='indigo-lighten-2' flat icon v-if="loggedIn">
              <v-icon icon="mdi-account" />
              <v-menu activator="parent">
                <v-list>
                  <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>{{user.firstName}} {{user.lastName}}</v-list-item-title>
                        <v-list-item-sub-title class="text-grey">{{user.email}}</v-list-item-sub-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>

                  <v-divider></v-divider>

                  <v-list>
                    <v-list-item to='/account'>
                      <v-list-item-icon><v-icon icon="mdi-cogs" class="mr-2"/></v-list-item-icon>
                      <v-list-item-content>Account</v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="logout">
                      <v-list-item-icon><v-icon icon="mdi-power" class="mr-2"/></v-list-item-icon>
                      <v-list-item-content>Logout</v-list-item-content>
                    </v-list-item>
                </v-list>
              </v-menu>
            </v-btn>

            <v-btn class="mr-2" flat v-on:click="openLogin" v-if="!loggedIn">Login</v-btn>
            <v-btn color="teal" dark v-on:click="openRegister" v-if="!loggedIn">Create a free account</v-btn>
          </div>
        </div>
      </div>

      <div class="flex-grow-1">
        <router-view></router-view>
      </div>

      <v-footer class="bg-indigo-lighten-1 mt-10 d-block d-sm-flex justify-space-between flex-grow-0">
        <img :src="logoLight" style="height:50px;"/>
        <div>
          <v-btn size='small' class="ma-1 umami--click--support-button-footer" prepend-icon="mdi-party-popper" href="https://ko-fi.com/wilw88" target="_blank" rel="noopener noreferrer">Support SSO Tools</v-btn>
          <v-btn size='small' variant='outlined' dark href='https://git.wilw.dev/wilw/sso-tools' target='_blank' rel='noopener noreferrer' class="ma-1">Source code</v-btn>
          <v-btn size='small' variant='outlined' dark to='/privacy' class="ma-1">Privacy Policy</v-btn>
          <v-btn size='small' variant='outlined' dark to="/terms" class="ma-1">Terms of Use</v-btn>
        </div>
      </v-footer>

      <v-dialog v-model="registerOpen" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Create a free account</span>
          </v-card-title>
          <v-card-text>
            <h4>Welcome to SSO Tools!</h4>
            <p>Registering takes less than a minute and we'll automatically associate the IDPs and other settings you've already setup with your new account.</p>

            <div class="d-flex mt-5">
              <v-text-field class="mr-2" label="First name" required autofocus v-model="newUser.firstName"/>
              <v-text-field label="Last name" v-model="newUser.lastName" />
            </div>
            <div class="d-flex mt-5">
              <v-text-field class="mr-2" type="email" label="Email address" v-model="newUser.email" />
              <v-text-field :type="showPassword ? 'text' : 'password'" hint="At least 8 characters" label="Password" v-model="newUser.password" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="toggleShowPassword"/>
            </div>

            <v-card>
              <v-card-text>
                <p>We collect this information from you for the sole purpose of creating and maintaining your account, and it will not be used for marketing purposes without your consent. Our Privacy Policy describes how we process your data in more detail.</p>
                <div class="d-flex mt-5">
                  <v-btn class="mr-2" to="/privacy" @click="closeRegister">Privacy Policy</v-btn>
                  <v-btn to="terms" @click="closeRegister">Terms of Use</v-btn>
                </div>
                <p class="mt-5">Please indicate below that you have read and you agree to the Privacy Policy and Terms of Use (the "terms").</p>
                <v-checkbox v-model="newUser.termsAgreed" label="I have read and agree to the terms" required></v-checkbox>
              </v-card-text>
            </v-card>

            <v-alert class="mt-5" v-if="registerError" type="error">
              <h4>Unable to register this account</h4>
              <p>{{registerError}}</p>
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="closeRegister">Cancel</v-btn>
            <v-btn color="primary" @click="register" :loading="registering">Register</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="loginOpen" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Login to your SSO Tools account</span>
          </v-card-title>
          <v-card-text>
            <p>Welcome back!</p>
            <div class="d-flex mt-5">
              <v-text-field class="mr-2" type="email" label="Email address" v-model="loginData.email" />
              <v-text-field type="password" label="Password" @keyup.enter="login" v-model="loginData.password" />
            </div>
            <div class="d-flex justify-end mb-5">
              <v-btn @click="forgotPassword" flat>Forgotten your password?</v-btn>
            </div>

            <v-alert v-if="loginError" type="error">
              <h4>Unable to login</h4>
              <p>{{loginError}}</p>
            </v-alert>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="closeLogin">Cancel</v-btn>
            <v-btn color="primary" @click="login" :loading="loggingIn">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="forgottenPasswordOpen" persistent max-width="500px">
        <v-card>
          <v-card-title>
            <span class="headline">Forgotten your SSO Tools password?</span>
          </v-card-title>
          <v-card-text>
            <p>No problem. Enter the email address of your account below, and if it exists we'll send a password-reset link to you.</p>
            <v-text-field class="mt-5" type="email" label="Email address" v-model="loginData.email" />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="forgottenPasswordOpen = false">Cancel</v-btn>
            <v-btn color="primary" @click="resetPassword" :loading="resettingPassword">Send me a reset link</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-app>
  </div>
</template>

<script>
import logo from './assets/logo.png';
import logoLight from './assets/logo_light.png';
import api from './api';

export default {
  name: 'app',
  data() {
    return {
      logo, logoLight,
      currentYear: (new Date()).getFullYear(),
      newUser: {firstName: '', lastName: '', email: '', password: '', termsAgreed: false},
      loginData: {email: '', password: ''},
      registering: false,
      registerError: null,
      loggingIn: false,
      loginError: null,
      showPassword: false,
      forgottenPasswordOpen: false,
      resettingPassword: false,
    }
  },
  computed: {
    loggedIn () {
      return this.$store.state.loggedIn;
    },
    user () {
      return this.$store.state.user;
    },
    registerOpen() {
      return this.$store.state.registerOpen;
    },
    loginOpen() {
      return this.$store.state.loginOpen;
    }
  },
  created() {
    const token = localStorage.getItem('apiToken');
    if (token && token !== 'null') this.onLogin(token);
  },
  methods: {
    openRegister() {
      this.$store.commit('openRegister', true);
    },
    closeRegister() {
      this.$store.commit('openRegister', false);
    },
    openLogin() {
      this.$store.commit('openLogin', true);
    },
    closeLogin() {
      this.$store.commit('openLogin', false);
    },
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },
    onLogin(token) {
      this.$store.commit('openLogin', false);
      this.$store.commit('openRegister', false);
      this.$store.commit('login', true);
      localStorage.setItem('apiToken', token);
      api.token = token;
      api.req('GET', '/users/me', null, u => this.$store.commit('setUser', u), () => this.logout());
      this.$router.push('/dashboard');
    },
    login() {
      const { email, password } = this.loginData;
      this.loggingIn = true;
      this.loginError = null;
      let idpsToClaim = [];
      try { idpsToClaim = JSON.parse(localStorage.getItem('idps')); }
      catch (err) { idpsToClaim = []; }

      api.req('POST', '/accounts/sessions', { email, password, idpsToClaim }, ({ token }) => {
        this.loggingIn = false;
        this.onLogin(token);
        localStorage.removeItem('idps');
        this.loginData.password = '';
      }, err => {
        this.loggingIn = false;
        this.loginError = err.message;
      });
    },
    register() {
      const { firstName, lastName, email, password, termsAgreed } = this.newUser;
      if (!termsAgreed) {
        this.registerError = 'We require that you agree to the Privacy Policy and Terms of Use in order to create your account.';
        return;
      }
      this.registering = true;
      this.registerError = null
      let idpsToClaim = [];
      try { idpsToClaim = JSON.parse(localStorage.getItem('idps')); }
      catch (err) { idpsToClaim = []; }
      api.req('POST', '/accounts', { firstName, lastName, email, password, idpsToClaim }, ({ token }) => {
        this.registering = false;
        this.onLogin(token);
        localStorage.removeItem('idps');
        this.newUser.password = '';
        this.newUser.termsAgreed = false;
      }, err => {
        this.registering = false;
        this.registerError = err.message;
      });
    },
    logout() {
      api.token = null;
      localStorage.removeItem('apiToken');
      this.$store.commit('setUser', null);
      this.$store.commit('login', false);
      this.$router.push('/');
    },
    forgotPassword() {
      this.forgottenPasswordOpen = true;
      this.closeRegister();
      this.closeLogin();
    },
    resetPassword() {
      this.resettingPassword = true;
      api.req('POST', '/accounts/password/reset', { email: this.loginData.email }, () => {
        this.resettingPassword = false;
        this.forgottenPasswordOpen = false;
      }, () => {
        this.resettingPassword = false;
      });
    },
  }
}
</script>

<style>

</style>
