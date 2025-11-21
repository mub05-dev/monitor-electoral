
import { createTheme } from "@mui/material/styles";

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

const BORDER_RADIUS = 12;
const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0d6efd", 
      light: "#7ab8ff",
      dark: "#0047a9",
    },
    secondary: {
      main: "#6c757d", 
    },
    success: {
      main: "#198754", 
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#212529", 
      secondary: "#6c757d",
    },

    pactColors: pactColors,
  },

  typography: {
    fontFamily: FONT_FAMILY,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 500,
      textTransform: "none",
    },
  },

  shape: {
    borderRadius: BORDER_RADIUS,
  },
  shadows: [
    "none", // 0
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 6px 16px 0 rgba(0,0,0,0.08)", 
    "0 8px 20px 0 rgba(0,0,0,0.09)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
    "0 4px 12px 0 rgba(0,0,0,0.07)",
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f8f9fa",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "1px solid #dee2e6",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
        },
        containedSuccess: {
          backgroundColor: "#198754",
          "&:hover": {
            backgroundColor: "#157347",
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          padding: "12px 16px",
          backgroundColor: "#f1f3f5", 
          color: "#495057", 
          textTransform: "uppercase", 
          fontSize: "0.75rem",
          fontWeight: 600,
          borderBottom: "1px solid #dee2e6",
        },
        body: {
          borderBottom: "1px solid #e9ecef",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },

        filledPrimary: {
          backgroundColor: "#0d6efd",
          color: "#fff",
        },
      },
    },
  },
});
