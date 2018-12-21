import sseclient
import urllib3
from auth import Auth

NEST_API_URL = 'https://developer-api.nest.com'

token = "YOUR_TOKEN_HERE" # Update with your token

class Streamer(object):

    def get_data_stream(token, api_endpoint):
        """ Start REST streaming device events given a Nest token.  """
        headers = {
            'Authorization': "Bearer {0}".format(token),
            'Accept': 'text/event-stream'
        }
        url = api_endpoint
        http = urllib3.PoolManager()

        # get response, handling redirects (307) if needed
        response = http.request('GET', url, headers=headers, preload_content=False,
        redirect=False)
        if (response.status == 307):
            redirect_url = response.headers.get("Location")
            response = http.request('GET', redirect_url, headers=headers,
            preload_content=False, redirect=False)
        if (response.status != 200):
            print("An error occurred! Response code is ", response.status)

        client = sseclient.SSEClient(response)
        for event in client.events(): # returns a generator
            event_type = event.event
            print("event: ", event_type)
            if event_type == 'open': # not always received here 
                print("The event stream has been opened")
            elif event_type == 'put':
                print("The data has changed (or initial data sent")
                print("data: ", event.data)
            elif event_type == 'keep-alive':
                print("No data updates. Receiving an HTTP header to keep the connection open.")
            elif event_type == 'auth_revoked':
                print("The API authorization has been revoked.")
                print("revoked token: ", event.data)
            elif event_type == 'error':
                print("Error occurred, such as connection closed.")
                print("error message: ", event.data)
            else:
                print("Unknown event, no handler for it.")

# get_data_stream(token, NEST_API_URL)