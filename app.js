
/**
 * Module dependencies.
 */

var express = require('express'),
  OAuth = require("oauth").OAuth,
  config = require("./app-config").config,

  twitter = {
    CONSUMER_KEY: config.oAuthConsumerKey,
    CONSUMER_TOKEN: config.oAuthConsumerToken,
    REQUEST_TOKEN_URL: 'http://twitter.com/oauth/request_token',
    ACCESS_TOKEN_URL: 'http://twitter.com/oauth/access_token',
    OAUTH_VERSION: '1.0',
    HASH_VERSION: 'HMAC-SHA1'
  },

  express = require('express'),
  OAuth = require("oauth").OAuth,
  app = module.exports = express.createServer();




//--- CONFIGURATION ------------------------------------------------------------

app.configure( function() {
  app.set( 'views', __dirname + '/views' );
  app.use( express.bodyDecoder() );
  app.use( express.methodOverride() );
  // app.use( express.compiler({ src: __dirname + '/public', enable: ['less'] }) );
  app.use( app.router );
  app.use( express.staticProvider( __dirname + '/public' ) );
});

app.configure( 'development', function() {
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }) ); 
});

app.configure( 'production', function() {
  app.use( express.errorHandler() );
});




//--- ROUTES ------------------------------------------------------------------

/**
 * GET /
 * Home sweet home.
 */

app.get( "/", function( req, res ) {
  res.render( "index.jade", {
    locals: {
      title: "Twitter Auto Reply"
    }
  });
});



/**
 * GET /login
 * Redirect to OAuth provider page.
 */

app.get( "/login", function( req, res ) {
  var oa = new OAuth(
    twitter.REQUEST_TOKEN_URL,
    twitter.ACCESS_TOKEN_URL,
    twitter.CONSUMER_KEY,
    twitter.CONSUMER_TOKEN,
    twitter.OAUTH_VERSION,
    null,
    twitter.HASH_VERSION
  );

  oa.getOAuthRequestToken(
    function( error, oauthToken, oauthTokenSecret, results ) {
      if (error) {
        throw new Error( ( [ error.statusCode, error.data ].join(": ") ) );
      } else { 
        res.redirect( "https://twitter.com/oauth/authorize?oauth_token=" + oauthToken )
      }
    }
  );

  /*
  var body = "";
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
    body += '<p>First time visiting? view this page in several browsers :)</p>';
  }
  res.send(body + '<p>viewed <strong>' + req.session.views + '</strong> times.</p>');
  */
});


/**
 * GET /oauth_callback
 * Redirect destination used by OAuth provider after successful authentication
 * workflow.
 */

app.get( "/oauth_callback", function( req, res ) {
  console.log(req);
  res.render( "oauth_callback.jade", {
    locals: {
      title: "oauth_callback",
      output: "see console"
    }
  });
});




//--- MAIN ---------------------------------------------------------------------

if (!module.parent) {
  app.listen(7000);
  console.log( "Express server listening on port %d", app.address().port );
}


