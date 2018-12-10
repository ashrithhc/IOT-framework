#!/usr/bin/python

from flask import session

from access_token import AccessToken
# import data_store

class Auth(object):

    def __init__ (self):
        self.access_token = AccessToken()

    def get_url(self):
        return self.access_token.authorization_url()

    def get_access(self, authorization_code):
        token = self.access_token.get_access_token(authorization_code)
        self.store_token(token)

    def remove_access(self, auth_revoked=False):
        self.token = fetch_token()
        if token:
            auth_revoked = False
            if not auth_revoked:
                # delete user token using the Nest API, if not already revoked
                try:
                    self.access_token.delete_access_token(token)
                except Exception as ex:
                    print ("Error deleting access token: ", ex)

            # delete token and user data from persistent storage and cache
            self.delete_cached_token()
            # data_store.delete_user_data()

        else:
            print ('Not signed in.')


    def get_token(self):
        return self.fetch_token()


    def fetch_token(self):
        if session is not None and "token" in session:
            return session["token"]
        return None


    def store_token(self, token):
        session["token"] = token


    def delete_cached_token(self):
        session["token"] = None
