<template>
  <div>
    <p>Below you'll find the latest requests and responses logged by SSOTools for your IdP. Requests are logged in JSON format and are encoded into XML for SAML2 transport.</p>
    <v-alert class="mt-5" type="info">Checking the logs can be useful in debugging your SSO setup. You can use it to compare against what you are sending or receiving in your application.</v-alert>

    <v-btn v-on:click="fetchLogs" class="mt-10 mb-5" prepend-icon="mdi-refresh">Refresh logs</v-btn>

    <v-alert v-if="!logs.length" :value="true" border="left" color="blue-grey" dark>No requests have been logged against this IdP yet.</v-alert>

    <v-card v-for="log in logs" :key="log._id" style="padding: 5; margin-bottom: 15px">
      <v-card-title>
        <div class="d-flex justify-space-between">
          <p class="mr-2">{{formatDate(log.createdAt)}}</p>
          <p class="mr-2">{{log.spName || log.sp}}</p>
          <p>{{log.type}}</p>
        </div>
      </v-card-title>
      <v-card-text>
          <textarea readonly rows="10" style="width: 100%; font-size: 8; font-family: monospace;" v-model="log.formattedData" />
      </v-card-text>
    </v-card>

  </div>
</template>

<script>
import api from '../api';
import moment from 'moment';

export default {
  name: 'IDPLogs',
  props: ['idp'],
  data() {
    return {
      logs: [],
      loadingLogs: false,
      tableHeaders: [{ text: 'Date and time' }, { text: 'Service' }, { text: 'Type' }, { text: 'Data' }],
    }
  },
  created () {
    this.fetchLogs();
  },
  methods: {
    fetchLogs() {
      this.loadingLogs = true;
      api.req('GET', `/idps/${this.idp._id}/saml2/logs`, null, resp => {
        this.logs = resp.logs;
        this.logs.forEach(l => l.formattedData = JSON.stringify(l.data, null, 2));
        this.loadingLogs = false;
      }, err => console.log(err));
    },
    formatDate(date) {
      return moment(date).format('L HH:mm:ss');
    }
  },
}
</script>

<style scoped>

</style>
