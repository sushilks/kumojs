const sjcl = require('sjcl');
const base64 = require('base-64');
const request = require('request');
import { KumoCfg, KumoCfgElement } from './kumoCfgInterface';

export class Kumo {
    private cfg: KumoCfg;
    private cfgr: {[room:string]: KumoCfgElement};
    private cfga: {[room:string]: KumoCfgElement};
    constructor(config: KumoCfg) {
        this.cfg = config;
        this.cfgr = {};
        this.cfga = {};
        for(let acc in config) {
            for(let hash in config[acc]) {
                let e = config[acc][hash];
                this.cfgr[e.label] = e;
                this.cfga[e.address] = e;
            }
        }
    }

    private h2l(dt: string): Array<number> {
        var r: Array<number> = [];
        for (var i = 0; i < dt.length; i += 2) {
            r.push(parseInt(dt.substr(i, 2), 16));
        }
        return r;
    }

    private l2h(l: Array<number>): string {
        var r=''
        for(var i = 0; i < l.length; ++i) {
            var c = l[i]
            if (c < 16) r += '0'
            r += Number(c).toString(16);
        }
        return r
    }

    private f2c(tempF: number): number {
        // round to nearest .5 C
        return Math.round((tempF - 32) * 10 / 9) / 2;
    }

    public getRoomList(): Array<string> {
        return Object.keys(this.cfgr);
    }
    public getAddressList(): Array<string> {
        return Object.keys(this.cfga);
    }
    public getAddress(label:string): string{
        if (label in this.cfgr)
            return this.cfgr[label].address;
        else
            throw Error("Room "+label+" Not Found.")
    }
    public cryptokeyFromAddress(dt:string, address:string): string {
        let cfg = this.cfga[address];
        let W = this.h2l(cfg.W)
        let p = base64.decode(cfg.password)
        let dt1 = sjcl.codec.hex.fromBits(
            sjcl.hash.sha256.hash(
                sjcl.codec.hex.toBits(
                    this.l2h(
                        Array.prototype.map.call(p+dt, function (m2:String) {
                            return m2.charCodeAt(0)
                        }) as number[]
                    )
                )
            )
        );
        let dt1_l = this.h2l(dt1)
        let dt2 = ''
        for (let i = 0; i < 88; i++) {
            dt2 += '00'
        }
        let dt3 = this.h2l(dt2)
        dt3[64] = 8
        dt3[65] = 64
        dt3.splice(32, 32, ...dt1_l)
        dt3[66] =  cfg.S
        let cryptoserial = this.h2l(cfg['cryptoSerial'])
        dt3[79] = cryptoserial[8]
        dt3[80] = cryptoserial[4]
        dt3[81] = cryptoserial[5]
        dt3[82] = cryptoserial[6]
        dt3[83] = cryptoserial[7]
        dt3[84] = cryptoserial[0]
        dt3[85] = cryptoserial[1]
        dt3[86] = cryptoserial[2]
        dt3[87] = cryptoserial[3]
        dt3.splice(0, 32, ...W)
        let hash = sjcl.codec.hex.fromBits(
            sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(this.l2h(dt3)))
        )
        return hash
    }

    public async cmd_(address: string, pdata:string): Promise<any> {
        return new Promise((resolve, reject) => {
            let url = 'http://' + address + '/api?m=' + this.cryptokeyFromAddress(pdata, address)
            request.put({
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    url: url,
                    body: pdata
                },
                function (error:any, resp:any, body:any) {
                    if (error != null) {
                        console.error("Unable to put data");
                        console.error(error)
                        reject(error);
                    }
                    try {
                        var dt = JSON.parse(body);
                        console.log(JSON.stringify(dt))
                        resolve(dt)
                    } catch (e) {
                        console.error("Unable to parse result after  put :", body);
                        console.error(e)
                        reject(e)
                    }
                });
        });
    }
    private timeout(ms: number): Promise <any> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    public async cmd(address: string, pdata:string): Promise<any> {
      for (let cnt = 0; cnt < 10; ++cnt) {
            try {
              const dt = await  this.cmd_(address, pdata);
              return dt;
            } catch (e) {
              console.error("Error when trying to send command ", pdata, " to " , address);
              console.error(e);
              await this.timeout(5000); 
            }
      }
      const dt = await  this.cmd_(address, pdata);
      return dt;

    }

    public async getStatus(address:string):Promise<any> {
        let c: string = JSON.stringify({"c":{"indoorUnit":{"status":{}}}});
        return this.cmd(address, c)
    }
    public async setMode(address:string, mode:string): Promise<any> {
        if (["off", 'heat', 'cool', 'dry', 'vent', 'auto'].indexOf(mode) < 0) {
            throw new Error("Invalid Mode:"+mode);
        }
        let c:string = JSON.stringify({"c":{"indoorUnit":{"status":{"mode":mode}}}});
        return this.cmd(address, c)
    }
    public async setFanSpeed(address:string, speed:string): Promise<any> {
        if (['quiet', 'low', 'powerful', 'auto', 'superPowerful'].indexOf(speed) < 0) {
            throw new TypeError("Invalid Fan Speed:"+speed);
        }
        let c:string = JSON.stringify({"c":{"indoorUnit":{"status":{"fanSpeed":speed}}}});
        return this.cmd(address, c)

    }
    public async setVentDirection(address:string, dir:string): Promise<any> {
        if (['auto', 'horizontal', 'midhorizontal', 'midpoint', 'midvertical',
                'vertical', 'swing'].indexOf(dir) < 0) {
            throw new TypeError("Invalid Direction:"+dir);
        }
        let c:string = JSON.stringify({"c":{"indoorUnit":{"status":{"vaneDir":dir}}}});
        return this.cmd(address, c)
    }
    public async setCoolTemp(address:string, tempF:number): Promise<any> {
        let tempC=this.f2c(tempF);
        let c:string = JSON.stringify({"c":{"indoorUnit":{"status":{"spCool":tempC}}}});
        return this.cmd(address, c)
    }
    public async setHeatTemp(address:string, tempF:number): Promise<any> {
        let tempC=this.f2c(tempF);
        let c:string = JSON.stringify({"c":{"indoorUnit":{"status":{"spHeat":tempC}}}});
        return this.cmd(address, c)
    }
}
