var Tweet = require("../models/tweet").Tweet,
  inherits = require("../lib/helpers.js").inherits;


/**
 * A simple wrapper for a single tweet.
 *
 * @param   tweet {Hash}
 * @param   oa {OAuth}
 */

function Mention( tweetHash, oa ) {
  Tweet.call( this, tweetHash );
  this.oa_ = oa;
}

inherits( Mention, Tweet );

exports.Mention = Mention;

