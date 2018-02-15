var _ = require('lodash')
var t = require('tap')
var Session = require('..')

module.exports = (session) => {
  let cache
  return {
    check: async () => {
      await session.check()
    },
    pack: async () => {
      cache = await session.pack()
      t.isa(cache, 'string')
    },

    unpack: async () => {
      session = await Session.unpack(cache)
      t.ok(session instanceof Session)
    },
    modules: async () => {
      var mods = await session.rpc('model.ir.module.search_read', [
        [], 0, null, null, ['name']
      ])
      t.ok(_.isArray(mods))
      _.each(mods, (obj) => {
        t.ok(_.isPlainObject(obj))
        t.isa(obj.id, 'number')
        t.isa(obj.name, 'string')
      })
      var mod = _.filter(mods, (obj) => {
        return obj.name === 'ir'
      })
      t.equal(_.size(mod), 1)
      mod = _.filter(mods, (obj) => {
        return obj.name === 'res'
      })
      t.equal(_.size(mod), 1)
    },
    crash: async () => {
      try {
        await session.rpc('model.tata.juliette', [])
      } catch (err) {
        t.ok(err instanceof Error)
        t.ok(Session.isRPCError(err))
        t.isa(err.status, 'number')
        t.isa(err.message, 'string')
        t.isa(err.tb, 'string')
        return
      }
      t.fail('error not raised')
    }
  }
}
