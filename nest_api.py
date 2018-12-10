#!/usr/bin/python

import json
from urllib.request import urlopen, Request
import urllib.error
import requests

from error import APIError, get_error_msg_help
from access_token import AccessToken

class NestAPI(object):

    def __init__(self):
        self.access_token = AccessToken()

    def get_data(self, token, api_endpoint=None):
        if api_endpoint == None:
            api_endpoint = self.access_token.nest_api_url
        headers = {
            'Authorization': "Bearer {0}".format(token),
        }
        req = Request(api_endpoint, None, headers)
        try:
            response = urlopen(req)
        except urllib.error.HTTPError as err:
            json_err = err.read()
            print ("get_data error occurred: ", json_err)
            raise apierr_from_json(err.code, json_err)

        except Exception as ex:
            print ("Error: ", ex)
            raise self.apierr_from_msg(500, "An error occurred connecting to the Nest API.")

        data = json.loads(response.read())

        return {"results": data}

    def apierr_from_msg(self, code, err_msg="Error"):
        help_msg = get_error_msg_help(code, '')

        return APIError(code, error_result("{0}: {1}. {2}".format(str(code), err_msg, help_msg)))
