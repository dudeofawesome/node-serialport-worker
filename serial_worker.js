'use strict'
const serial = require('serialport');
const serialport = serial.SerialPort;
const process = require('process');
const SERIAL_EVENTS = require(__dirname + '/serial_events.js');

var port = null;

process.on('message',function(msg){
    let func_name = msg.func;
    let func_param = msg.param;
    //console.log(func_param);
    //console.log(func_name);

    switch (func_name) {
        case "init":
            let path = func_param[0];
            let opts = func_param[1];
            let immediate = func_param[2];
            port = new serialport(path,opts,false);
            port.on('data',(data)=>{
                //console.log(data);
                let res = {
                    eventType : SERIAL_EVENTS.data,
                    body : data
                };
                process.send(res);
            });

            //This event sometime fired sometimes not fired
            //Ommiting Original Open Event to avoid firing issue
            //New Open Event will be fired in open() callback
            /*
            port.on('open',()=>{
                let res = {
                    eventType : SERIAL_EVENTS.open,
                    body : undefined
                };
                console.log("SENDING GGG");
                process.send(res);
            });
            */
            port.on('close',()=>{
                let res = {
                    eventType : SERIAL_EVENTS.close,
                    body : undefined
                };
                process.send(res);
            });

            if(immediate !== false){
                port.open();
            }

            break;
        case "list":
            let list_res;
            serial.list((err,ports)=>{
                if(err){
                    list_res = {
                        eventType : SERIAL_EVENTS.list_failed,
                        body : err
                    };
                }else{
                    list_res = {
                        eventType : SERIAL_EVENTS.list_success,
                        body : ports
                    };
                }
                process.send(list_res);
            });
            break;

        case "isOpen":
            let is_res = {
                eventType:SERIAL_EVENTS.is_open,
                body : port.isOpen()
            }
            process.send(is_res);
            break;

        default:
            let res = {};
            let callbackfunc = (e)=>{
                if(e){
                    res.eventType = SERIAL_EVENTS[func_name + "_failed"];
                    res.body = e;
                }else{
                    res.eventType = SERIAL_EVENTS[func_name + "_success"];
                    res.body = undefined;

                    //fix open event not fired by ommiting original open event
                    if(func_name === "open"){
                        process.send({
                            eventType : SERIAL_EVENTS.open,
                            body : undefined
                        });
                    }
                }
                process.send(res)
            }
            port[func_name](callbackfunc);
    }
});








//
