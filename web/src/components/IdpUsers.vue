<template>
  <div>
    <v-card>
      <v-card-title primary-title><h3>User accounts</h3></v-card-title>
      <v-card-text>
        <p class="mb-2">These users can authenticate against this IdP as part of a single sign-on flow.</p>
        <v-alert icon='mdi-information'>
          <p><small>Note that you will not be able to authenticate against this IdP using your own SSO Tools account. You can safely use dummy names/emails here (e.g. "name@example.com"). Auto-generated users are given the default password <code>password</code>.</small></p>
        </v-alert>

        <div class="d-flex justify-end mt-5 mb-b">
          <v-btn color='primary' v-on:click="openDialog" prepend-icon="mdi-plus">New user</v-btn>
        </div>

        <v-table :loading="loadingUsers" v-if="users.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th class="text-right"/>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" key="user._id">
              <td>{{user.firstName}} {{user.lastName}}</td>
              <td>{{user.email}}</td>
              <td>
                <v-btn flat>
                  Manage
                  <v-menu activator="parent">
                    <v-list>
                      <v-list-item v-on:click="e => editUser(user)" prepend-icon="mdi-pencil">
                        <v-list-item-content>Update</v-list-item-content>
                      </v-list-item>
                      <v-list-item v-on:click="e => deleteUser(user._id)" prepend-icon="mdi-delete">
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
              <span class="headline">{{editing ? 'Edit user' : 'Create a new user'}}</span>
            </v-card-title>
            <v-card-text>
              <div class="d-flex">
                <v-text-field class="mr-2" label="First name" required autofocus v-model="newUser.firstName"/>
                <v-text-field class="mr-2" label="Last name" v-model="newUser.lastName" />
              </div>
              <div class="d-flex">
                <v-text-field class="mr-2" type="email" label="Email address" v-model="newUser.email" />
                <v-text-field type="password" label="Password" hint="This can be changed later." v-model="newUser.password" />
              </div>

              <div v-if="attributes.length" class="mt-10">
                <h3>Additional user attributes</h3>
                <p>Specifying a value for an attribute below will include that value in assertions made during the SSO process, overriding the attribute's default value. Leave a value blank to send the default attribute value instead.</p>

                <div class="d-flex flex-wrap mt-5">
                  <div class="mr-2 w-25" v-for="attribute in attributes">
                    <v-text-field :label="attribute.name" :hint="`Default value: ${attribute.defaultValue ? `'${attribute.defaultValue}'` : 'none'}`" v-model="newUser.attributes[attribute._id]" />
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn  @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" dark @click="create">{{editing ? 'Save' : 'Create'}}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>

    <v-card class="mt-10">
      <v-card-title primary-title><h3>Additional user attributes</h3></v-card-title>
      <v-card-text>
        <p class="mb-2">Manage custom attributes that can be passed to the Service Provider during sign-on. These attributes are in addition to the core user account attributes (such as first name, last name, and email address).</p>

        <div class="d-flex justify-end mt-5 mb-b">
          <v-btn color='primary' v-on:click="openAttributeDialog" prepend-icon="mdi-plus">New attribute</v-btn>
        </div>

        <v-table :loading="loadingAttributes">
          <thead>
            <tr>
              <th>Human name</th>
              <th>Attribute key</th>
              <th>Default value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="attribute in attributes" key="attribute._id">
              <td>{{attribute.name}}</td>
              <td>{{attribute.samlMapping}}</td>
              <td>{{attribute.defaultValue}}</td>
              <td>
                <v-btn flat>
                  Manage
                  <v-menu activator="parent">
                    <v-list>
                      <v-list-item v-on:click="e => editAttribute(attribute)" prepend-icon="mdi-pencil">
                        <v-list-item-content>Update</v-list-item-content>
                      </v-list-item>
                      <v-list-item v-on:click="e => deleteAttribute(attribute._id)" prepend-icon="mdi-delete">
                        <v-list-item-content>Delete</v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-dialog v-model="attributeDialog" persistent max-width="600px">
          <v-card>
            <v-card-title>
              <span class="headline">{{editingAttribute ? 'Edit attribute' : 'Create a new custom attribute'}}</span>
            </v-card-title>
            <v-card-text>
              <div class="dd-flex">
                <v-text-field class="mb-2" label="Human-readable name" required autofocus v-model="newAttribute.name" hint="We'll use this as the attribute key unless a mapping is provided." />
                <v-text-field class="mb-2" label="Attribute key" v-model="newAttribute.samlMapping" hint="Values for this attribute will be sent with this key during the SSO process." />
                <v-text-field label="Default value" v-model="newAttribute.defaultValue" hint="If not overridden in the user itself, this value will be sent as a default."/>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="attributeDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="createAttribute">{{editingAttribute ? 'Save' : 'Create'}}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>

  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'IDPUsers',
  props: ['idp'],
  data() {
    return {
      users: [],
      loadingUsers: false,
      attributes: [],
      loadingAttributes: false,
      tableHeaders: [{ text: 'First name' }, { text: 'Last name' }, { text: 'Email' }, { text: '' }],
      attributeTableHeaders: [{ text: 'Name' }, { text: 'Default value' }, { text: 'SAML2 mapping' }, { text: '' }],
      newUser: { firstName: '', lastName: '', email: '', password: '', attributes: {}, },
      newAttribute: { name: '', defaultValue: '', samlMapping: '' },
      dialog: false,
      editing: false,
      attributeDialog: false,
      editingAttribute: false,
    }
  },
  created () {
    this.loadingUsers = true;
    this.loadingAttributes = true;
    api.req('GET', `/idps/${this.idp._id}/users`, null, resp => {
      this.users = resp.users.map(u => Object.assign({ attributes: {} }, u));
      this.loadingUsers = false;
    }, err => console.log(err));
    api.req('GET', `/idps/${this.idp._id}/attributes`, null, resp => {
      this.attributes = resp.attributes;
      this.loadingAttributes = false;
    }, err => console.log(err));
  },
  methods: {
    openDialog (event) {
      this.editing = false;
      this.dialog = true;
      this.newUser = { firstName: '', lastName: '', email: '', password: '', attributes: {} };
    },
    openAttributeDialog(event) {
      this.attributeDialog = true;
      this.editingAttribute = false;
      this.newAttribute = { name: '', defaultValue: '', samlMapping: '' };
    },
    create (event) {
      const { _id, firstName, lastName, email, password, attributes } = this.newUser;
      const data = {firstName, lastName, email, password, attributes};
      if (_id && this.editing) {
        api.req('PUT', `/idps/${this.idp._id}/users/${_id}`, data, resp => {
          this.users.map(u => {
            if (u._id === _id) return resp;
            return u;
          });
          this.dialog = false;
          this.editing = false;
        }, err => console.log(err));
      } else {
        api.req('POST', `/idps/${this.idp._id}/users`, data, resp => {
          this.users.push(resp);
          this.dialog = false;
        }, err => console.log(err));
      }
    },
    createAttribute() {
      const { _id, name, defaultValue, samlMapping } = this.newAttribute;
      const data = {name, defaultValue, samlMapping};
      if (_id && this.editingAttribute) {
        api.req('PUT', `/idps/${this.idp._id}/attributes/${_id}`, data, resp => {
          this.attributes.map(u => {
            if (u._id === _id) return resp;
            return u;
          });
          this.attributeDialog = false;
          this.editingAttribute = false;
        }, err => console.log(err));
      } else {
        api.req('POST', `/idps/${this.idp._id}/attributes`, data, resp => {
          this.attributes.push(resp);
          this.attributeDialog = false;
        }, err => console.log(err));
      }
    },
    editUser(user) {
      this.dialog = true;
      this.editing = true;
      this.newUser = user;
    },
    editAttribute(attribute) {
      this.attributeDialog = true;
      this.editingAttribute = true;
      this.newAttribute = attribute;
    },
    deleteUser(id) {
      api.req('DELETE', `/idps/${this.idp._id}/users/${id}`, null, resp => {
        this.users = this.users.filter(u => u._id !== id);
      }, err => console.log(err));
    },
    deleteAttribute(id) {
      api.req('DELETE', `/idps/${this.idp._id}/attributes/${id}`, null, resp => {
        this.attributes = this.attributes.filter(u => u._id !== id);
      }, err => console.log(err));
    },
  },
}
</script>

<style scoped>

</style>
