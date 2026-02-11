# Sistema de Control de Asistencia y Nómina 📅🚀

Aplicación web moderna (PWA) diseñada para el control de asistencia de empleados mediante geolocalización y reconocimiento facial (evidencia fotográfica). Incluye un panel administrativo para la gestión de sedes, estadísticas avanzadas y generación de nómina.

## ✨ Características Principales

### 👤 Para Empleados
- **Marcado de Entrada/Salida**: Registro con validación de geocerca (Geofencing) de 100m.
- **Evidencia Fotográfica**: Captura de selfie al marcar asistencia.
- **Mapa en Tiempo Real**: Visualización de la ubicación actual respecto a la sede asignada.
- **Estadísticas Personales**: Visualización de horas trabajadas y registros recientes.
- **Perfil de Usuario**: Información de sede asignada y opción de reinicio (Debug).

### 🛠️ Para Administradores
- **Dashboard de Estadísticas**: Gráficos interactivos de horas trabajadas, costos y actividad.
- **Mapa de Ubicaciones**: Visualización en tiempo real de todos los registros en un mapa interactivo.
- **Gestión de Empleados**: Listado detallado y vista individual de asistencia por empleado.
- **Generación de Nómina**: Exportación de reportes de horas calculadas a formato CSV.
- **Geocercas Dinámicas**: Configuración de coordenadas por sede.

## 🚀 Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite.
- **Estilos**: Tailwind CSS.
- **Mapas**: Leaflet / React-Leaflet.
- **Gráficos**: Recharts.
- **Animaciones**: Framer Motion.
- **Iconos**: Lucide React.
- **Almacenamiento**: LocalStorage (Demo/MVP).

## 🛠️ Instalación y Uso Local

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/martorres23/Asistencia.git
    cd Asistencia
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Ejecutar en modo desarrollo**:
    ```bash
    npm run dev
    ```

4.  **Construir para producción**:
    ```bash
    npm run build
    ```

## 🔒 Credenciales de Demo (PIN)
- **Administrador**: `1234`
- **Empleado**: `0000`

---
Desarrollado con ❤️ para la gestión eficiente de talento humano.
