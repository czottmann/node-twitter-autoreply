var mongoose = require("mongoose").Mongoose;

mongoose.model( "User", {
  properties: [ "twID", "screenName", "profileImageURL", "accessToken", "accessTokenSecret" ], 

  indexes: [
    [ { "twID": 1 }, { unique: true } ],
    [ { "accessToken": 1 }, { unique: true } ],
    [ { "accessTokenSecret": 1 }, { unique: true } ]
  ],


  getters: {
    id: function() {
      return this._id.toHexString();
    }
  },


  methods: {
    isValid: function() {
      return typeof this.accessToken === "string" &&
        typeof this.accessTokenSecret === "string";
    },

    save: function( okFn, failedFn ) {
      if ( this.isValid() ) {
        this.__super__(okFn);
      } else {
        failedFn();
      }
    }
  }
});


exports.User = function(db) {
  return db.model("User");
};

