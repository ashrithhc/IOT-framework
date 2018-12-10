#!/usr/bin/python

from flask import Flask, request, redirect, url_for, render_template, jsonify
from flask import Response, stream_with_context

import json
import sys

from auth import Auth
from nest_api import NestAPI
from datamodel import NestData
from error import APIError

app = Flask(__name__)

auth = Auth()
api = NestAPI()

@app.route('/testing')
def testing():
    global nestData
    data = nestData.get_data()
    print (data['results']['devices']['cameras'].keys())
    apicontent = {"content": None, "schedule": None}
    return jsonify(apicontent)

@app.route('/showimage')
def showimage():
    global nestData
    data = nestData.get_data()
    camera_id = list(data['results']['devices']['cameras'].keys())[0]

    return redirect(data['results']['devices']['cameras'][camera_id]["snapshot_url"])

@app.route('/')
def index():
    # if not authorized show login/auth view
    if not auth.get_token():
        return render_template('index.html')

    return render_template('application.html', has_token=True)


@app.route('/login')
def login():
    return redirect(auth.get_url())


@app.route('/callback')
def callback():
    authorization_code = request.args.get("code")
    auth.get_access(authorization_code)
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    auth.remove_access(auth_revoked=False)
    return redirect(url_for('index'))

@app.route('/apicontent', methods=['GET'])
def apicontent():
    global nestData
    token = auth.get_token()
    if not token:
        print ("missing token, return 400")
        return "", 400
    try:
        data = api.get_data(token)
        with open('data.json', 'w') as outfile:
            json.dump(data, outfile)

        print (data['results']['devices'].keys())
    except APIError as err:
        return process_api_err(err)

    nestData = NestData(data)

    apicontent = {"content": None, "schedule": None}
    return jsonify(apicontent)

class Start_app(object):

    def __init__ (self):
        app.debug = True
        app.secret_key = "test"
        port = 5000
        host = '0.0.0.0'
        app.run(host=host, port=port, threaded=True)

if __name__ == "__main__":
    Start_app()
