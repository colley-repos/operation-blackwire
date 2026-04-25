import { Actor } from './Actor'

export abstract class Pawn extends Actor {
  isPossessed = false
  possess(): void { this.isPossessed = true }
  unpossess(): void { this.isPossessed = false }
}
