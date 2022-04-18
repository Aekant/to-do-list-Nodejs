# Setting up environment variables

## Running Services

### Run Mongo in Docker Container

- The easiest way to run MongoDB would be to run it inside a container. Make sure you have Docker installed on your system by running `docker --version`

- Next we need to run MongoDB inside a container with the following command

  ```bash
  docker container run --name to-do-list-mongodb -v to-do-list-mongo-data:/data/db -p 27017:27017 --restart always -d mongo
  ```

- This will start a mongo container to which our app can connect using the following connection string "__mongodb://127.0.0.1:27017/\<DATABASE>__". Add this connection string as DATABASE_STRING in the `config.env` file

- Also add the name of the database of your choice as DATABASE environment variable in `config.env` file

___

### Run Redis in Docker Container

- Similar to running MongoDB inside a container we are going set up redis inside a container too

- Run the following command to start redis server inside a container

  ```bash
  docker container run --name to-do-list-redis -v to-do-list-redis-data:/data -p 6379:6379 -d redis
  ```

## Setting Up 3rd Party Credentials

### Setup OAuth2 Client for Oauth2 Sign-In/Up with Google

- [Follow this guide to setup an Oauth2 Client](https://support.google.com/cloud/answer/6158849?hl=en)

- Make sure to add the [following](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2) `userinfo.email` and `userinfo.profile` when configuring Auth screen

- When you are done with the above two steps, add the three env variables `GOOGLE_OAUTH2_CLIENT_ID` `GOOGLE_OAUTH2_CLIENT_SECRET` and `GOOGLE_OAUTH2_REDIRECT_URL` in the `config.env` file

___

### Setup Gmail for Nodemailer to Send Emails

- Follow this [documentation](https://support.google.com/mail/answer/7126229?visit_id=637858912781383814-3310371705&hl=en&rd=1#zippy=%2Cstep-change-smtp-other-settings-in-your-email-client%2Cstep-check-that-imap-is-turned-on%2Ci-cant-sign-in-to-my-email-client) to first enable IMAP

- Put port 587 as `EMAIL_PORT` and host smtp.gmail.com as `EMAIL_HOST` environment variables in `config.env` file

- Next, follow this [documentation](https://support.google.com/accounts/answer/185833#zippy=%2Cwhy-you-may-need-an-app-password%2Capp-passwords-revoked-after-password-change%2Cyou-still-cant-sign-in) to generate an App password. __Note__: You need to have 2FA enabled to generate app passwords and also use "other" as devices when setting up app password

- Copy over the app password and save it as `EMAIL_PASSWORD` environment variable. Use your gmail username (everything before the @) as `EMAIL_USERNAME` environment variable

___

### Setup SendGrid for Emails in Production

- Since SendGrid signup process is a little out of place and rage inducing because it will lock you out for whatever reason avoid going into it unless you really want things to run in production. It is a great tool "if" you don't get into weird unathorized errors during signup. Follow this gitub issue, [link](https://github.com/sendgrid/sendgrid-python/issues/806)

# How To Run the Project

Install all dependencies first using `npm i` or `npm ci`, then

```bash
node server.js
```