<script setup>
import { ref, onMounted } from 'vue'

const canvasRef = ref(null)

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let particles = []
  const PARTICLE_COUNT = 60
  const CONNECTION_DIST = 120

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  const createParticle = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    size: Math.random() * 2.5 + 1,
    opacity: Math.random() * 0.4 + 0.1,
    hue: Math.random() * 60 + 30 // warm hues: 30-90 (amber range)
  })

  resize()
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle())

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`
      ctx.fill()

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const dx = p.x - particles[j].x
        const dy = p.y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DIST) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `hsla(40, 80%, 60%, ${0.06 * (1 - dist / CONNECTION_DIST)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    })
    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  draw()
})
</script>

<template>
  <canvas ref="canvasRef" class="particle-canvas"></canvas>
</template>