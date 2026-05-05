const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../proto/lens.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const lensProto = grpc.loadPackageDefinition(packageDefinition).lens;

// Create the client
const getClient = (serverAddress = 'localhost:50060') => {
  return new lensProto.LensSyncService(serverAddress, grpc.credentials.createInsecure());
};

module.exports = { getClient };
