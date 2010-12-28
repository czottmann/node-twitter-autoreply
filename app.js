/**
 * Module dependencies.
 */

var express = require("express"),
  Seq = require("seq"),
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


// Middleware: Access control

function requireUser( req, res, next ) {
  
  if ( !( req.session.oauth && req.session.oauth.accessToken && req.session.oauth.accessTokenSecret ) ) {
    res.redirect("/signin");
  }
  else {
    Seq()
      .seq( "user", function() {
        var that = this;

        User.find(req.session.oauth).first( function(user) {
          if (!user) {
            user = new User();
            user.accessToken = req.session.oauth.accessToken;
            user.accessTokenSecret = req.session.oauth.accessTokenSecret;
            user.save();
          }

          that( null, user );
        });
      })    
      .seq( function(user) {
        req.user = user;

        if (!user.twID) {
          oa.get(
            "http://api.twitter.com/1/statuses/user_timeline.json?count=1",
            user.accessToken,
            user.accessTokenSecret,
            function( error, data ) {
              var u;

              if (!error) {
                try {
                  u = JSON.parse(data)[0].user;
                }
                catch(e) {
                  u = {};
                }

                user.twID = u.id_str;
                user.screenName = u.screen_name;
                user.profileImageURL = u.profile_image_url;
                user.save();
              
                next();
              }
              else {
                next( new Error("Failed to fetch Twitter user data") );
              }
            }
          );
        }

        next();
      });
  }
}


// Middleware: Access control

function loadUser( req, res, next ) {
  if ( req.session.oauth && req.session.oauth.accessToken && req.session.oauth.accessTokenSecret ) {
    User.find(req.session.oauth).first( function(user) {
      req.user = user;
      next();
    });
  }
  else {
    next();
  }
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
  app.set( "view engine", "jade" );
  app.use( express.bodyDecoder() );
  app.use( express.cookieDecoder() );
  app.use( express.session({ store: mongoStore( mongoStoreConnectionArgs() ) }) );
  app.use( express.logger({ format: "\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms" }) );
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( express.staticProvider( __dirname + "/public" ) );
});

app.User = User = require("./models.js").User(db);

app.dynamicHelpers({
  user: function( req, res ) {
    return req.user;
  }
});





//--- ROUTES ------------------------------------------------------------------

/**
 * GET /
 * Home sweet home.
 */

app.get( "/", loadUser, function( req, res ) {
  res.render( "index", {
    locals: {
      title: "Twitter Auto Reply"
    }
  });
});


/**
 * GET /signin
 * Redirect to OAuth provider page.
 */

app.get( "/signin", function( req, res ) {
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
 * GET /signout
 * Destroys the session, effectively logging the user out.
 */

app.get( "/signout", function( req, res ) {
  req.session.oauth = undefined;
  res.redirect("/");
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
 * The inner sanctum.  Requires auth'd user, will trigger signin flow if not
 * authenticated.
 */

app.get( "/member_area", requireUser, function( req, res ) {
  User.find().all( function(users) {
    res.render( "member_area", {
      locals: {
        title: "member_area",
        output: "@" + req.user.screenName,
        dbCount: users.length
      }
    });
  });
});




//--- MAIN ---------------------------------------------------------------------

if (!module.parent) {
  app.listen(7000);
  console.log( "Express server listening on port %d", app.address().port );
}


