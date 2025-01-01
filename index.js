const scoreEl = document.querySelector('#scoreEl')
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

class Player {
  constructor() {
    this.velocity = {
      x: 0,
      y: 0
    }
    this.rotation = 0
    this.opacity = 1
    const image = new Image()
    image.src = './img/spaceship.png'
    image.onload = () => {
      const scale = 0.15
      this.image = image
      this.width = image.width * scale
      this.height = image.height * scale
      // 
      this.position = {
        x: canvas.width / 2 - this.width / 2,
        y: canvas.height - this.height - 20
      }
    }
  }
  draw() {
    // Save the current canvas for a later restore
    c.save()
    // Activates Player fade-out when user loses game
    c.globalAlpha = this.opacity
    // Move canvas anchor position to player center so we can perform the tilt effect without tilting the entire canvas
    // Find the players center
    c.translate(
      player.position.x + player.width / 2,
      player.position.y + player.height / 2
    )
    // Tilt the player image
    c.rotate(this.rotation)
    // Move canvas anchor position back to top left corner by reversing out the tranlate
    c.translate(
      -player.position.x - player.width / 2,
      -player.position.y - player.height / 2
    )
    // Draw the canvas (which now includes a tilted player image)
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )
    // Restore back the saved canvas from above
    c.restore()
  }
  // Ensure image finished loading before continuing
  update() {
    if (this.image) {
      this.draw()
      this.position.x += this.velocity.x
    }
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position
    this.velocity = velocity

    this.radius = 4
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = 'red'
    c.fill()
    c.closePath()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

// Creates an explosion effect when player or invader is hit
class Particle {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position
    this.velocity = velocity

    this.radius = radius
    this.color = color
    // To fade-out explosions over time, start with full opacity 
    this.opacity = 1

    this.fades = fades
  }

  draw() {
    // To fade-out explosions over time, add save(), globalAlpha(), restore()
    c.save()
    c.globalAlpha = this.opacity
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
    c.restore()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    // To fade-out explosions over time, reduce opacity with each update
    if (this.fades) this.opacity -= 0.005
  }
}

class InvaderProjectile {
  constructor({ position, velocity }) {
    this.position = position
    this.velocity = velocity

    this.width = 3
    this.height = 10
  }

  draw() {
    c.fillStyle = 'white'
    c.fillRect(this.position.x, this.position.y + this.height, this.width, this.height)
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

class Invader {
  constructor({ position }) {
    this.velocity = {
      x: 0,
      y: 0
    }
    const image = new Image()
    image.src = './img/invader.png'
    image.onload = () => {
      const scale = 1
      this.image = image
      this.width = image.width * scale
      this.height = image.height * scale
      this.position = {
        x: position.x,
        y: position.y
      }
    }
  }
  draw() {
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )
  }
  // Ensure image finished loading before continuing
  update({ velocity }) {
    if (this.image) {
      this.draw()
      this.position.x += velocity.x
      this.position.y += velocity.y
    }
  }
  shoot(invaderProjectiles) {
    invaderProjectiles.push(
      new InvaderProjectile({
        position: {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height
        },
        velocity: {
          x: 0,
          y: 2
        }
      })
    )
  }
}

class Grid {
  constructor() {
    this.position = {
      x: 0,
      y: 0
    }
    this.velocity = {
      x: Math.random() * 0 + 1,
      //      x: 5,
      y: 0
    }
    this.invaders = []

    const rows = Math.floor(Math.random() * 5 + 2)
    const cols = Math.floor(Math.random() * 10 + 2)
    const invaderWidth = 30

    this.width = cols * invaderWidth
    this.height = rows * invaderWidth

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        this.invaders.push(new Invader({
          position: {
            x: x * invaderWidth,
            y: y * invaderWidth
          }
        }))
      }
    }
  }
  update() {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    this.velocity.y = 0

    // At canvas edges move invader grid down 1 row
    if (
      this.position.x + this.width >= canvas.width ||
      this.position.x <= 0
    ) {
      this.velocity.x = -this.velocity.x
      this.velocity.y = 30
    }
  }
}

