'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

var request = require('request');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Data interface
    interface dataToBot {
        username: string;
        message: string;
        filename: string;
        question: string;
        config: any;
    };

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "todofy-live-help-poc" is now active!');

    let todofyLive = new TodofyLive();
    let config = new Config();
    
    let disposable = vscode.commands.registerCommand('extension.todofyLive', () => {
        var editor, data:dataToBot, selection, text:string, regex, result;

        // configuration should be set
        if (!config.Load()) {
            vscode.window.showInformationMessage('Please configure todofylivehelp');
            return;            
        }
        
        // define empty data
        data = {
            message: "",
            username: null,
            filename: null,
            question: null,
            config: config.config
        };

        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }


        selection = editor.selection;
        text = editor.document.getText(selection).trim();
        if (!text.length) {
            text = editor.document.lineAt(selection.active.line).text.trim();
        }
        
        regex = /(.*)\@help:([a-zA-Z0-9]*)\s*.*/;
        result = regex.exec(text);
        if (typeof result[1] != 'undefined' && typeof result[2] != 'undefined') {
            data.question = result[1].trim();
            data.username = result[2].trim();
            data.filename = editor.document.fileName;
        
            // Display a message box to the user
            vscode.window.showInformationMessage('Help request sent to: ' +data.username);
            todofyLive.statusBarMessage('Help request sent to: ' +data.username);

            // get 3 lines from top, 3 lines from bottom and send it to slack
            // TODO: make this configurable by adding something like @lines[-10,+10]
            var start = (selection.active.line - 3 > 0) ? selection.active.line - 3 : 0;
            var end = (selection.active.line + 3 < editor.document.lineCount) ? selection.active.line + 3 : editor.document.lineCount;
            for (var i = start; i <= end; i++) data.message += editor.document.lineAt(i).text +"\n";

            // send the request to slackbot
            request.post(config.config.EndPoint, {form: data}, function(a, b, c) {
                var response = JSON.parse(c);
                var guid = response.guid;
                new ResponsePoll().call(data.config, guid, 0);
            });
        } else {
            todofyLive.hideStatusBar();
        }
    });
    
    context.subscriptions.push(todofyLive);
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class TodofyLive {
    private _statusBarItem: StatusBarItem;
    private _timeout: any = null;

    public statusBarMessage(message) {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        if (this._timeout != null) clearTimeout(this._timeout);
        this._statusBarItem.text = message;
        this._statusBarItem.show();

        var that = this;
    }

    public hideStatusBar() {
        if (this._timeout != null) clearTimeout(this._timeout);        
        this._statusBarItem.hide();        
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class Config {
    public config: any;

    public Load() {
        var config = vscode.workspace.getConfiguration('Todofylive.SlackBot');
        var requiredProps = ['APIToken', 'EndPoint', 'Channel', 'Team', 'EndPointPoll'];
        // Verify if all config exist
        for (var i = 0 ; i < requiredProps.length; i++) {
            if (typeof config[requiredProps[i]] == 'undefined' || config[requiredProps[i]] == null) return false;
        }

        this.config = config;
        return true;
    }

    dispose() {
        this.config.dispose();
    }
}

class ResponsePoll {
    // TODO: make this configurable
    private attemptThreshold = 30;
    public call(config, guid, attempt = 0) {
        if (attempt > this.attemptThreshold) return;
        var that = this;
        request.post(config.EndPointPoll, {form: {guid: guid}}, function(a, b, c) {
            var response = JSON.parse(c);
            if (response.ack) {
                vscode.window.showInformationMessage('HELP RESPONSE: ' +response.text);       
            } else {
                setTimeout(function() {
                    that.call(config, guid, attempt + 1);
                }, 5000);
            }
        })
    }
}