require('source-map-support').install();
const request = require('request');
const readline  = require('readline');
const Writable = require('stream').Writable;
const fs = require('fs');
import { KumoCfg, KumoCfgElement } from './kumoCfgInterface';
const S = 0;
const W = '44c73283b498d432ff25f5c8e06a016aef931e68f0a00ea710e36e6338fb22db';

var mutableStdout = new Writable({
    write: function(chunk: any, encoding:any, callback:()=>void) {
        if (!this.muted)
            process.stdout.write(chunk, encoding);
        callback();
    }
});
mutableStdout.muted = false;

var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
});

function processcfg(acc:any, j:any): KumoCfg {
    var mycfg: KumoCfg = {}
    let mycl: {[hash:string]:KumoCfgElement} = {}
    for (let children in j) {
        let child = j[children]
        for (let zone in child['zoneTable']) {
            let z = child['zoneTable'][zone]
            let myc: KumoCfgElement = {
                serial: z.serial,
                label: z.label,
                cryptoSerial: z.cryptoSerial,
                cryptoKeySet: z.cryptoKeySet,
                password: z.password,
                address: z.address,
                S: S,
                W: W
            }
            mycl[zone] = myc
        }
        mycfg[acc] = mycl
    }
    return mycfg;
}


function post(post_data: string) {
    request.post({
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br',
                'accept-Language': 'en-US,en',
                'Content-Length': post_data.length,
                'Content-Type': 'application/json'
            },
            url: 'https://geo-c.kumocloud.com/login',
            body: post_data
        },
        function (error: any, resp: any, body: any) {
            if (error != null) {
                console.error("Unable to get config");
                console.error(error)
            }
            try {
                var dt = JSON.parse(body);
                var cfg = processcfg(dt[0]['username'], dt[2]['children'])
                console.log("Downloaded the config file from cloud...")
                var out = fs.createWriteStream('kumo.cfg');
                out.write('module.exports = \n')
                out.write(JSON.stringify(cfg))
                out.end()
                console.log("Output written to file :./kumo.cfg")
            } catch (e) {
                console.error("Unable to get config from returned data");
                console.error(e)
            }

        }
    )
}

rl.write('Please enter Kumo cloud credentials\n')
rl.question("Enter username:", function (user: string) {
    console.log("Enter password:");
    mutableStdout.muted = true;
    rl.question("Enter password:", function (pass: string) {
        let msg = {
            username: user,
            password: pass,
            appVersion: "2.2.0"
        };
        var post_data = JSON.stringify(msg);
        post(post_data)
        rl.close()
    })
})




