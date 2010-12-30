/**
 * Module dependencies.
 */

var express = require("express"),
  Seq = require("seq"),
  OAuth = require("oauth").OAuth,
  Mongoose = require("mongoose").Mongoose,
  mongoStore = require("connect-mongodb"),
  config = require("./app-config").config,
  
  twitter = {
    CONSUMER_KEY: config.oAuthConsumerKey,
    CONSUMER_TOKEN: config.oAuthConsumerToken,
    REQUEST_TOKEN_URL: "https://twitter.com/oauth/request_token",
    ACCESS_TOKEN_URL: "https://twitter.com/oauth/access_token",
    OAUTH_VERSION: "1.0",
    HASH_VERSION: "HMAC-SHA1"
  },

  app = module.exports = express.createServer(),
  site,
  members,
  ah,
  db,
  oa = new OAuth(
    twitter.REQUEST_TOKEN_URL,
    twitter.ACCESS_TOKEN_URL,
    twitter.CONSUMER_KEY,
    twitter.CONSUMER_TOKEN,
    twitter.OAUTH_VERSION,
    null,
    twitter.HASH_VERSION
  );




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

db = Mongoose.connect( app.set("db-uri") );

ah = require("./lib/helpers").__(db);  // app helpers
rmw = require("./lib/route_middleware").__(oa);  // app helpers

app.configure( function() {
  app.set( "views", __dirname + "/views" );
  app.set( "view engine", "jade" );
  app.use( express.bodyDecoder() );
  app.use( express.cookieDecoder() );
  app.use( express.session({ store: mongoStore( ah.mongoStoreConnectionArgs() ) }) );
  app.use( express.logger({ format: "\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms" }) );
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( express.staticProvider( __dirname + "/public" ) );
});

app.dynamicHelpers({
  user: function( req, res ) {
    return req.user;
  }
});

User = require("./models/user").User(db);
Tweet = require("./models/tweet").Tweet;
Mention = require("./models/mention").Mention;





//--- ROUTES ------------------------------------------------------------------

// Main

site = require("./controllers/site").__(oa);

app.get( "/", rmw.loadUser, site.index );
app.get( "/signin", site.signin );
app.get( "/signout", site.signout );
app.get( "/oauth_callback", site.oauth_callback );

// Members area

members = require("./controllers/members").__(oa);

app.get( "/members", rmw.requireUser, members.index );
app.get( "/members/mentions", rmw.requireUser, members.mentions );




//--- MAIN ---------------------------------------------------------------------

if (!module.parent) {
  app.listen(7000);
  console.log( "Express server listening on port %d", app.address().port );
}

