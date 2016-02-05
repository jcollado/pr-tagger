import winston from 'winston'

const logger = new winston.Logger({
  transports: [new winston.transports.Console()]
})
logger.cli()

export {
  logger
}
