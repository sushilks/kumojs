require('source-map-support').install();

const port = process.env.KUMO_SERVER_PORT || 8084;

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const SKumo = require('./kumojs').Kumo;
const Scfg = require('./kumo.cfg');
var kumo = new SKumo(Scfg);


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

type ExpCB = any;
function rerr(res:any, e:any) {
    console.log("Error: " + e);
    console.log(e.stack);
    res.status(400).send("Error while processing the request [" + e + "]");
}

app.get('/v0/rooms', function(req:ExpCB, res:ExpCB){
    console.log("Got a GET:/v0/rooms");
    try {
        res.status(200).send(JSON.stringify(kumo.getRoomList()));
    } catch(e) {
        rerr(res, e);
    }
});


app.get('/v0/room/:room/status', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let mode = req.params.mode;
        console.log("      PUT:/v0/room" + room + "/status");
        let address = kumo.getAddress(room);
        kumo.getStatus(address).then((r:any) => {
            res.status(200).send(JSON.stringify(r));
        });
} catch(e) { rerr(res, e); }
});

app.put('/v0/room/:room/mode/:mode', function(req:ExpCB, res:ExpCB){
    console.log("Got a PUT:/v0/room");
    try {
        let room = req.params.room;
        let mode = req.params.mode;
        console.log("      PUT:/v0/room" + room + "/mode/"+mode);
        let address = kumo.getAddress(room);
        kumo.setMode(address, mode).then((r:any) => {
            res.status(200).send(JSON.stringify(r));
        }).catch(function(e:any) { rerr(res, e);});
} catch(e) { rerr(res, e); }
});

app.put('/v0/room/:room/speed/:speed', function(req:ExpCB, res:ExpCB){
    console.log("Got a PUT:/v0/room");
    try {
        let room = req.params.room;
        let speed = req.params.speed;
        console.log("      PUT:/v0/room" + room + "/speed/"+speed);
        let address = kumo.getAddress(room);
        kumo.setFanSpeed(address, speed).then((r:any) => {
            res.status(200).send(JSON.stringify(r));
        }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});



app.put('/v0/room/:room/vent/:vent', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let vent = req.params.vent;
        console.log("      PUT:/v0/room" + room + "/vent/"+vent);
        let address = kumo.getAddress(room);
        kumo.setVentDirection(address, vent).then((r:any)=> {
            res.status(200).send(JSON.stringify(r));
        }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});


app.put('/v0/room/:room/cool/temp/:temp', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let temp = req.params.temp;
        console.log("      PUT:/v0/room" + room + "/cooltemp/"+temp);
        let address = kumo.getAddress(room);
        kumo.setCoolTemp(address, temp).then((r:any)=> {
            res.status(200).send(JSON.stringify(r));
        }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});


app.put('/v0/room/:room/heat/temp/:temp', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let temp = req.params.temp;
        console.log("      PUT:/v0/room" + room + "/heattemp/"+temp);
        let address = kumo.getAddress(room);
        kumo.setHeatTemp(address, temp).then((r:any)=> {
            res.status(200).send(JSON.stringify(r));
        }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});

async function setCoolDemand(address:string, demand:number):Promise<any> {
    if (demand < 1) {
        await kumo.setMode(address, 'off')
    } else if (demand < 5) {
        await kumo.setMode(address, 'cool')
        await kumo.setCoolTemp(address,65)
        await kumo.setFanSpeed(address, 'quiet')
    } else if (demand < 8) {
        await kumo.setMode(address, 'cool')
        await kumo.setCoolTemp(address,65)
        await kumo.setFanSpeed(address, 'low')
    } else {
        await kumo.setMode(address, 'cool')
        await kumo.setCoolTemp(address,65)
        await kumo.setFanSpeed(address, 'powerful')
    }
}
async function setHeatDemand(address:string, demand:number):Promise<any> {
    if (demand < 1) {
        await kumo.setMode(address, 'off')
    } else if (demand < 5) {
        await kumo.setMode(address, 'heat')
        await kumo.setHeatTemp(address,78)
        await kumo.setFanSpeed(address, 'quiet')
    } else if (demand < 8) {
        await kumo.setMode(address, 'heat')
        await kumo.setHeatTemp(address,78)
        await kumo.setFanSpeed(address, 'low')
    } else {
        await kumo.setMode(address, 'heat')
        await kumo.setHeatTemp(address,78)
        await kumo.setFanSpeed(address, 'powerful')
    }
}

app.put('/v0/room/:room/cool/demand/:demand', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let demand = req.params.demand;
        console.log("      PUT:/v0/room" + room + "/cool/demaind/"+demand);
        let address = kumo.getAddress(room);
        setCoolDemand(address, demand)
            .then((r:any)=> {
                res.status(200).send(JSON.stringify(r));
            }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});

app.put('/v0/room/:room/heat/demand/:demand', function(req:ExpCB, res:ExpCB){
    try {
        let room = req.params.room;
        let demand = req.params.demand;
        console.log("      PUT:/v0/room" + room + "/heat/demaind/"+demand);
        let address = kumo.getAddress(room);
        setHeatDemand(address, demand)
            .then((r:any)=> {
                res.status(200).send(JSON.stringify(r));
            }).catch(function(e:any) { rerr(res, e);});
    } catch(e) {rerr(res, e); }
});

app.listen(port, function() {
    console.log("App is running on port:", port)
})