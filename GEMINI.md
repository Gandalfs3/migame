# Reglas del Proyecto: RPG Cooperativo WLAN / MMORPG

## Filosofía y Visión
- **Objetivo Primario**: Juego cooperativo en tiempo real diseñado para diversión familiar (2-6 jugadores en red local WLAN), con futura migración transparente a la nube (MMO / PvP masivo).
- **Perspectiva**: Isométrica 3D estilo *Albion Online* / *World of Warcraft* / *Diablo*.
- **Enfoque Pragmático**: Priorizar jugabilidad inmediata y diversión tangible antes de sobre-estructurar. Validar cada fase con pruebas reales en red local.

## Reglas de Arquitectura y Red
1. **Servidor Autoritativo ("Never Trust the Client")**:
   - Todo cálculo crítico (movimiento, colisiones estáticas, cooldowns de hechizos, daño, vida, inventario y persistencia) se calcula y valida en el backend.
   - El cliente solo envía intención (inputs / solicitudes de habilidad) y renderiza estados interpolados recibidos del servidor.
2. **Conectividad Local (WLAN/LAN)**:
   - El servidor debe escuchar siempre en `0.0.0.0` y admitir puerto configurable.
   - Los clientes deben resolver dinámicamente la URL del servidor (`window.location.hostname`) para funcionar de forma transparente en cualquier dispositivo (PCs, laptops, tablets, móviles) en la misma red Wi-Fi sin tocar código.
   - Mostrar en pantalla la IP local del host para que los demás miembros de la familia puedan ingresar con facilidad.
3. **Multi-dispositivo y UX Familiar**:
   - Soporte para controles por teclado (WASD / flechas) y diseño preparado para eventos táctiles / clics para tablets y móviles.
   - Interfaz limpia desacoplada (DOM Overlay HTML5/CSS) sobre el Canvas 3D.
4. **Interpolación y Fluidez**:
   - El loop de simulación del servidor corre a 20-30 ticks por segundo.
   - El cliente debe aplicar interpolación lineal (*lerp*) o buffer de estados para garantizar 60 FPS sin micro-stuttering.