const player = new Player()
const projectiles = []
const grids = []
const invaderProjectiles = []
const particles = []


// Keyboard monitor
const keys = {
  arrowLeft: {
    pressed: false
  },
  arrowRight: {
    pressed: false
  },
  space: {
    pressed: false
  }
}

let frames = 0
let randomInterval = Math.floor(Math.random() * 500 + 500)
let game = {
  over: false,
  active: true
}
let score = 0
const fireRate = 10

// Create background stars
for (let i = 0; i < 100; i++) {
  particles.push(
    new Particle({
      // Position stars randomly across the canvas
      position: {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
      },
      // Animate particles downwards, gives the feeling of movement thru space
      velocity: {
        x: 0,
        y: 0.3
      },
      radius: Math.random() * 2,
      color: 'white',
      fades: false
    })
  )
}

// Create the explosion effect
function createParticles({ object, color, fades }) {
  for (let i = 0; i < 15; i++) {
    particles.push(
      new Particle({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2
        },
        // Send the 15 particles in all directions
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        },
        radius: Math.random() * 3,
        color: color || '#BAA0DE',  // match the objects color (defult is invaders color)
        fades
      })
    )
  }
}

// ===============
// === Animate ===
// ===============
function animate() {
  if (!game.active) return
  requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Render player
  player.update()

  // Render particles (background stars, collision explosions)
  particles.forEach((particle, xNdx) => {
    // Recycle background stars to top, that fall off screen bottom
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width
      particle.position.y = -particle.radius
    }
    // Slowly fade-out and eventually purge any active explosions
    if (particle.opacity <= 0) {
      setTimeout(() => {
        // Garbage Collection
        particles.splice(xNdx, 1)
      }, 0)
    } else {
      particle.update()
    }
  })

  // Render bombs
  invaderProjectiles.forEach((invaderProjectile) => {
    invaderProjectile.update()
  })

  // Fire projectiles if active (fireRate controls fire frequency)
  if (keys.space.pressed && frames % fireRate === 0) {
    projectiles.push(
      new Projectile({
        position: {
          x: player.position.x + player.width / 2,
          y: player.position.y,
        },
        velocity: {
          x: 0,
          y: -4
        }
      }),
    )
  }

  // Bombs: Render on-screen invader projectiles and delete off-screen projectiles
  invaderProjectiles.forEach((invaderProjectile, pNdx) => {
    // Is Bomb off-screen (missed the Player)
    if (invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
      // Bomb is off-screen - delete Bomb
      // Without 'setTimeout' you might see on-screen flashing. This adds 1 extra frame before splicing out an off-screen invaderProjectile.
      setTimeout(() => {
        // Garbage Collection (remove Bomb from array)
        invaderProjectiles.splice(pNdx, 1)
      }, 0)
    } else {
      // Bomb still dropping
      invaderProjectile.update()
    }

    // Did Bomb hit Player
    if (
      player.opacity > 0 &&
      invaderProjectile.position.y + invaderProjectile.height >= player.position.y &&
      invaderProjectile.position.x + invaderProjectile.width >= player.position.x &&
      invaderProjectile.position.x <= player.position.x + player.width
    ) {
      // Bomb hit Player - delete Bomb and make Player invisible
      console.log('You lose...')
      setTimeout(() => {
        // Garbage Collection (remove Bomb from array)
        invaderProjectiles.splice(pNdx, 1)
        // Fade-out Player (Player cannot be physically removed easily - using opacity instead)
        player.opacity = 0
        game.over = true
      }, 0)
      
      // Wait 2 seconds and then freeze the game by preventing animate() from running 
      setTimeout(() => {
        game.active = false
      }, 2000)

      // Create Player explosion effect
      createParticles({
        object: player,
        color: 'red',
        fades: true
      })
    }
  })

  // Bullets
  // Render on-screen projectiles and delete off-screen projectiles
  projectiles.forEach((projectile, index) => {
    if (projectile.position.y + projectile.radius <= 0) {
      // Without 'setTimeout' you might see on-screen flashing. This adds 1 extra frame before splicing out an off-screen projectile.
      setTimeout(() => {
        projectiles.splice(index, 1)
      }, 0)
    } else {
      projectile.update()
    }
  })

  // Render invader grids
  grids.forEach((grid, gNdx) => {
    // Garbage Collection
    // if (grid.position.y + grid.height >= canvas.height) {
    //   console.log('Grid hit bottom')
    //   setTimeout(() => {
    //     grids.splice(gNdx, 1)
    //   }, 0)
    //   console.log(grids.length)
    // }

    grid.update()
    // Spawn bombs every 100th frame 
    if (frames % 100 === 0 && grid.invaders.length > 0) {
      const randomInvader = Math.floor(Math.random() * grid.invaders.length)
      grid.invaders[randomInvader].shoot(invaderProjectiles)
    }

    grid.invaders.forEach((invader, iNdx) => {
      invader.update({ velocity: grid.velocity })
      // Collision Check: missiles hitting invaders
      projectiles.forEach((projectile, pNdx) => {
        if (
          projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
          projectile.position.x + projectile.radius >= invader.position.x &&
          projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
          projectile.position.y + projectile.radius >= invader.position.y
        ) {
          // Collision Occurred: missile hit invader
          // Update arrays, remove objects involved in the collision
          setTimeout(() => {
            // Check array to see if invader exists
            const invaderFound = grid.invaders.find((invader2) => {
              return invader2 === invader
            })
            // Check array to see if missile exists
            const projectileFound = projectiles.find((projectile2) => {
              return projectile2 === projectile
            })
            // If both objects exist then...
            if (invaderFound && projectileFound) {
              // Increment score
              score += 10
              scoreEl.innerHTML = score
              // Create the explosion effect
              createParticles({
                object: invader,
                fades: true 
              })
              // Remove (delete) both objects from their associated arrays
              grid.invaders.splice(iNdx, 1)
              projectiles.splice(pNdx, 1)
              // Check if first/last grid columns have narrowed (else grids will scroll down before reaching canvas edges)
              if (grid.invaders.length > 0) {
                // Get revised first/last invaders in the grid
                const firstInvader = grid.invaders[0]
                const lastInvader = grid.invaders[grid.invaders.length - 1]
                // Shrink grid width based on new first/last grid invaders
                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width
                // Assign grid to firstInvaders x position
                grid.position.x = firstInvader.position.x
              } else {
                // Garbage Collection (when a grid has no more invaders)
                grids.splice(gNdx, 1)
              }
            }
          }, 0)
        }
      })
    })
  })

  // Player movement/tilt checks
  if (
    keys.arrowLeft.pressed && player.position.x >= 0
  ) {
    player.velocity.x = -5
    player.rotation = -0.15
  } else if (
    keys.arrowRight.pressed &&
    player.position.x + player.width <= canvas.width
  ) {
    player.velocity.x = 5
    player.rotation = 0.15
  } else {
    player.velocity.x = 0
    player.rotation = 0
  }

  // Spawn next grid at a random interval
  if (frames % randomInterval === 0) {
    grids.push(new Grid())
    randomInterval = Math.floor(Math.random() * 1000 + 500)
    frames = 0
  }

  frames++
}
animate()

addEventListener('keydown', ({ key }) => {
  if (game.over) return
  switch (key) {
    case 'ArrowLeft':
      keys.arrowLeft.pressed = true
      break
    case 'ArrowRight':
      keys.arrowRight.pressed = true
      break
    case ' ':
      keys.space.pressed = true
      break
  }
})
addEventListener('keyup', ({ key }) => {
  switch (key) {
    case 'ArrowLeft':
      keys.arrowLeft.pressed = false
      break
    case 'ArrowRight':
      keys.arrowRight.pressed = false
      break
    case ' ':
      keys.space.pressed = false
      break
  }
})