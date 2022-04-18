const googleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./../models/userModel');


module.exports = (passport) => {
  passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_OAUTH2_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_OAUTH2_REDIRECT_URL
  }, async function (access_token, refresh_token, profile, done) {

    try {
      // if user already exists mongoose will throw an error of duplicate id or email
      // searching by googleId not by userId
      let user = await User.findOne({ provider: 'google', googleId: profile.id });
      if (user) {
        return done(null, user);
      }
      // creating a user
      user = await User.create({
        provider: profile.provider,
        googleId: profile._json.sub,
        username: profile._json.name,
        email: profile._json.email,
        verified: true
      });

      // everthing is fine then send out a jwt to the user
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
}