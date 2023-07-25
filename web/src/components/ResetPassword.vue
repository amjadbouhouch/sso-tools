<template>
  <v-container>
    <h1>Reset your password</h1>
    <h3>Welcome to SSO Tools Password Reset.</h3>
    <p>To continue, please enter a new password for your account in the field below.</p>

    <div v-if="!success">
      <v-text-field :type="showPassword ? 'text' : 'password'" label="Password" v-model="password" :append-icon="showPassword ? 'visibility' : 'visibility_off'" @click:append="showPassword = !showPassword"/>

      <v-alert :value="error" type="error">
        <h4>Unable to set the password</h4>
        <p>{{error}}</p>
      </v-alert>

      <v-btn :loading="settingPassword" color="primary" @click="setPassword">Set new password</v-btn>
    </div>

    <v-alert :value="success" type="success">
      <h4>Password updated successfully</h4>
      <p>When you're ready, you can login with your new password.</p>
      <v-btn color="primary" @click="e => $store.commit('openLogin', true)">Login</v-btn>
    </v-alert>
  </v-container>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      showPassword: false,
      password: '',
      error: null,
      settingPassword: false,
      success: false
    }
  },
  methods: {
    setPassword() {
      this.settingPassword = true;
      this.error = null;
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      api.req('PUT', '/accounts/password', { newPassword: this.password, token }, () => {
        this.settingPassword = false;
        this.success = true;
      }, (err) => {
        this.settingPassword = false;
        this.error = err.message;
      });
    }
  }
}
</script>
