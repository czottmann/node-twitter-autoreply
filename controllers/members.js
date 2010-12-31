var _ = require("underscore");



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
      var url = "http://api.twitter.com/1/statuses/mentions.json?count=5";

      if (req.user.lastCheckedMentionID) {
        url += "&since_id=" + req.user.lastCheckedMentionID;
      }

      oa.get( url, req.user.accessToken, req.user.accessTokenSecret, function( error, data ) {
        var mentions;

        // TODO: error handling

        if (!error) {

          // Weed out the mentions by the current user, i.e. existing "wrong
          // @{screen name}" tweets.
          
          mentions = _.reject( JSON.parse(data), function(m) {
            return m.user.screen_name === req.user.screenName;
          });

          mentions = _.map( mentions, function(m) {
            return new Mention(m);
          });

          _.each( mentions, function(m) {
            console.log( "Guessing #" + m.id );
            m.guessLanguage(
              function(l) {
                console.log( m.id + ": " + l );
              },
              function(error) {
                console.log( m.id + ": " + error );
              }
            ); 
          });

          res.render( "mentions", {
            locals: {
              mentions: mentions, 
              title: "Member area: Mentions"
            }
          });
        }
      });
    }

  };
};
