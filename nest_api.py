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

'''
def get_event_stream(token):
    # Must use this version for sseclient for this sample
    #   https://github.com/mpetazzoni/sseclient
    import sseclient
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    """ Start REST streaming device events given a Nest token.  """
    headers = {
        'Authorization': "Bearer {0}".format(token),
        'Accept': 'text/event-stream'
    }
    http = urllib3.PoolManager()
    response = http.request('GET', nest_api_url, headers=headers, preload_content=False, redirect=False)
    if (response.status == 307):
        redirect_url = response.headers.get("Location")
        response = http.request('GET', redirect_url, headers=headers, preload_content=False, redirect=False)
    if (response.status != 200):
        print "An error occurred! Response code is ", response.status

    client = sseclient.SSEClient(response)
    return client


def get_device(token, device_type, device_id):
    api_path = "{0}/devices/{1}/{2}".format(nest_api_url, device_type, device_id)
    data = get_data(token, api_path)
    device = data.get("results") if data else None
    return device

def update(token, update_path, data):
    headers = {
        'Authorization': "Bearer {0}".format(token),
        'Content-Type': 'application/json'
    }
    api_path = "{0}/{1}".format(nest_api_url, update_path)
    print "update: api_path: ", api_path
    response = requests.put(api_path, data=data, headers=headers, allow_redirects=False)
    resp_code = response.status_code

    if resp_code == 200:
        return True

    elif resp_code == 307:
        # option: cache redirect_url to reduce requests to Nest API
        redirect_url = response.headers['Location']
        print "redirect_url: ", redirect_url
        next_resp = requests.put(redirect_url, data=data, headers=headers, allow_redirects=False)
        next_resp_code = next_resp.status_code
        if next_resp_code == 200:
            return True
        else:
            # send error message to client
            raise apierr_from_json(next_resp_code, next_resp.content)

    else:
        # send error message to client
        raise apierr_from_json(resp_code, response.content)


def apierr_from_json(code, json_msg):
    """ Retrieve the error message field from JSON sent from the Nest API.
    * Example: HTTP Status Code: 400 Bad Request, HTTP response (message will be in JSON format):
    {
        "error": "Temperature '$temp' is in wrong format",
        "type": "https://console.developers.nest.com/documentation/cloud/error-messages#format-error",
        "message": "Temperature '$temp' is in wrong format",
        "instance": "31441a94-ed26-11e4-90ec-1681e6b88ec1",
        "details": {
            "field_name": "$temp"
        }
    }

    See Nest API Error messages (https://developers.nest.com/documentation/cloud/error-messages) for more examples.
    """
    try:
        respjson = json.loads(json_msg)
        errmsg = respjson.get("message")
    except Exception as e:
        print "Exception reading error message as json: ", e
        errmsg = ''

    return apierr_from_msg(code, errmsg)

def apierr_from_msg(code, err_msg="Error"):
    # get additional message (not from the API), for next steps or more details.
    help_msg = get_error_msg_help(code, '')

    return APIError(code, error_result("{0}: {1}. {2}".format(str(code), err_msg, help_msg)))
'''
