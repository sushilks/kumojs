export interface KumoCfgElement {
    serial: string;
    label: string;
    cryptoSerial: string;
    cryptoKeySet: string;
    password: string;
    address: string;
    S: number;
    W: string;
}
export interface KumoCfg { [accName: string]: {[hash:string]: KumoCfgElement } }
