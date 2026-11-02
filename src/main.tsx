import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* Self hosted fonts (DESIGN_SPEC 1.2). Blauer Nue ships separately into
   public/fonts, see tokens.css. */
import '@fontsource-variable/outfit';
import '@fontsource-variable/fraunces';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';

import './styles/tokens.css';
import './styles/base.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
