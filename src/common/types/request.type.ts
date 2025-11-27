import { FastifyRequest } from "fastify";

export type _FastifyRequest = FastifyRequest & {
  user: RequestUserType;
};

export type RequestUserType = {
  userId: string;
};
