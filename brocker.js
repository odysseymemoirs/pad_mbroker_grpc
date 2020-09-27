const PROTO_PATH = "customers.proto";

var grpc = require("grpc");

var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var customersProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

const topics = [
    {
        name: "topicOne",
        users: []

    }
];

const currentClients = []

server.addService(customersProto.CustomerService.service, {

    subscribe: (call) => {

        middleware(call)

        const topicName = call.request.payload.topicName

        if (!topics.some(e => e.name === topicName)) {
            call.emit("error")
            return
        }

        // проверяем подписан ли клиент на топик
        if (topics.some(e => e.users.some(e => e.moduleName === call.request.moduleName))) {
            return console.log(call.request.moduleName, `уже подписан на ${topicName}`)
        }

        topics.map((topic) => {
            if (topic.name === topicName) {

                currentClients.map((c, index) => {
                    if (c.moduleName === call.request.moduleName) {

                        topic.users[index] = c
                    }
                })

                console.log(call.request.moduleName, 'подписался на ', topicName)
            }
        })

        console.table(topics)

        call.write({
            type: 'RESPONSE',
            status: 200,
            payload: `Вы подписались на ${topicName}`
        })

    },

    publish: (call) => {

        middleware(call)

        const topicName = call.request.payload.topicName

        const message = call.request.payload.message

        if (!topics.some(e => e.name === topicName)) {
            console.log('not exist')
            return call.emit('error', {
                type: 'ERROR',
                status: 400,
                payload: 'Topic not exists'
            })
        }

        topics.map((topic) => {

            // ищем нужный топик и отправляем все подписчикам сообщение

            currentClients.map((c,index) => {
                if(c.moduleName === call.request.moduleName) {

                    c.clientSocket.write({
                        message,
                        from: `From`,
                        topic: topic.name
                    })
                }
            })
            
        })

    },


    unsubscribe: (call, callback) => {

    },

    retrieveAlltopics: (call, callback) => {

    },

    createTopic: (call, callback) => {

    },

    handshake: (call, callback) => {

    },


});


// миддлеваре как функция, потому что grpc для nodejs пока не поддерживает встроенные миддлеваре
function middleware(call) {

    const peer = call.getPeer('ip')
    const portregex = new RegExp('((?:))(?:[0-9]+)$')
    let port = portregex.exec(peer)[0]
    let sliceIpv4 = peer.slice(5, peer.length)
    let ip = sliceIpv4.substr(0, sliceIpv4.indexOf(':'))

    if (!currentClients[0] || !(currentClients.some(e => e.moduleName === call.request.moduleName))) {

        currentClients.push({
            ip,
            port,
            moduleName: call.request.moduleName,
            clientSocket: call
        })

        return
    }

    for (i = 0; i < currentClients.length; i++) {


        if (currentClients[i].moduleName === call.request.moduleName) {
            // проверяем что у модуля не поменялся ip или порт
            // если поменялся то  
            if (currentClients[i].ip !== ip || currentClients[i].port !== port) {

                // делаем broadcast всем подключенным к брокеру модулям
                const response = {
                    type: 'BROADCAST',
                    status: 301,
                    payload: `The ${call.request.moduleName} module IP or PORT has changed from ${currentClients[i].ip} ===> ${ip} ${currentClients[i].port} ===> ${port} `
                }
                // broadcast(response)

                // запоминаем новый ip или порт
                currentClients[i] = {
                    moduleName: call.request.moduleName,
                    ip,
                    port,
                    clientSocket: call
                }

                break;

            }
        }
    }
}
server
server.bind("127.0.0.1:30043", grpc.ServerCredentials.createInsecure());
console.log("Server running at http://127.0.0.1:30043");
server.start();