<template>
  <v-container>
    <h1>Your account</h1>

    <v-card class="mt-10">
      <v-card-title><span class="headline">About you</span></v-card-title>
      <v-card-text>
        <div class="d-flex mt-5">
          <v-text-field class="mr-2" label="First name" v-model="user.firstName" />
          <v-text-field label="Last name" v-model="user.lastName" />
        </div>
        <div class="d-flex mt-2">
          <v-text-field class="w-50" label="Email address" v-model="user.email"/>
        </div>
        <p>Please note that if you change your email address we will notify both your old and new addresses.</p>
        <v-alert v-if="error" type="error">
          <h4>Unable to update your profile</h4>
          <p>{{error}}</p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :loading="savingProfile" color="primary" @click="saveProfile">Save changes</v-btn>
      </v-card-actions>
    </v-card>

    <v-card class="mt-10">
      <v-card-title><span class="headline">Password</span></v-card-title>
      <v-card-text>
        <p>Change the password associated with your SSO Tools account. This does not affect the accounts of any IDP users you may manage.</p>
        <div class="d-flex mt-5">
          <v-text-field class="mr-2" type="password" label="Current password" v-model="currentPassword" />
          <v-text-field :type="showPassword ? 'text' : 'password'" label="New password (8+ characters)" v-model="newPassword" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showPassword = !showPassword"/>
        </div>
        <v-alert v-if="passwordError" type="error">
          <h4>Unable to change your password</h4>
          <p>{{passwordError}}</p>
        </v-alert>
        <v-alert v-if="passwordSuccess" type="success">
          <h4>Password updated successfully</h4>
          <p>Use your new password next time you login.</p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :loading="savingPassword" color="primary" @click="savePassword">Save password</v-btn>
      </v-card-actions>
    </v-card>

    <v-card class="mt-10">
      <v-card-title><span class="headline">Delete your account</span></v-card-title>
      <v-card-text>
        <p>If you delete your SSO Tools account, we'll also delete your account content. This includes Identity Providers, Service Providers, and any IdP users you have created.</p>
        <p>To continue, please enter your account password.</p>
        <v-text-field class="mt-5" type="password" label="Current password" v-model="deletePassword" />
        <v-alert v-if="deleteError" type="error">
          <h4>Unable to delete your account</h4>
          <p>{{deleteError}}</p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :loading="deleting" color="error" @click="deleteAccount">Delete account</v-btn>
      </v-card-actions>
    </v-card>

  </v-container>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      error: null,
      savingProfile: false,
      currentPassword: '',
      newPassword: '',
      showPassword: false,
      savingPassword: false,
      passwordError: null,
      passwordSuccess: false,
      deletePassword: '',
      deleteError: null,
      deleting: false,
      user: {},
    }
  },
  computed: {
    storedUser () {
      return this.$store.state.user;
    },
  },
  created() {
    this.user = Object.assign({}, this.$store.state.user);
  },
  methods: {
    saveProfile() {
      this.savingProfile = true;
      this.error = null;
      const { firstName, lastName, email } = this.user;
      api.req('PUT', `/users/${this.$store.state.user._id}`, { firstName, lastName, email }, (user) => {
        this.savingProfile = false;
        this.$store.commit('updateProfile', user);
      }, (err) => {
        this.savingProfile= false;
        this.error = err.message;
      });
    },
    savePassword() {
      this.savingPassword = true;
      this.passwordError = null;
      this.passwordSuccess = false;
      const { currentPassword, newPassword } = this;
      api.req('PUT', `/accounts/password`, { currentPassword, newPassword }, () => {
        this.savingPassword = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.passwordSuccess = true;
      }, (err) => {
        this.savingPassword = false;
        this.passwordError = err.message;
      });
    },
    deleteAccount() {
      if (!window.confirm('Really delete your account? This cannot be un-done.')) return;
      this.deleting = true;
      this.deleteError = null;
      const { deletePassword } = this;
      api.req('DELETE', `/accounts`, { password: deletePassword }, () => {
        this.deleting = false;
        this.deletePassword = '';
        api.token = null;
        localStorage.removeItem('apiToken');
        this.$store.commit('setUser', null);
        this.$store.commit('login', false);
        this.$router.push('/');
      }, (err) => {
        this.deleting = false;
        this.deleteError = err.message;
      });
    }
  }
}
</script>
