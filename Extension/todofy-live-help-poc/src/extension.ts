'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

var request = require('request');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    interface dataToBot {
        username: string;
        message: string;
        filename: string;
        question: string;
    };

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "todofy-live-help-poc" is now active!');

    let todofyLive = new TodofyLive();
    let config = new Config();
    
    let disposable = vscode.commands.registerCommand('extension.todofyLive', () => {
        // The code you place here will be executed every time your command is executed
        if (!config.Load()) {
            vscode.window.showInformationMessage('Please configure todofylivehelp');
            return;            
        }

        // Display a message box to the user
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var selection = editor.selection;
        var text:string = editor.document.getText(selection);
        var data:dataToBot = {
            message: "",
            username: null,
            filename: null,
            question: null  
        };

        if (!text.length) {
            text = editor.document.lineAt(selection.active.line).text;
        }

        text = text.trim();
        var regex = /(.*)\@help:([a-zA-Z0-9]*)\s*.*/;
        var result = regex.exec(text);
        if (typeof result[1] != 'undefined' && typeof result[2] != 'undefined') {
            data.question = result[1].trim();
            data.username = result[2].trim();
            data.filename = editor.document.fileName;
        
            // Display a message box to the user
            vscode.window.showInformationMessage('Help request sent to: ' +data.username);
            todofyLive.statusBarMessage('Help request sent to: ' +data.username);

            // TODO: get 3 lines from top, 3 lines from bottom and send it to slack
            var start = (selection.active.line - 3 > 0) ? selection.active.line - 3 : 0;
            var end = (selection.active.line + 3 < editor.document.lineCount) ? selection.active.line + 3 : editor.document.lineCount;
            for (var i = start; i <= end; i++) data.message += editor.document.lineAt(i).text +"\n";

            console.log(data);


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

    // constructor
    TodofyLive() {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    }

    // public function
    public updateStatusBar() {
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        let TODOCount = this._getTODOCount(doc);

        // Update the status bar
        this._statusBarItem.text = TODOCount !== 1 ? `${TODOCount} TODOs` : '1 TODO';
        this._statusBarItem.show();
    }

    public _getTODOCount(doc: TextDocument): number {
        let docContent = doc.getText().toLowerCase();
        return docContent.split('todo').length;
    }

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
    private config: any;

    public Load() {
        var config = vscode.workspace.getConfiguration('Todofylive.SlackBot');
        var requiredProps = ['APIToken', 'EndPoint', 'Channel', 'Team'];
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