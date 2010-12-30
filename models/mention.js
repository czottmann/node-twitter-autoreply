var Tweet = require("../models/tweet").Tweet,
  Class = require("../lib/class").Class;


/**
 * A simple wrapper for a single tweet.
 *
 * @param   tweet {Hash}
 * @param   oa {OAuth}
 */

var Mention = Tweet.extend({
  init: function( tweetHash, oa ) {
    this.oa_ = oa;
    this._super(tweetHash);
  }
});


exports.Mention = Mention;

