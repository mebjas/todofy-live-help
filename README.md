# todofy-live-help
**Problem Statement**: We sometime leave todo, because we don't exactly know how to do it or are blocked by someone else working on dependency. A novel way to solve this?

**POC**: User installs an extension in VS Code & get live help from some other team mate over slack.

I had to take two screencaptures, though I think this still gives an Idea.

<img src="./Screenshots/VSCode.gif" alt="Drawing" style="width: 600px;"/>
<img src="./Screenshots/Slack.gif" alt="Drawing" style="width: 600px;"/>
How to try
================================================

Install VSCode Extension: TODO - steps
===================================

For easy usage add a key binding in `File > Preferences > Keyboard Shortcuts`
```json
// Place your key bindings in this file to overwrite the defaults
[
    {"key": "ctrl+shift+t", "command": "extension.todofyLive", "when": "editorTextFocus"}
]
```

This will make sure extension is triggered when you press `ctrl + shift + t`

#### Configuration - File > Preferences > User setting in VSCode
```
"Todofylive.SlackBot": {
    "APIToken": "<SlackAPIToken>",
    "EndPoint": "http://127.0.0.1:8080/todofylivepoc",
    "EndPointPoll": "http://127.0.0.1:8080/todofylivepocpoll",
    "Channel": "<SlackChannel>",
    "Team": "<slack Team Name>"
}
```

Slack Bot
=============================
As of now we have added support for custom integration. So follow these steps
1. Create a slack channel, for example: `todofylivehelp`, remember this name as `SlackChannel`

2. Go to `Options > App & Integrations` and on the top right click on `build`.

3. Select `bot`, give bot a **cool name** like `todofybot`, it's a must. Note down the `API Token`, don't share it with anyone.
Remeber this as `SlackAPIToken`.

4. **This step is very important**: set ![Icon](http://todofy.org/resources/footerface.png) as icon in customize icon.

5. What this bot does: `super cool stuff`

6. Channels: that's what we need to set. Click on `Save Integration`

7. Go to homepage (channel) > `todofylivehelp` or whatever is the `SlackChannel` & `Invite Others to this channel` & select `todofybot`

how to run this bot code
===============================
1. Go to SlackBot
2. `npm install`
3. `node index.js`

