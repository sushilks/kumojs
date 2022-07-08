
# kumojs

A NodeJS server that accepts REST commands and configures Mitsubishi air conditioners equipped with Kumo Cloud Wi-Fi interfaces (WI1 and WI2).

# Getting Started

kumojs is a suite of related tools that work together to configure and run the NodeJS server. 

  * **kumoserver** -- a long running process that connnects to Kumo Cloud interfaces to send commands
  * **kumo** -- command line interface tool that sends commands to the kumojs server
  * **kumoconfig** -- generates a configuration file for the kumojs server

## Installation

To install kumojs, run the following command:
```
> npm install kumojs
```
Once installed, you need to create a `kumo.cfg` file before any commands will work.

## Configuration
Run the following command:
```
> kumoconfig
```
This creates the `kumo.cfg` file needed for all kumojs commands.

## Command Line Interface (CLI)
After installation, access the CLI by running the **kumo** command. For example:
```
> kumo help
```
shows the different options available. The CLI is described in detail later in this document.

## Server
To start the server, run the following command:
```
> kumoserver
```

# Work with the kumojs Source Repository

## Set up a build environment and install required packages
After cloning this repo, from the repo directory, run the following command:
```
> npm install
```
Once all dependencies are installed, you can work directly with the kumojs source files.

## Build 
To build your modified version of kumojs, from the repo directory, run the following command:
```
> npm run build
```

## Set up configuration file

This command generates a configuration file with details of your air conditioner units. 
**This step is essential.** The CLI and the server require the details from this file.

When you run this command, kumojs connects to the Kumo Cloud service and downloads configuration details, including the IP addresses for your units on your local network, and authentication tokens required to connect directly to them. (Hopefully this won't be disabled by Kumo Cloud.) The downloaded details are stored in `kumo.cfg`. Run the following commands:
```
> npm run config
> cp kumo.cfg build/
```

# Run kumojs

## Start the Server
This command starts the kumoserver process. kumoserver is a long-running process providing a REST server that accepts commands on its http port, and then relays those commands to the air conditioner unit.
```
> npm run server
```
Details about how to run in server mode and the available commands are described in detail later in this document.

## Run in CLI mode
This command runs kumojs commands directly via its CLI. For example:
```
>  npm run cmd show config
```
Details about how to run in CLI mode and the available commands are described in detail later in this document.

## Create a container to run the package using the docker directory
To build the container, run the following commands:
```
> cp build/kumo.cfg docker/
> cd docker
> ./build_kumojs
```

### Run the container
This example uses a shared namespace. Run the following command:
```
> docker run --net=host  -d --name kumojs --restart unless-stopped --tmpfs /run --tmpfs /run/lock sushilks/kumojs /bin/bash -c ". /root/.nvm/nvm.sh && /root/run_kumojs.sh"
```

### Attach to the running container
```
> ./attach_kumojs
```

### View logs from the container
```
> docker logs -f kumojs
```

## Use kumojs in CLI Mode
In CLI mode, you can send a command to an air conditioner unit directly from the command line.

### Help
To get help with the CLI, run the following command:
```
> npm run cmd help
or
> kumo help
```

#### Example Help Output
```
usage: kumoCmd.js room <room> mode ( off | heat | cool | dry )
       kumoCmd.js room <room> fan ( quiet | low | powerful )
       kumoCmd.js room <room> vent [ auto | horizontal | midhorizontal | midpoint | midvertical | vertical | swing ]
       kumoCmd.js room <room> status
       kumoCmd.js room <room> cool temp <temp>
       kumoCmd.js room <room> heat temp <temp>
       kumoCmd.js show [config]
```

### View the Configuration 
This command displays all of the rooms (units, or zones) and the IP addresses of configured units. Run the following command:
```
> npm run cmd show config
```

#### Example Configuration Output
```
Account 	Address 	Label
Acc:mike@mydomain.com address:192.168.2.20 label:Master Bedroom
Acc:mike@mydomain.com address:192.168.2.21 label:Kids Room
Acc:mike@mydomain.com address:192.168.2.22 label:Guest Room
```

### Get the status of an air conditioner unit
This command gets the current state of a specific air conditioner unit. Run the following command:
```
> npm run cmd room 'Guest Room' status
```
Output is returned in JSON format.

#### Example Status Output
```
Status: {"r":{"indoorUnit":{"status":{"roomTemp":19.5,"mode":"off","spCool":25.5,
"spHeat":22.5,"vaneDir":"vertical","fanSpeed":"quiet","tempSource":"unset","activeThermistor":"unset",
"filterDirty":false,"hotAdjust":false,"defrost":false,"standby":false,"runTest":0}}}}
```

### Turn on an air conditioner and set to cool
```
> npm run cmd room 'Guest Room' mode cool
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"mode":"off"}}}}
```

### Change fan speed in Guest Room
```
> npm run cmd room 'Guest Room' fan powerful

```

### Turn off the air conditioner in Guest Room
```
> npm run cmd room 'Guest Room' mode off
```

## Use as a REST Server

When you run kumojs as a server, you can send it commands from any device on your network using HTTP REST requests.

### Start the Server
Start the server with the following command:
```
> npm run server
```

#### Example Result
```
App is running on port: 8084
```

### Get a list of rooms
```
> curl http://127.0.0.1:8084/v0/rooms
```

#### Example Result
```
["Guest Room","Master Bedroom","Kids Room"]
```

### Get the status of Guest Room
```
> curl http://127.0.0.1:8084/v0/room/Guest%20Room/status
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"roomTemp":23.333334,"mode":"off","spCool":25.5,"spHeat":22.5,
"vaneDir":"horizontal","fanSpeed":"powerful","tempSource":"unset","activeThermistor":"unset",
"filterDirty":false,"hotAdjust":false,"defrost":false,"standby":false,"runTest":0}}}}
```

### Start the Guest Room air conditioner in cooling mode
```
> curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/mode/cool
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"mode":"off"}}}}
```

### Change the fan speed
```
> curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/speed/powerful
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"fanSpeed":"powerful"}}}}
```

### Change the Vent Setting
The vents or vanes control the direction of air flowing out of the air conditioner unit. To change the vent mode:
```
curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/vent/swing
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"vaneDir":"horizontal"}}}}
```

### Change the set temperature for cooling
```
> curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/cool/temp/68
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"spCool":20}}}}
```

### Change the set temperature for heating
```
> curl -XPUT http://127.0.0.1:8084/v0/room/Guest%20Room/heat/temp/68
```

#### Example Result
```
{"r":{"indoorUnit":{"status":{"spHeat":20}}}}
```

# TODO
A list of remaining tasks to do in this project. Updating this list is the first item. ;-)
