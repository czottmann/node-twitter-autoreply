var Seq = require("seq");


exports.rmw = function(oa) {
  return {
    
    // Middleware: Access control

    requireUser: function( req, res, next ) {
      
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
    },


    // Middleware: Access control

    loadUser: function( req, res, next ) {
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

  };
};

