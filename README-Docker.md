# Python Works with Nest Sample App (Docker instructions)


NOTE: This is not an official Google product.

## 1. Introduction

This is a simple web app that talks to the Works with Nest API using Python and  
the Flask web framework. You'll use a Nest product to be accessed from the app.  
   
—————————————————————————————————————

## 2. Requirements

* The sample code
* Basic knowledge of HTML, CSS, Javascript, and Python (to change the sample)
* Docker 
* At least one Nest device, such as Nest Thermostat, Nest Cam, or Nest Protect

—————————————————————————————————————

## 3. Install dependencies

This project uses Docker to build and run the application. 

1. Install Docker (and docker-compose if you are on unix). 
   [http://www.docker.com/](http://www.docker.com)<br/>
1. Download the sample app.

—————————————————————————————————————

## 4. Set up your Nest device

If you don't already have a Nest device set up and associated with your  
home.nest.com account, use one of the following procedures.

Set up a Nest device with a Mac or Windows computer

-OR-

Set up a Nest device with the Nest App

-OR- 

Use the Nest Home Simulator to simulate a Nest device

—————————————————————————————————————

## 5. Create a Nest OAuth Client at console.developers.nest.com

Use the same account that you used for your Nest device. 

For the redirect URI, use http://localhost:5000/callback

For the permissions, select read/write corresponding with your Nest client. For 
example,  
if your Nest product is a Thermostat, select Thermostat Read/Write.

The next step is to set your OAuth client ID and client secret as environment  
variables so these values can be retrieved by the application to authorize 
your Nest integration.

If you are using Linux or MacOS, open a Bash shell and type the commands below  
(substitute your client ID and secret you copied from your client page):

```
$ export PRODUCT_ID='Your OAuth client ID here'
$ export PRODUCT_SECRET='Your OAuth client secret here'
```

—————————————————————————————————————

## 6. Run the app

If it's not already running, run the Docker application you installed.

In a terminal window, go to the nest-python directory and run the following 
commands.

```
$ docker-compose up 
```

If you are prompted, click to allow incoming network connections. You can update  
the source code while the Docker container is running, in a separate terminal window. 
 


(Optional) Use REST streaming  
You can use REST Streaming server-sent events instead of polling the API server.  
   *  Update static/js/app.js and un-comment `listenRESTStreamClient()`.  
      Comment out `pollRESTClient()` and save the file.  
   *  Reload the app in the browser.  

—————————————————————————————————————

## 7. Open http://localhost:5000/

Click **Login**.

When we log in, we are redirected to the Nest Authorization screen.  
On the Nest Authorization screen, click **Accept**.

When we accept the integration, the Nest Authorization screen redirects to the  
Redirect URL configured for our Nest client integration
(http://localhost:5000/callback).

—————————————————————————————————————

## 8. See the app in a mobile format

In Chrome, right-click the app and select **Inspect**.  
In the Responsive pulldown menu, select another format, such as iPhone 6.  
Click the icon that looks like a phone (**Toggle device toolbar**).

—————————————————————————————————————

## 9. Stop the app

In a separate terminal window, go to the nest-python directory and run the 
following commands.

```
$ docker-compose down 
```

—————————————————————————————————————

## Companion codelab

[10 Tips for a successful Nest integration](https://codelabs.developers.google.com/codelabs/nest-ten-tips-for-success)

## Contributing

Contributions are always welcome and highly encouraged.

See [CONTRIBUTING](CONTRIBUTING.md) for more information on how to get started.

## License

Apache 2.0 - See [LICENSE](LICENSE) for more information.
