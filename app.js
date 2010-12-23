/**
 * Module dependencies.
 */

var express = require("express"),
  OAuth = require("oauth").OAuth,
  mongoose = require("mongoose").Mongoose,
  mongoStore = require("connect-mongodb"),
  config = require("./app-config").config,
  
  app = module.exports = express.createServer(),

  twitter = {
    CONSUMER_KEY: config.oAuthConsumerKey,
    CONSUMER_TOKEN: config.oAuthConsumerToken,
    REQUEST_TOKEN_URL: "https://twitter.com/oauth/request_token",
    ACCESS_TOKEN_URL: "https://twitter.com/oauth/access_token",
    OAUTH_VERSION: "1.0",
    HASH_VERSION: "HMAC-SHA1"
  },
  oa = new OAuth(
    twitter.REQUEST_TOKEN_URL,
    twitter.ACCESS_TOKEN_URL,
    twitter.CONSUMER_KEY,
    twitter.CONSUMER_TOKEN,
    twitter.OAUTH_VERSION,
    null,
    twitter.HASH_VERSION
  ),
  db;




//--- HELPERS ------------------------------------------------------------------

// see http://dailyjs.com/2010/12/06/node-tutorial-5/

function mongoStoreConnectionArgs() {
  return {
    dbname: db.db.databaseName,
    host: db.db.serverConfig.host,
    port: db.db.serverConfig.port,
    username: db.uri.username,
    password: db.uri.password
  };
}


// Access control

function requireUser( req, res, next ) {
  
  // TODO: User accounts

  if ( !( req.session.oauth && req.session.oauth.accessToken && req.session.oauth.accessTokenSecret ) ) {
    res.redirect("/login");
  }
  else {
    next();
  }
  
  /*
  if (req.session.user_id) {
    User.findById( req.session.user_id, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect("/login");
      }
    });
  } else {
    res.redirect("/login");
  }
  */
}




//--- CONFIGURATION ------------------------------------------------------------

app.configure( "development", function() {
  app.set( "db-uri", "mongodb://localhost/nodepad-development" );
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }) ); 
});

app.configure( "test", function() {
  app.set( "db-uri", "mongodb://localhost/nodepad-test" );
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }) ); 
});

app.configure( "production", function() {
  app.set( "db-uri", "mongodb://localhost/nodepad-production" );
  app.use( express.errorHandler() );
});

db = mongoose.connect( app.set("db-uri") );

app.configure( function() {
  app.set( "views", __dirname + "/views" );
  app.use( express.bodyDecoder() );
  app.use( express.cookieDecoder() );
  app.use( express.session({ store: mongoStore( mongoStoreConnectionArgs() ) }) );
  app.use( express.logger({ format: "\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms" }) );
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( express.staticProvider( __dirname + "/public" ) );
});

// app.User = User = require("./models.js").User(db);




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
  oa.getOAuthRequestToken(
    function( error, oauthRequestToken, oauthRequestTokenSecret, results ) {
      if (error) {
        // TODO: better error handling
        throw new Error( [ error.statusCode, error.data ].join(": ") );
      } else {
        req.session.oauth = {
          requestTokenSecret: oauthRequestTokenSecret
        };

        res.redirect( "https://twitter.com/oauth/authorize?oauth_token=" + oauthRequestToken );
      }
    }
  );
});


/**
 * GET /oauth_callback
 * Redirect destination used by OAuth provider after successful authentication
 * workflow.
 */

app.get( "/oauth_callback", function( req, res ) {
  oa.getOAuthAccessToken(
    req.query.oauth_token,
    req.session.oauth.requestTokenSecret,
    req.query.oauth_verifier,
    function( error, oauthAccessToken, oauthAccessTokenSecret, results2 ) {
      if ( error && parseInt( error.statusCode, 10 ) == 401 ) {
        // TODO: better error handling
        throw new Error("Verifier invalid");
      }
      else if (error) {
        // TODO: better error handling
        throw new Error( "Error: " + error.statusCode );
      }

      // TODO: User accounts

      req.session.oauth = {
        accessToken: oauthAccessToken,
        accessTokenSecret: oauthAccessTokenSecret
      };

      res.redirect("/member_area");
    }
  );
});


/**
 * GET /member_area
 * The inner sanctum.
 */

app.get( "/member_area", requireUser, function( req, res ) {

  oa.get(
    "http://api.twitter.com/1/users/lookup.json?screen_name=hmans",
    req.session.oauth.accessToken,
    req.session.oauth.accessTokenSecret,
    function( error, data ) {
      console.log( error, data );
      res.render( "member_area.jade", {
        locals: {
          title: "member_area",
          output: data
        }
      });
    }
  );
  
});




//--- MAIN ---------------------------------------------------------------------

if (!module.parent) {
  app.listen(7000);
  console.log( "Express server listening on port %d", app.address().port );
}


