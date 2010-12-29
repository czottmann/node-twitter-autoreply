exports.__ = function(oa) {
  return {

    /**
     * GET /
     * Home sweet home.
     */

    index: function( req, res ) {
      res.render( "index", {
        locals: {
          title: "Twitter Auto Reply"
        }
      });
    },


    /**
     * GET /signin
     * Redirect to OAuth provider page.
     */

    signin: function( req, res ) {
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
    },


    /**
     * GET /signout
     * Destroys the session, effectively logging the user out.
     */

    signout: function( req, res ) {
      req.session.oauth = undefined;
      res.redirect("/");
    },


    /**
     * GET /oauth_callback
     * Redirect destination used by OAuth provider after successful authentication
     * workflow.
     */

    oauth_callback: function( req, res ) {
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

          res.redirect("/members");
        }
      );
    }

  };
};
