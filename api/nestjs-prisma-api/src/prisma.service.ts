import { Injectable } from "@nestjs/common"
import { PrismaClient } from "./generated/prisma/client.js"
import { prismaClientOptions } from "./lib/prisma.js"

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super(prismaClientOptions)
  }
}
