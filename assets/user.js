(function(){
  "use strict"

  var user = {
    details: false,
    oAuthButton: false,
    accounts: false,
    properties: false,
    profiles: false,

    ajax: function(url, callback){
      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
          callback(JSON.parse(request.responseText));
        }
      };
      request.open('GET', url);
      request.send();
    },
    getUser: function(callback){
      var hash = window.location.hash;

      user.callback = callback;
      if(user.details !== false){
        user.callback(user.details);
      } else {
        if(hash.indexOf('token') > -1){
          user.validateToken();
        } else {
          user.requestAuth();
        }
      }
    },
    param: function(obj){
      var params = [],
          key, value;
      for(key in obj){
        params.push(key + '=' + encodeURIComponent(obj[key]));
      }
      return params.join('&');
    },
    requestAuth: function(){
      window.location = 'https://accounts.google.com/o/oauth2/auth?' + user.param(googleAuth);
    },
    validateToken: function(){
      var params = user.paramsFromHash(),
          endpoint = 'https://www.googleapis.com/oauth2/v1/tokeninfo?';

      if(typeof params.access_token !== 'undefined'){
        window.location.hash = '';
        user.details = {
          accessToken: params.access_token
        };

        user.ajax(endpoint + "access_token="+ params.access_token, function(data){
          user.details.expires = (+new Date()) + (data.expires_in * 1000);
          user.details.id = data.user_id;
          user.details.email = data.email;
          user.callback(user.details);
        });
      }
    },
    paramsFromHash: function(){
      var hash = window.location.hash,
          params = {},
          chunk, i, _i;

      if(hash.indexOf('#') > -1){
        hash = hash.substr(1);
      }
      hash = hash.split('&');
      for(i=0,_i=hash.length; i<_i; i++){
        chunk = hash[i].split('=');
        params[decodeURIComponent(chunk[0])] = decodeURIComponent(chunk[1]);
      }
      return params;
    },
    getAccounts: function(callback){
      var endpoint = 'https://www.googleapis.com/analytics/v3/management/accounts';
      user.apiRequest(endpoint, function(data){ callback(user.parseResponse(data)); });
    },
    getProperties: function(accountId, callback){
      var endpoint = 'https://www.googleapis.com/analytics/v3/management/accounts/'+accountId+'/webproperties';
      user.apiRequest(endpoint, function(data){ callback(user.parseResponse(data)); });
    },
    getProfiles: function(accountId, webPropertyId, callback){
      var endpoint = 'https://www.googleapis.com/analytics/v3/management/accounts/'+accountId+'/webproperties/'+webPropertyId+'/profiles';
      user.apiRequest(endpoint, function(data){ callback(user.parseResponse(data)); });
    },
    parseResponse: function(data){
      var i, _i, output = [];
      if(data.items){
        for(i=0,_i=data.items.length; i<_i; i++){
          output.push({
            id: data.items[i].id,
            name: data.items[i].name
          });
        }
        output.sort(function(a, b){
          if(a.name<b.name){return -1;}
          if(a.name>b.name){return 1;}
          return 0;
        });
      }
      return output;
    },
    apiRequest: function(requestUri, callback){
      var extraParams, authedRequestUri;

      if(user.details === false){
        user.getUser(function(details){
          user.apiRequest(requestUri, callback);
        });
      } else {
        if(+new Date() < user.details.expires){
          extraParams = 'access_token='+user.details.accessToken;
          authedRequestUri = requestUri + (requestUri.indexOf('?') > -1 ? '&' : '?') + extraParams;

          user.ajax(authedRequestUri, callback);
        } else {
          alert('Your session has expired, you will need to relogin to continue');
        }
      }
    },
    fillSelect: function(elm, options){
      var html = [],
          optionsCount = options.length,
          i;

      html.push('<option value="">-- Pick an option --</option>');
      for(i=0; i<optionsCount; i++){
        html.push( "<option value='"+ options[i].id +"'>"+options[i].name+"</option>");
      }
      return html.join('');
    },
    displayAccounts: function(data){
      user.oAuthCTA.style.display = 'none';
      user.properties.innerHTML = '';
      user.profiles.innerHTML = '';

      user.accounts.innerHTML = user.fillSelect(user.accounts, data);
      user.accounts.addEventListener('change', function(){
        user.getProperties(user.accounts.value, user.displayProperties);
      });
    },
    displayProperties: function(data){
      user.profiles.innerHTML = '';

      user.properties.innerHTML = user.fillSelect(user.properties, data);
      user.properties.addEventListener('change', function(){
        user.getProfiles(user.accounts.value, user.properties.value, user.displayProfiles);
      });
    },
    displayProfiles: function(data){
      user.profiles.innerHTML = user.fillSelect(user.properties, data);
      user.profiles.addEventListener('change', function(){
        var profileId = user.profiles.value;
        var date = new Date();
        date.setDate(date.getDate() - 1);
        var endDate = user.dateString(date);
        date.setDate(date.getDate() - 30);
        var startDate = user.dateString(date);

        var endpoint = "https://www.googleapis.com/analytics/v3/data/ga?"
            + "ids=ga:"+ profileId +"&"
            + "dimensions=ga:screenResolution&"
            + "metrics=ga:visitors&"
            + "start-date="+ startDate +"&"
            + "end-date="+ endDate +"&"
            + "max-results=50&"
            + "sort=-ga:visitors";

        user.apiRequest(endpoint, user.parseResolutions);
        document.querySelector('#url').value = user.profiles.options[user.profiles.selectedIndex].text;
      });
    },
    parseResolutions: function(data){
      var i, rowCount = data.rows.length,
          output = [];
      for(i=0; i<rowCount; i++){
        output.push(data.rows[i][0]);
      }
      document.querySelector('#csv').value = output.join("\n");
    },
    dateString: function(date){
      var string = [];
      string.push(date.getFullYear());
      if(date.getMonth() + 1 < 10){
        string.push('0' + date.getMonth()+1);
      } else {
        string.push(date.getMonth()+1);
      }
      if(date.getDate() < 10){
        string.push('0' + date.getDate());
      } else {
        string.push(date.getDate());
      }
      return string.join('-');
    },

    init: function(){
      user.oAuthButton = document.querySelector('.oauth a');
      user.oAuthCTA = document.querySelector('.oauth');
      user.accounts = document.querySelector('#accounts');
      user.properties = document.querySelector('#properties');
      user.profiles = document.querySelector('#profiles');
      user.oAuthOptions = document.querySelector('.google');
      user.oAuthButton.addEventListener('click', function(e){
        e.preventDefault();
        user.oAuthOptions.style.display('block');
        user.getAccounts(user.displayAccounts);
      }, false);
      if(window.location.hash.indexOf('token') > -1){
        user.getAccounts(user.displayAccounts);
      }
    }
  };

  user.init();
  window.user = user;
}());
