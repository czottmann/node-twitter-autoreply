exports.__ = function(oa) {
  return {

    /**
     * GET /members
     * The inner sanctum.  Requires auth'd user, will trigger signin flow if not
     * authenticated.
     */

    index: function( req, res ) {
      User.find().all( function(users) {
        res.render( "member_area", {
          locals: {
            title: "Member area",
            dbCount: users.length
          }
        });
      });
    },


    /**
     * GET /members/mentions
     * The inner sanctum.  Requires auth'd user, will trigger signin flow if not
     * authenticated.
     */

    mentions: function( req, res ) {
      oa.get( "http://api.twitter.com/1/statuses/mentions.json", req.user.accessToken, req.user.accessTokenSecret, function( error, data ) {
        if (!error) {
          res.render( "mentions", {
            locals: {
              mentions: JSON.parse(data),
              title: "Member area: Mentions"
            }
          });
        }
      });
    }

  };
};
