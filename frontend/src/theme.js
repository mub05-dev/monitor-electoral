import { createTheme } from "@mui/material/styles";

// Tus colores de pactos (Intactos)
const pactColors = {
  B: "#d0fae5", 
  E: "#2e7d32",
  A: "#f9a825", 
  K: "#f0b100",
  C: "#fb2c36", 
  H: "#ef6c00", 
  I: "#ff6900",
  F: "#ad46ff", 
  D: "#f6339a", 
  G: "#7ccf00", 
  J: "#0288d1", 
  X: "#546e7a", 
  default: "#455a64",
};

// Definición de Fuentes
const FONT_HEADING = "'Merriweather', serif";
const FONT_BODY = "'Lato', sans-serif";

const BORDER_RADIUS = 8; // Un poco más cuadrado para ser más formal (antes 12)

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#102a43", // Azul Noche Corporativo (Coincide con Login)
      light: "#486581",
      dark: "#061523",
    },
    secondary: {
      main: "#6c757d", 
    },
    success: {
      main: "#198754", 
    },
    background: {
      default: "#f0f4f8", // Gris azulado muy suave (Coincide con Login)
      paper: "#ffffff",
    },
    text: {
      primary: "#102a43", // Texto principal azul muy oscuro (mejor lectura)
      secondary: "#486581",
    },
    pactColors: pactColors,
  },

  typography: {
    fontFamily: FONT_BODY, // Por defecto Lato
    h1: { fontFamily: FONT_HEADING, fontWeight: 900 },
    h2: { fontFamily: FONT_HEADING, fontWeight: 700 },
    h3: { fontFamily: FONT_HEADING, fontWeight: 700 },
    h4: { fontFamily: FONT_HEADING, fontWeight: 700 },
    h5: { fontFamily: FONT_HEADING, fontWeight: 700 },
    h6: { fontFamily: FONT_HEADING, fontWeight: 700 },
    subtitle1: { fontFamily: FONT_BODY, fontWeight: 600 },
    subtitle2: { fontFamily: FONT_BODY, fontWeight: 600 },
    button: {
      fontFamily: FONT_BODY,
      fontWeight: 700,
      textTransform: "none", // Evita mayúsculas forzadas
    },
  },

  shape: {
    borderRadius: BORDER_RADIUS,
  },
  
  shadows: [
    "none", 
    "0px 2px 4px rgba(16, 42, 67, 0.1)", // Sombra suave 1
    "0px 4px 8px rgba(16, 42, 67, 0.1)", // Sombra suave 2
    "0px 8px 16px rgba(16, 42, 67, 0.1)", // Sombra suave 3
    "0px 12px 24px rgba(16, 42, 67, 0.1)",
    ...Array(20).fill("none") // Relleno para evitar errores
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f0f4f8",
          fontFamily: FONT_BODY,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 1, // Usamos la sombra suave 1 por defecto
      },
      styleOverrides: {
        root: {
          border: "1px solid rgba(16, 42, 67, 0.1)", // Borde sutil
          backgroundImage: 'none', // Quitar overlay en modo dark si se usara
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: "8px 20px",
        },
        containedPrimary: {
           // El color ya viene de palette.primary.main
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "#fff",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          padding: "14px 16px",
          backgroundColor: "#f8f9fa", 
          color: "#334e68", 
          textTransform: "uppercase", 
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "0.5px",
          borderBottom: "2px solid #d9e2ec",
          fontFamily: FONT_BODY
        },
        body: {
          borderBottom: "1px solid #f0f4f8",
          padding: "12px 16px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 6,
        },
        filledPrimary: {
          backgroundColor: "#102a43",
          color: "#fff",
        },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: "#102a43", // Asegurar navbar oscuro
                boxShadow: "0px 4px 12px rgba(0,0,0,0.2)"
            }
        }
    }
  },
});