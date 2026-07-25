class PlayerStore {
  constructor() {
    this.players = new Map()
  }

  join(player) {
    this.players.set(player.name, player)
  }

  leave(name) {
    this.players.delete(name)
  }

  fullSync(list) {
    const next = new Map()
    for (const p of list) {
      next.set(p.name, p)
    }
    this.players = next
  }

  getAll() {
    return [...this.players.values()]
  }
}

export default PlayerStore
