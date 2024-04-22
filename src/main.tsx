import ReactDOM from 'react-dom/client'
import App from './Debugger.tsx'

import { ThemeProvider } from '@emotion/react'
import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#fff'
    },
    info: {
      main: '#000'
    },
    success: {
      main: '#21D170'
    },
    error: {
      main: '#DD4A4A'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minWidth: 0 }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  // <BabbagePrompt
  //   customPrompt
  //   appName="Coinflip"
  //   author="Project Babbage"
  //   authorUrl="https://projectbabbage.com"
  //   description="A coin flip demonstration of Project Babbage's micropayment capabilities"
  //   appIcon={tailsImage}
  //   // appImages={["/tempoBG.png"]}
  //   supportedMetaNet={'universal'}
  // >
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
  // </BabbagePrompt>
  // </React.StrictMode>
)
