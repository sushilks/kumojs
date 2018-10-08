require('source-map-support').install();
//const request = require('request');
const neodoc = require('neodoc');
const Kumo = require('./kumojs').Kumo;
const cfg = require('./kumo.cfg');
var kumo = new Kumo(cfg);

const args = neodoc.run(`
usage: kumoCmd.js room <room> mode ( off | heat | cool | dry | vent | auto )
       kumoCmd.js room <room> fan ( quiet | low | powerful | super | auto )
       kumoCmd.js room <room> vent [ auto | horizontal | midhorizontal | midpoint | midvertical | vertical | swing ]
       kumoCmd.js room <room> status
       kumoCmd.js room <room> cool temp <temp>
       kumoCmd.js room <room> heat temp <temp>
       kumoCmd.js show [config]
`, {optionsFirst: true, smartOptions: true});


async function processCmd(args:any) {
    try {
        // console.log(args)
        let room = args['<room>'];
        let address = kumo.getAddress(room);
        if (address == '') {
            throw new Error("Unable to find Room:" + room);
        }
        if ('mode' in args && args['mode']) {
            let cmd = '';
            if ('off' in args) {
                cmd = 'off'
            } else if ('heat' in args) {
                cmd = 'heat'
            } else if ('cool' in args) {
                cmd = 'cool'
            } else if ('dry' in args) {
                cmd = 'dry'
            } else if ('auto' in args) {
                cmd = 'auto'
            } else if ('vent' in args) {
                cmd = 'vent'
            }
            let res = await kumo.setMode(address, cmd);
            return res;
        } else if ('fan' in args && args['fan']) {
            let cmd = '';
            if ('quiet' in args) {
                cmd = 'quiet'
            } else if ('low' in args) {
                cmd = 'low'
            } else if ('powerful' in args) {
                cmd = 'powerful'
            } else if ('super' in args) {
                cmd = 'superPowerful'
            } else if ('auto' in args) {
                cmd = 'auto'
            }
            return await kumo.setFanSpeed(address, cmd);
        } else if ('vent' in args && args['vent']) {
            let cmd = ''
            if ('auto' in args)
                cmd = 'auto';
            else if ('horizontal' in args)
                cmd = 'horizontal'
            else if ('midhorizontal' in args)
                cmd = 'midhorizontal'
            else if ('midpoint' in args)
                cmd = 'midpoint'
            else if ('midvertical' in args)
                cmd = 'midvertical'
            else if ('vertical' in args)
                cmd = 'vertical'
            else if ('swing' in args)
                cmd = 'swing'
            return await kumo.setVentDirection(address, cmd);
        } else if ('status' in args && args['status']) {
            let r = await kumo.getStatus(address)
            console.log("Status:", JSON.stringify(r))
        } else if ('temp' in args && args['temp']) {
            let t = args['<temp>'];
            if ('cool' in args)
                return await kumo.setCoolTemp(address, t);
            else
                return await kumo.setHeatTemp(address, t);
        }

    } catch (e) {
        console.log("Error :", e)
        return -1;;
    }

}


if (args['show']) {
    console.log('Account \tAddress \tLabel')
    for(let acc in cfg) {
        for (let hash in cfg[acc]) {
            let e = cfg[acc][hash];
            console.log('Acc:'+acc+' address:' + e.address + ' label:' + e.label);
        }
    }
} else {
    processCmd(args)
}