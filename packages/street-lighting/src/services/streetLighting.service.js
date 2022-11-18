const StreetLighting = require("../model/StreetLighting")
const mongoose = require('mongoose');

module.exports = {
    name: "street-lighting-service",
    version: 1,
    actions: {
        create: {
            async handler(ctx) {
                const _id = mongoose.Types.ObjectId();
                const historicId = mongoose.Types.ObjectId();
                const timeElapsed = Date.now();
                const today = new Date(timeElapsed);
                if (ctx.params) {
                    if (ctx.params.street
                        && ctx.params.streetNumber
                        && ctx.params.latitude
                        && ctx.params.longitude
                        && ctx.params.description
                        && ctx.params.userId
                    ) {
                        this.createHistoric({
                            id: historicId,
                            userId: ctx.params.userId,
                            serviceId: _id,
                            serviceName: "Problemas na Iluminação Publica",
                            description: ctx.params.description,
                            street: ctx.params.street,
                            streetNumber: ctx.params.streetNumber,
                            serviceStatus: 1,
                            date: today,
                        });

                        return StreetLighting.create({
                            _id,
                            userId: ctx.params.userId,
                            cityId: ctx.params.cityId,
                            street: ctx.params.street,
                            streetNumber: ctx.params.streetNumber,
                            referencePoint: ctx.params.referencePoint,
                            latitude: ctx.params.latitude,
                            longitude: ctx.params.longitude,
                            description: ctx.params.description,
                            images: ctx.params.images,
                            serviceStatus: false,
                            date: today
                        })
                    }
                }
                return false
            }
        },

        getAll: {
            async handler(ctx) {
                return await StreetLighting.find()
            }
        },

        getById: {
            async handler(ctx) {
                if (ctx.params && ctx.params.id) {
                    return await StreetLighting.find({ _id: ctx.params.id })
                }
                return false
            }
        },

        update: {
            async handler(ctx) {
                if (ctx.params && ctx.params.id) {
                    const _id = mongoose.Types.ObjectId();
                    const timeElapsed = Date.now();
                    const today = new Date(timeElapsed);
                    return await StreetLighting.updateOne({ _id: ctx.params.id }, {
                        $set: {
                            street: ctx.params.street,
                            streetNumber: ctx.params.streetNumber,
                            referencePoint: ctx.params.referencePoint,
                            latitude: ctx.params.latitude,
                            longitude: ctx.params.longitude,
                            description: ctx.params.description,
                            images: ctx.params.images,
                        }
                    });
                }
                return false
            }
        },

        updateResolved: {
            async handler(ctx) {
                const _id = mongoose.Types.ObjectId();
                const timeElapsed = Date.now();
                const today = new Date(timeElapsed);
                const problem = await StreetLighting.find({ _id: ctx.params.id })
                let newDescription = '';
                if (ctx.params) {
                    if (ctx.params.serviceStatus === 2) {
                        newDescription = problem[0].description + '\n\n Atualização: \n ' + ctx.params.description
                    }
                    if (ctx.params.serviceStatus === 3) {
                        newDescription = problem[0].description + '\n\n Finalizado: \n ' + ctx.params.description
                    }
                    this.createNotification({
                        _id,
                        serviceId: ctx.params.id,
                        userId: ctx.params.userId,
                        serviceName: 'Problemas na Iluminação Publica',
                        description: ctx.params.description,
                        street: ctx.params.street,
                        streetNumber: ctx.params.streetNumber,
                        isRead: ctx.params.isRead,
                        serviceStatus: ctx.params.serviceStatus,
                        date: today,
                    })
                    return await StreetLighting.updateOne({ _id: ctx.params.id }, { $set: { serviceStatus: ctx.params.serviceStatus, description: newDescription } });
                }
                return false
            }
        },

        delete: {
            async handler(ctx) {
                if (ctx.params && ctx.params.id) {
                    return await StreetLighting.deleteOne({ _id: ctx.params.id })
                }
                return false
            }
        }
    },

    methods: {
        async createHistoric(params) {
            try {
                await this.broker.call("v1.historic.create", {
                    _id: params.id,
                    userId: params.userId,
                    serviceId: params.serviceId,
                    serviceName: params.serviceName,
                    description: params.description,
                    street: params.street,
                    streetNumber: params.streetNumber,
                    serviceStatus: params.serviceStatus,
                    date: params.date,
                });
                return true;
            } catch (error) {
                if (error.name == "ServiceNotFoundError") {
                    this.logger.info(error);
                    return;
                } else
                    throw error;
            }
        },
        async createNotification(params) {
            try {
                await this.broker.call("v1.notifications.create", {
                    _id: params.id,
                    serviceId: params.serviceId,
                    userId: params.userId,
                    serviceName: params.serviceName,
                    description: params.description,
                    street: params.street,
                    streetNumber: params.streetNumber,
                    isRead: params.isRead,
                    serviceStatus: params.serviceStatus,
                    date: params.date,
                });
                return true;
            } catch (error) {
                if (error.name == "ServiceNotFoundError") {
                    this.logger.info(error);
                    return;
                } else
                    throw error;
            }
        }
    }

}