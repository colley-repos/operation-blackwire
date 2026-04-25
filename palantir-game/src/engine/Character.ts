import { Pawn } from './Pawn'

export abstract class Character extends Pawn {
  isAlive = true
  destroy(): void { this.isAlive = false }
}
