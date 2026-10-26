/** Solo los datos conocidos, listos para mandar al chofer. */
export const accessMessage = (userName: string, password?: string | null) =>
  `Usuario: ${userName}${password ? `\nContraseña: ${password}` : ''}`
