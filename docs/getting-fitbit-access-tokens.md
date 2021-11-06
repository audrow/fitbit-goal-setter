# Getting the Fitbit Access Tokens

Rather than write a program with OAuth2.0 (which would be a bit of work), I am
using the implicit authorization token from the Fitbit tutorial page. These are
nice in that it's fairly easy to generate them and, once you do, you can use
them on multiple devices. They also have a variable lifetime, so you can say
that they should be active for a year or more, which saves me from having to
write token refresh logic, which is a pain.

To access the authorization token:

1. Create a Fitbit app for each Fitbit on the
   [Fitbit Developers site](https://dev.fitbit.com/apps). This can be a personal
   account or a client account, if you have talked to Fitbit and gotten the okay
   to get the intraday steps. I think it is probably easier to just create
   personal accounts.
   1. Sign up for a Fitbit account.
   1. [Create a new Fitbit App](https://dev.fitbit.com/apps/new). For most of
      the fields, it seems like you just need to put something. The only real
      important part is that for "OAuth 2.0 Application Type *" you select
      "Personal." This is unless you have permission from Fitbit to access
      intraday accounts from several devices, in which case, you can selecte
      "Client." Otherwise, you can put almost anything for the Redirect URL, I
      used `http://localhost`. You can also select "Read Only" for default
      access type, since we won't be writing any data to Fitbit's servers.
      ![Fitbit application example](./imgs/fitbit-application.png)
1. Now get your access tokens.
   1. After making your app, go to the
      [apps gallery](https://dev.fitbit.com/apps) and click your app. Then click
      the "OAuth 2.0 tutorial page" link.
      ![Registered app page](./imgs/registered-app.png) From there, you should
      see the following page: ![Tutorial page](./imgs/tutorial-page.png)
   1. Make sure the Flow type is set to "Implicit Grant Flow"
   1. Select all the scopes (we only need "Activity," but why not)
   1. Change the "Expires In(ms)" to "31536000" (one year)
   1. Click the link at the end of step one, which should look something like
      the following:
      > We've generated the authorization URL for you, all you need to do is
      > just click on link below:
      > https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=23BM6L&redirect_uri=http%3A%2F%2Flocalhost&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=31536000
   1. Go through the login step and then arrive at a "This site cannot be
      reached page".
      ![Site cannot be reached](./imgs/site-cannot-be-reached.png)
   1. Copy the URL into a text editor. The URL should look something like the
      following (note, I obfuscated the token in the link below to prevent funny
      business):
      > http://localhost/#access_token=eyJhbGciOiJIUzI1NiJ9.eyJhdWQioiIyM0TsNkwiLCJzdWIiOiI5TVBURFYiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJhY3QgcnNldCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNjY2MTkwNzM0LCJpYXQiOjE2MzYyMTA0MDh9.EZTMfEpG-5057FHVhAA_drbS6UmxSS4UMx2JuTFNRkc&user_id=9MPTDV&scope=sleep+social+nutrition+activity+heartrate+location+profile+weight+settings&token_type=Bearer&expires_in=29980326
   1. Extract the access token from the URL. The access token is the string of
      characters between `access_token=` and `&user_id`. For example, in the
      above link, the following is the access token:
      > eyJhbGciOiJIUzI1NiJ9.eyJhdWQioiIyM0TsNkwiLCJzdWIiOiI5TVBURFYiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJhY3QgcnNldCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNjY2MTkwNzM0LCJpYXQiOjE2MzYyMTA0MDh9.EZTMfEpG-5057FHVhAA_drbS6UmxSS4UMx2JuTFNRkc
   1. Find a safe place to store the token and don't lose track of which account
      the token is for. You can just put it straight into the project's
      configuration file, see the [README](../README.md).

That's it! You can now use the access token to access the Fitbit API. You can
repeat this process for each of the Fitbit devices you want.
