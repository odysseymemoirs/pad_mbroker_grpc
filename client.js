const PROTO_PATH = "customers.proto";
const inquirer = require('inquirer');

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

const CustomerService = grpc.loadPackageDefinition(packageDefinition).CustomerService;
const client = new CustomerService(
    "localhost:30043",
    grpc.credentials.createInsecure()
);

(() => {


    recursiveAsyncReadLine()

})()

function recursiveAsyncReadLine() {

    inquirer
        .prompt([
            {
                type: 'list',
                name: 'option',
                message: 'Choose option?',
                choices: ['Publish', 'Subscribe', 'Unsubscribe', 'Topics', 'Create'],
            },
        ])
        .then(answers => {

            switch (answers.option) {
                case "Publish":
                    publish()
                    break;
                case "Subscribe":
                    subscribe()
                    break;
                case "Unsubscribe":
                    unsubscribe()
                    break;
                case "Topics":
                    retrieveAllTopics()
                    break;
                case "Create":
                    createTopic()
                    break;
                default:
                    console.log("No such option. Please enter another:\n");
            }
        });
}


function subscribe() {
    
    inquirer
    .prompt([
        {
            name: 'topicName',
            message: 'Enter topic name',
        }
    ])
    .then(answers => {
        let call = client.subscribe({
            type: 'COMMAND',
            command: 'SUBSCRIBE',
            moduleName: "M2",
            payload: {
                topicName: answers.topicName
            }
        }, (err, data) => {
            if (err) console.log(err)
            else console.log(data)
        });
        
        call.on('data', function (response) {
            console.log(response);
        });
        
        call.on('error', function (response) {
            console.log("ERROR");
        });
        
        call.on('end', function () {
        });
        

        return recursiveAsyncReadLine()
    });
}

function publish() {
    inquirer
    .prompt([
        {
            name: 'topicName',
            message: 'Enter topic name: ',
        },
        {
            name: 'msg',
            message: 'Enter message to send: ',
        },
    ])
    .then(answers => {
     
        let call = client.publish({
            type: 'COMMAND',
            command: 'SUBSCRIBE',
            moduleName: "M2",
            payload: {
                topicName: answers.topicName,
                message: answers.msg
            }
        }, (err, data) => {
            if (err) console.log(err)
            else console.log(data)
        });
        
        call.on('data', function (response) {
            console.log(response);
        });
        
        call.on('error', function (response) {
            console.log("ERROR");
        });
        
        call.on('end', function () {
        });

        return recursiveAsyncReadLine()
    });
}

module.exports = client;