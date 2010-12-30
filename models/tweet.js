var request = require("request"),
  Class = require("../lib/class.js").Class;
  _ = require("underscore");



/**
 * A simple wrapper for a single tweet.
 */

var Tweet = Class.extend({

  /**
   * @constructor
   * @param   tweetHash {Hash} The raw hash as returned by the Twitter API.
   */

  init: function(tweetHash) {
    if ( typeof tweetHash !== "object" ) {
      throw "ArgumentError: tweetHash must be hash object";
    }

    this.raw_ = tweetHash;
    this.status = this.raw_.text;
    this.id = this.raw_.id;
    this.createdAt = this.raw_.created_at;
    this.sender = {
      id: this.raw_.user.id,
      name: this.raw_.user.name,
      screenName: this.raw_.user.screen_name
    };
  },


  /**
   * @property  {Hash} raw_   The raw hash as returned by the Twitter API.
   * @private
   */


  /**
   * @property  {String} status   The tweet body.
   * @property  {String} sender   The tweet body.
   * @property  {String} id   The tweet body.
   * @property  {String} createdAt    The creation date.
   * @property  {String} language   The suspected language.  Set by
   *            `guessLanguage()`.
   */


  /**
   * Passes the tweet body to uClassify's language classifier.  The guessed
   * language is stored in the `language` property.
   *
   * @param   {Function} fnSuccess    "on success" callback.  Language
   *          (string) is passed as parameter.
   * @param   {Function} fnError    "on error" callback.  Error message
   *          (string) is passed as parameter.
   */

  guessLanguage: function(callback) {
    var that = this,
      url = [
        "http://uclassify.com/browse/uClassify/Text%20Language/ClassifyText",
        "?readkey=MSlXeELDURTgU4N63GXBKJOpEok",
        "&text=", encodeURIComponent(this.status),
        "&output=json"
      ].join("");

    if (this.language) {
      return this.language;
    }

    request({ uri: url }, function( error, response, body ) {
      var languages;

      if ( !error && response.statusCode === 200 ) {
        languages = JSON.parse(body).cls1;
        that.language = _(languages).chain()
          .map( function( v, k ) {
            return [ k, v ];
          })
          .sortBy( function(ar) {
            return ar[1];
          })
          .last()
          .value()[0];
        
        if ( _.isFunction(fnSuccess) ) {
          fnSuccess(that.language);
        }
      }
      else if (!error) {
        if ( _.isFunction(fnError) ) {
          fnError("Unsuspected HTTP status code");
        }
      }
      else {
        if ( _.isFunction(fnError) ) {
          fnError(error);
        }
      }
    });

  }

});



exports.Tweet = Tweet;

