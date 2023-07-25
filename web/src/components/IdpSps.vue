<template>
  <div>
    <p>Register an app (e.g. your website or mobile app) here in order to connect it to your IdP.</p>

    <v-alert class="mt-5" icon="mdi-information">Users registered with this IdP will only be able to access the apps listed below.</v-alert>

    <div class="d-flex justify-end mt-5 mb-b">
      <v-btn color='primary' v-on:click="openDialog" prepend-icon="mdi-plus">New app</v-btn>
    </div>

    <v-table :items="sps" v-if="sps.length">
      <thead>
        <tr>
          <th>App name</th>
          <th>SAML2 configuration</th>
          <th>OAuth2 configuration</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="app in sps"  key="app._id">
          <td>{{app.name}} <br />
            <span class="text-grey">{{app.serviceUrl}}</span>
          </td>
          <td>
            <span v-if="app.entityId">EntityID: {{app.entityId}}</span>
            <span v-if="app.callbackUrl"><br />Consumer: {{app.callbackUrl}}</span>
            <span v-if="app.logoutUrl"><br />Logout: {{app.logoutUrl}}</span>
            <span v-if="app.logoutCallbackUrl"><br />Logout callback: {{app.logoutCallbackUrl}}</span>
          </td>
          <td>
            <v-alert size="small" v-if="!app.oauth2ClientId">
              This app was not created with a OAuth2 configuration.
            </v-alert>
            <span v-if="app.oauth2ClientId">Client ID: {{app.oauth2ClientId}}</span>
            <span v-if="app.oauth2ClientSecret"><br />Client secret: {{app.oauth2ClientSecret}}</span>
            <span v-if="app.oauth2RedirectUri"><br />Redirect URI: {{app.oauth2RedirectUri}}</span>
          </td>
          <td>
            <v-btn flat>
              Manage
              <v-menu activator="parent">
                <v-list>
                  <v-list-item v-on:click="e => editSp(app)" prepend-icon="mdi-pencil">
                    <v-list-item-content>Update</v-list-item-content>
                  </v-list-item>
                  <v-list-item v-on:click="e => deleteSp(app._id)" prepend-icon="mdi-delete">
                    <v-list-item-content>Delete</v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{editing ? 'Edit app': 'Register an app for use with this IDP'}}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field class="mb-2" label="Human-readable name" required autofocus v-model="newSP.name" hint="To help you identify this app." placeholder="My Service"/>
          <v-text-field class="mb-2" label="Service URL" v-model="newSP.serviceUrl" hint="The URL used to access your service. For example, for a webapp, you can just use your website URL." placeholder="https://sp.example.com"/>

          <h3 class="mb-2">SAML2 settings (optional)</h3>
          <v-text-field class="mb-2" label="EntityID" v-model="newSP.entityId" hint="This is a URL to uniquely identify your service. It is sometimes the same as the metadata URL." placeholder="https://sp.example.com/metdadata"/>
          <v-text-field class="mb-2" label="ACS URL" v-model="newSP.callbackUrl" hint="Assertion Consumer Service, or callback URL using the HTTP POST binding." placeholder="https://sp.example.com/callback"/>
          <v-text-field class="mb-2" label="Logout URL" v-model="newSP.logoutUrl" hint="The URL we will redirect IDP-initiated logout requests to." placeholder="https://sp.example.com/logout"/>
          <v-text-field class="mb-2" label="Logout callback URL" v-model="newSP.logoutCallbackUrl" hint="The URL we will redirect users to after an SP-initiated logout." placeholder="https://sp.example.com/logout/callback"/>

          <h3 class="mb-2">OAuth2 settings (optional)</h3>
          <v-text-field class="mb-2" label="Redirect URI" v-model="newSP.oauth2RedirectUri" hint="The URI users will be redirected to after successful authorization." placeholder="https://myapp.com/oauth/callback"/>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="create">{{editing ? 'Save': 'Create'}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPSPs',
  props: ['idp'],
  data() {
    return {
      sps: [],
      loadingSps: false,
      tableHeaders: [{ text: 'Name' }, { text: 'URLs' }, { text: '' }],
      newSP: { name: '', entityId: '', serviceUrl: '', callbackUrl: '', logoutUrl: '', logoutCallbackUrl: '',  oauth2RedirectUri: ''},
      dialog: false,
      editing: false,
    }
  },
  created () {
    this.loadingSps = true;
    api.req('GET', `/idps/${this.idp._id}/sps`, null, resp => {
      this.sps = resp.sps;
      this.loadingSps = false;
    }, err => console.log(err));
  },
  methods: {
    openDialog (event) {
      this.dialog = true;
      this.editing = false;
      this.newSP = { name: '', entityId: '', serviceUrl: '', callbackUrl: '', logoutUrl: '', logoutCallbackUrl: '', oauth2RedirectUri: '' };
    },
    create (event) {
      const { _id, name, entityId, serviceUrl, callbackUrl, logoutUrl, logoutCallbackUrl, oauth2RedirectUri } = this.newSP;
      const data = {name, entityId, serviceUrl, callbackUrl, logoutUrl, logoutCallbackUrl, oauth2RedirectUri};
      if (_id && this.editing) {
        api.req('PUT', `/idps/${this.idp._id}/sps/${_id}`, data, resp => {
          this.sps.map(s => {
            if (s._id === _id) return resp;
            return s;
          });
          this.dialog = false;
          this.editing = false;
        }, err => console.log(err));
      } else {
        api.req('POST', `/idps/${this.idp._id}/sps`, data, resp => {
          this.sps.push(resp);
          this.dialog = false;
        }, err => console.log(err));
      }
    },
    editSp(sp) {
      this.dialog = true;
      this.editing = true;
      this.newSP = sp;
    },
    deleteSp(id) {
      api.req('DELETE', `/idps/${this.idp._id}/sps/${id}`, null, resp => {
        this.sps = this.sps.filter(u => u._id !== id);
      }, err => console.log(err));
    },
  },
}
</script>

<style scoped>

</style>
