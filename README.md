# 📚 BookFlow - Plataforma E-commerce Full-Stack

**BookFlow** es una plataforma integral de comercio electrónico de libros desarrollada con arquitectura desacoplada: **Next.js (App Router)** para el frontend y **Express.js + Mongoose + Socket.IO** para el backend, con persistencia en **MongoDB Atlas**, pagos vía **PayPal Sandbox** y un tablero Kanban administrativo en tiempo real.

---

## 🌟 Características Principales

### 🛒 Experiencia del Cliente (`CLIENT`)
- **Registro & Login Seguro:** Autenticación con JWT y contraseñas cifradas mediante `bcryptjs`.
- **Catálogo de Libros:** Búsqueda reactiva por título/autor, filtrado por categorías, rango de precio y ordenamiento.
- **Detalle de Libro:** Galería, sinopsis, autor, páginas, valoración y verificación de stock en tiempo real.
- **Carrito de Compras:** Gestión reactiva con cálculo automático de totales y persistencia local.
- **Gestión de Envíos:** Captura y guardado de direcciones de entrega.
- **Pagos con PayPal Sandbox:** Integración oficial Server-Side con creación y captura de órdenes para garantizar seguridad de montos.
- **Historial & Seguimiento de Pedidos:** Vista de compras y línea de tiempo reactiva que refleja en vivo los cambios de estado hechos por los administradores.

### ⚡ Panel Administrativo (`ADMIN`)
- **Control de Acceso (RBAC):** Rutas y vistas protegidas para el rol de administrador.
- **Gestión de Catálogo & Stock:** CRUD completo de libros con modal interactivo (crear, editar precios/stock, eliminar).
- **Tablero Kanban en Tiempo Real:** 
  - 4 Columnas operativas: `PENDING_PAYMENT`, `PAID`, `PROCESSING`, `COMPLETED`.
  - Drag and Drop fluido impulsado por `@hello-pangea/dnd`.
  - Sincronización instantánea mediante **Socket.IO**: cualquier movimiento de pedido actualiza las pantallas de otros administradores y del cliente al instante.

---

## 🚀 Puesta en Marcha

### 1. Variables de Entorno

#### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/bookflow
JWT_SECRET=bookflow_super_secure_jwt_secret_key_2026!
JWT_EXPIRE=7d
PAYPAL_CLIENT_ID=sb-sample-client-id
PAYPAL_CLIENT_SECRET=sb-sample-client-secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

#### Frontend (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_PAYPAL_CLIENT_ID=sb
```

---

### 2. Poblar Base de Datos (Seed)
Para precargar categorías, libros de prueba y usuarios demo (Admin y Cliente):
```bash
cd server
npm run seed
```

#### 🔑 Credenciales Demo Creadas:
| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **ADMIN** | `admin@bookflow.com` | `adminpassword123` |
| **CLIENT** | `cliente@bookflow.com` | `clientepassword123` |

---

### 3. Ejecución en Desarrollo

#### Iniciar el Backend (Express + Socket.IO en puerto 5000):
```bash
cd server
npm run dev
```

#### Iniciar el Frontend (Next.js en puerto 3000):
```bash
cd client
npm run dev
```

---

## 🧪 Pruebas y Verificación

1. Acceder a `http://localhost:3000`.
2. Iniciar sesión usando el botón **Demo CLIENTE** o registrar una cuenta nueva.
3. Explorar el catálogo, agregar libros al carrito e ir a **Finalizar Compra**.
4. Completar la dirección y pulsar **Pagar con PayPal Sandbox**.
5. Abrir una nueva ventana en modo incógnito, acceder con **Demo ADMIN** e ingresar al **Tablero Kanban** (`/admin/kanban`).
6. Arrastrar el pedido entre columnas y observar la actualización instantánea en la ventana del cliente sin recargar la página.
