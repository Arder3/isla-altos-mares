# Estrategia de Perfil: EQUIPO (Acceso Técnico Interno)

## 🎯 Objetivo
Auditoría técnica en tiempo real, verificación de sincronización y gestión de la Single Source of Truth (SSoT).

## 🔓 Niveles de Acceso (IDs)
| ID | Descripción | Propósito |
| :--- | :--- | :--- |
| **01 - 99** | Acceso Total (Root) | Auditoría de cada archivo subido al sistema. |
| **-** | Backend de Cloudinary | Verificación de la entrega de assets vía CDN. |
| **-** | Logs de Sincronización | Monitoreo del script `sync-assets.cjs`. |
| **-** | Auditoría de Matrices | Verificación de la integridad de los CSVs de gerencia. |

## 🧭 Navegación y UX
- **Flujo**: Acceso directo a carpetas raíz y visualización de metadatos crudos.
- **Interacción**: Herramientas de diagnóstico y enlaces directos a Drive/Cloudinary.
- **Tono**: Utilitario, crudo y potente.

## 🌟 Puntos Fuertes (Strengths)
- Control absoluto sobre la infraestructura de datos.
- Capacidad de detectar desincronizaciones de forma inmediata.

## ⚠️ Análisis de Gaps (Debilidades)
- **Control Remoto**: No se puede disparar el sincronizador desde el portal (requiere ejecución local).
- **Editor en Web**: No se pueden editar los SSoTs directamente desde la interfaz del portal.
- **Alertas**: No existe un sistema de notificaciones si falla una carga o un ID está duplicado.
