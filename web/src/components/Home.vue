<template>
  <div>
    <div class="bg-indigo-lighten-5">
      <v-container class="d-block d-sm-flex align-center">
      <div class="w-auto pa-5">
        <h1 class="mb-5">Implement and test single sign-on in your web, mobile, and desktop apps</h1>
        <p>With SSO Tools it is easy to spin-up your own custom identity providers, allowing you to start building and testing your <span class="bg-yellow-lighten-3 rounded-md pa-1">SAML2</span>, <span class="bg-yellow-lighten-3 rounded-md pa-1">OAuth2</span>, and <span class="bg-yellow-lighten-3 rounded-md pa-1">OpenID Connect</span> applications in minutes.</p>
        <v-btn class="mt-5" to="/idps/new" color="primary" prepend-icon="mdi-rocket"> Get started</v-btn>
        <div class="d-flex align-center mt-2">
          <v-icon icon="mdi-star" class="mr-2 text-primary" />
          <p><small>It's free &amp; you don't have to register an account</small></p>
        </div>
        <div class="d-flex align-center mt-1">
          <v-icon icon="mdi-star" class="mr-2 text-primary" />
          <p><small>SSO Tools is <a href='https://git.wilw.dev/wilw/sso-tools' target='_blank' rel='noopener noreferrer'>fully open-source</a></small></p>
        </div>
      </div>
      <div class="w-auto">
        <img v-bind:src="landingImage" class="w-100"/>
      </div>
      </v-container>
    </div>

    <v-container class="d-block d-sm-flex mt-10 mb-10">
      <div class="pa-5 rounded-lg bg-grey-lighten-4 flex-grow-1 elevation-15 ma-sm-5 mb-10 mb-sm-0">
        <h3>A full single sign-on suite</h3>
        <p>Use SSO Tools to create an identity provider that mimics the SSO capabilities of services like <span class="bg-yellow-lighten-3 rounded-md pa-1">Microsoft Active Directory</span>, <span class="bg-yellow-lighten-3 rounded-md pa-1">Stripe</span>, and <span class="bg-yellow-lighten-3 rounded-md pa-1">Facebook</span>.</p>
        <p class="mt-3">You can create apps, register users, build custom attributes, and more, to fully ensure your app has the SSO capabilities you need.</p>

        <v-alert class="mt-5" size="small" color="primary"><strong>Top tip:</strong> Include SSO Tools in your local dev workflow and your CI/CD pipeline to help prevent regression.</v-alert>
      </div>

      <div class="pa-5 rounded-lg bg-grey-lighten-4 flex-grow-1 elevation-15 ma-sm-5">
        <h3>Learn how to implement SSO</h3>
        <p>SSO Tools is simple and forgiving. Feel free to make as many mistakes as you need while you develop your solutions: SSO Tools does not enforce strict rate limiting on its IdPs.</p>
        <p class="mt-3">SSO Tools shows you the requests it receives and makes during the single sign-on flows, helping you to identify problems and debug your app.</p>

        <div class="mt-5">
          <h4 class="mb-3">Learn how to implement:</h4>
          <v-btn class="mr-2 mb-2" size='small' to="/guides/oauth2" color="green">OAuth2 & OpenID Connect</v-btn>
          <v-btn class="mr-2 mb-2" size='small' to="/guides/saml2" color="green">SAML2</v-btn>
        </div>

      </div>

    </v-container>


    <div class="bg-indigo-lighten-5 pt-10 pb-10">
      <v-container>
        <h2>Why use SSO Tools?</h2>
        <p>Single sign-on is great for individuals and businesses. It offers extra security and greater control to its users.</p>
        <p class="mt-5">If you are building apps for businesses or enterprise customers, single sign-on is often an essential requirement in procurement. However, it can be hard to understand and implement.</p>
        <p class="mt-5">SSO Tools is a free resource aimed at helping people build and maintain SSO solutions in their applications - no matter if you are a solo developer or a member of a large software team.</p>

        <v-btn class="mt-5" to="/idps/new" color="primary" prepend-icon="mdi-rocket">Get started</v-btn>
      </v-container>
    </div>

    <v-container>
    <div class="d-block d-sm-flex ml-5 ml-sm-16 mr-5 mr-sm-16 mt-16">
      <div class="w-auto mr-5 mb-5">
        <h2>Quick and simple: we focus on the essentials</h2>
        <p>Use the SSO Tools sandbox to quickly spin-up identity providers, register users and set-up your service providers in order to test the entire SSO lifecycle.</p>
        <p>You don't need to worry about signing up for complicated or expensive SSO providers, and <strong>you don't even need an account to get started</strong>.</p>
      </div>
      <div class="w-auto">
        <img :src="usersImage" style="width:100%;border-radius:3px;box-shadow:0px 4px 10px rgba(0,0,0,0.2);" />
      </div>
    </div>

    <div class="d-block d-sm-flex ml-5 ml-sm-16 mr-5 mr-sm-16 mt-16">
      <div class="w-auto">
        <img :src="secureImage" style="width:100%;border-radius:3px;box-shadow:0px 4px 10px rgba(0,0,0,0.2);" />
      </div>
      <div class="w-auto ml-5">
        <h2>Personalised and secure</h2>
        <p>Each of your identity providers is given its own path at our IdP subdomain, allowing you to easily separate different IdP configurations for testing different functions.</p>
        <h2 class="mt-5">Emulate a real-world IdP</h2>
        <p>SSO Tools allows you to run a typical IdP environment. Users associated with your provider can locally login to list your connected applications to test the login and logout flows.</p>
        <p>Support for both IdP and SP initiated sign-on is available, allowing you to test your applications under typical enterprise SSO usage. For example, if one of your customers has a link to sign-in to your app from their local intranet.</p>
      </div>
    </div>

    <div class="d-block d-sm-flex ml-5 ml-sm-16 mr-5 mr-sm-16 mt-16">
      <div class="w-auto mr-5 mb-5">
        <h2>Follow industry standards</h2>
        <p>SSO Tools allows you to test your SSO implementations in your apps following protocols and standards used by the vast majority of large companies, educational institutions, government agencies, and more.</p>
        <p>Each IdP you create can have different settings to enable you to fully test out your services and your multi-tenancy support.</p>
      </div>
      <div class="w-auto">
        <img :src="samlImage" style="width:100%;border-radius:3px;box-shadow:0px 4px 10px rgba(0,0,0,0.2);" />
      </div>
    </div>
    </v-container>

    <div class="bg-indigo-lighten-5 mt-10 pt-10 pb-10">
      <v-container>
        <div class="text-center">
          <h1>Additional features</h1>
          <p>SSO Tools is offered as a free service. For any questions, or to get in touch, please do so via <a href="mailto:hello@sso.tools" target="_blank" rel="noopener noreferrer">email</a>.</p>
        </div>

        <div class="d-block d-sm-flex mt-10 justify-center">
            <v-list class="bg-transparent">
              <v-list-item v-for="feature in features" :key="feature">
                <v-list-item-icon><v-icon icon="mdi-check-circle" class="text-green mr-2"/></v-list-item-icon>
                <v-list-item-content>
                  {{ feature }}
                </v-list-item-content>
              </v-list-item>
            </v-list>
        </div>
      </v-container>
    </div>

  </div>
</template>

<script>
import landingImage from '../assets/login.png';
import usersImage from '../assets/users.png';
import secureImage from '../assets/secure.png';
import samlImage from '../assets/saml.png';

export default {
  name: 'Home',
  data() {
    return {
      landingImage, usersImage, secureImage, samlImage,
      features: [
        'SAML2, OAuth2, and OpenID Connect support', 'Create unlimited IdPs and apps', 'Support for custom user attributes & mappings', 'IdP- and SP-initiated SAML2 sign-on', 'SAML2 ForceAuthn respected', 'Full request and response logging'
      ],
    }
  },
}
</script>

<style scoped>
  .banner{
    min-height:300px;
    position:relative;
  }
  .banner-background{
    background-size:cover;
    background-position:center bottom;
    position:absolute;
    width:100%;
    height:100%;
    left:0;top:0;

  }
  .banner-content{
    position: relative;
  }
</style>
