# Twitch Websocket Example

This is a template for connecting websocket with Twitch API by using the React framework and Vite.

Before you start this project, please insure you already have [Twitch Dev Account](https://dev.twitch.tv/console), and create your own twitch app.

### Setting Oauth Redirect
Go to twitch console panel, if you don't know how to enter the panel, it might look like that:
```
https://dev.twitch.tv/console/apps/<client_id>
```
Add your url into `OAuth Redirect URLs`, like: `http://localhost:5173`, and save it.

## Setting env file
Duplicate `.env.example` file and rename to `.env`, there are 2 variables you should fill into `.env`.

```
VITE_TWITCH_CLIENT_ID=<client_id>
VITE_TWITCH_OAUTH_REDIRECT_URI=<redirect_url>
```

## Start Project
```
yarn dev
```