# Paseo por el Casino 🎰

Presentación interactiva en 3D (Three.js): la cámara recorre el casino según el
croquis y se detiene en cada parada/diapositiva.

## Controles

| Acción | Tecla / gesto |
|---|---|
| Siguiente / anterior | `→` / `←` (también `Espacio`, `PageDown`/`PageUp`, o las flechas en pantalla) |
| Ir a una parada | `0`–`9`, los puntitos bajo el contador, o las marcas del minimapa |
| Pantalla completa | `F` |
| Mostrar/ocultar minimapa | `M` |
| Ocultar toda la interfaz | `H` |
| Control remoto (QR para el celular) | `R` o el botón del celular arriba a la derecha |
| Interactuar | click en ruleta, tragamonedas, expendedora, moza, cajero o ascensor |

Se puede abrir directo en una parada con `#n` en la URL (ej. `index.html#3`).

## Control remoto desde el celular

1. Con la presentación abierta en la notebook (ya publicada en GitHub Pages),
   tocá el botón del celular arriba a la derecha (o la tecla `R`).
2. Escaneá el QR con el celular. Se abre una página de control con:
   flechas de atrás/siguiente, la lista de paradas, las interacciones de la
   parada actual (girar la ruleta, cobrar, etc.) y botones para el mapa y la interfaz.
   También se puede deslizar el dedo para cambiar de diapositiva.
3. Cuando el celular se conecta, el puntito del botón se pone verde y el QR se cierra solo.

Si se recarga la presentación, el celular se reconecta solo (el código queda guardado).
Si no tenés el QR a mano, abrí `.../remote.html` en el celular y escribí el código de 5 letras.

Necesita internet en los dos dispositivos (usa PeerJS para conectarlos directo, sin
servidor propio). Algunas redes de colegios o facultades bloquean este tipo de conexión:
en ese caso compartí internet desde el celular a la notebook, o usá el teclado.

## Editar el contenido

- **Textos de las diapositivas y de la fachada (`facadeTop`, `facadeMain`):** `js/slides.js`
- **Posición de la cámara en cada parada:** `VIEWS` en `js/main.js`
- **Ubicación de máquinas y objetos (en px del croquis):** `js/layout.js`
- **Colores / estilo de la interfaz:** `css/style.css`

## Probar en la compu

Los módulos de JavaScript no funcionan abriendo el archivo con doble click; hace
falta un servidor local:

```bash
node serve.mjs
```

y abrir <http://localhost:5173>.

## Publicar en GitHub Pages

1. Subí esta carpeta a un repositorio de GitHub.
2. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   elegí la rama `main` y la carpeta `/ (root)`.
3. En un minuto queda online en `https://<usuario>.github.io/<repo>/`.

Three.js y las fuentes se cargan desde CDN, así que no hace falta instalar nada.
