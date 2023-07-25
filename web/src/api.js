const hosts = {
  'development': 'http://localhost:6002',
  'production': 'https://api.sso.tools',
};

export const api = {

  token: null,

  req(method, path, data, success, fail) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${hosts[process.env.NODE_ENV]}${path}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (api.token) {
      xhr.setRequestHeader('Authorization', `Bearer ${api.token}`);
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let response;
          try { response = JSON.parse(xhr.responseText); } catch (err) { console.log(err); }
          if (success) success(response);
        } else {
          if (xhr.status === 401) {
            return fail && fail({ status: 401, message: 'Authorisation is needed' });
          }
          let message;
          try { message = JSON.parse(xhr.responseText).message; } catch (err) { if (fail) fail({ status: xhr.status, message: 'There was a problem with this request' }); }
          if (fail) fail({ status: xhr.status, message });
        }
      }
    };
    xhr.send(data && JSON.stringify(data));
  },

  unauthenticatedRequest(method, path, data, success, fail, options) {
    api.req(method, path, data, success, fail, false, options);
  },

  authenticatedRequest(method, path, data, success, fail, options ) {
    api.req(method, path, data, success, fail, true, options);
  },
};

export default api;
