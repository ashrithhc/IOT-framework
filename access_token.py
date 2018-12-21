#!/usr/bin/python
import os
import json
from urllib.parse import urlencode
from urllib.request import urlopen, Request

class AccessToken(object):

    def __init__(self):
        self.nest_auth_url =         'https://home.nest.com/login/oauth2'
        self.nest_access_token_url = 'https://api.home.nest.com/oauth2/access_token'
        self.nest_api_root_url     = 'https://api.home.nest.com'
        self.nest_tokens_path      = '/oauth2/access_tokens/'
        self.nest_api_url          = 'https://developer-api.nest.com'

        self.product_id     = os.environ.get("PRODUCT_ID", None)
        self.product_secret = os.environ.get("PRODUCT_SECRET", None)


    def get_access_token(self, authorization_code):
        data = urlencode({
            'client_id': self.product_id,
            'client_secret': self.product_secret,
            'code': authorization_code,
            'grant_type': 'authorization_code'
        }).encode("utf-8")

        req = Request(self.nest_access_token_url, data)
        response = urlopen(req)
        data = json.loads(response.read())

        return data['access_token']


    def delete_access_token(self, token):
        path = self.nest_tokens_path + token
        req = Request(self.nest_api_root_url + path, None)
        req.get_method = lambda: "DELETE"
        response = urlopen(req)
        resp_code = response.getcode()
        print ("deleted token, response code: ", resp_code)
        return resp_code


    def authorization_url(self):
        query = urlencode({
            'client_id': self.product_id,
            'state': 'STATE'
        })
        return "{0}?{1}".format(self.nest_auth_url, query)
