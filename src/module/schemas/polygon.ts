import { Vertex as VertexProto } from "../../proto/gen/Vertex";
import { Polygon as PolygonProto } from "../../proto/gen/Polygon";

export class Vertex {
    constructor(public x: number, public y: number) {}

    public static fromProto(vertexProto: VertexProto | undefined): Vertex {
        return new Vertex(+(vertexProto?.x || 0), +(vertexProto?.y || 0));
    }
}

export class Polygon {
    constructor(public vertices: Vertex[]) {}

    public static fromProto(polygonProto: PolygonProto | undefined): Polygon {
        const vertices = polygonProto?.vertices || [];
        return new Polygon(vertices.map(Vertex.fromProto));
    }
}
