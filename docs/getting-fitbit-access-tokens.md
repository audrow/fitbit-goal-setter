# Getting the Fitbit Access Tokens

A note on setup. Rather than write a program with OAuth2.0 (which would be a bit
of work), I am using the implicit authorization token from the Fitbit tutorial
page. To access the authorization token:

1. Create a Fitbit app for each Fitbit. This can be a personal account or a
   client account, if you have talked to Fitbit and gotten the okay to get the
   intraday steps. I think it is probably easier to just create personal
   accounts.
1. Now get your access tokens.
   1. After making your app, go to the
      [apps gallery](https://dev.fitbit.com/apps) and click your app. Then click
      the "OAuth 2.0 tutorial page" link. From here we will get the access code.
   1. Make sure the Flow type is set to "Implicit Grant Flow"
   1. Select all the scopes (we only need "Activity," but why not)
   1. Change the "Expires In(ms)" to "31536000" (one year)
   1. Click the link at the end of step one, which should look something like
      the following:
      > We've generated the authorization URL for you, all you need to do is
      > just click on link below:
      > https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=23BM6L&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Ffitbit&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=31536000
   1. Go through the login step and then arrive at a "This site cannot be
      reached page"
   1. Copy the URL into a text editor. The URL should look something like the
      following:
      > http://localhost:8080/fitbit#access_token=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNkwiLCJzdWIiOiI5TVBURFYiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJzZXQgcmFjdCBybG9jIHJ3ZWkgcmhyIHJwcm8gcm51dCByc2xlIiwiZXhwIjoxNjY2MTkwNzM0LCJpYXQiOjE2MzQ4MjY1OTB9.aUBqJpQzKP8KwnHcB18x6UoV_zc4sG-dL0nsCZH-3FM&user_id=9MPTDV&scope=settings+profile+weight+heartrate+social+location+activity+sleep+nutrition&token_type=Bearer&expires_in=31364144
   1. Extract the access token from the URL. The access token is the string of
      characters between `access_token=` and `&user_id`. For example, in the
      above link, the following is the access token:
      > eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNkwiLCJzdWIiOiI5TVBURFYiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJzZXQgcmFjdCBybG9jIHJ3ZWkgcmhyIHJwcm8gcm51dCByc2xlIiwiZXhwIjoxNjY2MTkwNzM0LCJpYXQiOjE2MzQ4MjY1OTB9.aUBqJpQzKP8KwnHcB18x6UoV_zc4sG-dL0nsCZH-3FM
1. Put your token(s) in a YAML file:
   1. A the top level of this project, create a file called `config.yaml` (you
      can use any text editor for this).
   1. Create a YAML file that has the following form:
      ```
      fitbit:
        devices:
          - name: Yellow Fitbit
            accessToken: <your access token>
      ```
      For example, with the above code, the YAML file would look like
      ```
      fitbit:
        devices:
          - name: Yellow Fitbit
            accessToken: eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNkwiLCJzdWIiOiI5TVBURFYiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJzZXQgcmFjdCBybG9jIHJ3ZWkgcmhyIHJwcm8gcm51dCByc2xlIiwiZXhwIjoxNjY2MTkwNzM0LCJpYXQiOjE2MzQ4MjY1OTB9.aUBqJpQzKP8KwnHcB18x6UoV_zc4sG-dL0nsCZH-3FM
      ```
      The `name` field can be whatever you would like. I've added it to help you
      keep track of which data is coming from where, rather than having to keep
      track of which access code corresponds to which Fitbit.

      You can add multiple access codes to a file. In this case, each one is
      added by adding a new dash with a `name` and `accessToken`:
      ```
      fitbit:
        devices:
          - name: Yellow Fitbit
            accessToken: <yellow fitbit access token>
          - name: Red Fitbit
            accessToken: <red fitbit access token>
          - name: Blue Fitbit
            accessToken: <blue fitbit access token>
      ```
      You can add as many Fitbit devices as possible.
1. Check that you can get data from each Fitbit.
