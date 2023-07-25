<template>
  <div>
    <v-container>
      <h3>Manage Identity Provider</h3>
      <h1 class="mb-10">{{idp && idp.name}}</h1>

      <div class="d-block d-sm-flex">
        <div class="mb-10">
          <v-card v-if="idp">
            <v-list>
              <v-list-item exact :to="`/idps/${idp._id}`" prepend-icon="mdi-home">
                <v-list-item-content>Overview</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/settings`" prepend-icon="mdi-cogs">
                <v-list-item-content>Settings</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/users`" prepend-icon="mdi-account-group">
                <v-list-item-content>Users</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/sps`" prepend-icon="mdi-power-plug">
                <v-list-item-content>Connected apps</v-list-item-content>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item :to="`/idps/${idp._id}/saml`" prepend-icon="mdi-swap-horizontal">
                <v-list-item-content>SAML2 configuration</v-list-item-content>
              </v-list-item>
              
              <v-list-item :to="`/idps/${idp._id}/saml/guide`" prepend-icon="mdi-lifebuoy">
                <v-list-item-content>SAML2 setup guide</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/saml/logs`" prepend-icon="mdi-format-list-bulleted">
                <v-list-item-content>SAML2 logs</v-list-item-content>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item :to="`/idps/${idp._id}/oauth`" prepend-icon="mdi-swap-horizontal">
                <v-list-item-content>OAuth2 configuration</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/oauth/guide`" prepend-icon="mdi-lifebuoy">
                <v-list-item-content>OAuth2 setup guide</v-list-item-content>
              </v-list-item>

              <v-list-item :to="`/idps/${idp._id}/oauth/logs`" prepend-icon="mdi-format-list-bulleted">
                <v-list-item-content>OAuth2 logs</v-list-item-content>
              </v-list-item>
              </v-list>
          </v-card>

          <v-btn block class="mt-5" :href="`https://idp.sso.tools/${idp?.code}`" target="_blank" prepend-icon="mdi-open-in-new">Open IdP dashboard</v-btn>
        </div>

        <div class="ml-sm-5" style="flex: 1">
          <div v-if="idp">
            <router-view :idp="idp" @onUpdateIdp="updateIdp"/>
          </div>
        </div>
      </div>

    </v-container>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDP',
  data() {
    return {
      idp: null,
    }
  },
  created (){
    const id = this.$route.params.id;
    api.req('GET', `/idps/${id}`, null, resp => {
      this.idp = resp;
    });
  },
  methods: {
    updateIdp(upd) {
      this.idp = upd;
    },
  },
}
</script>

<style scoped>

</style>
