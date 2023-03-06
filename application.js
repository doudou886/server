
'use strict'

/**
 * Module dependencies.
 */

const http = require('http')
const context = require('./context')
const request = require('./request')
const response = require('./response')
const compose = require('./compose')
const Emitter = require('events')

module.exports = class Application extends Emitter{

    /**
     * 构造函数
     */
    constructor() {
        super()
        this.middlewares = []
        this.compose = compose
        //挂载原型
        this.context = Object.create(context)
        this.request = Object.create(request)
        this.response = Object.create(response)
    }

    /**
     * 开启http server并传入callback
     */
    listen(...args) {
        let server = http.createServer(this.callback())
        server.listen(...args)
    }

    /**
     * 挂载回调函数
     * @param {Function} fn 回调处理函数
     */
    use(middleware) {
        this.middlewares.push(middleware)
    }

    /**
     * 获取http server所需的callback函数
     * @return {Function} fn
     */
    callback() {
        return (req, res) => {
            let ctx = this.createContext(req, res)
            let respond = () => this.responseBody(ctx)
            let fn = this.compose(this.middlewares)
            return fn(ctx).then(respond)
        }
    }

    /**
     * 构造ctx
     * @param {Object} req node req实例
     * @param {Object} res node res实例
     * @return {Object} ctx实例
     */
    createContext(req, res) {
        // 针对每个请求，都要创建ctx对象
        let ctx = this.context
        ctx.request = this.request
        ctx.response = this.response
        ctx.req = ctx.request.req = req
        ctx.res = ctx.response.res = res
        return ctx
    }

    /**
     * 对客户端消息进行回复
     * @param {Object} ctx ctx实例
     */
    responseBody(ctx) {
        let content = ctx.body
        if (typeof content === 'string') {
            ctx.res.end(content)
        }
        else if (typeof content === 'object') {
            ctx.res.end(JSON.stringify(content))
        }
    }

}