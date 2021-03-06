'use strict'

const events = require('events');
const cp = require('child_process');
const process = require("process");
const SERIAL_EVENTS = require(__dirname + '/serial_events.js');


var serial_worker = cp.fork(__dirname + '/serial_worker.js',{silent:false});



class SerialInterface extends events.EventEmitter {
    constructor(path,options,immediate){
        super();
        let $ = this;

        $.reporter = new events.EventEmitter();

        serial_worker.on('message',(msg)=>{
            $.reporter.emit(msg.eventType,msg.body);
        });

        serial_worker.send({
            func: 'init',
            param: [path,options,immediate]
        });

        $.reporter.on(SERIAL_EVENTS.data,(data)=>{
            $.emit("data",data);
        });
        $.reporter.on(SERIAL_EVENTS.open,()=>{
            $.emit("open");
        });
        $.reporter.on(SERIAL_EVENTS.close,()=>{
            $.emit("close");
        });
    }

    static list(callback){
        let $ = this;
        serial_worker.send({func:"list",param:undefined});
        serial_worker.once('message',(msg)=>{
            if(msg.eventType === SERIAL_EVENTS.list_success){
                if(callback){
                    callback(undefined,msg.body);
                }
            }else if(msg.eventType === SERIAL_EVENTS.list_failed){
                if(callback){
                    callback(msg.body);
                }
            }
        });

        //serial_worker
    }

    open(callback){
        let $ = this;
        serial_worker.send({func:"open",param:undefined});
        $.reporter.once(SERIAL_EVENTS.open_success,()=>{
            if(callback){
                callback();
            }
        });
        $.reporter.once(SERIAL_EVENTS.open_failed,(err)=>{
            if(callback){
                callback(err);
            }
        });
    }
    isOpen(callback){
        let $ = this;
        serial_worker.send({func:'isOpen',param:undefined});
        $.reporter.once(SERIAL_EVENTS.is_open,(flag)=>{
            callback(flag)
        });
    }
    close(callback){
        let $ = this;
        serial_worker.send({func:"close",param:undefined});
        $.reporter.once(SERIAL_EVENTS.close_success,()=>{
            if(callback){
                callback();
            }
        });
        $.reporter.once(SERIAL_EVENTS.close_failed,(err)=>{
            if(callback){
                callback(err);
            }
        });
    }



}




process.on('exit', function() {
    serial_worker.kill();
});

module.exports = SerialInterface;










//serial_interface.init().then(()=>{},(err)=>{console.log(err)});
