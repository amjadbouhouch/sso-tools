<template>
  <div>
    <h3>Friendly name</h3>
    <p>This is the name given to your IDP so that you can recognise it. It's also the name shown to <router-link :to="`/idps/${idp._id}/users`">users who authenticate against this IDP</router-link>.</p>
    <v-text-field v-model="idp.name" label="Friendly name"/>

    <h3>Code (issuer)</h3>
    <p>A globally unique machine-friendly (alphanumeric) code to identify this IDP on SSO Tools. We derive the issuer and other SSO information from this code, so you may need to update other configurations elsewhere if you do change it.</p>
    <v-text-field v-model="idp.code" label="Code" />

    <v-btn color='primary' :loading="saving" v-on:click="save">Save changes</v-btn>

    <v-snackbar v-model="snackbar" :timeout="2000" >Settings saved</v-snackbar>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPSettings',
  props: ['idp'],
  data() {
    return {
      snackbar: false,
      saving: false,
    }
  },
  methods: {
    save() {
      const { name, code } = this.idp;
      const data = { name, code };
      this.saving = true;
      api.req('PUT', `/idps/${this.idp._id}`, { name, code }, resp => {
        this.$emit('onUpdateIdp', resp);
        this.snackbar = true;
        this.saving = false;
      }, err => {
        this.saving = false;
      });
    },
  },
}
</script>

<style scoped>

</style>
