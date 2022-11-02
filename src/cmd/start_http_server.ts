import { Container } from "brandi";
import dotenv from "dotenv";
import * as utils from "../utils";
import * as config from "../config";
import * as elasticsearch from "../dataaccess/elasticsearch";
import * as grpc from "../dataaccess/grpc";
import * as s3 from "../dataaccess/s3";
import * as modules from "../module";
import * as service from "../service";

export function startHTTPServer(dotenvPath: string) {
    dotenv.config({
        path: dotenvPath,
    });

    const container = new Container();
    utils.bindToContainer(container);
    config.bindToContainer(container);
    elasticsearch.bindToContainer(container);
    grpc.bindToContainer(container);
    s3.bindToContainer(container);
    modules.bindToContainer(container);
    service.bindToContainer(container);

    const server = container.get(service.GATEWAY_HTTP_SERVER_TOKEN);
    server.loadAPIDefinitionAndStart("./api/api.yml");
}
