var config = require('./config');
var moment = require('moment');

var influx = require('influx');
var influx_client = influx({
  host : config.influx_host,
  port : config.influx_port, // default 8086
  protocol : 'http',         // default 'http'
  username : config.influx_user,
  password : config.influx_pass,
  database : config.influx_db
});

// Our providers IDs
var providers = {
    "Multifon1" : "SIP-PROVIDER-124783434254b996ac973dc",
    "Multifon2" : "SIP-PROVIDER-2473986754db1618e64b6",
    "Zadarma" : "SIP-PROVIDER-5898284556540eb7298b5"
};

var dictionary = {
    "ANSWERED" : "Отвечено",
    "NO ANSWER" : "Не ответили",
    "BUSY" : "Занято",
    "userfield" : "Направление",
    "inbound" : "Входящий",
    "outbound" : "Исходящий"
};

function Translate(value) {
    if (value in dictionary) {
        return dictionary[value];
    }
    return value;
}

function GetProvider(channel, destinationchannel) {
    var substring=providers.Multifon1;
    if (channel.indexOf(substring) > -1 || destinationchannel.indexOf(substring) > -1) {
        return "Multifon1";
    }

    substring=providers.Multifon2;
    if (channel.indexOf(substring) > -1 || destinationchannel.indexOf(substring) > -1) {
        return "Multifon2";
    }

    substring=providers.Zadarma;
    if (channel.indexOf(substring) > -1 || destinationchannel.indexOf(substring) > -1) {
        return "Zadarma";
    }

    return "Прочее";
}

function TransformData(evt) {
    return {
        values: {
            Время_общее: parseInt(evt.duration),
            Время_разговора: parseInt(evt.billableseconds),
            Время_ожидания: parseInt(evt.duration)-parseInt(evt.billableseconds)
        },
        tags: {
            callerid: evt.callerid,
            Источник: evt.source,
            Направление: Translate(evt.userfield),
            Статус: Translate(evt.disposition),
            Провайдер: GetProvider(evt.channel, evt.destinationchannel),
            // recordingfile: evt.recordingfile,
            uniqueid: evt.uniqueid
        }
    };
}

// ASKOZIA
var ami = new require('asterisk-manager')(config.agi_port, config.agi_host, config.agi_login, config.agi_pass, true);
ami.keepConnected();

ami.on('disconnect', function(evt) {
    console.log('ATS askozia disconnected ('+moment().format()+'):');
    console.log(evt);
});

ami.on('connect', function(evt) {
    console.log('==========================================================');
    console.log('ATS askozia connected! '+'('+moment().format()+')');
});

// catch CDR event and send metrics to InfluxDB
ami.on('cdr', function(evt) {
    // console.log("==========================================================");
    // console.log(evt);
    console.log("==========================================================");
    console.log('CDR event! '+'('+moment().format()+')');

    // transform CDR-event JSON to special object
    var data = TransformData(evt);

    // writing data into InfluxDB
    console.log('values: '); console.log(data.values);
    console.log('tags: '); console.log(data.tags);

    influx_client.writePoint('calls', data.values, data.tags, function(err,response) {
        if (err) {
            console.log('Error writing data into InfluxDB: ');
            console.log(err);
        }
        console.log("==========================================================");
    });

});

ami.connect(function(){
});
