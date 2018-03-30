
# kumojs

A NodeJS server which accepts REST commands and configures Mitsubishi Airconditioners that use Kumo Gateway


## TO setup build env and packages
---------
> npm install

## TO BUILD
---------
> npm run build
 
## To setup you configuraiton file. 
---------
This step is important step, this is what creates the configuraiton file that has all the information about the
units. The CLI mode and the server mode will use this file to work.
When you run this, the script connects to the cloud and downloads the configuration. (Hopefully This is not going 
 to be disabled by the cloud folks).
The download files will be stored in kumo.cfg

```
> npm run config
> cp kumo.cfg build/
```

## To start SERVER
---------
This command will run a rest server that will accept commands by listining to a http port and sending those commands
to the airconditioner

> npm run server

Detail on how to run in server mode and all the API's are provided later in the document.

## To run in cli mode
---------
>  npm run cmd show config

Detail on how to run in cli mode and all the commands are provided later in the document.


## To create a container to run the package use the docker directory
---------
Build the container
```
> cp build/kumo.cfg docker/
> cd docker
> ./build_kumojs
```

## to run the container (I Use shared namespace in my case)
---------
> docker run --net=host  -d --name kumojs --restart unless-stopped --tmpfs /run --tmpfs /run/lock sushilks/kumojs /bin/bash -c ". /root/.nvm/nvm.sh && /root/run_kumojs.sh"

## To attach to the running container
---------
> ./attach_kumojs

## To view the logs from the container
---------
> docker logs -f kumojs


## Usages in CLI Mode
---------
in cli mode you can send a command to the air-conditioner form the shell. 

### Help
```
> npm run cmd help
usage: kumoCmd.js room <room> mode ( off | heat | cool | dry )
       kumoCmd.js room <room> fan ( quiet | low | powerful )
       kumoCmd.js room <room> vent [ auto | horizontal | midhorizontal | midpoint | midvertical | vertical | swing ]
       kumoCmd.js room <room> status
       kumoCmd.js room <room> cool temp <temp>
       kumoCmd.js room <room> heat temp <temp>
       kumoCmd.js show [config]
```

### To see the configuration file i.e. all the rooms and address
```
> npm run cmd show config

Account 	Address 	Label
Acc:mike@mydomain.com address:192.168.2.20 label:Master Bedroom
Acc:mike@mydomain.com address:192.168.2.21 label:Kids Room
Acc:mike@mydomain.com address:192.168.2.22 label:Guest Room
```

### Get the status of one of the air con
```
> npm run cmd room 'Guest Room' status
Status: {"r":{"indoorUnit":{"status":{"roomTemp":19.5,"mode":"off","spCool":25.5,
"spHeat":22.5,"vaneDir":"vertical","fanSpeed":"quiet","tempSource":"unset","activeThermistor":"unset",
"filterDirty":false,"hotAdjust":false,"defrost":false,"standby":false,"runTest":0}}}}
```

### Turn on one of the air conditioner to cool
```
> npm run cmd room 'Guest Room' mode cool 
{"r":{"indoorUnit":{"status":{"mode":"off"}}}}
```

### to change the fan speed in the guest room
```
> npm run cmd room 'Guest Room' fan powerful

```

### Turn off the air conditioner to cool in Guest room
```
> npm run cmd room 'Guest Room' mode off 
```

## Usages when running as an API server
---------
Start the server 
```
> npm run server
App is running on port: 8084
```
### Get a list of rooms
 
 ```
 > curl http://127.0.0.1:8084/v0/rooms
 ["Guest Room","Master Bedroom","Kids Room"]
 ```
 
### Get the status of Guest Room
```
> curl http://127.0.0.1:8084/v0/room/Guest%20Room/status
{"r":{"indoorUnit":{"status":{"roomTemp":23.333334,"mode":"off","spCool":25.5,"spHeat":22.5,
"vaneDir":"horizontal","fanSpeed":"powerful","tempSource":"unset","activeThermistor":"unset",
"filterDirty":false,"hotAdjust":false,"defrost":false,"standby":false,"runTest":0}}}}
```

### Start the guest room Aircon in cooling mode
```
> curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/mode/cool
{"r":{"indoorUnit":{"status":{"mode":"off"}}}}
```

### Change the fan speed
 ```
 > curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/speed/powerful
 {"r":{"indoorUnit":{"status":{"fanSpeed":"powerful"}}}}
 ```
 
 ### Change the vent setting
 ```
 curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/vent/swing
 {"r":{"indoorUnit":{"status":{"vaneDir":"horizontal"}}}}
 ```
 
 ### change the temperature for cooling
  ```
  > curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/cooltemp/68
  {"r":{"indoorUnit":{"status":{"spCool":20}}}}
  ```
  
 ### change the temperature for heating
  ```
 > curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/heattemp/68
   {"r":{"indoorUnit":{"status":{"spHeat":20}}}}
 ```
   
 
