import React from 'react';

// Componente para anunciar mensajes a lectores de pantalla
function LiveRegion({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

export default LiveRegion;
